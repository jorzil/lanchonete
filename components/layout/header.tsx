'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Menu, X, ArrowUpRight } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { MaisSubMark, MBadge } from '@/components/brand/logo'

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
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-navy/92 backdrop-blur-xl border-b border-white/8'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">

          <Link href="/" className="flex items-center shrink-0 gap-2">
            <MBadge size={28} />
            <MaisSubMark className="text-[18px]" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV.map(l => (
              <Link key={l.href} href={l.href}
                className="text-[13px] font-medium text-white/55 hover:text-white transition-colors duration-200">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button onClick={openCart} aria-label="Carrinho"
              className="relative p-1.5 text-white/55 hover:text-white transition-colors">
              <ShoppingBag size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand text-white text-[9px] font-black min-w-[15px] h-[15px] px-1 rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            <Link href="/cardapio" className="hidden sm:block">
              <button className="group flex items-center gap-1 bg-brand hover:bg-brand-hover text-white text-[12.5px] font-bold px-4 py-2 rounded-full transition-all duration-200 shadow-[0_0_20px_rgba(238,92,19,0.35)]">
                Pedir agora
                <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </Link>

            <button onClick={() => setMobileOpen(true)}
              className="md:hidden p-1 text-white/65 hover:text-white transition-colors">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`fixed inset-0 z-[100] bg-navy flex flex-col transition-all duration-400 ${
        mobileOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
      }`}>
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/8">
          <div className="flex items-center gap-2">
            <MBadge size={26} />
            <MaisSubMark className="text-[18px]" />
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-1 text-white/55 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-5 py-8">
          {[{ href: '/', label: 'Início' }, ...NAV].map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between py-5 border-b border-white/8 text-[24px] font-display font-extrabold tracking-[-0.03em] text-white/85 hover:text-white transition-colors">
              {l.label}
              <ArrowUpRight size={18} className="text-white/25" />
            </Link>
          ))}
        </nav>
        <div className="px-5 pb-10 space-y-3">
          <Link href="/cardapio" onClick={() => setMobileOpen(false)}>
            <button className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-4 rounded-2xl text-[15px] transition-all shadow-[0_0_30px_rgba(238,92,19,0.35)]">
              Montar meu sub
            </button>
          </Link>
        </div>
      </div>
    </>
  )
}
