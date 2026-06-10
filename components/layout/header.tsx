'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Menu, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useCart } from '@/contexts/cart-context'
import { CartPanel } from '@/components/cart/cart-panel'

const NAV_LINKS = [
  { href: '/cardapio', label: 'Cardápio' },
  { href: '/#promocoes', label: 'Promoções' },
  { href: '/#como-funciona', label: 'Como Funciona' },
  { href: '/#contato', label: 'Contato' },
]

const WHATSAPP_URL = 'https://wa.me/5511999999999'

export function Header() {
  const { itemCount, toggleCart } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'backdrop-blur-md bg-white/90 border-b border-white/20 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl select-none">🥖</span>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-2xl font-black tracking-tight leading-none transition-colors duration-300 ${
                      scrolled ? 'text-[#023E74]' : 'text-white'
                    }`}
                  >
                    MAIS
                  </span>
                  <span className="text-2xl font-black tracking-tight leading-none text-[#EE5C13]">
                    SUB
                  </span>
                </div>
                <span
                  className={`hidden sm:inline-flex items-center text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full transition-all duration-300 ${
                    scrolled
                      ? 'bg-[#EE5C13]/10 text-[#EE5C13]'
                      : 'bg-white/15 text-white/80'
                  }`}
                >
                  delivery
                </span>
              </div>
            </Link>

            {/* Center Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link-underline relative px-4 py-2 text-sm font-semibold transition-colors duration-300 rounded-lg hover:bg-white/10 ${
                    scrolled ? 'text-gray-700 hover:text-[#EE5C13]' : 'text-white/90 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* WhatsApp */}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`hidden sm:flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 hover:scale-110 ${
                  scrolled ? 'text-green-600 hover:bg-green-50' : 'text-white/80 hover:bg-white/15 hover:text-white'
                }`}
                aria-label="WhatsApp"
              >
                <MessageCircle size={20} />
              </a>

              {/* Cart */}
              <button
                onClick={toggleCart}
                className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 hover:scale-110 ${
                  scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/15'
                }`}
                aria-label="Abrir carrinho"
              >
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#EE5C13] text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center animate-pulse-orange leading-none">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              {/* CTA Button */}
              <Link href="/cardapio" className="hidden sm:block">
                <Button
                  size="sm"
                  className="bg-[#EE5C13] hover:bg-[#d94b0d] text-white font-bold px-5 py-2 rounded-full text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30"
                >
                  Pedir Agora
                </Button>
              </Link>

              {/* Mobile Menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button
                    className={`md:hidden flex items-center justify-center w-9 h-9 rounded-full transition-all ${
                      scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/20'
                    }`}
                    aria-label="Abrir menu"
                  >
                    <Menu size={20} />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] p-0 border-0">
                  <SheetHeader className="p-6 bg-[#011a33]">
                    <SheetTitle className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🥖</span>
                        <span className="text-2xl font-black text-white">
                          MAIS <span className="text-[#EE5C13]">SUB</span>
                        </span>
                      </div>
                    </SheetTitle>
                    <p className="text-white/50 text-xs font-medium tracking-widest uppercase mt-1">
                      Monte do seu jeito
                    </p>
                  </SheetHeader>

                  <nav className="flex flex-col p-4 gap-1 bg-white flex-1">
                    {NAV_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center px-4 py-3.5 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-[#EE5C13] font-semibold transition-all text-sm"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
                      <Link href="/cardapio" onClick={() => setMobileOpen(false)}>
                        <Button className="w-full bg-[#EE5C13] hover:bg-[#d94b0d] text-white font-bold rounded-full h-12 text-sm">
                          🥖 Fazer Pedido Agora
                        </Button>
                      </Link>
                      <a
                        href={WHATSAPP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-colors"
                      >
                        <MessageCircle size={16} />
                        Pedir pelo WhatsApp
                      </a>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      <CartPanel />
    </>
  )
}
