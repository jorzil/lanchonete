// Pure data module — NO React imports.
// Safe to import from Server Components and Client Components alike.

export type SizeOption = '15cm' | '30cm'
export interface BreadOption  { key: string; name: string; description: string; emoji: string }
export interface MeatOption   { key: string; name: string; description: string; emoji: string }
export interface CheeseOption { key: string; name: string }
export interface SaladOption  { key: string; name: string }
export interface SauceOption  { key: string; name: string }
export interface ExtraOption  { key: string; name: string; price15cm: number; price30cm: number }

export interface SubCustomization {
  size: SizeOption
  bread: string
  meat: string
  cheeses: string[]
  salads: string[]
  sauces: string[]
  extras: Record<string, number>
  notes?: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  imageUrl?: string
  category: 'subs-15cm' | 'subs-30cm' | 'combos' | 'bebidas' | 'cookies'
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
  notes?: string
  image: string
}

export type OrderStatus = 'novo' | 'aceito' | 'em_preparo' | 'pronto' | 'saiu_entrega' | 'entregue' | 'cancelado'

export interface Address {
  cep: string; street: string; number: string; complement?: string
  neighborhood: string; city: string; state: string
}

export interface Customer    { name: string; phone: string }
export type PaymentMethod    = 'pix' | 'cartao-credito' | 'cartao-debito' | 'dinheiro'
export interface Coupon      { code: string; discount: number; type: 'percentage' | 'fixed' }
export interface LoyaltyPoints { customerId: string; points: number; history: { date: string; points: number; description: string }[] }

export interface Order {
  id: string; orderNumber: string; items: CartItem[]
  customer: Customer; address?: Address
  orderType: 'entrega' | 'retirada'; paymentMethod: PaymentMethod
  subtotal: number; deliveryFee: number; discount: number; total: number
  status: OrderStatus; notes?: string; createdAt: string; updatedAt: string; coupon?: Coupon
}

