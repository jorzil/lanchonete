import { NextRequest, NextResponse } from 'next/server'
import { listDeliveries } from '@/lib/db-orders'
import { supabaseConfigured } from '@/lib/supabase'
import { ENTREGAS_TOKEN } from '@/lib/entregas-auth'

// Lista os pedidos de entrega prontos / a caminho (sem expor o código).
export async function GET(req: NextRequest) {
  if (req.headers.get('x-entregas-token') !== ENTREGAS_TOKEN) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!supabaseConfigured) {
    return NextResponse.json({ orders: [] })
  }
  try {
    const orders = await listDeliveries()
    // Remove o código antes de enviar — o motoboy deve obtê-lo com o cliente.
    const safe = orders.map((o) => {
      const { deliveryCode, ...rest } = o
      void deliveryCode
      return { ...rest, hasCode: !!deliveryCode }
    })
    return NextResponse.json({ orders: safe })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
