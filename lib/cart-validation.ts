'use client'

// ============================================================================
// Revalidação do carrinho contra o cardápio atual.
//
// O carrinho vive no localStorage do cliente e sobrevive a dias. Se um produto
// for desativado (ou um ingrediente ficar em falta) depois que o item entrou no
// carrinho, o pedido chegaria na cozinha com algo que não existe mais.
//
// PRINCÍPIO: só remove com PROVA POSITIVA de indisponibilidade. "Não encontrei
// no catálogo" não é prova — pode ser id sintético, produto criado no admin ou
// simplesmente uma chamada que falhou. Na dúvida, o item fica. Esvaziar o
// carrinho de um cliente legítimo é pior que deixar passar um item raro.
// ============================================================================

import { PRODUCTS, type CartItem } from '@/lib/data'
import { ingKey, type IngredientCategory } from '@/lib/ingredients-availability'
import { materializeCustomProducts, type OverridesMap } from '@/lib/product-overrides'

export interface UnavailableItem {
  item: CartItem
  /** Motivo legível, para mostrar ao cliente. */
  reason: string
}

/**
 * Ids que não existem em PRODUCTS por construção: o "Monte Seu Sub" da tela do
 * cardápio (`monte-15cm`) e o sub montado sem produto de origem
 * (`sub-custom-15cm`). Valem pelos ingredientes, nunca pelo catálogo.
 */
function isSyntheticId(productId: string): boolean {
  return productId.startsWith('monte-') || productId.startsWith('sub-custom-')
}

/** Ingredientes da customização, achatados em chaves `categoria:key`. */
function customizationKeys(item: CartItem): string[] {
  const c = item.customization
  if (!c) return []
  const out: string[] = []
  const push = (cat: IngredientCategory, k?: string) => { if (k) out.push(ingKey(cat, k)) }
  push('bread', c.bread)
  push('meat', c.meat)
  c.cheeses?.forEach((k) => push('cheese', k))
  c.salads?.forEach((k) => push('salad', k))
  c.sauces?.forEach((k) => push('sauce', k))
  Object.entries(c.extras ?? {}).forEach(([k, q]) => { if (q > 0) push('extra', k) })
  return out
}

/**
 * Busca uma lista de indisponíveis distinguindo "veio vazia" de "falhou".
 * Sem essa distinção, uma falha de rede vira "nada está disponível".
 */
async function fetchList(url: string, field: string): Promise<{ ok: boolean; set: Set<string> }> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return { ok: false, set: new Set() }
    const data = await res.json()
    const arr = (data as Record<string, unknown>)[field]
    if (!Array.isArray(arr)) return { ok: false, set: new Set() }
    return { ok: true, set: new Set(arr.filter((v): v is string => typeof v === 'string')) }
  } catch {
    return { ok: false, set: new Set() }
  }
}

async function fetchOverrides(): Promise<{ ok: boolean; overrides: OverridesMap }> {
  try {
    const res = await fetch('/api/product-overrides', { cache: 'no-store' })
    if (!res.ok) return { ok: false, overrides: {} }
    const data = await res.json()
    if (!data?.overrides || typeof data.overrides !== 'object') return { ok: false, overrides: {} }
    return { ok: true, overrides: data.overrides as OverridesMap }
  } catch {
    return { ok: false, overrides: {} }
  }
}

/**
 * Confronta o carrinho com o cardápio publicado agora.
 * Retorna apenas os itens comprovadamente indisponíveis.
 */
export async function findUnavailableItems(items: CartItem[]): Promise<UnavailableItem[]> {
  if (items.length === 0) return []

  const [prods, ings, ovr] = await Promise.all([
    fetchList('/api/products-availability', 'disabled'),
    fetchList('/api/ingredients', 'disabled'),
    fetchOverrides(),
  ])

  // Catálogo confiável só quando os overrides carregaram: produtos criados no
  // admin vivem lá, e sem eles um item legítimo pareceria inexistente.
  const catalogoConfiavel = ovr.ok
  const baseIds = new Set(PRODUCTS.map((p) => p.id))
  const catalog = new Map(
    [...PRODUCTS, ...materializeCustomProducts(ovr.overrides, baseIds)].map((p) => [p.id, p] as const),
  )

  const out: UnavailableItem[] = []
  for (const item of items) {
    const sintetico = isSyntheticId(item.productId)

    // ── Regra 1: desativado na tela de disponibilidade (prova positiva) ──
    if (prods.ok && !sintetico && prods.set.has(item.productId)) {
      out.push({ item, reason: 'está indisponível no momento' })
      continue
    }

    // ── Regra 2: marcado como inativo (prova positiva) ──
    // Só o override manda aqui: PRODUCTS traz active:true para tudo que está
    // publicado, e o admin desliga pelo override.
    const ov = ovr.ok ? ovr.overrides[item.productId] : undefined
    if (ov?.active === false) {
      out.push({ item, reason: 'saiu do cardápio' })
      continue
    }
    if (ovr.ok && !sintetico && catalog.get(item.productId)?.active === false) {
      out.push({ item, reason: 'saiu do cardápio' })
      continue
    }

    // ── Regra 3: sumiu do catálogo ──
    // Só vale com o catálogo confiável e id não sintético. Sem isso, uma
    // chamada que falhou apagaria o carrinho inteiro.
    if (catalogoConfiavel && !sintetico && !catalog.has(item.productId)) {
      out.push({ item, reason: 'saiu do cardápio' })
      continue
    }

    // ── Regra 4: ingrediente em falta (prova positiva) ──
    if (ings.ok) {
      const keys = customizationKeys(item)
      if (keys.some((k) => ings.set.has(k))) {
        out.push({ item, reason: 'tem ingrediente em falta' })
      }
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
