'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SandwichBuilder } from '@/components/builder/sandwich-builder'
import { useCart } from '@/contexts/cart-context'
import { PRODUCTS, formatCurrency, type Product } from '@/lib/store'
import { toast } from 'sonner'

const CATEGORIES = [
  { key: 'all', label: 'Todos' },
  { key: 'subs-15cm', label: 'Subs 15cm' },
  { key: 'subs-30cm', label: 'Subs 30cm' },
  { key: 'combos', label: 'Combos' },
  { key: 'bebidas', label: 'Bebidas' },
]

function ProductCard({ product, onCustomize, onAdd }: { product: Product; onCustomize: (p: Product) => void; onAdd: (p: Product) => void }) {
  const isSub = product.category === 'subs-15cm' || product.category === 'subs-30cm'
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex flex-col">
      <div className="h-44 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center text-8xl group-hover:scale-110 transition-transform duration-300">{product.image}</div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <span className="text-xs font-medium text-[#EE5C13] bg-orange-50 px-2 py-0.5 rounded-full mb-2 inline-block">
            {CATEGORIES.find((c) => c.key === product.category)?.label}
          </span>
          <h3 className="font-bold text-gray-800 text-base leading-tight mb-2">{product.name}</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">{product.description}</p>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <span className="text-[#EE5C13] font-black text-2xl">{formatCurrency(product.price)}</span>
          <Button onClick={() => isSub ? onCustomize(product) : onAdd(product)}
            className="bg-[#EE5C13] hover:bg-[#d94b0d] text-white rounded-full px-5 font-semibold transition-all hover:scale-105">
            {isSub ? '🥖 Personalizar' : '+ Adicionar'}
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
        <section className="bg-gradient-to-br from-[#023E74] to-[#0359A2] py-16 text-white text-center">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-5xl mb-4">🥖</div>
            <h1 className="text-4xl sm:text-5xl font-black mb-4">Nosso <span className="text-[#EE5C13]">Cardápio</span></h1>
            <p className="text-white/80 text-lg">Escolha e personalize seu sub do seu jeito. Ingredientes frescos, sabor garantido.</p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Buscar no cardápio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 rounded-full border-gray-200 focus:border-[#EE5C13]" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map((cat) => (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
                className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                  activeCategory === cat.key ? 'bg-[#EE5C13] text-white shadow-md scale-105' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#EE5C13] hover:text-[#EE5C13]'
                }`}>
                {cat.label}
                <span className="ml-1.5 text-xs opacity-70">({PRODUCTS.filter((p) => p.active && (cat.key === 'all' || p.category === cat.key)).length})</span>
              </button>
            ))}
          </div>

          <p className="text-gray-500 text-sm mb-6">
            {filtered.length} {filtered.length === 1 ? 'produto encontrado' : 'produtos encontrados'}{search && ` para "${search}"`}
          </p>

          {filtered.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product}
                  onCustomize={(p) => { setBuilderProduct(p); setBuilderOpen(true) }}
                  onAdd={handleAdd}
                />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-400 mb-6">Tente buscar por outro termo ou categoria.</p>
              <Button onClick={() => { setSearch(''); setActiveCategory('all') }} className="bg-[#EE5C13] hover:bg-[#d94b0d] text-white rounded-full">Limpar filtros</Button>
            </div>
          )}
        </section>
      </main>
      <Footer />
      <SandwichBuilder product={builderProduct} open={builderOpen} onClose={() => setBuilderOpen(false)} />
    </>
  )
}
