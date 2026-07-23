import { NextRequest, NextResponse } from 'next/server'
import { financialSales } from '@/lib/integrations/ifood/client'
import { logIFood } from '@/lib/integrations/ifood/logs'

export const dynamic = 'force-dynamic'

// GET /api/integrations/ifood/financial?begin=YYYY-MM-DD&end=YYYY-MM-DD
// Vendas com bruto/líquido oficiais (módulo financial do iFood).
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const begin = sp.get('begin') ?? ''
  const end = sp.get('end') ?? ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(begin) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return NextResponse.json({ ok: false, error: 'Período inválido (use YYYY-MM-DD)' }, { status: 400 })
  }
  try {
    const sales = await financialSales(begin, end)
    await logIFood('info', 'financial', `Consulta financeira ${begin} a ${end}: ${sales.length} venda(s)`)
    return NextResponse.json({ ok: true, sales })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro'
    return NextResponse.json({ ok: false, error: msg }, { status: 502 })
  }
}
