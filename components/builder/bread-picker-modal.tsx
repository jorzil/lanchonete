'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MENU, formatCurrency, type Product } from '@/lib/data'
import { useCart } from '@/contexts/cart-context'
import { toast } from 'sonner'
import { Plus, Minus } from 'lucide-react'

const SIZES = [
  { key: '15cm', label: '15cm', price: 27.9, description: 'Perfeito para um lanche individual' },
  { key: '30cm', label: '30cm', price: 52.9, description: 'Ideal para quem tem mais fome' },
]

const EXTRA_EMOJIS: Record<string, string> = {
  'bacon': '🥓',
  'peito-peru': '🍖',
  'salaminho-italiano': '🍕',
  'queijo-parmesao': '🧀',
  'presunto': '🥩',
  'cebola-caramelizada': '🧅',
}

interface BreadPickerModalProps {
  product: Product | null
  onClose: () => void
}

export function BreadPickerModal({ product, onClose }: BreadPickerModalProps) {
  const [size, setSize] = useState<string>('')
  const [bread, setBread] = useState<string>('')
  const [extras, setExtras] = useState<Record<string, number>>({})
  const { addItem } = useCart()

  if (!product) return null

  const selectedSize = SIZES.find(s => s.key === size)
  const basePrice = selectedSize?.price ?? product.price
  const extrasTotal = Object.entries(extras).reduce((sum, [key, qty]) => {
    const extra = MENU.extras.find(e => e.key === key)
    if (!extra || qty === 0) return sum
    return sum + (size === '15cm' ? extra.price15cm : extra.price30cm) * qty
  }, 0)
  const total = basePrice + extrasTotal

  function changeExtra(key: string, delta: number) {
    setExtras(prev => ({ ...prev, [key]: Math.max(0, (prev[key] ?? 0) + delta) }))
  }

  function handleClose() {
    setSize('')
    setBread('')
    setExtras({})
    onClose()
  }

  function handleAdd() {
    if (!size) { toast.error('Escolha o tamanho.'); return }
    if (!bread) { toast.error('Escolha o tipo de pão.'); return }
    const breadObj = MENU.breads.find(b => b.key === bread)
    const activeExtras = Object.fromEntries(Object.entries(extras).filter(([, q]) => q > 0))
    addItem({
      productId: product!.id,
      name: `${product!.name} ${size}`,
      price: total,
      quantity: 1,
      image: product!.image,
      notes: `Pão: ${breadObj?.name}`,
      customization: Object.keys(activeExtras).length > 0
        ? { size: size as '15cm' | '30cm', bread, meat: '', cheeses: [], salads: [], sauces: [], extras: activeExtras, notes: '' }
        : undefined,
    })
    toast.success(`${product!.name} ${size} adicionado!`)
    handleClose()
  }

  const hasExtras = Object.values(extras).some(q => q > 0)

  return (
    <Dialog open={!!product} onOpenChange={() => handleClose()}>
      <DialogContent className="max-w-sm bg-[#0B2C5C] border border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-black">{product.name}</DialogTitle>
          <p className="text-white/40 text-[13px] mt-1">{product.description}</p>
        </DialogHeader>

        {/* Tamanho */}
        <div className="mt-2">
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.18em] mb-3">Escolha o tamanho</p>
          <div className="grid grid-cols-2 gap-2">
            {SIZES.map(s => (
              <button
                key={s.key}
                onClick={() => { setSize(s.key); setExtras({}) }}
                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                  size === s.key ? 'border-brand bg-brand/10' : 'border-white/10 hover:border-white/25 bg-white/5'
                }`}
              >
                <span className="text-[18px] font-black text-white">{s.label}</span>
                <span className="text-[12px] font-bold text-brand mt-0.5">{formatCurrency(s.price)}</span>
                <span className="text-[10px] text-white/35 mt-0.5 text-center">{s.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pão */}
        <div className="mt-4">
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.18em] mb-3">Escolha o pão</p>
          <div className="space-y-2">
            {MENU.breads.map(b => (
              <button
                key={b.key}
                onClick={() => setBread(b.key)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  bread === b.key ? 'border-brand bg-brand/10' : 'border-white/10 hover:border-white/25 bg-white/5'
                }`}
              >
                <span className="text-2xl">{b.emoji}</span>
                <div>
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

        {/* Turbinar */}
        <div className="mt-4">
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.18em] mb-1">⚡ Turbinar seu sub</p>
          <p className="text-[11px] text-white/30 mb-3">Adicionais opcionais</p>
          <div className="space-y-2">
            {MENU.extras.map(extra => {
              const qty = extras[extra.key] ?? 0
              const price = size === '30cm' ? extra.price30cm : extra.price15cm
              return (
                <div
                  key={extra.key}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    qty > 0 ? 'border-brand bg-brand/10' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <span className="text-xl shrink-0">{EXTRA_EMOJIS[extra.key] || '➕'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white leading-tight">{extra.name}</p>
                    <p className="text-[11px] text-brand font-bold">+{formatCurrency(price)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => changeExtra(extra.key, -1)}
                      disabled={qty === 0}
                      className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:border-brand hover:text-brand disabled:opacity-25 transition-all"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="w-4 text-center font-black text-white text-sm">{qty}</span>
                    <button
                      onClick={() => changeExtra(extra.key, 1)}
                      className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-white hover:bg-orange-600 transition-all"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-[10px] text-white/30 font-bold uppercase">Total</p>
            <p className="text-xl font-black text-white">{formatCurrency(total)}</p>
            {hasExtras && <p className="text-[10px] text-brand">inclui extras</p>}
          </div>
          <Button
            onClick={handleAdd}
            disabled={!size || !bread}
            className="bg-brand hover:bg-brand-hover text-white font-black px-6 disabled:opacity-40"
          >
            Adicionar ao carrinho
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
