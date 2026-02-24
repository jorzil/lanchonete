// ==================== TYPES ====================
export interface Product {
  id: number
  name: string
  category: string
  price: number
  cost: number
  stock: number
  image: string
  active: boolean
}

export const DEFAULT_CATEGORIES = ['bebidas', 'lanches', 'combos']

export interface CartItem {
  id: string | number
  name: string
  price: number
  cost: number
  quantity: number
  observation: string
  isCustom: boolean
}

export interface Sale {
  id: number
  date: string
  customer: string
  phone: string
  address: string
  orderType: 'pickup' | 'delivery' | 'table'
  deliveryFee: number
  items: CartItem[]
  subtotal: number
  discount: { type: 'fixed' | 'percent' | null; value: number }
  total: number
  paymentMethod: string
  observation: string
  user: string
}

export interface Customer {
  id: number
  name: string
  phone: string
  address: string
}

export interface StockEntry {
  id: number
  date: string
  productName: string
  type: string
  quantity: number
  reason: string
}

export interface Expense {
  id: number
  date: string
  description: string
  amount: number
  category: string
  user: string
}

export interface CustomBurger {
  step: number
  size: string | null
  sizePrice: number
  meat: string | null
  cheeses: string[]
  salads: string[]
  sauces: string[]
  extras: Record<string, number>
  total: number
}

export type OrderType = 'pickup' | 'delivery' | 'table'
export type PaymentMethod = 'money' | 'pix' | 'debit' | 'credit'
export type AppView = 'pos' | 'products' | 'stock' | 'reports' | 'cashier' | 'expenses' | 'customers' | 'tables'
export type UserRole = 'admin' | 'attendant'

// ==================== MENU DATA ====================
export const MENU = {
  sizes: {
    '15cm': { name: '15cm', price: 18.0, extras: { bacon: 4.0, presunto: 3.0, peru: 4.0, queijo: 3.0 } },
    '30cm': { name: '30cm', price: 32.0, extras: { bacon: 6.0, presunto: 5.0, peru: 6.0, queijo: 5.0 } },
  },
  meats: [
    { key: 'carne-suprema', name: 'Carne Suprema' },
    { key: 'frango-cream-cheese', name: 'Frango com Cream Cheese' },
    { key: 'lombo-defumado', name: 'Lombo Defumado' },
  ],
  cheeses: [
    { key: 'mussarela', name: 'Mussarela' },
    { key: 'cheddar', name: 'Cheddar Cremoso' },
    { key: 'ricota', name: 'Ricota' },
  ],
  salads: ['Alface', 'Tomate', 'Picles', 'Pimentao', 'Cebola Roxa', 'Azeitona', 'Cenoura Ralada', 'Rucula'],
  sauces: [
    { key: 'chipotle', name: 'Chipotle' },
    { key: 'mostarda-mel', name: 'Mostarda e Mel' },
    { key: 'maionese', name: 'Maionese Temperada' },
    { key: 'ranch', name: 'Molho Ranch' },
    { key: 'barbecue', name: 'Barbecue' },
    { key: 'baconese', name: 'Baconese' },
  ],
  extras: {
    bacon: { name: 'Bacon' },
    presunto: { name: 'Presunto' },
    peru: { name: 'Peito de Peru' },
    queijo: { name: 'Queijo em Dobro' },
  } as Record<string, { name: string }>,
} as const

