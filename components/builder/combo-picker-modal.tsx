'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PRODUCTS, formatCurrency, type Product } from '@/lib/data'
import { useCart } from '@/contexts/cart-context'
import { toast } from 'sonner'

const COOKIES = PRODUCTS.filter(p => p.active && p.category === 'cookies')
const LATAS = PRODUCTS.filter(p => p.active && p.category === 'bebidas' && p.id.includes('lata'))

interface ComboPickerModalProps {
  product: Product | null
  onClose: () => void
}

export function ComboPickerModal({ product, onClose }: ComboPickerModalProps) {
  const [cookie, setCookie] = useState<string>('')
  const [refri, setRefri] = useState<string>('')
  const { addItem } = useCart()

  if (!product) return null

  function handleClose() {
    setCookie('')
    setRefri('')
    onClose()
  }

  function handleAdd() {
    if (!cookie) { toast.error('Escolha o cookie.'); return }
    if (!refri) { toast.error('Escolha o refrigerante.'); return }
    const cookieObj = COOKIES.find(c => c.id === cookie)
    const refriObj = LATAS.find(r => r.id === refri)
    addItem({
      productId: product!.id,
      name: product!.name,
      price: product!.price,
      quantity: 1,
      image: product!.image,
      notes: `Cookie: ${cookieObj?.name} | Refri: ${refriObj?.name}`,
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

        {/* Cookie */}
        <div className="mt-2">
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
                <p className="text-[13px] font-bold text-white flex-1">{c.name}</p>
                {cookie === c.id && (
                  <span className="ml-auto h-4 w-4 rounded-full bg-brand flex items-center justify-center">
                    <span className="text-white text-[9px] font-black">✓</span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Refrigerante */}
        <div className="mt-4">
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.18em] mb-3">Escolha o refrigerante (lata 350ml)</p>
          <div className="space-y-2">
            {LATAS.map(r => (
              <button
                key={r.id}
                onClick={() => setRefri(r.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  refri === r.id ? 'border-brand bg-brand/10' : 'border-white/10 hover:border-white/25 bg-white/5'
                }`}
              >
                <span className="text-2xl">🥤</span>
                <p className="text-[13px] font-bold text-white flex-1">{r.name}</p>
                {refri === r.id && (
                  <span className="ml-auto h-4 w-4 rounded-full bg-brand flex items-center justify-center">
                    <span className="text-white text-[9px] font-black">✓</span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-[10px] text-white/30 font-bold uppercase">Total</p>
            <p className="text-xl font-black text-white">{formatCurrency(product.price)}</p>
            <p className="text-[10px] text-green-400">5% de desconto incluído</p>
          </div>
          <Button
            onClick={handleAdd}
            disabled={!cookie || !refri}
            className="bg-brand hover:bg-brand-hover text-white font-black px-6 disabled:opacity-40"
          >
            Adicionar ao carrinho
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
