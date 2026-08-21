'use client'

// ============================================================================
// Catálogo vigente: a lista do código MAIS as edições feitas no admin.
//
// Existem duas formas de um produto sair do ar, e é preciso olhar as duas:
//   1. Produtos → desativar/editar/criar  → vive no mapa de overrides
//   2. Disponibilidade → faltou hoje      → vive na lista de indisponíveis
//
// Quem lê só a lista estática do código (PRODUCTS) mostra cookie desativado e
// esconde cookie criado pelo admin. Este módulo existe para que cardápio,
// combo e sugestões do checkout enxerguem exatamente a mesma coisa.
// ============================================================================

import { PRODUCTS, type Product } from '@/lib/data'
import { fetchProductOverrides, materializeCustomProducts, type OverridesMap } from '@/lib/product-overrides'
import { fetchDisabledProducts } from '@/lib/products-availability'

export interface EffectiveCatalog {
  /** Produtos com as edições do admin aplicadas, incluindo os criados por ele. */
  products: Product[]
  /** Ids marcados como indisponíveis hoje. */
  disabled: Set<string>
}

export function buildCatalog(overrides: OverridesMap): Product[] {
  const baseIds = new Set(PRODUCTS.map((p) => p.id))
  return [
    ...PRODUCTS.map((p) => ({ ...p, ...(overrides[p.id] ?? {}) })),
    ...materializeCustomProducts(overrides, baseIds),
  ]
}

export async function fetchEffectiveCatalog(): Promise<EffectiveCatalog> {
  const [overrides, disabled] = await Promise.all([fetchProductOverrides(), fetchDisabledProducts()])
  return { products: buildCatalog(overrides), disabled }
}

/** Vendável agora: não foi desativado no cadastro nem marcado como em falta. */
export function isAvailable(p: Product, disabled: Set<string>): boolean {
  return p.active !== false && !disabled.has(p.id)
}

/** Produtos vendáveis de uma categoria, na ordem do catálogo. */
export function availableByCategory(
  catalog: EffectiveCatalog,
  category: Product['category'],
  allowedIds?: string[] | null,
): Product[] {
  const allow = allowedIds && allowedIds.length > 0 ? new Set(allowedIds) : null
  return catalog.products.filter(
    (p) => p.category === category && (!allow || allow.has(p.id)) && isAvailable(p, catalog.disabled),
  )
}
