import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import { Toaster } from 'sonner'
import { CartProvider } from '@/contexts/cart-context'
import { CartPanel } from '@/components/cart/cart-panel'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['400', '600', '700', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mais Sub — O Sub Mais Gostoso Da Cidade',
  description:
    'Delivery de subs artesanais em até 30 minutos. Ingredientes frescos, montados do seu jeito, direto na sua porta.',
  keywords: 'sub, lanche, delivery, artesanal, personalizado, mais sub, frango, lombo, carne',
  openGraph: {
    title: 'Mais Sub — O Sub Mais Gostoso Da Cidade',
    description:
      'Delivery de subs artesanais. Ingredientes frescos, personalize seu lanche.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#EE5C13',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={poppins.variable}>
      <body
        className="font-sans antialiased"
        style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
        suppressHydrationWarning
      >
        <CartProvider>
          {children}
          <CartPanel />
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              style: { fontFamily: 'var(--font-poppins)' },
            }}
          />
        </CartProvider>
      </body>
    </html>
  )
}
