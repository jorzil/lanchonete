import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { listOrders } from '@/lib/db-orders'
import {
  computeBalance, canSpin, drawSlice, blockedSlices, normalizeWheel, prizeCode,
  type Redemption,
} from '@/lib/loyalty'
import { normalizePhone, isInternalPhone } from '@/lib/phone'
import { readLoyaltyRow, writeLoyaltyRow } from '../route'

export const dynamic = 'force-dynamic'

const COUPONS_PHONE = '__coupons__'

async function lerCupons(): Promise<Record<string, unknown>[]> {
  const { data } = await supabase
    .from('customers').select('address_reference').eq('phone', COUPONS_PHONE).maybeSingle()
  if (data?.address_reference) {
    try {
      const p = JSON.parse(data.address_reference)
      if (Array.isArray(p.coupons)) return p.coupons
    } catch {}
  }
  return []
}

async function criarCupom(cupom: Record<string, unknown>): Promise<Error | null> {
  const lista = await lerCupons()
  lista.push(cupom)
  const { error } = await supabase.from('customers').upsert(
    { phone: COUPONS_PHONE, name: '__system__', address_reference: JSON.stringify({ coupons: lista }) },
    { onConflict: 'phone' },
  )
  return error ?? null
}

/**
 * Telefones girando neste exato momento.
 *
 * Segura o caso comum de dois cliques quase simultâneos chegando na mesma
 * instância. Não substitui a gravação verificada mais abaixo, que é o que
 * protege de verdade quando a Vercel espalha as requisições entre instâncias.
 */
const girando = new Set<string>()

/**
 * Grava o giro relendo a linha antes de escrever, e confere depois se ele
 * realmente entrou.
 *
 * A configuração mora num JSON só, então dois giros ao mesmo tempo podem se
 * sobrescrever: quem grava por último apaga o giro do outro. Reler, anexar e
 * conferir faz o giro perdido ser regravado em vez de sumir — e, como a busca
 * é pela spinKey, regravar nunca duplica.
 */
async function gravarGiro(registro: Redemption): Promise<Error | null> {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const atual = await readLoyaltyRow()
    if (atual.redemptions.some((r) => r.spinKey && r.spinKey === registro.spinKey)) return null
    const erro = await writeLoyaltyRow({
      config: atual.config,
      redemptions: [...atual.redemptions, registro],
    })
    if (erro) return erro
    const conferencia = await readLoyaltyRow()
    if (conferencia.redemptions.some((r) => r.spinKey === registro.spinKey)) return null
  }
  return new Error('Não foi possível registrar o giro. Tente de novo.')
}

/** Resposta de um giro, para reaproveitar quando a mesma requisição repete. */
function resposta(registro: Redemption, indice: number, fatia: unknown, restantes: number) {
  return NextResponse.json({
    ok: true,
    indice,
    fatia,
    premio: !!registro.couponCode,
    couponCode: registro.couponCode || null,
    expiresAt: registro.expiresAt ?? null,
    girosRestantes: restantes,
  })
}

/**
 * Gira a roleta. O SORTEIO ACONTECE AQUI, no servidor: a tela só anima até o
 * resultado já decidido. Sortear no navegador permitiria escolher o prêmio.
 */
