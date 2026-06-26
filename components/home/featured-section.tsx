'use client'

import { useState, useMemo, memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowRight } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { PRODUCTS, formatCurrency, type Product } from '@/lib/data'
import { toast } from 'sonner'

const SandwichBuilder = dynamic(
  () => import('@/components/builder/sandwich-builder').then(m => ({ default: m.SandwichBuilder })),
  { ssr: false }
)

const FEATURED = PRODUCTS.filter(p => p.active && (p.category === 'subs-15cm' || p.category === 'subs-30cm')).slice(0, 4)

const ProductCard = memo(function ProductCard({ product, onCustomize, onAdd }: {
  product: Product
  onCustomize: (p: Product) => void
  onAdd: (p: Product) => void
}) {
  const isSub = product.category === 'subs-15cm' || product.category === 'subs-30cm'
  return (
    <div className="group flex flex-col bg-navy-surface rounded-2xl overflow-hidden border border-white/8 hover:border-brand/45 hover:shadow-[0_12px_40px_rgba(238,92,19,0.12)] transition-all duration-300">
      <div className="relative aspect-[4/3] overflow-hidden bg-navy-deep">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill loading="lazy" className="object-cover card-img" sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,280px" />
        ) : (
          <div className="h-full flex items-center justify-center text-5xl">{product.image}</div>
        )}
        {product.badge && (
          <span className="absolute top-3 left-3 bg-brand text-white text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full">
            {product.badge.label.replace(/[^\w\s]/g, '').trim()}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-white text-[14.5px] leading-snug mb-1">{product.name}</h3>
        <p className="text-white/45 text-[12.5px] leading-relaxed line-clamp-2 flex-1">{product.description}</p>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/8">
          <div>
            <p className="text-[9.5px] text-white/30 font-medium uppercase tracking-wider mb-0.5">a partir de</p>
            <p className="text-[17px] font-bold text-white leading-none tabular-nums">{formatCurrency(product.price)}</p>
          </div>
          <button
            onClick={() => isSub ? onCustomize(product) : onAdd(product)}
            className="flex items-center gap-1 bg-brand hover:bg-brand-hover text-white text-[12px] font-bold px-4 py-2 rounded-full transition-colors"
          >
            {isSub ? 'Montar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
})

export function FeaturedSection() {
  const [builderProduct, setBuilderProduct] = useState<Product | undefined>()
  const [builderOpen, setBuilderOpen] = useState(false)
  const { addItem } = useCart()

  const handleCustomize = useMemo(() => (pr: Product) => { setBuilderProduct(pr); setBuilderOpen(true) }, [])
  const handleAdd = useMemo(() => (pr: Product) => {
    addItem({ productId: pr.id, name: pr.name, price: pr.price, quantity: 1, image: pr.image })
    toast.success(`${pr.name} adicionado!`)
  }, [addItem])

  return (
    <section className="bg-navy py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5 mb-12">
          <div>
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.22em] mb-3">Mais pedidos</p>
            <h2 className="font-display font-extrabold text-white text-[2.2rem] sm:text-[2.8rem] leading-[0.98] tracking-[-0.04em]">
              Os subs queridos<br />pela galera.
            </h2>
          </div>
          <Link href="/cardapio" className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-white/55 hover:text-white transition-colors">
            Ver cardápio completo <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURED.map(p => (
            <ProductCard key={p.id} product={p} onCustomize={handleCustomize} onAdd={handleAdd} />
          ))}
        </div>
      </div>
      <SandwichBuilder product={builderProduct} open={builderOpen} onClose={() => setBuilderOpen(false)} />
    </section>
  )
}
