'use client'

import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SandwichBuilder } from '@/components/builder/sandwich-builder'
import { useCart } from '@/contexts/cart-context'
import { PRODUCTS, formatCurrency, type Product } from '@/lib/store'
import { toast } from 'sonner'

const CATEGORIES = [
  { key: 'all', label: '🍽️ Todos', count: true },
  { key: 'subs-15cm', label: '🥖 Subs 15cm', count: true },
  { key: 'subs-30cm', label: '🥖 Subs 30cm', count: true },
  { key: 'combos', label: '🎁 Combos', count: true },
  { key: 'bebidas', label: '🥤 Bebidas', count: true },
]

const PRODUCT_TAGS: Record<string, { label: string; color: string }> = {
  'sub-15-frango': { label: '🔥 Mais Pedido', color: 'bg-red-500' },
  'sub-30-frango': { label: '🔥 Mais Pedido', color: 'bg-red-500' },
  'sub-15-lombo': { label: '⭐ Destaque', color: 'bg-amber-500' },
  'sub-30-carne': { label: '🆕 Novo', color: 'bg-[#EE5C13]' },
  'combo-duplo': { label: '💥 Oferta', color: 'bg-[#0359A2]' },
}

const CARD_GRADIENTS: Record<string, string> = {
  'subs-15cm': 'from-amber-400 via-orange-400 to-orange-500',
  'subs-30cm': 'from-orange-500 via-red-400 to-red-500',
  'combos': 'from-blue-500 via-[#0359A2] to-[#023E74]',
  'bebidas': 'from-cyan-400 via-sky-400 to-blue-500',
}

function ProductCard({ product, onCustomize, onAdd }: {
  product: Product
  onCustomize: (p: Product) => void
  onAdd: (p: Product) => void
}) {
  const isSub = product.category === 'subs-15cm' || product.category === 'subs-30cm'
  const tag = PRODUCT_TAGS[product.id]
  const gradient = CARD_GRADIENTS[product.category] || 'from-orange-400 to-orange-600'

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group flex flex-col border border-gray-100">
      <div className={`relative h-52 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
        {tag && (
          <span className={`absolute top-3 left-3 ${tag.color} text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-lg`}>
            {tag.label}
          </span>
        )}
        {isSub && (
          <span className="absolute top-3 right-3 bg-black/30 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
            Personalizável
          </span>
        )}
        <div className="text-9xl group-hover:scale-110 transition-transform duration-500 drop-shadow-xl select-none">
          {product.image}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-black text-gray-900 text-[15px] leading-tight mb-1.5">{product.name}</h3>
        <p className="text-gray-400 text-[13px] leading-relaxed mb-4 flex-1 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">A partir de</p>
            <p className="text-2xl font-black text-[#EE5C13] leading-none mt-0.5">{formatCurrency(product.price)}</p>
          </div>
          <Button
            onClick={() => isSub ? onCustomize(product) : onAdd(product)}
            className={`rounded-2xl px-5 h-10 font-bold transition-all hover:scale-105 text-sm shadow-md ${
              isSub
                ? 'bg-[#EE5C13] hover:bg-[#d94b0d] text-white shadow-[#EE5C13]/20'
                : 'bg-[#023E74] hover:bg-[#0359A2] text-white'
            }`}
          >
            {isSub ? '🥖 Montar' : '+ Add'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function CardapioPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [builderProduct, setBuilderProduct] = useState<Product | undefined>()
  const [builderOpen, setBuilderOpen] = useState(false)
  const { addItem } = useCart()

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

  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Hero banner */}
        <section className="relative bg-[#011a33] pt-16 pb-24 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#EE5C13]/15 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0359A2]/20 rounded-full blur-[80px]" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="text-5xl mb-4">🥖</div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Nosso <span className="text-[#EE5C13]">Cardápio</span>
            </h1>
            <p className="text-white/60 text-lg mb-8">
              Ingredientes frescos, selecionados diariamente. Monte do seu jeito.
            </p>
            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar no cardápio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-14 rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 focus:border-[#EE5C13] text-base"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xl">×</button>
              )}
            </div>
          </div>

          {/* Wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" className="w-full">
              <path d="M0 60 L0 30 Q360 0 720 30 Q1080 60 1440 30 L1440 60 Z" fill="#f9fafb" />
            </svg>
          </div>
        </section>

        {/* Category tabs — sticky */}
        <div className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto py-4" style={{ scrollbarWidth: 'none' }}>
              {CATEGORIES.map((cat) => {
                const count = cat.key === 'all'
                  ? PRODUCTS.filter((p) => p.active).length
                  : PRODUCTS.filter((p) => p.active && p.category === cat.key).length
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all hover:scale-105 ${
                      activeCategory === cat.key
                        ? 'bg-[#EE5C13] text-white shadow-md shadow-[#EE5C13]/20'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      activeCategory === cat.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
              <div className="ml-auto shrink-0 flex items-center gap-2 text-gray-400">
                <SlidersHorizontal size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <section className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <p className="text-gray-500 text-sm">
                <span className="font-bold text-gray-800">{filtered.length}</span>{' '}
                {filtered.length === 1 ? 'produto' : 'produtos'}
                {search && <span className="text-[#EE5C13] font-medium"> para "{search}"</span>}
              </p>
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
              <div className="py-32 text-center">
                <div className="text-7xl mb-4">🔍</div>
                <h3 className="text-2xl font-black text-gray-700 mb-2">Nenhum produto encontrado</h3>
                <p className="text-gray-400 mb-8">Tente outro termo ou limpe os filtros.</p>
                <Button
                  onClick={() => { setSearch(''); setActiveCategory('all') }}
                  className="bg-[#EE5C13] hover:bg-[#d94b0d] text-white rounded-2xl px-8 font-bold"
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <SandwichBuilder product={builderProduct} open={builderOpen} onClose={() => setBuilderOpen(false)} />
    </>
  )
}
