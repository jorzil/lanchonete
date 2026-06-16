'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Menu, X } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { Logo } from '@/components/brand/logo'

const NAV = [
  { href: '/cardapio', label: 'Cardápio' },
  { href: '/cardapio?cat=combos', label: 'Combos' },
  { href: '/#sobre', label: 'Sobre' },
  { href: '/#contato', label: 'Contato' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount, openCart } = useCart()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#FAF6EE]/85 backdrop-blur-xl border-b border-[#E8E0D0]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-6 sm:px-10 h-[72px] flex items-center justify-between gap-10">
          <Link href="/" aria-label="Mais Sub" className="flex items-center shrink-0">
            <Logo height={36} priority />
          </Link>

          <nav className="hidden md:flex items-center gap-9">
            {NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="link-underline text-[13.5px] font-medium text-[#3D4D6A] hover:text-[#0E1F3C] transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openCart}
              aria-label="Carrinho"
              className="relative h-10 w-10 grid place-items-center rounded-full text-[#0E1F3C] hover:bg-[#0E1F3C]/5 transition-colors"
            >
              <ShoppingBag size={17} strokeWidth={1.8} />
              {itemCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-[#EE5C13] text-white text-[9.5px] font-bold min-w-[16px] h-[16px] px-1 rounded-full grid place-items-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            <Link href="/cardapio" className="hidden sm:block">
              <button className="bg-[#0E1F3C] hover:bg-[#1a2e54] text-[#FAF6EE] text-[13px] font-medium px-5 py-2.5 rounded-full transition-colors">
                Fazer pedido
              </button>
            </Link>

            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden h-10 w-10 grid place-items-center text-[#0E1F3C] hover:bg-[#0E1F3C]/5 rounded-full transition-colors"
              aria-label="Menu"
            >
              <Menu size={19} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-[100] bg-[#FAF6EE] flex flex-col transition-all duration-300 ${
          mobileOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between h-[72px] px-6 border-b border-[#E8E0D0]">
          <Logo height={32} />
          <button
            onClick={() => setMobileOpen(false)}
            className="h-10 w-10 grid place-items-center text-[#0E1F3C] hover:bg-[#0E1F3C]/5 rounded-full transition-colors"
            aria-label="Fechar"
          >
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>
        <nav className="flex-1 px-6 py-10">
          {[{ href: '/', label: 'Início' }, ...NAV].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between py-5 border-b border-[#E8E0D0] h-editorial text-[28px] text-[#0E1F3C] hover:text-[#EE5C13] transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="px-6 pb-10 space-y-3">
          <Link href="/cardapio" onClick={() => setMobileOpen(false)}>
            <button className="w-full bg-[#0E1F3C] hover:bg-[#1a2e54] text-[#FAF6EE] font-medium py-4 rounded-full text-[14px] transition-colors">
              Fazer pedido
            </button>
          </Link>
        </div>
      </div>
    </>
  )
}
