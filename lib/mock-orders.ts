// ==================== MOCK ORDERS ====================
// Dados fictícios de pedidos para o painel administrativo.
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

function iso(daysAgo: number, hour: number, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function addr(
  street: string,
  number: string,
  neighborhood: string,
  complement?: string,
) {
  return {
    cep: "35010-000",
    street,
    number,
    complement,
    neighborhood,
    city: "Governador Valadares",
    state: "MG",
  }
}

export const MOCK_ORDERS: Order[] = [
  {
    id: "1", orderNumber: "MS-001042",
    items: [
      { id: "i1", productId: "sub-30-carne", name: "Sub 30cm Carne Suprema", price: 37.9, quantity: 1, image: "🥖" },
      { id: "i2", productId: "refri-lata", name: "Refrigerante 350ml", price: 6.0, quantity: 2, image: "🥤" },
    ],
    customer: { name: "João Pereira", phone: "(33) 99812-4521" },
    address: addr("Rua Israel Pinheiro", "1240", "Centro", "Próximo à praça"),
    orderType: "entrega", paymentMethod: "pix",
    subtotal: 49.9, deliveryFee: 6.0, discount: 0, total: 55.9,
    status: "novo", createdAt: iso(0, 19, 12), updatedAt: iso(0, 19, 12),
  },
  {
    id: "2", orderNumber: "MS-001041",
    items: [{ id: "i3", productId: "sub-15-frango", name: "Sub 15cm Frango Cream Cheese", price: 21.9, quantity: 2, image: "🥖" }],
    customer: { name: "Maria Aparecida Silva", phone: "(33) 98745-1122" },
    address: addr("Av. Brasil", "3580", "Lourdes"),
    orderType: "entrega", paymentMethod: "dinheiro",
    subtotal: 43.8, deliveryFee: 5.0, discount: 0, total: 48.8,
    status: "confirmado", notes: "Troco para R$ 100", createdAt: iso(0, 18, 40), updatedAt: iso(0, 18, 50),
  },
  {
    id: "3", orderNumber: "MS-001040",
    items: [
      { id: "i4", productId: "combo-30-refri", name: "Combo Premium", price: 45.9, quantity: 1, image: "🎁" },
    ],
    customer: { name: "Carlos Eduardo Souza", phone: "(33) 99988-7766" },
    address: addr("Rua Marechal Floriano", "210", "São Pedro"),
    orderType: "entrega", paymentMethod: "cartao-credito",
    subtotal: 45.9, deliveryFee: 7.0, discount: 5.0, total: 47.9,
    status: "em-preparo", createdAt: iso(0, 18, 10), updatedAt: iso(0, 18, 25),
  },
  {
    id: "4", orderNumber: "MS-001039",
    items: [
      { id: "i5", productId: "sub-30-carne", name: "Sub 30cm Carne Suprema", price: 37.9, quantity: 1, image: "🥖" },
      { id: "i6", productId: "refri-lata", name: "Refrigerante 350ml", price: 6.0, quantity: 1, image: "🥤" },
    ],
    customer: { name: "Fernanda Oliveira", phone: "(33) 98123-4567" },
    orderType: "retirada", paymentMethod: "pix",
    subtotal: 43.9, deliveryFee: 0, discount: 0, total: 43.9,
    status: "saiu-para-entrega", createdAt: iso(0, 17, 30), updatedAt: iso(0, 17, 55),
  },
  {
    id: "5", orderNumber: "MS-001038",
    items: [
      { id: "i7", productId: "sub-15-lombo", name: "Sub 15cm Lombo Defumado", price: 21.9, quantity: 1, image: "🥖" },
      { id: "i8", productId: "suco", name: "Suco Natural 400ml", price: 9.0, quantity: 1, image: "🍊" },
    ],
    customer: { name: "Roberto Carlos Mendes", phone: "(33) 99777-3311" },
    address: addr("Rua Sá Carvalho", "98", "Vila Bretas", "Casa azul"),
    orderType: "entrega", paymentMethod: "cartao-debito",
    subtotal: 30.9, deliveryFee: 6.0, discount: 0, total: 36.9,
    status: "saiu-para-entrega", createdAt: iso(0, 16, 50), updatedAt: iso(0, 17, 20),
  },
  {
    id: "6", orderNumber: "MS-001037",
    items: [{ id: "i9", productId: "sub-30-frango", name: "Sub 30cm Frango Cream Cheese", price: 37.9, quantity: 1, image: "🥖" }],
    customer: { name: "Ana Beatriz Costa", phone: "(33) 98456-7890" },
    address: addr("Av. Minas Gerais", "1500", "Grã-Duquesa"),
    orderType: "entrega", paymentMethod: "pix",
    subtotal: 37.9, deliveryFee: 5.0, discount: 0, total: 42.9,
    status: "entregue", createdAt: iso(1, 20, 5), updatedAt: iso(1, 20, 45),
  },
  {
    id: "7", orderNumber: "MS-001036",
    items: [
      { id: "i10", productId: "sub-15-carne", name: "Sub 15cm Carne Suprema", price: 21.9, quantity: 3, image: "🥖" },
    ],
    customer: { name: "Lucas Gabriel Ferreira", phone: "(33) 99321-6549" },
    address: addr("Rua Prudente de Morais", "742", "Santa Rita"),
    orderType: "entrega", paymentMethod: "dinheiro",
    subtotal: 65.7, deliveryFee: 6.0, discount: 10.0, total: 61.7,
    status: "entregue", createdAt: iso(1, 19, 30), updatedAt: iso(1, 20, 10),
  },
  {
    id: "8", orderNumber: "MS-001035",
    items: [{ id: "i11", productId: "sub-30-lombo", name: "Sub 30cm Lombo Defumado", price: 37.9, quantity: 1, image: "🥖" }],
    customer: { name: "Patrícia Gomes", phone: "(33) 98765-4321" },
    orderType: "retirada", paymentMethod: "pix",
    subtotal: 37.9, deliveryFee: 0, discount: 0, total: 37.9,
    status: "entregue", createdAt: iso(1, 18, 15), updatedAt: iso(1, 18, 40),
  },
  {
    id: "9", orderNumber: "MS-001034",
    items: [{ id: "i12", productId: "combo-30-refri", name: "Combo Premium", price: 45.9, quantity: 2, image: "🎁" }],
    customer: { name: "Rafael Almeida", phone: "(33) 99654-7788" },
    address: addr("Rua Bárbara Heliodora", "330", "Esplanadinha"),
    orderType: "entrega", paymentMethod: "cartao-credito",
    subtotal: 91.8, deliveryFee: 7.0, discount: 0, total: 98.8,
    status: "cancelado", notes: "Cliente desistiu", createdAt: iso(2, 21, 0), updatedAt: iso(2, 21, 15),
  },
  {
    id: "10", orderNumber: "MS-001033",
    items: [
      { id: "i13", productId: "sub-15-frango", name: "Sub 15cm Frango Cream Cheese", price: 21.9, quantity: 1, image: "🥖" },
      { id: "i14", productId: "suco", name: "Suco Natural 400ml", price: 9.0, quantity: 1, image: "🍊" },
    ],
    customer: { name: "Juliana Martins", phone: "(33) 98234-5566" },
    address: addr("Rua Peçanha", "455", "Centro"),
    orderType: "entrega", paymentMethod: "pix",
    subtotal: 30.9, deliveryFee: 5.0, discount: 0, total: 35.9,
    status: "entregue", createdAt: iso(2, 20, 10), updatedAt: iso(2, 20, 50),
  },
  {
    id: "11", orderNumber: "MS-001032",
    items: [{ id: "i15", productId: "sub-30-carne", name: "Sub 30cm Carne Suprema", price: 37.9, quantity: 2, image: "🥖" }],
    customer: { name: "Bruno Henrique Lima", phone: "(33) 99445-2211" },
    address: addr("Av. JK", "2100", "Ilha dos Araújos"),
    orderType: "entrega", paymentMethod: "dinheiro",
    subtotal: 75.8, deliveryFee: 8.0, discount: 0, total: 83.8,
    status: "entregue", createdAt: iso(3, 19, 40), updatedAt: iso(3, 20, 20),
  },
  {
    id: "12", orderNumber: "MS-001031",
    items: [{ id: "i16", productId: "combo-duplo", name: "Combo Duplo", price: 54.9, quantity: 1, image: "🎁" }],
    customer: { name: "Camila Rodrigues", phone: "(33) 98998-1234" },
    orderType: "retirada", paymentMethod: "pix",
    subtotal: 54.9, deliveryFee: 0, discount: 0, total: 54.9,
    status: "entregue", createdAt: iso(3, 18, 20), updatedAt: iso(3, 18, 45),
  },
  {
    id: "13", orderNumber: "MS-001030",
    items: [{ id: "i17", productId: "sub-30-frango", name: "Sub 30cm Frango Cream Cheese", price: 37.9, quantity: 1, image: "🥖" }],
    customer: { name: "Diego Santos", phone: "(33) 99112-8765" },
    address: addr("Rua Israel Pinheiro", "880", "Centro"),
    orderType: "entrega", paymentMethod: "cartao-debito",
    subtotal: 37.9, deliveryFee: 6.0, discount: 0, total: 43.9,
    status: "entregue", createdAt: iso(4, 20, 30), updatedAt: iso(4, 21, 0),
  },
  {
    id: "14", orderNumber: "MS-001029",
    items: [
      { id: "i18", productId: "sub-30-carne", name: "Sub 30cm Carne Suprema", price: 37.9, quantity: 1, image: "🥖" },
      { id: "i19", productId: "sub-15-carne", name: "Sub 15cm Carne Suprema", price: 21.9, quantity: 1, image: "🥖" },
      { id: "i20", productId: "refri-lata", name: "Refrigerante 350ml", price: 6.0, quantity: 2, image: "🥤" },
    ],
    customer: { name: "Vanessa Cardoso", phone: "(33) 98321-9988" },
    address: addr("Rua Coronel Tonico Pereira", "67", "Carapina"),
    orderType: "entrega", paymentMethod: "pix",
    subtotal: 71.8, deliveryFee: 6.0, discount: 0, total: 77.8,
    status: "entregue", createdAt: iso(5, 19, 15), updatedAt: iso(5, 19, 55),
  },
  {
    id: "15", orderNumber: "MS-001028",
    items: [{ id: "i21", productId: "combo-15-refri", name: "Combo Classic", price: 29.9, quantity: 1, image: "🎁" }],
    customer: { name: "Thiago Nunes", phone: "(33) 99887-6655" },
    orderType: "retirada", paymentMethod: "dinheiro",
    subtotal: 29.9, deliveryFee: 0, discount: 0, total: 29.9,
    status: "entregue", createdAt: iso(5, 18, 0), updatedAt: iso(5, 18, 30),
  },
  {
    id: "16", orderNumber: "MS-001027",
    items: [
      { id: "i22", productId: "sub-15-frango", name: "Sub 15cm Frango Cream Cheese", price: 21.9, quantity: 2, image: "🥖" },
      { id: "i23", productId: "suco", name: "Suco Natural 400ml", price: 9.0, quantity: 2, image: "🍊" },
    ],
    customer: { name: "Larissa Pereira", phone: "(33) 98456-3322" },
    address: addr("Av. Brasil", "5120", "Lourdes"),
    orderType: "entrega", paymentMethod: "pix",
    subtotal: 61.8, deliveryFee: 5.0, discount: 0, total: 66.8,
    status: "entregue", createdAt: iso(6, 20, 0), updatedAt: iso(6, 20, 40),
  },
  {
    id: "17", orderNumber: "MS-001026",
    items: [{ id: "i24", productId: "sub-30-lombo", name: "Sub 30cm Lombo Defumado", price: 37.9, quantity: 1, image: "🥖" }],
    customer: { name: "Gustavo Henrique", phone: "(33) 99334-5511" },
    address: addr("Rua Dom Modesto", "145", "Vila Isa"),
    orderType: "entrega", paymentMethod: "cartao-credito",
    subtotal: 37.9, deliveryFee: 6.0, discount: 0, total: 43.9,
    status: "entregue", createdAt: iso(6, 19, 20), updatedAt: iso(6, 19, 50),
  },
  {
    id: "18", orderNumber: "MS-001025",
    items: [{ id: "i25", productId: "sub-30-carne", name: "Sub 30cm Carne Suprema", price: 37.9, quantity: 2, image: "🥖" }],
    customer: { name: "Renata Dias", phone: "(33) 98765-1199" },
    address: addr("Rua Afonso Pena", "990", "Centro"),
    orderType: "entrega", paymentMethod: "dinheiro",
    subtotal: 75.8, deliveryFee: 6.0, discount: 5.0, total: 76.8,
    status: "entregue", createdAt: iso(6, 18, 30), updatedAt: iso(6, 19, 10),
  },
]
