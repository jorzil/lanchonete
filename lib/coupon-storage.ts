// Coupon management — localStorage persistence with full business rules

export type CouponType = 'percentage' | 'fixed' | 'free_shipping'

export interface CouponDef {
  id: string
  code: string
  name: string
  description: string
  type: CouponType
  discount: number       // % or R$ value (ignored for free_shipping)
  minOrder: number       // minimum cart value to apply
  maxUses: number | null // null = unlimited
  usedCount: number
  validFrom: string      // ISO date string
  validUntil: string | null // null = never expires
  active: boolean
  createdAt: string
}

export interface CouponValidationResult {
  valid: boolean
  coupon?: CouponDef
  error?: string
  discountAmount?: number
}

const STORAGE_KEY = 'mais_sub_coupons'

const DEFAULT_COUPONS: CouponDef[] = [
  {
    id: 'coupon-maissub10',
    code: 'MAISSUB10',
    name: '10% de desconto',
    description: '10% OFF em qualquer pedido',
    type: 'percentage',
    discount: 10,
    minOrder: 0,
    maxUses: null,
    usedCount: 0,
    validFrom: '2025-01-01',
    validUntil: null,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coupon-primeirodia',
    code: 'PRIMEIRODIA',
    name: 'R$ 5 de desconto',
    description: 'R$ 5 OFF no primeiro pedido',
    type: 'fixed',
    discount: 5,
    minOrder: 20,
    maxUses: null,
    usedCount: 0,
    validFrom: '2025-01-01',
    validUntil: null,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coupon-bemvindo',
    code: 'BEMVINDO',
    name: '15% de desconto',
    description: '15% OFF de boas-vindas',
    type: 'percentage',
    discount: 15,
    minOrder: 0,
    maxUses: null,
    usedCount: 0,
    validFrom: '2025-01-01',
    validUntil: null,
    active: true,
    createdAt: new Date().toISOString(),
  },
]

export function getCoupons(): CouponDef[] {
  if (typeof window === 'undefined') return DEFAULT_COUPONS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as CouponDef[]
  } catch {}
  // First load: persist defaults
  saveCoupons(DEFAULT_COUPONS)
  return DEFAULT_COUPONS
}

export function saveCoupons(coupons: CouponDef[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons))
}

export function addCoupon(data: Omit<CouponDef, 'id' | 'usedCount' | 'createdAt'>): CouponDef {
  const coupons = getCoupons()
  const existing = coupons.find(c => c.code.toUpperCase() === data.code.toUpperCase())
  if (existing) throw new Error(`Código "${data.code}" já existe.`)
  const coupon: CouponDef = {
    ...data,
    id: `coupon-${Date.now()}`,
    code: data.code.toUpperCase(),
    usedCount: 0,
    createdAt: new Date().toISOString(),
  }
  saveCoupons([coupon, ...coupons])
  return coupon
}

export function updateCoupon(id: string, data: Partial<CouponDef>): void {
  const coupons = getCoupons().map(c => c.id === id ? { ...c, ...data } : c)
  saveCoupons(coupons)
}

export function deleteCoupon(id: string): void {
  saveCoupons(getCoupons().filter(c => c.id !== id))
}

export function incrementCouponUsage(code: string): void {
  const coupons = getCoupons().map(c =>
    c.code === code.toUpperCase() ? { ...c, usedCount: c.usedCount + 1 } : c
  )
  saveCoupons(coupons)
}

export function validateCoupon(code: string, orderTotal: number): CouponValidationResult {
  const coupons = getCoupons()
  const coupon = coupons.find(c => c.code === code.toUpperCase().trim())

  if (!coupon) return { valid: false, error: 'Cupom não encontrado.' }
  if (!coupon.active) return { valid: false, error: 'Este cupom não está ativo.' }
  if (coupon.minOrder > 0 && orderTotal < coupon.minOrder) {
    return { valid: false, error: `Pedido mínimo de ${formatR$(coupon.minOrder)} para usar este cupom.` }
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: 'Este cupom atingiu o limite de uso.' }
  }
  if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
    return { valid: false, error: 'Este cupom está expirado.' }
  }
  if (new Date(coupon.validFrom) > new Date()) {
    return { valid: false, error: 'Este cupom ainda não está válido.' }
  }

  const discountAmount = calcCouponDiscount(coupon, orderTotal)
  return { valid: true, coupon, discountAmount }
}

export function calcCouponDiscount(coupon: CouponDef, subtotal: number): number {
  if (coupon.type === 'percentage') return subtotal * (coupon.discount / 100)
  if (coupon.type === 'fixed') return Math.min(coupon.discount, subtotal)
  if (coupon.type === 'free_shipping') return 0 // handled separately
  return 0
}

function formatR$(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
