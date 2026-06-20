// ==================== ORDERS STORAGE ====================
// Persistência de pedidos reais no localStorage.
// Os pedidos são gravados pelo checkout do site e pelo PDV,
// e lidos pelo painel administrativo.

import type { Order } from "@/lib/store"

export const ORDERS_STORAGE_KEY = "mais_sub_orders"

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

/** Sobrescreve a lista de pedidos no localStorage. */
export function saveOrders(orders: Order[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
  } catch {
    /* ignore */
  }
}

/** Adiciona um pedido ao topo da lista persistida. */
export function addOrder(order: Order): void {
  const existing = loadOrders()
  existing.unshift(order)
  saveOrders(existing)
}
