// ==================== MOCK ORDERS ====================
// Rótulos e estilos de status para o painel administrativo.
// Usa os tipos reais de lib/store.ts.

import type { Order, OrderStatus, PaymentMethod } from "@/lib/store"

export const STATUS_LABELS: Record<OrderStatus, string> = {
  novo: "Novo",
  confirmado: "Confirmado",
  "em-preparo": "Em preparo",
  "saiu-para-entrega": "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
}

/** Classes Tailwind para os badges de status. */
export const STATUS_STYLES: Record<OrderStatus, string> = {
  novo: "bg-blue-100 text-blue-700 border-blue-200",
  confirmado: "bg-yellow-100 text-yellow-700 border-yellow-200",
  "em-preparo": "bg-orange-100 text-orange-700 border-orange-200",
  "saiu-para-entrega": "bg-indigo-100 text-indigo-700 border-indigo-200",
  entregue: "bg-green-100 text-green-700 border-green-200",
  cancelado: "bg-red-100 text-red-700 border-red-200",
}

export const STATUS_ORDER: OrderStatus[] = [
  "novo",
  "confirmado",
  "em-preparo",
  "saiu-para-entrega",
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
