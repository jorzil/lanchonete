import { NextRequest, NextResponse } from 'next/server'
import { pushStatus } from '@/lib/integrations/ifood/client'

export const dynamic = 'force-dynamic'

// Envia a mudança de status ao iFood (quando há ação equivalente na API).
export async function POST(req: NextRequest) {
  const { externalId, status } = await req.json()
  if (!externalId || !status) {
    return NextResponse.json({ ok: false, error: 'externalId e status obrigatórios' }, { status: 400 })
  }
  const ok = await pushStatus(String(externalId), String(status))
  return NextResponse.json({ ok, synced: ok })
}
