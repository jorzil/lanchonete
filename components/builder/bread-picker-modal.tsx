'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MENU, formatCurrency, type Product } from '@/lib/data'
import { useCart } from '@/contexts/cart-context'
import { toast } from 'sonner'

const SIZES = [
  { key: '15cm', label: '15cm', price: 21.9, description: 'Perfeito para um lanche individual' },
  { key: '30cm', label: '30cm', price: 37.9, description: 'Ideal para quem tem mais fome' },
]

interface BreadPickerModalProps {
  product: Product | null
  onClose: () => void
}

export function BreadPickerModal({ product, onClose }: BreadPickerModalProps) {
  const [size, setSize] = useState<string>('')
  const [bread, setBread] = useState<string>('')
  const { addItem } = useCart()

  if (!product) return null

  const selectedSize = SIZES.find(s => s.key === size)
  const price = selectedSize?.price ?? product.price

  function handleAdd() {
    if (!size) { toast.error('Escolha o tamanho.'); return }
    if (!bread) { toast.error('Escolha o tipo de pão.'); return }
    const breadObj = MENU.breads.find(b => b.key === bread)
    addItem({
      productId: product!.id,
      name: `${product!.name} ${size}`,
      price,
      quantity: 1,
      image: product!.image,
      notes: `Pão: ${breadObj?.name}`,
    })
    toast.success(`${product!.name} ${size} adicionado!`)
    setSize('')
    setBread('')
    onClose()
  }

  return (
    <Dialog open={!!product} onOpenChange={() => { setSize(''); setBread(''); onClose() }}>
      <DialogContent className="max-w-sm bg-[#0B2C5C] border border-white/10 text-white">
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
                onClick={() => setSize(s.key)}
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

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <span className="text-xl font-black text-white">{formatCurrency(price)}</span>
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
