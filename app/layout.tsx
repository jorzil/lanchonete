import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import { Toaster } from 'sonner'
import { CartProvider } from '@/contexts/cart-context'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['400', '600', '700', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mais Sub - O Sub Mais Gostoso Da Cidade',
  description: 'Delivery de subs artesanais. Ingredientes frescos, personalize seu lanche e receba em casa em até 30 minutos.',
  keywords: 'sub, lanche, delivery, artesanal, personalizado, mais sub, frango, lombo, carne',
  openGraph: {
    title: 'Mais Sub - O Sub Mais Gostoso Da Cidade',
    description: 'Delivery de subs artesanais. Ingredientes frescos, personalize seu lanche.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#EE5C13',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${poppins.variable} font-sans antialiased`} suppressHydrationWarning>
        <CartProvider>
          {children}
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
