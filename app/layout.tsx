import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { CartProvider } from '@/contexts/cart-context'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Mais Sub - Monte Seu Sub Do Seu Jeito',
  description: 'Delivery de subs artesanais. Ingredientes frescos, personalize seu lanche e receba em casa.',
  keywords: 'sub, lanche, delivery, artesanal, personalizado, mais sub',
  openGraph: {
    title: 'Mais Sub - Monte Seu Sub Do Seu Jeito',
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
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <CartProvider>
          {children}
          <Toaster position="top-center" richColors />
        </CartProvider>
      </body>
    </html>
  )
}
