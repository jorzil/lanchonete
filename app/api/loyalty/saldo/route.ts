import { NextRequest, NextResponse } from 'next/server'
import { listOrders } from '@/lib/db-orders'
import { supabaseConfigured } from '@/lib/supabase'
import { computeBalance } from '@/lib/loyalty'
import { normalizePhone, isInternalPhone } from '@/lib/phone'
import { readLoyaltyRow } from '../route'

export const dynamic = 'force-dynamic'

/** GET ?phone=... — saldo do cliente. Calculado no servidor, nunca no cliente. */
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone') ?? ''
  const chave = normalizePhone(phone)
  if (!chave || isInternalPhone(phone) || chave.length < 10) {
    return NextResponse.json({ ok: false, error: 'Informe um telefone válido com DDD.' }, { status: 400 })
  }
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Banco não configurado' }, { status: 503 })
  }

  const { config, redemptions } = await readLoyaltyRow()
  if (!config.ativo) {
    return NextResponse.json({ ok: false, error: 'O clube está desativado no momento.' }, { status: 409 })
  }

  const orders = await listOrders()
  const saldo = computeBalance(config, chave, orders, redemptions)
  if (saldo.pedidos === 0) {
    return NextResponse.json({
      ok: false,
      error: 'Não encontramos pedidos concluídos para este telefone. Faça seu primeiro pedido para entrar no clube!',
    }, { status: 404 })
  }

  const meus = redemptions.filter((r) => normalizePhone(r.phone) === chave)
  return NextResponse.json({ ok: true, config, saldo, resgates: meus.slice(-10).reverse() })
}
