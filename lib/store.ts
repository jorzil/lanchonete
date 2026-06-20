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
  cheeses: string[]
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
  imageUrl?: string
  category: 'subs-15cm' | 'subs-30cm' | 'combos' | 'bebidas'
  active: boolean
  badge?: { label: string; color: string }
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
    { key: 'salada-completa', name: 'Salada Completa' },
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
  {
    id: 'sub-15-frango', name: 'Frango com Cream Cheese', description: 'Frango grelhado, cream cheese cremoso, saladas frescas no pão artesanal tostado',
    price: 21.9, image: '🥖', imageUrl: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=600&q=85&auto=format&fit=crop',
    category: 'subs-15cm', active: true, badge: { label: '🔥 Mais Pedido', color: 'bg-red-500' },
  },
  {
    id: 'sub-15-lombo', name: 'Lombo Defumado', description: 'Lombo suíno defumado artesanalmente, mussarela derretida, pão quentinho',
    price: 21.9, image: '🥖', imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=85&auto=format&fit=crop',
    category: 'subs-15cm', active: true, badge: { label: '⭐ Destaque', color: 'bg-amber-500' },
  },
  {
    id: 'sub-15-carne', name: 'Carne Suprema', description: 'Carne bovina premium, requeijão cremoso, tomate e alface no pão especial',
    price: 21.9, image: '🥖', imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&q=85&auto=format&fit=crop',
    category: 'subs-15cm', active: true, badge: { label: '🆕 Novo', color: 'bg-green-500' },
  },
  {
    id: 'sub-30-frango', name: 'Frango com Cream Cheese', description: 'Versão família — frango grelhado, cream cheese, legumes frescos no pão artesanal',
    price: 37.9, image: '🥖', imageUrl: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=600&q=85&auto=format&fit=crop',
    category: 'subs-30cm', active: true, badge: { label: '🔥 Mais Pedido', color: 'bg-red-500' },
  },
  {
    id: 'sub-30-lombo', name: 'Lombo Defumado', description: 'Versão família — lombo defumado, queijo derretido, saladas e molho especial',
    price: 37.9, image: '🥖', imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=85&auto=format&fit=crop',
    category: 'subs-30cm', active: true,
  },
  {
    id: 'sub-30-carne', name: 'Carne Suprema', description: 'Versão família — carne premium, requeijão cremoso, vegetais frescos',
    price: 37.9, image: '🥖', imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&q=85&auto=format&fit=crop',
    category: 'subs-30cm', active: true, badge: { label: '🆕 Novo', color: 'bg-green-500' },
  },
  {
    id: 'combo-15-refri', name: 'Combo Classic', description: 'Sub 15cm de sua escolha + refrigerante gelado 350ml. Perfeito para o dia a dia',
    price: 29.9, image: '🎁', imageUrl: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=85&auto=format&fit=crop',
    category: 'combos', active: true, badge: { label: '⚡ Econômico', color: 'bg-blue-500' },
  },
  {
    id: 'combo-30-refri', name: 'Combo Premium', description: 'Sub 30cm de sua escolha + refrigerante gelado 350ml. O combo completo',
    price: 45.9, image: '🎁', imageUrl: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=85&auto=format&fit=crop',
    category: 'combos', active: true,
  },
  {
    id: 'combo-duplo', name: 'Combo Duplo', description: '2 Subs 15cm + 2 refrigerantes 350ml. Ideal para compartilhar',
    price: 54.9, image: '🎁', imageUrl: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=85&auto=format&fit=crop',
    category: 'combos', active: true, badge: { label: '💥 Oferta', color: 'bg-purple-600' },
  },
  {
    id: 'refri-lata', name: 'Refrigerante 350ml', description: 'Coca-Cola, Guaraná Antarctica, Sprite ou Fanta bem gelados',
    price: 6.0, image: '🥤', imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&q=85&auto=format&fit=crop',
    category: 'bebidas', active: true,
  },
  {
    id: 'agua', name: 'Água Mineral 500ml', description: 'Água mineral natural sem gás, gelada e refrescante',
    price: 4.0, image: '💧', imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=85&auto=format&fit=crop',
    category: 'bebidas', active: true,
  },
  {
    id: 'suco', name: 'Suco Natural 400ml', description: 'Laranja, Limão ou Maracujá espremidos na hora',
    price: 9.0, image: '🍊', imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&q=85&auto=format&fit=crop',
    category: 'bebidas', active: true,
  },
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
  if (customization.cheeses.length > 1) {
    const queijoDobro = MENU.extras.find((e) => e.key === 'queijo-dobro')
    if (queijoDobro) extrasTotal += customization.size === '15cm' ? queijoDobro.price15cm : queijoDobro.price30cm
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
      if (c.cheeses.length > 0) {
        const cheeseNames = c.cheeses.map((ck) => MENU.cheeses.find((ch) => ch.key === ck)?.name || ck).join(', ')
        lines.push(`   🧀 Queijo: ${cheeseNames}${c.cheeses.length > 1 ? ' (em dobro)' : ''}`)
      }
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
