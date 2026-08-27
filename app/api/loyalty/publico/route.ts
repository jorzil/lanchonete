import { NextResponse } from 'next/server'
import { readLoyaltyRow } from '../route'
import { blockedSlices, sliceUsage, sliceStockLeft, normalizeWheel } from '@/lib/loyalty'

export const dynamic = 'force-dynamic'

/** Segunda-feira desta semana, para contar os prêmios do período. */
function inicioDaSemana(): number {
  const d = new Date()
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * GET — o que a página pública da roleta precisa saber, e só isso.
 *
 * A rota raiz de /api/loyalty devolve também a lista de resgates, com os
 * cupons de todos os clientes. Não dá para chamá-la de uma página aberta.
 */
export async function GET() {
  const { config, redemptions } = await readLoyaltyRow()
  const roleta = normalizeWheel(config.roleta)
  const giros = redemptions.filter((r) => r.rewardId.startsWith('roleta:'))
  const usos = sliceUsage(redemptions)

  // Quantos prêmios ainda podem sair hoje. Fatia sem limite conta como
  // disponível, mas não infla o número: só o que tem estoque é somado.
  const bloqueadas = blockedSlices(roleta.fatias, redemptions)
  let restantes = 0
  let ilimitados = 0
  for (const f of roleta.fatias) {
    if (f.tipo === 'nada' || bloqueadas.has(f.id)) continue
    const resta = sliceStockLeft(f, usos)
    if (resta === null) ilimitados++
    else restantes += resta
  }

  return NextResponse.json({
    ok: true,
    ativo: config.ativo,
    nomePrograma: config.nomePrograma,
    // As fatias vão sem estoque nem flag de ativo: a tela desenha a roda, quem
    // decide o que pode sair é o servidor.
    roleta: {
      ...roleta,
      girosManuais: {},
      fatias: roleta.fatias.map(({ estoque, ativo, ...f }) => f),
    },
    esgotadas: [...bloqueadas],
    stats: {
      ganharamNaSemana: giros.filter((r) => !!r.couponCode && new Date(r.at).getTime() >= inicioDaSemana()).length,
      premiosDisponiveis: restantes,
      premiosIlimitados: ilimitados,
    },
  })
}
