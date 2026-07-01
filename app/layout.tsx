import type { Metadata, Viewport } from 'next'
import { Inter, Bricolage_Grotesque, Poppins, Manrope } from 'next/font/google'
import { Toaster } from 'sonner'
import { CartProvider } from '@/contexts/cart-context'
import { CartPanelLazy } from '@/components/cart/cart-panel-lazy'
import { SmoothScrollProvider } from '@/components/providers/smooth-scroll-provider'
import { MetaPixel } from '@/components/analytics/meta-pixel'
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
  weight: ['700', '800'],
})

// Fontes do hero (banner) — Poppins (títulos) e Manrope (texto)
const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['600', '700', '800', '900'],
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
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
    locale: 'pt_BR',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#0B2C5C',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${bricolage.variable} ${poppins.variable} ${manrope.variable}`}>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <MetaPixel />
        <CartProvider>
          <SmoothScrollProvider>
            {children}
          </SmoothScrollProvider>
          <CartPanelLazy />
          <Toaster position="top-center" richColors />
        </CartProvider>
      </body>
    </html>
  )
}
