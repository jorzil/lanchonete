'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MENU, formatCurrency, type Product } from '@/lib/data'
import { useCart } from '@/contexts/cart-context'
import { toast } from 'sonner'

interface BreadPickerModalProps {
  product: Product | null
  onClose: () => void
}

export function BreadPickerModal({ product, onClose }: BreadPickerModalProps) {
  const [selected, setSelected] = useState<string>('')
  const { addItem } = useCart()

  if (!product) return null

  function handleAdd() {
    if (!selected) { toast.error('Escolha o tipo de pão.'); return }
    const bread = MENU.breads.find(b => b.key === selected)
    addItem({
      productId: product!.id,
      name: product!.name,
      price: product!.price,
      quantity: 1,
      image: product!.image,
      notes: `Pão: ${bread?.name}`,
    })
    toast.success(`${product!.name} adicionado!`)
    setSelected('')
    onClose()
  }

  return (
    <Dialog open={!!product} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-[#0B2C5C] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-black">{product.name}</DialogTitle>
          <p className="text-white/40 text-[13px] mt-1">{product.description}</p>
        </DialogHeader>

        <div className="mt-2">
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.18em] mb-3">Escolha o pão</p>
          <div className="space-y-2">
            {MENU.breads.map(bread => (
              <button
                key={bread.key}
                onClick={() => setSelected(bread.key)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  selected === bread.key
                    ? 'border-brand bg-brand/10'
                    : 'border-white/10 hover:border-white/25 bg-white/5'
                }`}
              >
                <span className="text-2xl">{bread.emoji}</span>
                <div>
                  <p className="text-[13px] font-bold text-white">{bread.name}</p>
                  <p className="text-[11px] text-white/40">{bread.description}</p>
                </div>
                {selected === bread.key && (
                  <span className="ml-auto h-4 w-4 rounded-full bg-brand flex items-center justify-center">
                    <span className="text-white text-[9px] font-black">✓</span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <span className="text-xl font-black text-white">{formatCurrency(product.price)}</span>
          <Button
            onClick={handleAdd}
            disabled={!selected}
            className="bg-brand hover:bg-brand-hover text-white font-black px-6 disabled:opacity-40"
          >
            Adicionar ao carrinho
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
