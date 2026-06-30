import { NextResponse } from 'next/server'
import { listMerchants } from '@/lib/integrations/ifood/client'

export const dynamic = 'force-dynamic'

// Lista as lojas (merchants) do app — para descobrir o Merchant ID.
export async function GET() {
  try {
    const merchants = await listMerchants()
    return NextResponse.json({ ok: true, merchants })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro'
    return NextResponse.json({ ok: false, error: msg }, { status: 400 })
  }
}