export async function POST(req: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Banco não configurado' }, { status: 503 })
  }

  let chave = ''
  try {
    const body = await req.json()
    chave = normalizePhone(body?.phone)
    const spinKey = typeof body?.spinKey === 'string' ? body.spinKey.slice(0, 60) : ''

    if (!chave || isInternalPhone(body?.phone) || chave.length < 10) {
      return NextResponse.json({ ok: false, error: 'Telefone inválido.' }, { status: 400 })
    }
    if (!spinKey) {
      return NextResponse.json({ ok: false, error: 'Requisição sem identificação.' }, { status: 400 })
    }

    const { config, redemptions } = await readLoyaltyRow()
    const roleta = normalizeWheel(config.roleta)

    // Mesma requisição chegando de novo (retry, duplo clique, refresh): devolve
    // o prêmio que já saiu, sem sortear outro nem cobrar outro giro.
    const jaFeito = redemptions.find((r) => r.spinKey && r.spinKey === spinKey)
    if (jaFeito) {
      const id = jaFeito.rewardId.slice('roleta:'.length)
      const i = roleta.fatias.findIndex((f) => f.id === id)
      const saldoAtual = computeBalance(config, chave, await listOrders(), redemptions)
      return resposta(jaFeito, Math.max(0, i), roleta.fatias[i] ?? null, saldoAtual.girosDisponiveis)
    }

    if (!config.ativo) return NextResponse.json({ ok: false, error: 'O clube está desativado.' }, { status: 409 })
    if (!roleta.ativo) {
      return NextResponse.json({ ok: false, error: 'Essa promoção está temporariamente encerrada.' }, { status: 409 })
    }

    if (girando.has(chave)) {
      return NextResponse.json({ ok: false, error: 'Seu giro já está em andamento.' }, { status: 429 })
    }
    girando.add(chave)

    try {
      // Saldo recalculado do zero: o navegador não decide se pode girar.
      const orders = await listOrders()
      const saldo = computeBalance(config, chave, orders, redemptions)
      if (!canSpin(saldo, roleta)) {
        return NextResponse.json(
          { ok: false, error: `Você não tem giros disponíveis. ${saldo.comoGanharGiro}.` },
          { status: 409 },
        )
      }

      // Fatia desligada ou com estoque no fim não entra no sorteio.
      const bloqueadas = blockedSlices(roleta.fatias, redemptions)
      const indice = drawSlice(roleta.fatias, Math.random(), bloqueadas)
      if (indice < 0) {
        return NextResponse.json(
          { ok: false, error: 'Os prêmios de hoje acabaram. Volte amanhã!' },
          { status: 409 },
        )
      }
      const fatia = roleta.fatias[indice]
      const hoje = new Date()
      const dias = Math.max(1, fatia.validadeDias ?? 30)
      const validade = new Date(hoje.getTime() + dias * 86_400_000)

      const registro: Redemption = {
        id: `giro-${Date.now().toString(36)}`,
        phone: chave,
        rewardId: `roleta:${fatia.id}`,
        rewardNome: fatia.tipo === 'nada' ? 'Roleta (sem prêmio)' : fatia.nome,
        icone: fatia.icone,
        couponCode: '',
        // Giro vem da regra, não de saldo; nada é debitado de pontos ou selos.
        moeda: 'selos',
        custo: 0,
        at: hoje.toISOString(),
        spinKey,
        status: 'disponivel',
      }

      if (fatia.tipo !== 'nada') {
        const cuponsAtuais = await lerCupons()
        const usados = new Set(cuponsAtuais.map((c) => String((c as { code?: string }).code ?? '')))
        const code = prizeCode(usados)
        const tipoCupom =
          fatia.tipo === 'frete_gratis' ? 'free_shipping'
          : fatia.tipo === 'desconto_percentual' ? 'percentage'
          : 'fixed'
        const desconto =
          fatia.tipo === 'desconto_percentual' || fatia.tipo === 'desconto_fixo' ? fatia.valor : 0

        const erroCupom = await criarCupom({
          id: `coupon-${code}`,
          code,
          name: `${fatia.nome} — Roleta`,
          description: `Prêmio da roleta do ${config.nomePrograma}`,
          type: tipoCupom,
          discount: desconto,
          minOrder: 0,
          maxUses: 1,
          usedCount: 0,
          validFrom: hoje.toISOString(),
          validUntil: validade.toISOString(),
          active: true,
          createdAt: hoje.toISOString(),
          phone: chave,
        })
        if (erroCupom) {
          return NextResponse.json({ ok: false, error: `Falha ao gerar o cupom: ${erroCupom.message}` }, { status: 500 })
        }
        registro.couponCode = code
        registro.expiresAt = validade.toISOString()
      }

      const erro = await gravarGiro(registro)
      if (erro) return NextResponse.json({ ok: false, error: erro.message }, { status: 500 })

      return resposta(registro, indice, fatia, Math.max(0, saldo.girosDisponiveis - 1))
    } finally {
      girando.delete(chave)
    }
  } catch {
    girando.delete(chave)
    return NextResponse.json({ ok: false, error: 'Requisição inválida' }, { status: 400 })
  }
}
