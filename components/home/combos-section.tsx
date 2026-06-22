'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { PRODUCTS, formatCurrency } from '@/lib/data'
import { toast } from 'sonner'

const COMBOS = PRODUCTS.filter(p => p.active && p.category === 'combos')

export function CombosSection() {
  const { addItem } = useCart()

  return (
    <section className="bg-navy py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5 mb-12">
          <div>
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.22em] mb-3">Combos</p>
            <h2 className="font-display font-extrabold text-white text-[2.2rem] sm:text-[2.8rem] leading-[0.98] tracking-[-0.04em]">
              Mais sabor<br />pelo mesmo preço.
            </h2>
          </div>
          <Link href="/cardapio?cat=combos" className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-white/55 hover:text-white transition-colors">
            Ver todos <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {COMBOS.map((combo, i) => (
            <article key={combo.id} className={`relative rounded-2xl overflow-hidden border border-white/8 hover:border-brand/40 hover:shadow-[0_12px_40px_rgba(238,92,19,0.12)] transition-all duration-300 ${i === 0 ? 'sm:col-span-2' : ''}`}>
              <div className={`relative overflow-hidden bg-navy-surface ${i === 0 ? 'aspect-[16/8]' : 'aspect-[4/3]'}`}>
                {combo.imageUrl && (
                  <Image src={combo.imageUrl} alt={combo.name} fill loading="lazy" className="object-cover card-img"
                    sizes="(max-width:640px) 100vw, (max-width:1024px) 66vw, 50vw" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/25 to-transparent" />
                {combo.badge && (
                  <span className="absolute top-3 left-3 bg-brand text-white text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full">
                    {combo.badge.label.replace(/[^\w\s]/g, '').trim()}
                  </span>
                )}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-[18px] leading-tight">{combo.name}</p>
                    <p className="text-white/65 text-[12.5px] mt-1 line-clamp-1">{combo.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-white font-display font-extrabold text-[22px] tabular-nums leading-none tracking-[-0.03em]">{formatCurrency(combo.price)}</p>
                    <button
                      onClick={() => { addItem({ productId: combo.id, name: combo.name, price: combo.price, quantity: 1, image: combo.image }); toast.success(`${combo.name} adicionado!`) }}
                      className="bg-brand hover:bg-brand-hover text-white text-[12px] font-bold px-4 py-2 rounded-full transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
