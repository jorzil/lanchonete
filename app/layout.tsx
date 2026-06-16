import type { Metadata, Viewport } from 'next'
import { Inter, Instrument_Serif } from 'next/font/google'
import { Toaster } from 'sonner'
import { CartProvider } from '@/contexts/cart-context'
import { CartPanel } from '@/components/cart/cart-panel'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const serif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Mais Sub — Subs artesanais em Governador Valadares',
  description:
    'Pão assado no dia, ingredientes selecionados, montados do seu jeito. Delivery em até 30 minutos em Governador Valadares.',
  keywords: 'sub, sanduíche, delivery, artesanal, Governador Valadares, mais sub',
  openGraph: {
    title: 'Mais Sub — Subs artesanais em Governador Valadares',
    description: 'Pão assado no dia, ingredientes selecionados, montados do seu jeito.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#FAF6EE',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${serif.variable}`}>
      <body className="antialiased" suppressHydrationWarning>
        <CartProvider>
          {children}
          <CartPanel />
          <Toaster position="top-center" richColors />
        </CartProvider>
      </body>
    </html>
  )
}
