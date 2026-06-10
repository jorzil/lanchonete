'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Menu, MessageCircle, X } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const NAV_LINKS = [
  { href: '/',         label: 'Início'   },
  { href: '/cardapio', label: 'Cardápio' },
  { href: '/#sobre',   label: 'Sobre'    },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount, openCart } = useCart()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="fixed top-0 inset-x-0 z-50 pointer-events-none">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 transition-all duration-500 ${scrolled ? 'pt-0' : 'pt-4'}`}>
        <nav className={`pointer-events-auto liquid-glass flex items-center justify-between gap-4 px-5 sm:px-7 py-3.5 transition-all duration-500 ${
          scrolled ? 'rounded-none -mx-4 sm:-mx-6 px-8 sm:px-10' : 'rounded-2xl'
        }`}>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 z-10">
            <span className="text-2xl select-none">🥖</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl font-black text-white leading-none">MAIS</span>
              <span className="text-xl font-black text-[#EE5C13] leading-none">SUB</span>
            </div>
          </Link>

          {/* Center nav pills */}
          <div className="hidden md:flex items-center liquid-glass rounded-full px-2 py-1.5 gap-1">
            {NAV_LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="px-4 py-1.5 rounded-full text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://wa.me/5511999999999"
              target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 liquid-glass text-white/90 hover:text-white text-xs font-bold px-3.5 py-2 rounded-full transition-all hover:scale-105"
            >
              <MessageCircle size={14} />
              WhatsApp
            </a>

            <button
              onClick={openCart}
              className="relative liquid-glass-orange text-white p-2.5 rounded-full transition-all hover:scale-105 active:scale-95"
              aria-label="Carrinho"
            >
              <ShoppingCart size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-[#EE5C13] text-[10px] font-black w-4.5 h-4.5 min-w-[1.1rem] min-h-[1.1rem] flex items-center justify-center rounded-full shadow-lg px-1">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            <Link
              href="/cardapio"
              className="hidden sm:block bg-white text-[#011a33] font-black text-sm px-5 py-2.5 rounded-full hover:bg-[#EE5C13] hover:text-white transition-all duration-200 hover:scale-105 shadow-lg"
            >
              Pedir Agora
            </Link>

            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden liquid-glass text-white p-2.5 rounded-full transition-all hover:scale-105">
                  <Menu size={18} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#011a33]/95 backdrop-blur-2xl border-white/10 w-72 p-0">
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🥖</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xl font-black text-white">MAIS</span>
                      <span className="text-xl font-black text-[#EE5C13]">SUB</span>
                    </div>
                  </div>
                  <button onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white p-1">
                    <X size={20} />
                  </button>
                </div>
                <nav className="px-6 py-6 flex flex-col gap-2">
                  {NAV_LINKS.map(l => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 font-semibold transition-all"
                    >
                      {l.label}
                    </Link>
                  ))}
                </nav>
                <div className="px-6 pt-2 flex flex-col gap-3">
                  <a
                    href="https://wa.me/5511999999999"
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    <MessageCircle size={16} />
                    Pedir pelo WhatsApp
                  </a>
                  <Link
                    href="/cardapio"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center bg-[#EE5C13] hover:bg-[#d94b0d] text-white font-bold py-3 rounded-xl transition-all"
                  >
                    Ver Cardápio
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  )
}
