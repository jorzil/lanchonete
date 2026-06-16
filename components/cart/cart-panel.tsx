'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trash2, Plus, Minus, Tag, Truck, Store, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart } from '@/contexts/cart-context'
import { formatCurrency, MENU } from '@/lib/store'
import { formatCartForWhatsApp, openWhatsApp } from '@/lib/whatsapp'
import { toast } from 'sonner'

function customizationSummary(c: NonNullable<import('@/lib/store').CartItem['customization']>): string {
  const parts: string[] = []
  parts.push(c.size)
  if (c.meat) { const meat = MENU.meats.find((m) => m.key === c.meat); if (meat) parts.push(meat.name) }
  if (c.cheese) { const cheese = MENU.cheeses.find((ch) => ch.key === c.cheese); if (cheese) parts.push(cheese.name) }
  if (c.salads.length > 0) parts.push(c.salads.map((s) => MENU.salads.find((sl) => sl.key === s)?.name || s).join(', '))
  if (c.sauces.length > 0) parts.push(c.sauces.map((s) => MENU.sauces.find((sc) => sc.key === s)?.name || s).join(', '))
  return parts.join(' • ')
}

export function CartPanel() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, coupon, applyCoupon, removeCoupon, deliveryFee, setDeliveryFee, subtotal, total, itemCount } = useCart()
  const [couponInput, setCouponInput] = useState('')
  const [orderType, setOrderType] = useState<'entrega' | 'retirada'>('entrega')

  const discount = coupon ? (coupon.type === 'percentage' ? subtotal * (coupon.discount / 100) : coupon.discount) : 0

  const handleApplyCoupon = () => {
    const ok = applyCoupon(couponInput)
    if (ok) { toast.success('Cupom aplicado!'); setCouponInput('') }
    else toast.error('Cupom inválido ou expirado.')
  }

  const handleOrderType = (type: 'entrega' | 'retirada') => {
    setOrderType(type)
    setDeliveryFee(type === 'entrega' ? 5.0 : 0)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-[#FAF6EE] border-l border-[#E8E0D0] text-[#0E1F3C]">
        <SheetHeader className="px-6 py-5 border-b border-[#E8E0D0]">
          <div className="flex items-center justify-between gap-4">
            <SheetTitle className="h-editorial text-[24px] text-[#0E1F3C] flex items-baseline gap-2">
              Carrinho
              {itemCount > 0 && <span className="text-[12px] font-normal text-[#8B95A8] tabular-nums font-sans">{itemCount.toString().padStart(2, '0')}</span>}
            </SheetTitle>
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <h3 className="h-editorial text-[28px] text-[#0E1F3C] mb-3">Tudo vazio por aqui</h3>
            <p className="text-[13px] text-[#8B95A8] mb-7 max-w-[240px]">Adicione subs ao carrinho para finalizar o pedido.</p>
            <Link href="/cardapio" onClick={closeCart}>
              <Button className="bg-[#0E1F3C] hover:bg-[#1a2e54] text-[#FAF6EE] rounded-full px-6 h-11">Ver cardápio</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 custom-scrollbar">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border border-[#E8E0D0] p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-[#F2ECDF] rounded-lg flex items-center justify-center text-2xl shrink-0">{item.image}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-[13.5px] font-medium text-[#0E1F3C] leading-tight">{item.name}</h4>
                        <button onClick={() => removeItem(item.id)} className="text-[#8B95A8] hover:text-[#9C3D0E] transition-colors shrink-0" aria-label="Remover">
                          <X size={14} strokeWidth={1.8} />
                        </button>
                      </div>
                      {item.customization && <p className="text-[11.5px] text-[#8B95A8] mt-1 leading-relaxed">{customizationSummary(item.customization)}</p>}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full border border-[#E8E0D0] flex items-center justify-center hover:border-[#0E1F3C] transition-colors"><Minus size={11} strokeWidth={1.8} /></button>
                          <span className="w-6 text-center text-[13px] font-medium tabular-nums">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full border border-[#E8E0D0] flex items-center justify-center hover:border-[#0E1F3C] transition-colors"><Plus size={11} strokeWidth={1.8} /></button>
                        </div>
                        <span className="text-[13.5px] font-medium text-[#0E1F3C] tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 pb-6 pt-5 border-t border-[#E8E0D0] space-y-5 bg-[#F2ECDF]">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#8B95A8] mb-2.5">Tipo de pedido</p>
                <div className="flex gap-2">
                  {(['entrega', 'retirada'] as const).map((type) => (
                    <button key={type} onClick={() => handleOrderType(type)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-[13px] font-medium transition-all ${
                        orderType === type ? 'border-[#0E1F3C] bg-white text-[#0E1F3C]' : 'border-[#E8E0D0] text-[#8B95A8] hover:border-[#0E1F3C]/40'
                      }`}>
                      {type === 'entrega' ? <Truck size={13} strokeWidth={1.8} /> : <Store size={13} strokeWidth={1.8} />}
                      {type === 'entrega' ? 'Entrega' : 'Retirada'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#8B95A8] mb-2.5">Cupom</p>
                {coupon ? (
                  <div className="flex items-center justify-between bg-white border border-[#E8E0D0] rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-emerald-700 text-[12.5px] font-medium">
                      <Tag size={13} strokeWidth={1.8} />
                      {coupon.code} ({coupon.type === 'percentage' ? `${coupon.discount}%` : formatCurrency(coupon.discount)} off)
                    </div>
                    <button onClick={removeCoupon} className="text-[#8B95A8] hover:text-[#9C3D0E] text-[11px]">Remover</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input placeholder="Digite seu cupom" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()} className="flex-1 text-[13px] bg-white border-[#E8E0D0] text-[#0E1F3C] placeholder:text-[#8B95A8] focus-visible:ring-1 focus-visible:ring-[#0E1F3C] focus-visible:ring-offset-0" />
                    <Button onClick={handleApplyCoupon} variant="outline" className="border-[#0E1F3C] text-[#0E1F3C] hover:bg-[#0E1F3C] hover:text-[#FAF6EE] text-[12.5px] bg-transparent">Aplicar</Button>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between text-[#3D4D6A]"><span>Subtotal</span><span className="tabular-nums">{formatCurrency(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-emerald-700"><span>Desconto</span><span className="tabular-nums">-{formatCurrency(discount)}</span></div>}
                <div className="flex justify-between text-[#3D4D6A]"><span>Entrega</span><span className="tabular-nums">{deliveryFee === 0 ? 'Grátis' : formatCurrency(deliveryFee)}</span></div>
                <div className="h-px bg-[#E8E0D0] my-2" />
                <div className="flex justify-between items-baseline">
                  <span className="text-[#0E1F3C] font-medium">Total</span>
                  <span className="h-editorial text-[#0E1F3C] text-[26px] tabular-nums">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Link href="/checkout" onClick={closeCart} className="block">
                  <Button className="w-full bg-[#0E1F3C] hover:bg-[#1a2e54] text-[#FAF6EE] font-medium py-6 rounded-full text-[14px]">Finalizar pedido</Button>
                </Link>
                <Button onClick={() => { if (items.length === 0) return; openWhatsApp(formatCartForWhatsApp(items, total)) }} variant="outline" className="w-full border-[#E8E0D0] text-[#0E1F3C] hover:bg-white rounded-full font-medium bg-transparent">
                  Pedir pelo WhatsApp
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
