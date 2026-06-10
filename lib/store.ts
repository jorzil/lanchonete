import { useState, useEffect } from 'react'

export type SizeOption = '15cm' | '30cm'
export interface MeatOption { key: string; name: string }
export interface CheeseOption { key: string; name: string }
export interface SaladOption { key: string; name: string }
export interface SauceOption { key: string; name: string }
export interface ExtraOption { key: string; name: string; price15cm: number; price30cm: number }

export interface SubCustomization {
  size: SizeOption
  meat: string
  cheese: string
  salads: string[]
  sauces: string[]
  extras: Record<string, number>
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: 'subs-15cm' | 'subs-30cm' | 'combos' | 'bebidas'
  active: boolean
}

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  customization?: SubCustomization
  image: string
}

export type OrderStatus = 'novo' | 'confirmado' | 'em-preparo' | 'saiu-para-entrega' | 'entregue' | 'cancelado'

export interface Address {
  cep: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
}

export interface Customer { name: string; phone: string }
export type PaymentMethod = 'pix' | 'cartao-credito' | 'cartao-debito' | 'dinheiro'
export interface Coupon { code: string; discount: number; type: 'percentage' | 'fixed' }
export interface LoyaltyPoints { customerId: string; points: number; history: { date: string; points: number; description: string }[] }

export interface Order {
  id: string
  orderNumber: string
  items: CartItem[]
  customer: Customer
  address?: Address
  orderType: 'entrega' | 'retirada'
  paymentMethod: PaymentMethod
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  status: OrderStatus
  notes?: string
  createdAt: string
  updatedAt: string
  coupon?: Coupon
}

export const MENU = {
  sizes: [
    { key: '15cm' as SizeOption, label: '15cm', price: 21.9, description: 'Perfeito para um lanche individual' },
    { key: '30cm' as SizeOption, label: '30cm', price: 37.9, description: 'Ideal para quem tem mais fome' },
  ],
  meats: [
    { key: 'frango-cream-cheese', name: 'Frango com Cream Cheese' },
    { key: 'lombo-defumado', name: 'Lombo Defumado' },
    { key: 'carne-suprema', name: 'Carne Suprema com Requeijão' },
  ] as MeatOption[],
  cheeses: [
    { key: 'mussarela', name: 'Mussarela' },
    { key: 'cheddar-cremoso', name: 'Cheddar Cremoso' },
    { key: 'creme-ricota', name: 'Creme de Ricota' },
  ] as CheeseOption[],
  salads: [
    { key: 'alface', name: 'Alface' },
    { key: 'tomate', name: 'Tomate' },
    { key: 'picles', name: 'Picles' },
    { key: 'pimentao', name: 'Pimentão' },
    { key: 'cebola-roxa', name: 'Cebola Roxa' },
    { key: 'azeitona', name: 'Azeitona' },
    { key: 'cenoura-ralada', name: 'Cenoura Ralada' },
    { key: 'rucula', name: 'Rúcula' },
  ] as SaladOption[],
  sauces: [
    { key: 'chipotle', name: 'Chipotle' },
    { key: 'mostarda-mel', name: 'Mostarda e Mel' },
    { key: 'maionese-temperada', name: 'Maionese Temperada' },
    { key: 'ranch', name: 'Ranch' },
    { key: 'barbecue', name: 'Barbecue' },
    { key: 'baconese', name: 'Baconese' },
  ] as SauceOption[],
  maxSauces: 3,
  extras: [
    { key: 'bacon', name: 'Bacon', price15cm: 4, price30cm: 6 },
    { key: 'presunto', name: 'Presunto', price15cm: 3, price30cm: 5 },
    { key: 'peito-peru', name: 'Peito de Peru', price15cm: 4, price30cm: 6 },
    { key: 'queijo-dobro', name: 'Queijo em Dobro', price15cm: 3, price30cm: 5 },
  ] as ExtraOption[],
}

