'use client'

// ============================================================================
// Revalidação do carrinho contra o cardápio atual.
//
// O carrinho vive no localStorage do cliente e sobrevive a dias. Se um produto
// for desativado (ou um ingrediente ficar em falta) depois que o item entrou no
// carrinho, nada avisava: o pedido chegava na cozinha com algo que não existe
// mais. Esta checagem roda ao abrir o carrinho e antes de finalizar o pedido.
// ============================================================================

import { PRODUCTS, type CartItem } from '@/lib/data'
import { fetchDisabledProducts } from '@/lib/products-availability'
import { fetchDisabledIngredients, ingKey, type IngredientCategory } from '@/lib/ingredients-availability'
import { fetchProductOverrides, materializeCustomProducts } from '@/lib/product-overrides'

export interface UnavailableItem {
  item: CartItem
  /** Motivo legível, para mostrar ao cliente. */
  reason: string
}

/** Ingredientes da customização, achatados em chaves `categoria:key`. */
function customizationKeys(item: CartItem): Array<{ key: string; label: string }> {
  const c = item.customization
  if (!c) return []
  const out: Array<{ key: string; label: string }> = []
  const push = (cat: IngredientCategory, k?: string) => {
    if (k) out.push({ key: ingKey(cat, k), label: k })
  }
  push('bread', c.bread)
  push('meat', c.meat)
  c.cheeses?.forEach((k) => push('cheese', k))
  c.salads?.forEach((k) => push('salad', k))
  c.sauces?.forEach((k) => push('sauce', k))
  Object.entries(c.extras ?? {}).forEach(([k, q]) => { if (q > 0) push('extra', k) })
  return out
}

/**
 * Confronta o carrinho com o cardápio publicado agora.
 * Retorna os itens que não podem mais ser pedidos, com o motivo.
 */
export async function findUnavailableItems(items: CartItem[]): Promise<UnavailableItem[]> {
  if (items.length === 0) return []

  const [disabledProducts, disabledIngredients, overrides] = await Promise.all([
    fetchDisabledProducts(),
    fetchDisabledIngredients(),
    fetchProductOverrides(),
  ])

  // Catálogo vigente: os produtos do código + os criados pelo admin, já com os
  // ajustes de override aplicados (um deles pode ter desativado o produto).
  const baseIds = new Set(PRODUCTS.map((p) => p.id))
  const catalog = new Map(
    [...PRODUCTS, ...materializeCustomProducts(overrides, baseIds)].map((p) => {
      const ov = overrides[p.id]
      return [p.id, { ...p, ...(ov ?? {}) }] as const
    }),
  )

  const out: UnavailableItem[] = []
  for (const item of items) {
    // Subs montados pelo cliente não existem no catálogo: valem pelos
    // ingredientes, checados logo abaixo.
    const isCustom = item.productId.startsWith('sub-custom-')
    const product = catalog.get(item.productId)

    if (!isCustom) {
      if (!product) {
        out.push({ item, reason: 'saiu do cardápio' })
        continue
      }
      if (product.active === false) {
        out.push({ item, reason: 'saiu do cardápio' })
        continue
      }
      if (disabledProducts.has(item.productId)) {
        out.push({ item, reason: 'está indisponível no momento' })
        continue
      }
    }

    const missing = customizationKeys(item).filter((k) => disabledIngredients.has(k.key))
    if (missing.length > 0) {
      out.push({ item, reason: 'tem ingrediente em falta' })
    }
  }
  return out
}

/** Frase pronta para avisar o cliente, no singular ou plural. */
export function unavailableMessage(list: UnavailableItem[]): string {
  if (list.length === 0) return ''
  const names = list.map((u) => `${u.item.name} (${u.reason})`).join(', ')
  return list.length === 1
    ? `${names} — o item foi removido do carrinho.`
    : `${names} — os itens foram removidos do carrinho.`
}
