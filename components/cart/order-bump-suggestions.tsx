'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { formatCurrency } from '@/lib/store'
import { fetchEffectiveCatalog, availableByCategory, isAvailable, type EffectiveCatalog } from '@/lib/effective-products'
import { fetchOrderBumps, logBumpAdd, type OrderBumpOffer } from '@/lib/order-bumps'
import type { Product } from '@/lib/data'
import { toast } from 'sonner'

/** Sugestões de order bump. variant 'light' (carrinho) ou 'dark' (checkout). */
export function OrderBumpSuggestions({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { items, addItem } = useCart()
  const [catalog, setCatalog] = useState<EffectiveCatalog>({ products: [], disabled: new Set() })
  const [offers, setOffers] = useState<OrderBumpOffer[]>([])
  const [picks, setPicks] = useState<Record<string, string>>({})

  useEffect(() => {
    // Catálogo vigente (edições do admin + indisponíveis do dia): sem isto a
    // sugestão oferecia produto que já tinha saído do cardápio.
    fetchEffectiveCatalog().then(setCatalog)
    fetchOrderBumps().then((c) => setOffers(c.offers))
  }, [])

  const suggestions = useMemo(() => {
    const inCart = new Set(items.map((i) => i.productId))
    const out: { offer: OrderBumpOffer; products: Product[] }[] = []
    for (const o of offers.filter((x) => x.enabled)) {
      if (o.category) {
        const list = availableByCategory(catalog, o.category, o.productIds).filter((p) => !inCart.has(p.id))
        if (list.length > 0) out.push({ offer: o, products: list })
      } else if (o.productId) {
        const p = catalog.products.find((x) => x.id === o.productId)
        if (p && isAvailable(p, catalog.disabled) && !inCart.has(p.id)) out.push({ offer: o, products: [p] })
      }
    }
    return out
  }, [items, catalog, offers])

  function addBump(offer: OrderBumpOffer, products: Product[]) {
    const chosenId = offer.category ? (picks[offer.id] ?? products[0]?.id) : products[0]?.id
    const product = products.find((p) => p.id === chosenId) ?? products[0]
    if (!product) return
    addItem({ productId: product.id, name: product.name, price: offer.bumpPrice, quantity: 1, image: product.image })
    logBumpAdd(product.id)
    toast.success(`${product.name} adicionado por ${formatCurrency(offer.bumpPrice)}!`)
  }

  if (suggestions.length === 0) return null

  const dark = variant === 'dark'
  const wrap = dark
    ? 'rounded-2xl border border-brand/30 bg-white/5 p-4'
    : 'rounded-xl border-2 border-dashed border-brand/30 bg-orange-50/40 p-3'
  const row = dark
    ? 'flex items-center gap-3 bg-white/5 rounded-lg border border-white/10 p-2'
    : 'flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-2'
  const nameCls = dark ? 'text-white' : 'text-gray-900'
  // 'appearance-none' é obrigatório: sem ele o Chrome pinta o select com o
  // widget nativo (fundo branco), ignorando o bg-transparent — era o que
  // deixava o bloco com cara de fora do lugar no checkout escuro.
  const selectBase =
    // 16px no celular: abaixo disso o iOS dá zoom ao tocar e não desfaz.
    'w-full appearance-none text-[16px] md:text-[13px] font-bold rounded-md pl-1.5 pr-6 py-1 outline-none cursor-pointer transition-colors'
  const selectCls = dark
    ? `${selectBase} text-white bg-white/10 border border-white/15 hover:border-white/30 focus:border-brand [&>option]:bg-navy [&>option]:text-white`
    : `${selectBase} text-gray-900 bg-white border border-gray-200 hover:border-gray-300 focus:border-brand`

  return (
    <div className={wrap}>
      <p className="text-xs font-black text-brand uppercase tracking-widest mb-2">😋 Aproveite e adicione</p>
      <div className="space-y-2">
        {suggestions.map(({ offer, products }) => {
          const isCategory = !!offer.category
          const selectedId = isCategory ? (picks[offer.id] ?? products[0].id) : products[0].id
          const selected = products.find((p) => p.id === selectedId) ?? products[0]
          const hasDiscount = offer.bumpPrice < selected.price
          return (
            <div key={offer.id} className={row}>
              <div className="w-10 h-10 bg-gradient-to-br from-[#FFF5EB] to-[#FFE8D6] rounded-lg flex items-center justify-center text-xl shrink-0">{selected.image}</div>
              <div className="flex-1 min-w-0">
                {isCategory ? (
                  <div className="relative">
                    <select value={selectedId} onChange={(e) => setPicks((prev) => ({ ...prev, [offer.id]: e.target.value }))} className={selectCls}>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <ChevronDown
                      size={13}
                      className={`pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 ${dark ? 'text-white/60' : 'text-gray-400'}`}
                    />
                  </div>
                ) : (
                  <p className={`text-[13px] font-bold truncate ${nameCls}`}>{selected.name}</p>
                )}
                <p className="text-sm mt-0.5">
                  {hasDiscount && <span className={`line-through mr-1.5 text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>{formatCurrency(selected.price)}</span>}
                  <span className="text-brand font-black">{formatCurrency(offer.bumpPrice)}</span>
                </p>
              </div>
              <button onClick={() => addBump(offer, products)} className="flex items-center gap-1 bg-brand hover:bg-brand-hover text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors shrink-0">
                <Plus size={13} /> Adicionar
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