export const PRODUCTS: Product[] = [
  { id: 'sub-15-frango', name: 'Sub Frango com Cream Cheese 15cm', description: 'Frango suculento com cream cheese cremoso, pão artesanal tostado', price: 21.9, image: '🥖', category: 'subs-15cm', active: true },
  { id: 'sub-15-lombo', name: 'Sub Lombo Defumado 15cm', description: 'Lombo defumado artesanal com sabor inconfundível', price: 21.9, image: '🥖', category: 'subs-15cm', active: true },
  { id: 'sub-15-carne', name: 'Sub Carne Suprema 15cm', description: 'Carne bovina premium com requeijão cremoso', price: 21.9, image: '🥖', category: 'subs-15cm', active: true },
  { id: 'sub-30-frango', name: 'Sub Frango com Cream Cheese 30cm', description: 'Frango suculento com cream cheese cremoso, pão artesanal tostado', price: 37.9, image: '🥖', category: 'subs-30cm', active: true },
  { id: 'sub-30-lombo', name: 'Sub Lombo Defumado 30cm', description: 'Lombo defumado artesanal com sabor inconfundível', price: 37.9, image: '🥖', category: 'subs-30cm', active: true },
  { id: 'sub-30-carne', name: 'Sub Carne Suprema 30cm', description: 'Carne bovina premium com requeijão cremoso', price: 37.9, image: '🥖', category: 'subs-30cm', active: true },
  { id: 'combo-15-refri', name: 'Combo Sub 15cm + Refri', description: 'Sub 15cm de sua escolha + refrigerante 350ml', price: 29.9, image: '🎁', category: 'combos', active: true },
  { id: 'combo-30-refri', name: 'Combo Sub 30cm + Refri', description: 'Sub 30cm de sua escolha + refrigerante 350ml', price: 45.9, image: '🎁', category: 'combos', active: true },
  { id: 'combo-duplo', name: 'Combo Duplo 15cm', description: '2 Subs 15cm + 2 refrigerantes 350ml', price: 54.9, image: '🎁', category: 'combos', active: true },
  { id: 'refri-lata', name: 'Refrigerante Lata 350ml', description: 'Coca-Cola, Guaraná, Sprite ou Fanta', price: 6.0, image: '🥤', category: 'bebidas', active: true },
  { id: 'agua', name: 'Água Mineral 500ml', description: 'Água mineral sem gás gelada', price: 4.0, image: '💧', category: 'bebidas', active: true },
  { id: 'suco', name: 'Suco Natural 400ml', description: 'Laranja, Limão ou Maracujá', price: 9.0, image: '🍊', category: 'bebidas', active: true },
]

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `MS-${timestamp}-${random}`
}

export function calculateSubTotal(customization: SubCustomization): number {
  const sizePrice = customization.size === '15cm' ? 21.9 : 37.9
  let extrasTotal = 0
  for (const [key, qty] of Object.entries(customization.extras)) {
    if (qty > 0) {
      const extra = MENU.extras.find((e) => e.key === key)
      if (extra) extrasTotal += (customization.size === '15cm' ? extra.price15cm : extra.price30cm) * qty
    }
  }
  return sizePrice + extrasTotal
}

export function generateWhatsAppMessage(order: Order): string {
  const lines: string[] = []
  lines.push('🥖 *NOVO PEDIDO - MAIS SUB*')
  lines.push(`📋 Pedido: ${order.orderNumber}`)
  lines.push('')
  lines.push('*ITENS DO PEDIDO:*')
  order.items.forEach((item, index) => {
    lines.push(`\n${index + 1}. *${item.name}* x${item.quantity}`)
    if (item.customization) {
      const c = item.customization
      lines.push(`   🥖 Tamanho: ${c.size}`)
      if (c.meat) { const meat = MENU.meats.find((m) => m.key === c.meat); lines.push(`   🥩 Carne: ${meat?.name || c.meat}`) }
      if (c.cheese) { const cheese = MENU.cheeses.find((ch) => ch.key === c.cheese); lines.push(`   🧀 Queijo: ${cheese?.name || c.cheese}`) }
      if (c.salads.length > 0) lines.push(`   🥗 Saladas: ${c.salads.map((s) => MENU.salads.find((sl) => sl.key === s)?.name || s).join(', ')}`)
      if (c.sauces.length > 0) lines.push(`   🥫 Molhos: ${c.sauces.map((s) => MENU.sauces.find((sc) => sc.key === s)?.name || s).join(', ')}`)
      const extraEntries = Object.entries(c.extras).filter(([, qty]) => qty > 0)
      if (extraEntries.length > 0) lines.push(`   ➕ Extras: ${extraEntries.map(([key, qty]) => { const extra = MENU.extras.find((e) => e.key === key); return `${extra?.name || key} x${qty}` }).join(', ')}`)
    }
    lines.push(`   💰 ${formatCurrency(item.price * item.quantity)}`)
  })
  lines.push('')
  lines.push(`Subtotal: ${formatCurrency(order.subtotal)}`)
  if (order.discount > 0) lines.push(`Desconto: -${formatCurrency(order.discount)}`)
  lines.push(`Taxa de entrega: ${order.deliveryFee === 0 ? 'Grátis' : formatCurrency(order.deliveryFee)}`)
  lines.push(`*TOTAL: ${formatCurrency(order.total)}*`)
  lines.push('')
  lines.push(`👤 Nome: ${order.customer.name}`)
  lines.push(`📱 Telefone: ${order.customer.phone}`)
  if (order.orderType === 'entrega' && order.address) {
    lines.push(`📍 ${order.address.street}, ${order.address.number}${order.address.complement ? ` - ${order.address.complement}` : ''}`)
    lines.push(`   ${order.address.neighborhood} - ${order.address.city}/${order.address.state}`)
  } else {
    lines.push('🏠 *RETIRADA NO LOCAL*')
  }
  return lines.join('\n')
}

function formatPaymentMethod(method: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = { pix: 'PIX', 'cartao-credito': 'Cartão de Crédito', 'cartao-debito': 'Cartão de Débito', dinheiro: 'Dinheiro' }
  return map[method] || method
}

export { formatPaymentMethod }

export function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    try { const stored = localStorage.getItem(key); return stored ? (JSON.parse(stored) as T) : defaultValue } catch { return defaultValue }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)) } catch { /* ignore */ }
  }, [key, state])
  return [state, setState]
}
