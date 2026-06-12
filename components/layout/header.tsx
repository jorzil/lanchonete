'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Menu, X, ArrowRight } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'

const NAV = [
  { href: '/cardapio', label: 'Cardápio' },
  { href: '/cardapio?cat=combos', label: 'Combos' },
  { href: '/#sobre', label: 'Sobre' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount, openCart } = useCart()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 72)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const dark = !scrolled

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/96 backdrop-blur-sm border-b border-[#E4E4E7]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <span className={`text-[17px] font-semibold tracking-[-0.03em] transition-colors ${dark ? 'text-white' : 'text-[#0A0A0A]'}`}>
              mais<span className="font-black text-[#EE5C13]">sub</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-[13.5px] font-medium transition-colors duration-200 ${
                  dark ? 'text-white/65 hover:text-white' : 'text-[#6B7280] hover:text-[#0A0A0A]'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Cart */}
            <button
              onClick={openCart}
              aria-label="Carrinho"
              className={`relative p-1.5 transition-colors duration-200 ${
                dark ? 'text-white/70 hover:text-white' : 'text-[#6B7280] hover:text-[#0A0A0A]'
              }`}
            >
              <ShoppingBag size={19} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#EE5C13] text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center leading-none">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            {/* CTA */}
            <Link href="/cardapio" className="hidden sm:block">
              <button className="group flex items-center gap-1.5 bg-[#EE5C13] hover:bg-[#d94b0d] text-white text-[13px] font-semibold px-4 py-2 rounded-full transition-all duration-200">
                Pedir agora
                <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className={`md:hidden p-1 transition-colors ${dark ? 'text-white' : 'text-[#0A0A0A]'}`}
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-[100] bg-white transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-[#E4E4E7]">
          <span className="text-[17px] font-semibold tracking-[-0.03em]">
            mais<span className="font-black text-[#EE5C13]">sub</span>
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 text-[#6B7280] hover:text-[#0A0A0A] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="px-5 py-6">
          {[{ href: '/', label: 'Início' }, ...NAV].map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between py-4 border-b border-[#F4F4F5] text-[15px] font-medium text-[#0A0A0A] hover:text-[#EE5C13] transition-colors"
            >
              {l.label}
              <ArrowRight size={14} className="text-[#9CA3AF]" />
            </Link>
          ))}

          <div className="mt-6 space-y-3">
            <Link href="/cardapio" onClick={() => setMobileOpen(false)}>
              <button className="w-full bg-[#EE5C13] hover:bg-[#d94b0d] text-white font-semibold py-3.5 rounded-full text-[15px] transition-colors">
                Pedir agora
              </button>
            </Link>
            <a
              href="https://wa.me/5511999999999"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full border border-[#E4E4E7] text-[#6B7280] font-medium py-3.5 rounded-full text-[15px] hover:border-[#0A0A0A] hover:text-[#0A0A0A] transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </nav>
      </div>
    </>
  )
}
