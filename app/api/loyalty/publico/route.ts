import { NextResponse } from 'next/server'
import { readLoyaltyRow } from '../route'

export const dynamic = 'force-dynamic'

/**
 * GET — o que a página pública da roleta precisa saber, e só isso.
 *
 * A rota raiz de /api/loyalty devolve também a lista de resgates, com os
 * cupons de todos os clientes. Não dá para chamá-la de uma página aberta:
 * aqui devolvemos apenas o nome do programa e a roleta.
 */
export async function GET() {
  const { config } = await readLoyaltyRow()
  return NextResponse.json({
    ok: true,
    ativo: config.ativo,
    nomePrograma: config.nomePrograma,
    roleta: config.roleta,
  })
}
