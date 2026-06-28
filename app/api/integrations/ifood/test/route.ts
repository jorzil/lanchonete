import { NextResponse } from 'next/server'
import { testConnection } from '@/lib/integrations/ifood/client'

export const dynamic = 'force-dynamic'

export async function POST() {
  const result = await testConnection()
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
