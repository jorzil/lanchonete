'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import type { CartItem, Coupon } from '@/lib/store'
import { validateCoupon, incrementCouponUsage } from '@/lib/coupon-storage'

interface CartContextValue {
  items: CartItem[]
  isOpen: boolean
  coupon: Coupon | null
  deliveryFee: number
  subtotal: number
  total: number
  itemCount: number
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  applyCoupon: (code: string) => boolean
  removeCoupon: () => void
  setDeliveryFee: (fee: number) => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [deliveryFee, setDeliveryFeeState] = useState(5.0)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mais-sub-cart')
      if (stored) setItems(JSON.parse(stored))
      const storedCoupon = localStorage.getItem('mais-sub-coupon')
      if (storedCoupon) setCoupon(JSON.parse(storedCoupon))
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try { localStorage.setItem('mais-sub-cart', JSON.stringify(items)) } catch { /* ignore */ }
  }, [items, hydrated])

  useEffect(() => {
    if (!hydrated) return
    try {
      if (coupon) { localStorage.setItem('mais-sub-coupon', JSON.stringify(coupon)) }
      else { localStorage.removeItem('mais-sub-coupon') }
    } catch { /* ignore */ }
  }, [coupon, hydrated])

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = coupon ? (coupon.type === 'percentage' ? subtotal * (coupon.discount / 100) : coupon.discount) : 0
  const total = Math.max(0, subtotal - discount + deliveryFee)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const addItem = useCallback((newItem: Omit<CartItem, 'id'>) => {
    setItems((prev) => {
      if (newItem.customization) {
        return [...prev, { ...newItem, id: `${newItem.productId}-${Date.now()}` }]
      }
      const existing = prev.find((i) => i.productId === newItem.productId && !i.customization)
      if (existing) return prev.map((i) => i.id === existing.id ? { ...i, quantity: i.quantity + newItem.quantity } : i)
      return [...prev, { ...newItem, id: `${newItem.productId}-${Date.now()}` }]
    })
  }, [])

  const removeItem = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), [])
  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) setItems((prev) => prev.filter((i) => i.id !== id))
    else setItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity } : i))
  }, [])
  const clearCart = useCallback(() => { setItems([]); setCoupon(null) }, [])
  const toggleCart = useCallback(() => setIsOpen((o) => !o), [])
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const applyCoupon = useCallback((code: string): boolean => {
    const result = validateCoupon(code, subtotal)
    if (result.valid && result.coupon) {
      const c = result.coupon
      setCoupon({ code: c.code, discount: c.discount, type: c.type === 'free_shipping' ? 'fixed' : c.type })
      return true
    }
    return false
  }, [subtotal])
  const removeCoupon = useCallback(() => setCoupon(null), [])
  const setDeliveryFee = useCallback((fee: number) => setDeliveryFeeState(fee), [])

  const value = useMemo(() => ({
    items, isOpen, coupon, deliveryFee, subtotal, total, itemCount,
    addItem, removeItem, updateQuantity, clearCart,
    toggleCart, openCart, closeCart,
    applyCoupon, removeCoupon, setDeliveryFee,
  }), [items, isOpen, coupon, deliveryFee, subtotal, total, itemCount, addItem, removeItem, updateQuantity, clearCart, toggleCart, openCart, closeCart, applyCoupon, removeCoupon, setDeliveryFee])

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
