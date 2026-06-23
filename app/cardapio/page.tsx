'use client'

import Image from 'next/image'
import { useState, useMemo, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useCart } from '@/contexts/cart-context'
import { PRODUCTS, formatCurrency, type Product } from '@/lib/data'
import { toast } from 'sonner'
import { IdentificationModal } from '@/components/cart/IdentificationModal'

const SandwichBuilder = dynamic(() => import('@/components/builder/sandwich-builder').then(m => ({ default: m.SandwichBuilder })), { ssr: false })

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
    <div className="group flex flex-col bg-navy-surface rounded-2xl overflow-hidden border border-white/6 hover:border-brand/40 hover:shadow-[0_0_40px_rgba(238,92,19,0.08)] transition-all duration-400 cursor-pointer">
      <div className="relative aspect-[4/3] overflow-hidden bg-navy-deep">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover card-img"
            sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,20vw"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-5xl">{product.image}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-surface/50 via-transparent to-transparent" />
        {product.badge && (
          <span className="absolute top-3 left-3 bg-brand text-white text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full">
            {product.badge.label.replace(/[^\w\s]/g, '').trim()}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="font-bold text-white text-[14px] leading-snug mb-1">{product.name}</h3>
          <p className="text-white/35 text-[12px] leading-relaxed line-clamp-2">{product.description}</p>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-white/6">
          <div>
            <p className="text-[9px] text-white/25 font-medium uppercase tracking-wider mb-0.5">a partir de</p>
            <p className="text-[16px] font-black text-white leading-none tabular-nums">{formatCurrency(product.price)}</p>
          </div>
          <button
            onClick={() => isSub ? onCustomize(product) : onAdd(product)}
            className="flex items-center gap-1.5 bg-white/6 hover:bg-brand border border-white/10 hover:border-brand text-white text-[12px] font-bold px-3.5 py-2 rounded-full transition-all duration-200"
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
  const [idModalOpen, setIdModalOpen] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const { addItem, items, subtotal, total, deliveryFee, clearCart } = useCart()

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
      <main className="min-h-screen bg-navy">

        {/* Page header */}
        <section className="relative bg-navy pt-28 pb-14 overflow-hidden">
          {/* Glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-brand/5 blur-[100px] rounded-full" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />
          </div>

          <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
            <div className="animate-slide-up">
              <p className="text-[11px] font-semibold text-brand uppercase tracking-[0.22em] mb-3">Mais Sub</p>
              <h1 className="text-[2.8rem] sm:text-[3.8rem] font-black text-white leading-[1.04] tracking-[-0.045em] mb-5">
                Cardápio
              </h1>
              <p className="text-white/35 text-[15px] max-w-md leading-relaxed mb-8">
                Subs 15cm e 30cm, combos e bebidas. Personalize cada detalhe do seu jeito.
              </p>
              {/* Search */}
              <div className="relative max-w-sm">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type="text"
                  placeholder="Buscar no cardápio…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-11 pl-10 pr-9 rounded-full bg-white/6 border border-white/10 text-white placeholder-white/25 text-[14px] outline-none focus:border-brand/40 focus:bg-white/8 transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div ref={sentinelRef} className="h-px" />

        {/* Filter bar */}
        <div className={`bg-navy/95 backdrop-blur-xl border-b border-white/6 z-40 transition-shadow ${sticky ? 'sticky top-16 shadow-[0_4px_30px_rgba(0,0,0,0.4)]' : ''}`}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-3">
              <SlidersHorizontal size={13} className="text-white/20 shrink-0" />
              {CATS.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setActive(cat.key)}
                  className={`cat-pill shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                    active === cat.key
                      ? 'bg-brand text-white shadow-[0_0_20px_rgba(238,92,19,0.3)]'
                      : 'text-white/35 hover:bg-white/6 hover:text-white border border-white/8'
                  }`}
                >
                  {cat.label}
                  <span className={`text-[11px] font-bold ${active === cat.key ? 'text-white/70' : 'text-white/20'}`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
          <p className="text-[13px] text-white/25 mb-7">
            <span className="font-bold text-white/60">{filtered.length}</span> {filtered.length === 1 ? 'item' : 'itens'}
            {search && <> para <span className="font-bold text-white/60">&ldquo;{search}&rdquo;</span></>}
          </p>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {filtered.map((product, i) => (
                <div
                  key={product.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${Math.min(i * 0.04, 0.25)}s` }}
                >
                  <ProductCard
                    product={product}
                    onCustomize={p => { setBuilderProduct(p); setBuilderOpen(true) }}
                    onAdd={handleAdd}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="animate-slide-up-sm py-24 text-center">
              <p className="text-4xl mb-4">🔍</p>
              <h3 className="font-bold text-white text-lg mb-2">Nenhum resultado</h3>
              <p className="text-white/35 text-[14px] mb-6">Tente outro termo ou limpe os filtros.</p>
              <button
                onClick={() => { setSearch(''); setActive('all') }}
                className="inline-flex items-center gap-2 border border-white/12 hover:border-white/25 text-white/50 hover:text-white text-[13.5px] font-semibold px-6 py-2.5 rounded-full transition-all"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        {/* WhatsApp CTA */}
        <div className="border-t border-white/6 bg-navy-deep py-12">
          <div className="max-w-xl mx-auto px-5 text-center">
            <p className="text-white/30 text-[13.5px] mb-5">Prefere pedir pelo WhatsApp?</p>
            <button
              onClick={() => {
                if (items.length === 0) {
                  toast.error('Adicione itens ao carrinho antes de pedir pelo WhatsApp.')
                  return
                }
                setIdModalOpen(true)
              }}
              className="inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1fbd5b] text-white font-bold px-7 py-3.5 rounded-full text-[14px] transition-all hover:shadow-[0_0_30px_rgba(37,211,102,0.35)]"
            >
              💬 Pedir pelo WhatsApp
            </button>
          </div>
        </div>
      </main>
      <Footer />
      <SandwichBuilder product={builderProduct} open={builderOpen} onClose={() => setBuilderOpen(false)} />
      <IdentificationModal
        open={idModalOpen}
        onClose={() => setIdModalOpen(false)}
        items={items}
        subtotal={subtotal}
        total={total}
        deliveryFee={deliveryFee}
        onSuccess={clearCart}
      />
    </>
  )
}
