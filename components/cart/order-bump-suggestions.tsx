'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { formatCurrency, PRODUCTS } from '@/lib/store'
import { fetchDisabledProducts } from '@/lib/products-availability'
import { fetchOrderBumps, logBumpAdd, type OrderBumpOffer } from '@/lib/order-bumps'
import { toast } from 'sonner'

const PRODUCT_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]))

/** Sugestões de order bump. variant 'light' (carrinho) ou 'dark' (checkout). */
export function OrderBumpSuggestions({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { items, addItem } = useCart()
  const [disabledProducts, setDisabledProducts] = useState<Set<string>>(new Set())
  const [offers, setOffers] = useState<OrderBumpOffer[]>([])
  const [picks, setPicks] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchDisabledProducts().then(setDisabledProducts)
    fetchOrderBumps().then((c) => setOffers(c.offers))
  }, [])

  const suggestions = useMemo(() => {
    const inCart = new Set(items.map((i) => i.productId))
    const avail = (p: typeof PRODUCTS[number]) => p.active && !disabledProducts.has(p.id) && !inCart.has(p.id)
    const out: { offer: OrderBumpOffer; products: typeof PRODUCTS }[] = []
    for (const o of offers.filter((x) => x.enabled)) {
      if (o.category) {
        const allow = o.productIds && o.productIds.length > 0 ? new Set(o.productIds) : null
        const list = PRODUCTS.filter((p) => p.category === o.category && (!allow || allow.has(p.id)) && avail(p))
        if (list.length > 0) out.push({ offer: o, products: list })
      } else if (o.productId) {
        const p = PRODUCT_BY_ID.get(o.productId)
        if (p && avail(p)) out.push({ offer: o, products: [p] })
      }
    }
    return out
  }, [items, disabledProducts, offers])

  function addBump(offer: OrderBumpOffer, products: typeof PRODUCTS) {
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
  const selectCls = dark
    ? 'w-full text-[13px] font-bold text-white bg-transparent border border-white/15 rounded-md px-1.5 py-1 outline-none focus:border-brand [&>option]:text-black'
    : 'w-full text-[13px] font-bold text-gray-900 bg-transparent border border-gray-200 rounded-md px-1.5 py-1 outline-none focus:border-brand'

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
                  <select value={selectedId} onChange={(e) => setPicks((prev) => ({ ...prev, [offer.id]: e.target.value }))} className={selectCls}>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
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