// ─── MENU DATA ────────────────────────────────────────────────────────────────
export const MENU = {
  sizes: [
    { key: '15cm' as SizeOption, label: '15cm', price: 21.9, description: 'Perfeito para um lanche individual' },
    { key: '30cm' as SizeOption, label: '30cm', price: 37.9, description: 'Ideal para quem tem mais fome' },
  ],
  breads: [
    { key: 'tradicional',  name: 'Tradicional',   description: 'Pão clássico, macio e levemente tostado',         emoji: '🍞' },
    { key: 'gergelim',     name: 'Com Gergelim',  description: 'Pão com gergelim crocante por fora, macio por dentro', emoji: '🥖' },
    { key: '4-queijos',    name: '4 Queijos',     description: 'Pão recheado com blend especial de 4 queijos',     emoji: '🧀' },
  ] as BreadOption[],
  meats: [
    { key: 'frango-cream-cheese', name: 'Frango com Cream Cheese',    description: 'Frango grelhado com cream cheese cremoso',    emoji: '🍗' },
    { key: 'carne-suprema',       name: 'Carne Suprema com Requeijão',description: 'Carne bovina premium com requeijão especial', emoji: '🥩' },
    { key: 'lombo-defumado',      name: 'Lombo Defumado',             description: 'Lombo suíno defumado artesanalmente',         emoji: '🥓' },
  ] as MeatOption[],
  cheeses: [
    { key: 'mussarela',      name: 'Mussarela' },
    { key: 'cheddar-cremoso', name: 'Cheddar Cremoso' },
    { key: 'creme-ricota',   name: 'Creme de Ricota' },
  ] as CheeseOption[],
  salads: [
    { key: 'alface',          name: 'Alface' },
    { key: 'tomate',          name: 'Tomate' },
    { key: 'cebola-roxa',     name: 'Cebola Roxa' },
    { key: 'picles',          name: 'Picles' },
    { key: 'azeitona',        name: 'Azeitona' },
    { key: 'rucula',          name: 'Rúcula' },
    { key: 'cenoura-ralada',  name: 'Cenoura Ralada' },
    { key: 'pimentao',        name: 'Pimentão' },
  ] as SaladOption[],
  sauces: [
    { key: 'chipotle',           name: 'Chipotle' },
    { key: 'mostarda-mel',       name: 'Mostarda e Mel' },
    { key: 'maionese-temperada', name: 'Maionese Temperada' },
    { key: 'ranch',              name: 'Ranch' },
    { key: 'barbecue',           name: 'Barbecue' },
    { key: 'baconese',           name: 'Baconese' },
  ] as SauceOption[],
  maxSauces: 3,
  extras: [
    { key: 'bacon',       name: 'Bacon',         price15cm: 4, price30cm: 6 },
    { key: 'presunto',    name: 'Presunto',       price15cm: 3, price30cm: 5 },
    { key: 'peito-peru',  name: 'Peito de Peru',  price15cm: 4, price30cm: 6 },
    { key: 'queijo-dobro',name: 'Queijo em Dobro',price15cm: 3, price30cm: 5 },
  ] as ExtraOption[],
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
export const PRODUCTS: Product[] = [
  // ── Subs ────────────────────────────────────────────────────────────────────
  {
    id: 'sub-bacon-bbq', name: 'Bacon com Barbecue',
    description: 'Carne suprema com requeijão, cheddar cremoso, cebola roxa, picles e molho barbecue com bacon crocante',
    price: 21.9, image: '🥖', imageUrl: '/bacon-barbecue.jpg', category: 'subs-15cm', active: true,
    badge: { label: '🔥 Mais Pedido', color: 'bg-red-500' },
  },
  {
    id: 'sub-lombo-especial', name: 'Lombo Especial',
    description: 'Lombo suíno, mussarela, alface, tomate, cebola roxa, cebola caramelizada e mostarda com mel',
    price: 21.9, image: '🥖', imageUrl: '/lombo-especial.jpg', category: 'subs-15cm', active: true,
  },
  {
    id: 'sub-frango-ranch', name: 'Frango Ranch',
    description: 'Frango com cream cheese, cheddar, alface, tomate, cebola roxa e molho ranch',
    price: 21.9, image: '🥖', imageUrl: '/frango-ranch.jpg', category: 'subs-15cm', active: true,
  },
  {
    id: 'sub-italiano', name: 'Italiano Premium',
    description: 'Carne suprema com requeijão, salaminho italiano, mussarela, rúcula, tomate e baconese',
    price: 21.9, image: '🥖', imageUrl: '/italiano-premium.jpg', category: 'subs-15cm', active: true,
    badge: { label: '⭐ Destaque', color: 'bg-amber-500' },
  },
  {
    id: 'sub-lombo-defumado', name: 'Lombo Defumado',
    description: 'Lombo, cheddar cremoso, bacon crocante, picles e molho barbecue',
    price: 21.9, image: '🥖', imageUrl: '/lombo-defumado.jpg', category: 'subs-15cm', active: true,
  },
  {
    id: 'sub-frango-mais', name: 'Frango Coma+',
    description: 'Frango com cream cheese, mussarela, cebola caramelizada, mostarda com mel e barbecue',
    price: 21.9, image: '🥖', imageUrl: '/frango-coma.jpg', category: 'subs-15cm', active: true,
    badge: { label: '🆕 Novo', color: 'bg-green-500' },
  },
  {
    id: 'sub-ipanema', name: 'Ipanema',
    description: 'Carne suprema com cream cheese, mussarela, bacon, picles, baconese e barbecue',
    price: 21.9, image: '🥖', imageUrl: '/ipanema.jpg', category: 'subs-15cm', active: true,
  },
  // ── Cookies ─────────────────────────────────────────────────────────────────
  {
    id: 'cookie-caramelo', name: 'Cookie Caramelo Salgado',
    description: 'Cookie artesanal recheado com caramelo salgado, crocante por fora e macio por dentro',
    price: 16.0, image: '🍪', imageUrl: '/caramelo-salgado.jpg', category: 'cookies', active: true,
    badge: { label: '🔥 Favorito', color: 'bg-amber-500' },
  },
  {
    id: 'cookie-nutella', name: 'Cookie Nutella',
    description: 'Cookie artesanal recheado com Nutella cremosa, irresistível a cada mordida',
    price: 16.0, image: '🍪', imageUrl: '/nutela.jpg', category: 'cookies', active: true,
  },
  {
    id: 'cookie-kinder', name: 'Cookie Kinder Bueno',
    description: 'Cookie artesanal com recheio de Kinder Bueno e avelã, uma combinação incrível',
    price: 16.0, image: '🍪', imageUrl: '/kinder.jpg', category: 'cookies', active: true,
  },
  {
    id: 'cookie-ovomaltine', name: 'Cookie Ovomaltine',
    description: 'Cookie artesanal crocante com recheio de Ovomaltine, sabor único e marcante',
    price: 16.0, image: '🍪', imageUrl: '/ovo-maltine.jpg', category: 'cookies', active: true,
  },
  // ── Bebidas ─────────────────────────────────────────────────────────────────
  { id: 'refri-lata',  name: 'Refrigerante 350ml',  description: 'Coca-Cola, Guaraná Antarctica, Sprite ou Fanta bem gelados', price: 6.0, image: '🥤', category: 'bebidas', active: true },
  { id: 'agua',        name: 'Água Mineral 500ml',  description: 'Água mineral natural sem gás, gelada e refrescante',         price: 4.0, image: '💧', category: 'bebidas', active: true },
  { id: 'suco',        name: 'Suco Natural 400ml',  description: 'Laranja, Limão ou Maracujá espremidos na hora',              price: 9.0, image: '🍊', category: 'bebidas', active: true },
]

// ─── UTILITIES ────────────────────────────────────────────────────────────────
const _currencyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const formatCurrency = (v: number) => _currencyFmt.format(v)

export function generateOrderNumber(): string {
  return `MS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`
}

const _extrasMap = new Map(MENU.extras.map((e) => [e.key, e]))

export function calculateSubTotal(customization: SubCustomization): number {
  const is15 = customization.size === '15cm'
  let total = is15 ? 21.9 : 37.9
  const extras = customization.extras ?? {}
  for (const [key, qty] of Object.entries(extras)) {
    if (qty > 0) {
      const e = _extrasMap.get(key)
      if (e) total += (is15 ? e.price15cm : e.price30cm) * qty
    }
  }
  if (customization.cheeses.length > 1) {
    const qd = _extrasMap.get('queijo-dobro')
    if (qd) total += is15 ? qd.price15cm : qd.price30cm
  }
  return total
}

export function formatPaymentMethod(method: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = {
    pix: 'PIX', 'cartao-credito': 'Cartão de Crédito',
    'cartao-debito': 'Cartão de Débito', dinheiro: 'Dinheiro',
  }
  return map[method] || method
}
