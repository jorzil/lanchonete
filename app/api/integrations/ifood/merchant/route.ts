import { NextRequest, NextResponse } from 'next/server'
import {
  getMerchantDetail, getMerchantStatus,
  listInterruptions, createInterruption, deleteInterruption,
  getOpeningHours, putOpeningHours,
  type IFoodShift,
} from '@/lib/integrations/ifood/client'

export const dynamic = 'force-dynamic'

// GET: pacote com detalhes, status, pausas e horários da loja
export async function GET() {
  try {
    const [detail, status, interruptions, openingHours] = await Promise.all([
      getMerchantDetail(),
      getMerchantStatus(),
      listInterruptions(),
      getOpeningHours(),
    ])
    return NextResponse.json({ ok: true, detail, status, interruptions, openingHours })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro'
    return NextResponse.json({ ok: false, error: msg }, { status: 502 })
  }
}

// POST { action: 'createInterruption' | 'deleteInterruption' | 'setOpeningHours', ... }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (body.action === 'createInterruption') {
      const ok = await createInterruption(
        String(body.description || 'Pausa'),
        Math.max(1, Number(body.minutes) || 30),
      )
      return NextResponse.json({ ok })
    }
    if (body.action === 'deleteInterruption' && body.id) {
      const ok = await deleteInterruption(String(body.id))
      return NextResponse.json({ ok })
    }
    if (body.action === 'setOpeningHours' && Array.isArray(body.shifts)) {
      const shifts: IFoodShift[] = body.shifts
        .filter((s: IFoodShift) => s.dayOfWeek && s.start && s.duration > 0)
      const ok = await putOpeningHours(shifts)
      return NextResponse.json({ ok })
    }
    return NextResponse.json({ ok: false, error: 'Ação inválida' }, { status: 400 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro'
    return NextResponse.json({ ok: false, error: msg }, { status: 502 })
  }
}
