import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { listOrders } from '@/lib/db-orders'
import { computeBalance, canRedeem, redemptionCode, type Redemption } from '@/lib/loyalty'
import { normalizePhone, isInternalPhone } from '@/lib/phone'
import { readLoyaltyRow, writeLoyaltyRow } from '../route'

export const dynamic = 'force-dynamic'

const COUPONS_PHONE = '__coupons__'

/** Cria o cupom do resgate na mesma lista que o checkout já valida. */
async function criarCupom(cupom: Record<string, unknown>): Promise<Error | null> {
  const { data } = await supabase
    .from('customers').select('address_reference').eq('phone', COUPONS_PHONE).maybeSingle()
  let lista: unknown[] = []
  if (data?.address_reference) {
    try { const p = JSON.parse(data.address_reference); if (Array.isArray(p.coupons)) lista = p.coupons } catch {}
  }
  lista.push(cupom)
  const { error } = await supabase.from('customers').upsert(
    { phone: COUPONS_PHONE, name: '__system__', address_reference: JSON.stringify({ coupons: lista }) },
    { onConflict: 'phone' },
  )
  return error ?? null
}

export async function POST(req: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Banco não configurado' }, { status: 503 })
  }
  try {
    const { phone, rewardId } = await req.json()
    const chave = normalizePhone(phone)
    if (!chave || isInternalPhone(phone) || chave.length < 10) {
      return NextResponse.json({ ok: false, error: 'Telefone inválido.' }, { status: 400 })
    }

    const { config, redemptions } = await readLoyaltyRow()
    if (!config.ativo) return NextResponse.json({ ok: false, error: 'Clube desativado.' }, { status: 409 })

    const reward = config.recompensas.find((r) => r.id === rewardId)
    if (!reward) return NextResponse.json({ ok: false, error: 'Recompensa não encontrada.' }, { status: 404 })

    // Saldo recalculado AQUI: o navegador não decide quantos pontos alguém tem.
    const orders = await listOrders()
    const saldo = computeBalance(config, chave, orders, redemptions)
    if (!canRedeem(saldo, reward)) {
      const tem = reward.moeda === 'pontos' ? saldo.pontos : saldo.selos
      return NextResponse.json(
        { ok: false, error: `Saldo insuficiente: você tem ${tem} ${reward.moeda} e precisa de ${reward.custo}.` },
        { status: 409 },
      )
    }

    const code = redemptionCode(chave, reward.id)
    const hoje = new Date()
    const validade = new Date(hoje.getTime() + 30 * 86_400_000)

    const tipoCupom =
      reward.tipo === 'frete_gratis' ? 'free_shipping'
      : reward.tipo === 'desconto_percentual' ? 'percentage'
      : 'fixed'
    // Brindes (cookie/adicional) viram desconto fixo do valor do item, para
    // caberem no cupom que o checkout já sabe validar.
    const desconto =
      reward.tipo === 'desconto_percentual' || reward.tipo === 'desconto_fixo' ? reward.valor : 0

    const erroCupom = await criarCupom({
      id: `coupon-${code}`,
      code,
      name: `${reward.nome} — ${config.nomePrograma}`,
      description: `${reward.descricao} (resgate do clube)`,
      type: tipoCupom,
      discount: desconto,
      minOrder: 0,
      maxUses: 1, // exclusivo: um resgate, um uso
      usedCount: 0,
      validFrom: hoje.toISOString(),
      validUntil: validade.toISOString(),
      active: true,
      createdAt: hoje.toISOString(),
    })
    if (erroCupom) {
      return NextResponse.json({ ok: false, error: `Falha ao gerar o cupom: ${erroCupom.message}` }, { status: 500 })
    }

    const registro: Redemption = {
      id: `resg-${Date.now().toString(36)}`,
      phone: chave,
      rewardId: reward.id,
      rewardNome: reward.nome,
      couponCode: code,
      moeda: reward.moeda,
      custo: reward.custo,
      at: hoje.toISOString(),
    }
    const erro = await writeLoyaltyRow({ config, redemptions: [...redemptions, registro] })
    if (erro) {
      return NextResponse.json({ ok: false, error: `Cupom criado, mas o resgate não foi registrado: ${erro.message}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true, resgate: registro, validoAte: validade.toISOString() })
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida' }, { status: 400 })
  }
}