// ==================== DEFAULT PRODUCTS ====================
export const DEFAULT_PRODUCTS: Product[] = [
  { id: 101, name: 'Coca-Cola Lata', category: 'bebidas', price: 6.0, cost: 3.0, stock: 50, image: '', active: true },
  { id: 102, name: 'Coca-Cola Zero Lata', category: 'bebidas', price: 6.0, cost: 3.0, stock: 30, image: '', active: true },
  { id: 103, name: 'Guarana Lata', category: 'bebidas', price: 6.0, cost: 3.0, stock: 40, image: '', active: true },
  { id: 104, name: 'Guarana Zero Lata', category: 'bebidas', price: 6.0, cost: 3.0, stock: 20, image: '', active: true },
  { id: 105, name: 'Agua sem Gas', category: 'bebidas', price: 3.0, cost: 1.0, stock: 60, image: '', active: true },
  { id: 106, name: 'Agua com Gas', category: 'bebidas', price: 5.0, cost: 2.0, stock: 40, image: '', active: true },
  { id: 107, name: 'Limoneto', category: 'bebidas', price: 8.0, cost: 4.0, stock: 25, image: '', active: true },
  { id: 108, name: 'Gatorade', category: 'bebidas', price: 8.0, cost: 4.0, stock: 20, image: '', active: true },
  { id: 109, name: 'Suco de Uva Integral', category: 'bebidas', price: 8.0, cost: 4.0, stock: 15, image: '', active: true },
  { id: 110, name: 'Redbull', category: 'bebidas', price: 12.0, cost: 6.0, stock: 30, image: '', active: true },
  { id: 111, name: 'Fanta Laranja Lata', category: 'bebidas', price: 6.0, cost: 3.0, stock: 30, image: '', active: true },
  { id: 112, name: 'Fanta Uva Lata', category: 'bebidas', price: 6.0, cost: 3.0, stock: 20, image: '', active: true },
  { id: 113, name: 'Sprite Lata', category: 'bebidas', price: 6.0, cost: 3.0, stock: 20, image: '', active: true },
  { id: 114, name: 'Schweppes Citrus Lata', category: 'bebidas', price: 7.0, cost: 3.5, stock: 15, image: '', active: true },
  { id: 115, name: 'H2OH Limão 500ml', category: 'bebidas', price: 7.0, cost: 3.5, stock: 20, image: '', active: true },
  { id: 116, name: 'Coca-Cola 600ml', category: 'bebidas', price: 9.0, cost: 4.5, stock: 20, image: '', active: true },
  { id: 117, name: 'Guaraná Antarctica 600ml', category: 'bebidas', price: 9.0, cost: 4.5, stock: 20, image: '', active: true },
  { id: 118, name: 'Suco Del Valle Pêssego', category: 'bebidas', price: 8.0, cost: 4.0, stock: 15, image: '', active: true },
  { id: 119, name: 'Suco Del Valle Uva', category: 'bebidas', price: 8.0, cost: 4.0, stock: 15, image: '', active: true },
  { id: 120, name: 'Coca-Cola 2 Litros', category: 'bebidas', price: 16.0, cost: 9.0, stock: 10, image: '', active: true },
  { id: 121, name: 'Guaraná Antarctica 2 Litros', category: 'bebidas', price: 15.0, cost: 8.0, stock: 10, image: '', active: true },
]

// ==================== BEVERAGE ICONS ====================
export function getBeverageIcon(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('coca') || n.includes('guarana') || n.includes('redbull')) return 'can'
  if (n.includes('agua') || n.includes('water')) return 'droplets'
  if (n.includes('suco') || n.includes('juice') || n.includes('gatorade') || n.includes('limoneto')) return 'glass-water'
  return 'cup-soda'
}

// ==================== PERSISTED STATE HOOK ====================
import { useState, useEffect, type Dispatch, type SetStateAction } from "react"

export function usePersistedState<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setStateRaw] = useState<T>(defaultValue)
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) {
        setStateRaw(JSON.parse(stored))
      }
    } catch {
      // ignore parse errors, use default
    }
    setHydrated(true)
  }, [key])

  // Save to localStorage on change (only after hydration)
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(key, JSON.stringify(state))
      } catch {
        // ignore storage errors (quota, etc)
      }
    }
  }, [key, state, hydrated])

  return [state, setStateRaw]
}

// ==================== FORMAT HELPERS ====================
export function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

export function generateOrderNumber(): string {
  return Date.now().toString().slice(-6)
}
