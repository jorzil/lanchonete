'use client'

import Image from 'next/image'
import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, X, ArrowUpRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
  product: Product; onCustomize: (p: Product) => void; onAdd: (p: Product) => void
}) {
  const isSub = product.category === 'subs-15cm' || product.category === 'subs-30cm'
  return (
    <div className="group flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[14px] bg-[#F2ECDF] mb-4">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover card-img" sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,20vw" />
        ) : (
          <div className="h-full flex items-center justify-center text-5xl">{product.image}</div>
        )}
        {product.badge && (
          <span className="absolute top-3 left-3 bg-[#FAF6EE] text-[#0E1F3C] text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full">
            {product.badge.label.replace(/[^\w\s]/g, '').trim()}
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-medium text-[#0E1F3C] leading-snug">{product.name}</h3>
          <p className="text-[12px] text-[#8B95A8] leading-relaxed mt-1 line-clamp-2">{product.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[13.5px] font-medium text-[#0E1F3C] tabular-nums">{formatCurrency(product.price)}</p>
        </div>
      </div>
      <button
        onClick={() => isSub ? onCustomize(product) : onAdd(product)}
        className="mt-3 self-start inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0E1F3C] hover:text-[#EE5C13] transition-colors link-underline"
      >
        {isSub ? 'Personalizar' : 'Adicionar'}
        <ArrowUpRight size={11} strokeWidth={1.8} />
      </button>
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
      <main className="min-h-screen bg-[#FAF6EE]">
        {/* Page header */}
        <section className="pt-[120px] pb-16">
          <div className="max-w-[1280px] mx-auto px-6 sm:px-10">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[#8B95A8]">
                <span className="w-5 h-px bg-[#0E1F3C]/30" />
                Cardápio completo
              </div>
              <h1 className="h-editorial mt-6 text-[#0E1F3C] text-[56px] sm:text-[80px] lg:text-[96px]">
                Escolha,<br />
                <span className="italic text-[#EE5C13]">monte e peça.</span>
              </h1>
              <p className="mt-7 text-[15px] text-[#3D4D6A] max-w-[520px] leading-relaxed">
                Subs 15cm e 30cm, combos da casa e bebidas geladas. Personalize cada detalhe do seu sub.
              </p>

              <div className="mt-10 relative max-w-md">
                <Search size={14} strokeWidth={1.8} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8B95A8]" />
                <input
                  type="text"
                  placeholder="Buscar no cardápio…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-12 pl-11 pr-10 rounded-full bg-white border border-[#E8E0D0] text-[#0E1F3C] placeholder-[#8B95A8] text-[14px] outline-none focus:border-[#0E1F3C] transition-colors"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B95A8] hover:text-[#0E1F3C] transition-colors">
                    <X size={14} strokeWidth={1.8} />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        <div ref={sentinelRef} className="h-px" />

        {/* Filter bar */}
        <div className={`bg-[#FAF6EE]/92 backdrop-blur-xl border-y border-[#E8E0D0] z-40 transition-all ${sticky ? 'sticky top-[72px]' : ''}`}>
          <div className="max-w-[1280px] mx-auto px-6 sm:px-10">
            <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide py-4">
              {CATS.map(cat => {
                const isActive = active === cat.key
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActive(cat.key)}
                    className={`cat-pill shrink-0 flex items-center gap-2 text-[13px] font-medium pb-1 border-b transition-colors ${
                      isActive
                        ? 'text-[#0E1F3C] border-[#0E1F3C]'
                        : 'text-[#8B95A8] border-transparent hover:text-[#0E1F3C]'
                    }`}
                  >
                    {cat.label}
                    <span className={`text-[10.5px] tabular-nums font-normal ${isActive ? 'text-[#EE5C13]' : 'text-[#8B95A8]'}`}>
                      {cat.count.toString().padStart(2, '0')}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-[1280px] mx-auto px-6 sm:px-10 py-16">
          <p className="text-[12.5px] text-[#8B95A8] mb-10">
            <span className="font-medium text-[#0E1F3C]">{filtered.length.toString().padStart(2, '0')}</span> {filtered.length === 1 ? 'item' : 'itens'}
            {search && <> para <span className="font-medium text-[#0E1F3C]">&ldquo;{search}&rdquo;</span></>}
          </p>

          <AnimatePresence mode="wait">
            {filtered.length > 0 ? (
              <motion.div
                key={active + search}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12"
              >
                {filtered.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: Math.min(i * 0.04, 0.25) }}
                  >
                    <ProductCard
                      product={product}
                      onCustomize={p => { setBuilderProduct(p); setBuilderOpen(true) }}
                      onAdd={handleAdd}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-24 text-center"
              >
                <h3 className="h-editorial text-[32px] text-[#0E1F3C] mb-3">Nada encontrado</h3>
                <p className="text-[14px] text-[#8B95A8] mb-7">Tente outro termo ou limpe os filtros.</p>
                <button
                  onClick={() => { setSearch(''); setActive('all') }}
                  className="inline-flex items-center gap-2 bg-[#0E1F3C] hover:bg-[#1a2e54] text-[#FAF6EE] text-[13px] font-medium px-6 py-3 rounded-full transition-colors"
                >
                  Limpar filtros
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
      <SandwichBuilder product={builderProduct} open={builderOpen} onClose={() => setBuilderOpen(false)} />
    </>
  )
}
