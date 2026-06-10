'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, X, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SandwichBuilder } from '@/components/builder/sandwich-builder'
import { useCart } from '@/contexts/cart-context'
import { PRODUCTS, formatCurrency, type Product } from '@/lib/store'
import { toast } from 'sonner'

const CATEGORIES = [
  { key: 'all', label: '🍽️ Todos', count: PRODUCTS.filter((p) => p.active).length },
  { key: 'subs-15cm', label: '🥖 Subs 15cm', count: PRODUCTS.filter((p) => p.active && p.category === 'subs-15cm').length },
  { key: 'subs-30cm', label: '🥖 Subs 30cm', count: PRODUCTS.filter((p) => p.active && p.category === 'subs-30cm').length },
  { key: 'combos', label: '🎁 Combos', count: PRODUCTS.filter((p) => p.active && p.category === 'combos').length },
  { key: 'bebidas', label: '🥤 Bebidas', count: PRODUCTS.filter((p) => p.active && p.category === 'bebidas').length },
]

const PRODUCT_TAGS: Record<string, { label: string; bg: string }> = {
  'sub-15-frango': { label: '🔥 Mais Pedido', bg: 'bg-[#EE5C13]' },
  'sub-30-frango': { label: '🔥 Mais Pedido', bg: 'bg-[#EE5C13]' },
  'sub-15-carne':  { label: '🆕 Novo', bg: 'bg-green-500' },
  'sub-30-carne':  { label: '🆕 Novo', bg: 'bg-green-500' },
  'sub-15-lombo':  { label: '⭐ Destaque', bg: 'bg-amber-500' },
  'sub-30-lombo':  { label: '⚡ Rápido', bg: 'bg-blue-500' },
  'combo-duplo':   { label: '💥 Oferta', bg: 'bg-purple-500' },
  'combo-15-refri':{ label: '⚡ Rápido', bg: 'bg-blue-500' },
}

const CARD_GRADIENTS: Record<string, string> = {
  'subs-15cm': 'from-amber-400 via-orange-400 to-[#EE5C13]',
  'subs-30cm': 'from-[#EE5C13] via-orange-600 to-red-600',
  'combos':    'from-[#023E74] via-[#0359A2] to-blue-500',
  'bebidas':   'from-cyan-400 via-sky-400 to-blue-500',
}

