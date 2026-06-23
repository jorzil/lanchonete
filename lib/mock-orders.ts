// ==================== MOCK ORDERS ====================
// Rótulos e estilos de status para o painel administrativo.
// Usa os tipos reais de lib/store.ts.

import type { Order, OrderStatus, PaymentMethod } from "@/lib/store"

export const STATUS_LABELS: Record<OrderStatus, string> = {
  novo:         "Novo Pedido",
  aceito:       "Aceito",
  em_preparo:   "Em Preparo",
  pronto:       "Pronto",
  saiu_entrega: "Saiu p/ Entrega",
  entregue:     "Entregue",
  cancelado:    "Cancelado",
}

export const STATUS_STYLES: Record<OrderStatus, string> = {
  novo:         "bg-orange-100 text-orange-700 border-orange-200",
  aceito:       "bg-blue-100 text-blue-700 border-blue-200",
  em_preparo:   "bg-purple-100 text-purple-700 border-purple-200",
  pronto:       "bg-emerald-100 text-emerald-700 border-emerald-200",
  saiu_entrega: "bg-cyan-100 text-cyan-700 border-cyan-200",
  entregue:     "bg-green-100 text-green-700 border-green-200",
  cancelado:    "bg-red-100 text-red-700 border-red-200",
}

export const STATUS_ORDER: OrderStatus[] = [
  "novo",
  "aceito",
  "em_preparo",
  "pronto",
  "saiu_entrega",
  "entregue",
  "cancelado",
]

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  "cartao-credito": "Cartão de Crédito",
  "cartao-debito": "Cartão de Débito",
  dinheiro: "Dinheiro",
}

// Sem pedidos fictícios. Os pedidos reais vêm do localStorage `mais_sub_orders`,
// gravados pelo checkout do site e pelo PDV.
export const MOCK_ORDERS: Order[] = []
