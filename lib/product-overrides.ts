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
  category?: Product['category']
  /** true quando o produto foi criado/duplicado no admin (não existe na lista base) */
  isCustom?: boolean
}
export type OverridesMap = Record<string, ProductOverride>

/**
 * Materializa produtos criados no admin (duplicados/novos), que não existem
 * na lista base de PRODUCTS — eles vivem apenas no mapa de overrides.
 */
export function materializeCustomProducts(overrides: OverridesMap, baseIds: Set<string>): Product[] {
  return Object.entries(overrides)
    .filter(([id, ov]) => !baseIds.has(id) && ov.name && ov.price != null && ov.price > 0)
    .map(([id, ov]) => ({
      id,
      name: ov.name!,
      description: ov.description ?? '',
      price: ov.price!,
      promoPrice: ov.promoPrice,
      image: ov.image ?? '🥖',
      category: ov.category ?? 'subs-15cm',
      active: ov.active ?? true,
      badge: ov.badge,
    }))
}

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
