'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { CartItem, Coupon } from '@/lib/store'
import { validateCouponFresh, calcCouponDiscount, subtotalElegivel } from '@/lib/coupon-storage'
import { fbTrack } from '@/components/analytics/meta-pixel'

interface CartContextValue {
  items: CartItem[]
  isOpen: boolean
  coupon: Coupon | null
  /** Frete já cobrado: zero quando há cupom de frete grátis. */
  deliveryFee: number
  /** Há cupom de frete grátis aplicado — para a tela escrever "Grátis". */
  freteGratis: boolean
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
  /** Devolve o motivo junto: ler de um estado logo após chamar pegaria o
   *  valor anterior, porque o React só propaga no próximo render. */
  applyCoupon: (code: string, phoneCliente?: string) => Promise<{ ok: boolean; erro?: string }>
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
  // O desconto incide só sobre o que o cupom alcança: um cupom preso a um
  // produto não pode descontar o pedido inteiro.
  const discount = coupon ? calcCouponDiscount(coupon, subtotal, items) : 0
  /**
   * Cupom de frete grátis não desconta do subtotal: ele zera a entrega.
   *
   * O valor cobrado é o que sai daqui para a tela e para o pedido, então o
   * frete some em todo lugar de uma vez — antes o cupom era convertido em
   * desconto fixo de R$ 0 e o cliente pagava a entrega do mesmo jeito.
   */
  const freteGratis = coupon?.type === 'free_shipping'
  const freteCobrado = freteGratis ? 0 : deliveryFee
  const total = Math.max(0, subtotal - discount + freteCobrado)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  // Date.now() sozinho colide: dois itens adicionados no mesmo milissegundo
  // (toque duplo no botão) ganhavam o mesmo id, e aí remover um removia os
  // dois — e o React ainda reclamava de chave duplicada.
  const seqRef = useRef(0)
  const newItemId = (productId: string) =>
    `${productId}-${Date.now()}-${(seqRef.current = (seqRef.current + 1) % 1e6)}`

  const addItem = useCallback((newItem: Omit<CartItem, 'id'>) => {
    fbTrack('AddToCart', { content_name: newItem.name, value: newItem.price * newItem.quantity, currency: 'BRL' })
    setItems((prev) => {
      if (newItem.customization) {
        return [...prev, { ...newItem, id: newItemId(newItem.productId) }]
      }
      const existing = prev.find((i) => i.productId === newItem.productId && !i.customization)
      if (existing) return prev.map((i) => i.id === existing.id ? { ...i, quantity: i.quantity + newItem.quantity } : i)
      return [...prev, { ...newItem, id: newItemId(newItem.productId) }]
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

  const applyCoupon = useCallback(async (code: string, phoneCliente?: string): Promise<{ ok: boolean; erro?: string }> => {
    // Sempre valida com os dados atuais do servidor (cupom pode ter sido inativado)
    const result = await validateCouponFresh(code, subtotal, phoneCliente)
    if (result.valid && result.coupon) {
      const c = result.coupon
      // O cupom é válido, mas alcança alguma coisa deste carrinho?
      //
      // Aplicar um cupom que desconta zero é pior que recusar: o cliente vê
      // "cupom aplicado", o total não muda, e ele acha que o site quebrou.
      if (subtotalElegivel(c, items) <= 0) {
        return {
          ok: false,
          erro: 'Este cupom vale só para alguns produtos, e nenhum deles está no seu pedido.',
        }
      }
      setCoupon({
        code: c.code,
        discount: c.discount,
        type: c.type,
        // O escopo viaja junto: é ele que impede o cupom de um produto de
        // descontar o carrinho inteiro.
        scope: c.scope,
        scopeProducts: c.scopeProducts,
      })
      return { ok: true }
    }
    return { ok: false, erro: result.error }
  }, [subtotal, items])
  const removeCoupon = useCallback(() => setCoupon(null), [])
  const setDeliveryFee = useCallback((fee: number) => setDeliveryFeeState(fee), [])

  const value = useMemo(() => ({
    // Sai daqui já com o frete grátis aplicado: quem consome não precisa
    // saber do cupom para cobrar o valor certo.
    items, isOpen, coupon, deliveryFee: freteCobrado, freteGratis, subtotal, total, itemCount,
    addItem, removeItem, updateQuantity, clearCart,
    toggleCart, openCart, closeCart,
    applyCoupon, removeCoupon, setDeliveryFee,
  }), [items, isOpen, coupon, freteCobrado, freteGratis, subtotal, total, itemCount, addItem, removeItem, updateQuantity, clearCart, toggleCart, openCart, closeCart, applyCoupon, removeCoupon, setDeliveryFee])

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