function ProductCard({
  product,
  onCustomize,
  onAdd,
}: {
  product: Product
  onCustomize: (p: Product) => void
  onAdd: (p: Product) => void
}) {
  const isSub = product.category === 'subs-15cm' || product.category === 'subs-30cm'
  const tag = PRODUCT_TAGS[product.id]
  const gradient = CARD_GRADIENTS[product.category] ?? 'from-orange-400 to-orange-600'
  const catLabel = CATEGORIES.find((c) => c.key === product.category)?.label ?? ''

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group flex flex-col border border-gray-100">
      <div className={`relative h-52 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
        {tag && (
          <span className={`absolute top-3 left-3 ${tag.bg} text-white text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full shadow-md z-10`}>
            {tag.label}
          </span>
        )}
        <span className="absolute top-3 right-3 bg-black/20 text-white text-[9px] font-bold px-2.5 py-1 rounded-full z-10 backdrop-blur-sm">
          {catLabel}
        </span>
        <span
          className="text-[7rem] card-image-zoom select-none leading-none"
          role="img"
          aria-label={product.name}
          style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.2))' }}
        >
          {product.image}
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-black text-gray-900 text-base leading-tight mb-1.5">{product.name}</h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <p className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase">A partir de</p>
            <p className="text-2xl font-black text-[#EE5C13] leading-none price-highlight">{formatCurrency(product.price)}</p>
          </div>
          <Button
            onClick={() => isSub ? onCustomize(product) : onAdd(product)}
            className={`rounded-2xl px-5 h-10 font-bold transition-all hover:scale-105 text-sm shadow-sm ${
              isSub
                ? 'bg-[#EE5C13] hover:bg-[#d94b0d] text-white hover:shadow-orange-400/30 hover:shadow-lg'
                : 'bg-[#023E74] hover:bg-[#0359A2] text-white'
            }`}
          >
            {isSub ? '🥖 Personalizar' : '+ Adicionar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ query, onReset }: { query: string; onReset: () => void }) {
  return (
    <div className="py-28 text-center flex flex-col items-center">
      <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center text-6xl mb-6">🔍</div>
      <h3 className="text-xl font-black text-gray-800 mb-2">Nenhum resultado encontrado</h3>
      {query ? (
        <p className="text-gray-400 mb-6 max-w-xs">
          Não encontramos nada para <span className="font-bold text-gray-600">&ldquo;{query}&rdquo;</span>. Tente outro termo.
        </p>
      ) : (
        <p className="text-gray-400 mb-6 max-w-xs">Nenhum produto nesta categoria. Explore as outras!</p>
      )}
      <Button onClick={onReset} className="bg-[#EE5C13] hover:bg-[#d94b0d] text-white rounded-full px-8 font-bold">
        Limpar filtros
      </Button>
    </div>
  )
}

export default function CardapioPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [builderProduct, setBuilderProduct] = useState<Product | undefined>()
  const [builderOpen, setBuilderOpen] = useState(false)
  const [tabsSticky, setTabsSticky] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)
  const { addItem } = useCart()

  useEffect(() => {
    const handleScroll = () => {
      if (!tabsRef.current) return
      setTabsSticky(tabsRef.current.getBoundingClientRect().top <= 64)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const filtered = useMemo(() => {
    let list = PRODUCTS.filter((p) => p.active)
    if (activeCategory !== 'all') list = list.filter((p) => p.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    }
    return list
  }, [activeCategory, search])

  const handleAdd = (product: Product) => {
    addItem({ productId: product.id, name: product.name, price: product.price, quantity: 1, image: product.image })
    toast.success(`${product.name} adicionado!`)
  }

  const handleReset = () => { setSearch(''); setActiveCategory('all') }

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen bg-gray-50">

        {/* Hero banner */}
        <section
          className="relative overflow-hidden grain"
          style={{ background: 'linear-gradient(160deg, #011a33 0%, #023E74 55%, #0359A2 100%)', paddingTop: '5rem', paddingBottom: '5rem' }}
        >
          <div
            className="absolute pointer-events-none"
            style={{ top: '-20%', right: '-10%', width: '55vw', height: '55vw', maxWidth: 600, maxHeight: 600, background: 'radial-gradient(circle, rgba(238,92,19,0.2) 0%, transparent 65%)', borderRadius: '50%' }}
          />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="text-6xl mb-4 animate-float-sm" role="img" aria-label="Sub">🥖</div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
              Nosso <span className="text-[#EE5C13]">Cardápio</span>
            </h1>
            <p className="text-white/65 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              Escolha seu sub favorito, personalize cada detalhe e receba fresquinho em casa.
            </p>
            <div className="relative max-w-xl mx-auto">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
              <Input
                placeholder="Buscar no cardápio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-12 h-14 rounded-2xl border-0 bg-white/95 shadow-xl text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#EE5C13]/40 text-base"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Sticky category tabs */}
        <div
          ref={tabsRef}
          className={`z-40 bg-white border-b border-gray-100 transition-all duration-300 ${tabsSticky ? 'sticky top-[64px] shadow-sm' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`category-pill flex-none flex items-center gap-1.5 px-5 py-2.5 rounded-full font-bold text-sm border transition-all ${
                    activeCategory === cat.key
                      ? 'bg-[#EE5C13] text-white border-[#EE5C13] shadow-md shadow-orange-400/20 active'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#EE5C13]/50 hover:text-[#EE5C13]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeCategory === cat.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-500 text-sm">
              <span className="font-bold text-gray-800">{filtered.length}</span>{' '}
              {filtered.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
              {search && <span> para <span className="text-[#EE5C13] font-semibold">&ldquo;{search}&rdquo;</span></span>}
            </p>
            {(search || activeCategory !== 'all') && (
              <button onClick={handleReset} className="flex items-center gap-1 text-[#EE5C13] text-xs font-bold hover:underline">
                <X size={12} /> Limpar filtros
              </button>
            )}
          </div>

          {filtered.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onCustomize={(p) => { setBuilderProduct(p); setBuilderOpen(true) }}
                  onAdd={handleAdd}
                />
              ))}
            </div>
          ) : (
            <EmptyState query={search} onReset={handleReset} />
          )}

          {filtered.length > 0 && (
            <div className="mt-14 text-center">
              <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-[#011a33] to-[#023E74] rounded-3xl px-8 py-6 text-white">
                <div className="text-left">
                  <p className="font-black text-lg">Não encontrou o que procura?</p>
                  <p className="text-white/60 text-sm">Fale com a gente pelo WhatsApp</p>
                </div>
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-full text-sm transition-all hover:scale-105 shrink-0"
                >
                  💬 WhatsApp <ChevronRight size={14} />
                </a>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
      <SandwichBuilder product={builderProduct} open={builderOpen} onClose={() => setBuilderOpen(false)} />
    </>
  )
}
