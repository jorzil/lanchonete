import type { Metadata, Viewport } from 'next'
import { Inter, Bricolage_Grotesque } from 'next/font/google'
import { Toaster } from 'sonner'
import { CartProvider } from '@/contexts/cart-context'
import { CartPanel } from '@/components/cart/cart-panel'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Mais Sub — O Sub Mais Gostoso Da Cidade',
  description:
    'Delivery de subs artesanais em até 30 minutos. Ingredientes frescos, montados do seu jeito, direto na sua porta.',
  keywords: 'sub, lanche, delivery, artesanal, personalizado, mais sub, frango, lombo, carne',
  openGraph: {
    title: 'Mais Sub — O Sub Mais Gostoso Da Cidade',
    description: 'Delivery de subs artesanais. Ingredientes frescos, personalize seu lanche.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0B2C5C',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${bricolage.variable}`}>
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
