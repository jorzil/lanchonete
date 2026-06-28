import { NextResponse } from 'next/server'
import { getLogs } from '@/lib/integrations/ifood/logs'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ logs: await getLogs() })
}
