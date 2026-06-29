'use client'

export interface OrderBumpOffer {
  id: string
  productId: string
  bumpPrice: number
  enabled: boolean
}

export interface OrderBumpConfig {
  offers: OrderBumpOffer[]
  metrics: Record<string, number>
}

export async function fetchOrderBumps(): Promise<OrderBumpConfig> {
  try {
    const res = await fetch('/api/order-bumps', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      return { offers: Array.isArray(data.offers) ? data.offers : [], metrics: data.metrics ?? {} }
    }
  } catch {}
  return { offers: [], metrics: {} }
}

export async function patchOrderBumps(offers: OrderBumpOffer[]): Promise<boolean> {
  try {
    const res = await fetch('/api/order-bumps', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offers }),
    })
    const data = await res.json().catch(() => ({}))
    return res.ok && data.ok
  } catch {
    return false
  }
}

// Registra (métrica) que um produto foi adicionado via order bump
export function logBumpAdd(productId: string): void {
  try {
    fetch('/api/order-bumps/metric', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    }).catch(() => {})
  } catch {}
}
