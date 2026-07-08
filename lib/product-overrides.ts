'use client'

import type { Product } from '@/lib/data'

// Edições de produto feitas no admin (descrição, preço, nome, badge, ativo),
// persistidas no Supabase para refletir no site em todos os aparelhos.
export type ProductOverride = {
  active?: boolean
  costPrice?: number
  price?: number
  promoPrice?: number
  name?: string
  description?: string
  image?: string
  badge?: Product['badge']
}
export type OverridesMap = Record<string, ProductOverride>

export async function fetchProductOverrides(): Promise<OverridesMap> {
  try {
    const res = await fetch('/api/product-overrides', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      return data.overrides && typeof data.overrides === 'object' ? data.overrides : {}
    }
  } catch {}
  return {}
}

// Retorna o mapa confirmado pelo servidor, ou null se falhou.
export async function patchProductOverrides(overrides: OverridesMap): Promise<OverridesMap | null> {
  try {
    const res = await fetch('/api/product-overrides', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrides }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.ok && data.overrides) return data.overrides
    return null
  } catch {
    return null
  }
}
