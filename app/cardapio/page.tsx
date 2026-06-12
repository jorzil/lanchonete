'use client'

import Image from 'next/image'
import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SandwichBuilder } from '@/components/builder/sandwich-builder'
import { useCart } from '@/contexts/cart-context'
import { PRODUCTS, formatCurrency, type Product } from '@/lib/store'
import { toast } from 'sonner'

const CATS = [
  { key: 'all',       label: 'Tudo',      count: PRODUCTS.filter(p => p.active).length },
  { key: 'subs-15cm', label: 'Subs 15cm', count: PRODUCTS.filter(p => p.active && p.category === 'subs-15cm').length },
  { key: 'subs-30cm', label: 'Subs 30cm', count: PRODUCTS.filter(p => p.active && p.category === 'subs-30cm').length },
  { key: 'combos',    label: 'Combos',    count: PRODUCTS.filter(p => p.active && p.category === 'combos').length },
  { key: 'bebidas',   label: 'Bebidas',   count: PRODUCTS.filter(p => p.active && p.category === 'bebidas').length },
]

function ProductCard({ product, onCustomize, onAdd }: {
  product: Product
  onCustomize: (p: Product) => void
  onAdd: (p: Product) => void
}) {
  const isSub = product.category === 'subs-15cm' || product.category === 'subs-30cm'

  return (
    <div className="group flex flex-col bg-white rounded-xl overflow-hidden border border-[#E4E4E7] hover:border-[#D1D5DB] hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] transition-all duration-300">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F4F4F5]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover card-img"
            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,25vw"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-5xl">{product.image}</div>
        )}
        {product.badge && (
          <span className="absolute top-3 left-3 bg-[#0A0A0A]/80 backdrop-blur-sm text-white text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full">
            {product.badge.label}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="font-semibold text-[#0A0A0A] text-[14px] leading-snug mb-1">{product.name}</h3>
          <p className="text-[#9CA3AF] text-[12.5px] leading-relaxed line-clamp-2">{product.description}</p>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-[#F4F4F5]">
          <div>
            <p className="text-[9.5px] text-[#9CA3AF] font-medium uppercase tracking-wider mb-0.5">a partir de</p>
            <p className="text-[17px] font-bold text-[#0A0A0A] leading-none tabular-nums">{formatCurrency(product.price)}</p>
          </div>
          <button
            onClick={() => isSub ? onCustomize(product) : onAdd(product)}
            className="flex items-center gap-1.5 bg-[#0A0A0A] hover:bg-[#EE5C13] text-white text-[12px] font-semibold px-4 py-2 rounded-full transition-all duration-200"
          >
            {isSub ? 'Personalizar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CardapioPage() {
  const [active, setActive] = useState('all')
  const [search, setSearch] = useState('')
  const [builderProduct, setBuilderProduct] = useState<Product | undefined>()
  const [builderOpen, setBuilderOpen] = useState(false)
  const [sticky, setSticky] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const { addItem } = useCart()

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => setSticky(!e.isIntersecting), { threshold: 0 })
    if (sentinelRef.current) obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [])

  const filtered = useMemo(() => {
    let list = PRODUCTS.filter(p => p.active)
    if (active !== 'all') list = list.filter(p => p.category === active)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    }
    return list
  }, [active, search])

  const handleAdd = (p: Product) => {
    addItem({ productId: p.id, name: p.name, price: p.price, quantity: 1, image: p.image })
    toast.success(`${p.name} adicionado!`)
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FAFAFA]">

        {/* Page header */}
        <section className="bg-[#011a33] pt-28 pb-14">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-[11px] font-semibold text-[#EE5C13] uppercase tracking-[0.22em] mb-3">Mais Sub</p>
              <h1 className="text-[2.8rem] sm:text-[3.5rem] font-bold text-white leading-[1.05] tracking-[-0.035em] mb-5">
                Cardápio
              </h1>
              <p className="text-white/50 text-[15px] max-w-md leading-relaxed mb-8">
                Subs 15cm e 30cm, combos e bebidas. Personalize cada detalhe do seu jeito.
              </p>
              <div className="relative max-w-sm">
                <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Buscar no cardápio…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-11 pl-10 pr-9 rounded-full bg-white/8 border border-white/12 text-white placeholder-white/30 text-[14px] outline-none focus:border-white/25 focus:bg-white/12 transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        <div ref={sentinelRef} className="h-px" />

        {/* Filter bar */}
        <div className={`bg-white border-b border-[#E4E4E7] z-40 transition-shadow ${sticky ? 'sticky top-16 shadow-sm' : ''}`}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3">
              {CATS.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setActive(cat.key)}
                  className={`cat-pill shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                    active === cat.key
                      ? 'bg-[#0A0A0A] text-white'
                      : 'text-[#6B7280] hover:bg-[#F4F4F5] hover:text-[#0A0A0A]'
                  }`}
                >
                  {cat.label}
                  <span className={`text-[11px] font-semibold ${active === cat.key ? 'text-white/50' : 'text-[#9CA3AF]'}`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
          <p className="text-[13px] text-[#9CA3AF] mb-7">
            <span className="font-semibold text-[#0A0A0A]">{filtered.length}</span> {filtered.length === 1 ? 'item' : 'itens'}
            {search && <> para <span className="font-semibold text-[#0A0A0A]">&ldquo;{search}&rdquo;</span></>}
          </p>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {filtered.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: Math.min(i * 0.04, 0.3) }}
                >
                  <ProductCard
                    product={product}
                    onCustomize={p => { setBuilderProduct(p); setBuilderOpen(true) }}
                    onAdd={handleAdd}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <p className="text-4xl mb-4">🔍</p>
              <h3 className="font-bold text-[#0A0A0A] text-lg mb-2">Nenhum resultado</h3>
              <p className="text-[#9CA3AF] text-[14px] mb-6">Tente outro termo ou limpe os filtros.</p>
              <button
                onClick={() => { setSearch(''); setActive('all') }}
                className="inline-flex items-center gap-2 border border-[#E4E4E7] hover:border-[#0A0A0A] text-[#0A0A0A] text-[13.5px] font-semibold px-6 py-2.5 rounded-full transition-all"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-[#E4E4E7] bg-white py-10">
          <div className="max-w-xl mx-auto px-5 text-center">
            <p className="text-[#9CA3AF] text-[13.5px] mb-4">Prefere pedir pelo WhatsApp?</p>
            <a
              href="https://wa.me/5511999999999"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1fbd5b] text-white font-semibold px-7 py-3 rounded-full text-[14px] transition-all hover:scale-[1.02]"
            >
              💬 Pedir pelo WhatsApp
            </a>
          </div>
        </div>
      </main>
      <Footer />
      <SandwichBuilder product={builderProduct} open={builderOpen} onClose={() => setBuilderOpen(false)} />
    </>
  )
}
