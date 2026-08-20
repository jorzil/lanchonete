// ==================== ORDERS STORAGE ====================
// Cópia local dos pedidos, usada só como rede de segurança quando o banco não
// responde. A fonte da verdade é o Supabase.
//
// Há um teto de pedidos guardados de propósito: o painel gravava a lista
// INTEIRA a cada mudança de status e, ao estourar os ~5MB do navegador, o
// localStorage RECUSA a gravação e mantém o valor antigo. O erro caía num
// catch vazio, e na próxima vez que o banco falhasse a lista velha voltava —
// com os status desatualizados, parecendo que nada tinha sido salvo.

import type { Order } from "@/lib/store"

export const ORDERS_STORAGE_KEY = "mais_sub_orders"

/** Quantos pedidos ficam na cópia local. Os mais recentes são os que importam. */
const MAX_LOCAL_ORDERS = 200

/** Avisa a aplicação quando a cópia local falha, em vez de falhar em silêncio. */
export type StorageFailure = (motivo: string) => void
let onFailure: StorageFailure | null = null
export function setOrdersStorageFailureHandler(fn: StorageFailure | null): void {
  onFailure = fn
}

/** Lê os pedidos persistidos no localStorage. Retorna [] no servidor ou em erro. */
export function loadOrders(): Order[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Order[]) : []
  } catch {
    return []
  }
}

/** Mantém os mais recentes primeiro e corta no teto. */
function recortar(orders: Order[]): Order[] {
  if (orders.length <= MAX_LOCAL_ORDERS) return orders
  return [...orders]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, MAX_LOCAL_ORDERS)
}

/** Sobrescreve a lista de pedidos no localStorage. */
export function saveOrders(orders: Order[]): void {
  if (typeof window === "undefined") return
  const recortados = recortar(orders)
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(recortados))
  } catch {
    // Cheio: tenta de novo com bem menos. Guardar pouco é melhor que guardar
    // desatualizado, porque o valor antigo continuaria lá.
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(recortados.slice(0, 40)))
    } catch {
      // Nem isso coube: apaga a cópia local. Uma cópia velha é pior que nenhuma
      // — ela reapareceria no lugar dos dados do banco.
      try { localStorage.removeItem(ORDERS_STORAGE_KEY) } catch {}
      onFailure?.("A cópia local de pedidos está cheia e foi limpa. Os pedidos seguem salvos no banco.")
    }
  }
}

/** Adiciona um pedido ao topo da lista persistida. */
export function addOrder(order: Order): void {
  const existing = loadOrders()
  existing.unshift(order)
  saveOrders(existing)
}
