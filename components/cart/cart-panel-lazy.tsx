'use client'

import dynamic from 'next/dynamic'

const CartPanel = dynamic(
  () => import('@/components/cart/cart-panel').then(m => ({ default: m.CartPanel })),
  { ssr: false }
)

export function CartPanelLazy() {
  return <CartPanel />
}
