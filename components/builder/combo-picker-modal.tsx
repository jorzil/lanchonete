'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PRODUCTS, MENU, formatCurrency, effectivePrice, type Product } from '@/lib/data'
import { useCart } from '@/contexts/cart-context'
import { fetchDisabledIngredients, ingKey } from '@/lib/ingredients-availability'
import { fetchDisabledProducts } from '@/lib/products-availability'
import { toast } from 'sonner'

const ALL_COOKIES = PRODUCTS.filter(p => p.active && p.category === 'cookies')
// Bebidas do combo: latas 350ml + sucos
const ALL_LATAS = PRODUCTS.filter(p => p.active && p.category === 'bebidas' && (p.id.includes('lata') || p.id.includes('suco')))

interface ComboPickerModalProps {
  product: Product | null
  onClose: () => void
}

export function ComboPickerModal({ product, onClose }: ComboPickerModalProps) {
  const [bread, setBread] = useState<string>('')
  const [cookie, setCookie] = useState<string>('')
  const [refri, setRefri] = useState<string>('')
  const [disabled, setDisabled] = useState<Set<string>>(new Set())
  const [disabledProducts, setDisabledProducts] = useState<Set<string>>(new Set())
  const { addItem } = useCart()

  useEffect(() => {
    if (product) {
      fetchDisabledIngredients().then(setDisabled)
      fetchDisabledProducts().then(setDisabledProducts)
    }
  }, [product])

  // Itens do combo: padrão cookie + refri; combos "lanche + refri" trazem só refri
  const wantsCookie = !product?.comboItems || product.comboItems.includes('cookie')
  const wantsRefri = !product?.comboItems || product.comboItems.includes('refri')

  const availBreads = useMemo(() => MENU.breads.filter((b) => !disabled.has(ingKey('bread', b.key))), [disabled])
  const COOKIES = useMemo(
    () => (wantsCookie ? ALL_COOKIES.filter((c) => !disabledProducts.has(c.id)) : []),
    [disabledProducts, wantsCookie]
  )
  const LATAS = useMemo(
    () => (wantsRefri ? ALL_LATAS.filter((r) => !disabledProducts.has(r.id)) : []),
    [disabledProducts, wantsRefri]
  )

  if (!product) return null

  function handleClose() {
    setBread('')
    setCookie('')
    setRefri('')
    onClose()
  }

  function handleAdd() {
    if (!bread) { toast.error('Escolha o pão.'); return }
    // Cookie/bebida só são obrigatórios se houver opção disponível (não esgotada)
    if (COOKIES.length > 0 && !cookie) { toast.error('Escolha o cookie.'); return }
    if (LATAS.length > 0 && !refri) { toast.error('Escolha a bebida.'); return }
    const breadObj = MENU.breads.find(b => b.key === bread)
    const cookieObj = COOKIES.find(c => c.id === cookie)
    const refriObj = LATAS.find(r => r.id === refri)
    const parts = [
      `Pão: ${breadObj?.name}`,
      cookieObj ? `Cookie: ${cookieObj.name}` : null,
      refriObj ? `Refri: ${refriObj.name}` : null,
    ].filter(Boolean)
    addItem({
      productId: product!.id,
      name: product!.name,
      price: effectivePrice(product!),
      quantity: 1,
      image: product!.image,
      notes: parts.join(' | '),
    })
    toast.success(`${product!.name} adicionado!`)
    handleClose()
  }

  return (
    <Dialog open={!!product} onOpenChange={() => handleClose()}>
      <DialogContent className="max-w-sm bg-[#0B2C5C] border border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-black">{product.name}</DialogTitle>
          <p className="text-white/40 text-[13px] mt-1">{product.description}</p>
        </DialogHeader>

        {/* Pão */}
        <div className="mt-2">
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.18em] mb-3">Escolha o pão do sub</p>
          <div className="space-y-2">
            {availBreads.map(b => (
              <button
                key={b.key}
                onClick={() => setBread(b.key)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  bread === b.key ? 'border-brand bg-brand/10' : 'border-white/10 hover:border-white/25 bg-white/5'
                }`}
              >
                <span className="text-2xl">{b.emoji}</span>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-white">{b.name}</p>
                  <p className="text-[11px] text-white/40">{b.description}</p>
                </div>
                {bread === b.key && (
                  <span className="ml-auto h-4 w-4 rounded-full bg-brand flex items-center justify-center">
                    <span className="text-white text-[9px] font-black">✓</span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cookie (some quando não há cookie disponível) */}
        {COOKIES.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.18em] mb-3">Escolha o cookie</p>
          <div className="space-y-2">
            {COOKIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCookie(c.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  cookie === c.id ? 'border-brand bg-brand/10' : 'border-white/10 hover:border-white/25 bg-white/5'
                }`}
              >
                <span className="text-2xl">🍪</span>
                <p className="text-[13px] font-bold text-white flex-1 min-w-0">{c.name}</p>
                {cookie === c.id && (
                  <span className="ml-auto h-4 w-4 rounded-full bg-brand flex items-center justify-center">
                    <span className="text-white text-[9px] font-black">✓</span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Bebida (some quando não há bebida disponível) */}
        {LATAS.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.18em] mb-3">Escolha a bebida</p>
          <div className="space-y-2">
            {LATAS.map(r => (
              <button
                key={r.id}
                onClick={() => setRefri(r.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  refri === r.id ? 'border-brand bg-brand/10' : 'border-white/10 hover:border-white/25 bg-white/5'
                }`}
              >
                <span className="text-2xl">{r.image}</span>
                <p className="text-[13px] font-bold text-white flex-1 min-w-0">{r.name}</p>
                {refri === r.id && (
                  <span className="ml-auto h-4 w-4 rounded-full bg-brand flex items-center justify-center">
                    <span className="text-white text-[9px] font-black">✓</span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between mt-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-[10px] text-white/30 font-bold uppercase">Total</p>
            {effectivePrice(product) < product.price ? (
              <div className="flex items-baseline gap-2">
                <p className="text-sm text-white/35 line-through">{formatCurrency(product.price)}</p>
                <p className="text-xl font-black text-emerald-400">{formatCurrency(effectivePrice(product))}</p>
              </div>
            ) : (
              <p className="text-xl font-black text-white">{formatCurrency(product.price)}</p>
            )}
            <p className="text-[10px] text-green-400">5% de desconto incluído</p>
          </div>
          <Button
            onClick={handleAdd}
            disabled={!bread || (COOKIES.length > 0 && !cookie) || (LATAS.length > 0 && !refri)}
            className="bg-brand hover:bg-brand-hover text-white font-black px-6 disabled:opacity-40 w-full sm:w-auto"
          >
            Adicionar ao carrinho
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
