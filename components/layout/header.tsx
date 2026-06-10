'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Menu, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useCart } from '@/contexts/cart-context'
import { CartPanel } from '@/components/cart/cart-panel'

const NAV_LINKS = [
  { href: '/cardapio', label: 'Cardápio' },
  { href: '/#promocoes', label: 'Promoções' },
  { href: '/#sobre', label: 'Sobre' },
  { href: '/#contato', label: 'Contato' },
]

export function Header() {
  const { itemCount, toggleCart } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md border-b border-gray-100' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex flex-col leading-none">
                <span className={`text-2xl font-black tracking-tight transition-colors ${
                  scrolled ? 'text-[#023E74]' : 'text-white'
                }`}>
                  MAIS <span className="text-[#EE5C13]">SUB</span>
                </span>
                <span className={`text-[10px] font-medium tracking-widest uppercase transition-colors ${
                  scrolled ? 'text-gray-500' : 'text-white/70'
                }`}>Monte do seu jeito</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={`text-sm font-medium transition-colors hover:text-[#EE5C13] ${
                  scrolled ? 'text-gray-700' : 'text-white'
                }`}>{link.label}</Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button onClick={toggleCart} className={`relative p-2 rounded-full transition-all hover:scale-110 ${
                scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/20'
              }`} aria-label="Abrir carrinho">
                <ShoppingCart size={22} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#EE5C13] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse-orange">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              <Link href="/cardapio">
                <Button className="hidden sm:flex bg-[#EE5C13] hover:bg-[#d94b0d] text-white font-semibold px-4 py-2 rounded-full transition-all hover:scale-105" size="sm">
                  Fazer Pedido
                </Button>
              </Link>

              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button className={`md:hidden p-2 rounded-full transition-colors ${
                    scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/20'
                  }`} aria-label="Abrir menu">
                    <Menu size={22} />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] p-0">
                  <SheetHeader className="p-6 bg-[#023E74] text-white">
                    <SheetTitle className="text-white text-left">
                      <span className="text-2xl font-black">MAIS <span className="text-[#EE5C13]">SUB</span></span>
                    </SheetTitle>
                    <p className="text-white/70 text-xs tracking-widest uppercase">Monte do seu jeito</p>
                  </SheetHeader>
                  <nav className="flex flex-col p-4 gap-1">
                    {NAV_LINKS.map((link) => (
                      <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                        className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-[#EE5C13] font-medium transition-colors">
                        {link.label}
                      </Link>
                    ))}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <Link href="/cardapio" onClick={() => setMobileOpen(false)}>
                        <Button className="w-full bg-[#EE5C13] hover:bg-[#d94b0d] text-white font-semibold rounded-full">Fazer Pedido</Button>
                      </Link>
                      <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 mt-3 px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors">
                        <Phone size={16} />
                        WhatsApp
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
