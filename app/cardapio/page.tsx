'use client'

import Image from 'next/image'
import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SandwichBuilder } from '@/components/builder/sandwich-builder'
import { useCart } from '@/contexts/cart-context'
import { PRODUCTS, formatCurrency, type Product } from '@/lib/store'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const CATEGORIES = [
  { key: 'all',       label: 'Tudo' },
  { key: 'subs-15cm', label: 'Sub 15cm' },
  { key: 'subs-30cm', label: 'Sub 30cm' },
  { key: 'combos',    label: 'Combos' },
  { key: 'bebidas',   label: 'Bebidas' },
]

function ProductCard({ product, onCustomize, onAdd }: {
  product: Product
  onCustomize: (p: Product) => void
  onAdd: (p: Product) => void
}) {
  const isSub = product.category === 'subs-15cm' || product.category === 'subs-30cm'

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col border border-gray-100">
      <div className="relative h-48 overflow-hidden bg-gray-100 shrink-0">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,300px"
          />
        ) : (
          <div className="h-full bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center text-6xl">
            {product.image}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
        {product.badge && (
          <span className={`absolute top-3 left-3 ${product.badge.color} text-white text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg shadow-lg`}>
            {product.badge.label}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-black text-gray-900 text-[0.95rem] leading-snug mb-1">{product.name}</h3>
        <p className="text-gray-400 text-xs leading-relaxed mb-4 flex-1 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">a partir de</p>
            <p className="text-xl font-black text-[#EE5C13] leading-tight tabular-nums">{formatCurrency(product.price)}</p>
          </div>
          <button
            onClick={() => isSub ? onCustomize(product) : onAdd(product)}
            className={`rounded-xl h-10 px-4 font-bold text-sm transition-all active:scale-95 hover:scale-105 ${
              isSub
                ? 'bg-[#EE5C13] hover:bg-[#d94b0d] text-white'
                : 'bg-[#023E74] hover:bg-[#0359A2] text-white'
            }`}
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
      <main className="min-h-screen bg-[#f7f7f8]">

        {/* Hero com foto */}
        <section className="relative h-[280px] sm:h-[340px] overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1553909489-cd47e0907980?w=1400&q=85&auto=format&fit=crop"
            alt="Cardápio Mais Sub"
            fill priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#011a33] via-[#011a33]/60 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 px-4">
            <p className="text-[#EE5C13] font-black text-xs uppercase tracking-[0.2em] mb-2">Monte do seu jeito</p>
            <h1 className="text-4xl sm:text-5xl font-black text-white text-center leading-tight mb-6">
              Nosso <span className="text-[#EE5C13]">Cardápio</span>
            </h1>
            <div className="relative w-full max-w-md">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar subs, combos, bebidas…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-12 pl-10 pr-10 rounded-2xl bg-white text-gray-800 text-sm font-medium shadow-2xl outline-none border-0 focus:ring-2 focus:ring-[#EE5C13]/40"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        </section>

        <div ref={sentinelRef} className="h-px" />

        {/* Category tabs */}
        <div className={`bg-white border-b border-gray-100 z-40 transition-all ${sticky ? 'sticky top-16 shadow-md' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide py-3">
              {CATEGORIES.map(cat => {
                const count = cat.key === 'all'
                  ? PRODUCTS.filter(p => p.active).length
                  : PRODUCTS.filter(p => p.active && p.category === cat.key).length
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActive(cat.key)}
                    className={`shrink-0 flex items-center gap-1.5 px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                      active === cat.key
                        ? 'bg-[#EE5C13] text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {cat.label}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active === cat.key ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {filtered.length > 0 ? (
            <>
              <p className="text-gray-400 text-sm mb-6">
                <span className="font-semibold text-gray-700">{filtered.length}</span> {filtered.length === 1 ? 'item' : 'itens'}
                {search && <> para <span className="font-semibold text-gray-700">&ldquo;{search}&rdquo;</span></>}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filtered.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onCustomize={p => { setBuilderProduct(p); setBuilderOpen(true) }}
                    onAdd={handleAdd}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl mx-auto mb-4">🔍</div>
              <h3 className="font-black text-gray-800 text-xl mb-2">Nenhum resultado</h3>
              <p className="text-gray-400 mb-6">Tente outro termo ou limpe os filtros.</p>
              <Button onClick={() => { setSearch(''); setActive('all') }} className="bg-[#EE5C13] hover:bg-[#d94b0d] text-white rounded-full px-8">
                Limpar filtros
              </Button>
            </div>
          )}
        </div>

        <div className="bg-white border-t border-gray-100 py-10">
          <div className="max-w-xl mx-auto px-4 text-center">
            <p className="text-gray-400 text-sm mb-3">Prefere pedir pelo WhatsApp?</p>
            <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-3 rounded-full transition-all hover:scale-105 shadow-lg text-sm">
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
