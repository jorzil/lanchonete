import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import { CartProvider } from '@/contexts/cart-context'
import { CartPanel } from '@/components/cart/cart-panel'
import './globals.css'

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
    <html lang="pt-BR">
      <body className="font-sans antialiased" suppressHydrationWarning>
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
