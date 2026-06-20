import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Checkout — Mais Sub',
  description: 'Finalize seu pedido de sub artesanal.',
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
