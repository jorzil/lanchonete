'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trash2, Plus, Minus, ShoppingBag, Tag, Truck, Store } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
    if (ok) { toast.success('Cupom aplicado com sucesso!'); setCouponInput('') }
    else toast.error('Cupom inválido ou expirado.')
  }

  const handleOrderType = (type: 'entrega' | 'retirada') => {
    setOrderType(type)
    setDeliveryFee(type === 'entrega' ? 5.0 : 0)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-[#0A0A0A] border-white/8 text-white">
        <SheetHeader className="px-6 py-4 border-b border-white/8 bg-[#141414]">
          <SheetTitle className="text-white flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#EE5C13]" />
            Meu Carrinho
            {itemCount > 0 && <Badge className="ml-2 bg-[#EE5C13] text-white border-0">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</Badge>}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="text-7xl mb-4">🥖</div>
            <h3 className="text-xl font-bold text-white mb-2">Seu carrinho está vazio</h3>
            <p className="text-white/35 mb-6">Adicione subs deliciosos ao seu pedido!</p>
            <Link href="/cardapio" onClick={closeCart}>
              <Button className="bg-[#EE5C13] hover:bg-[#ff6b1a] text-white rounded-full px-6 shadow-[0_0_30px_rgba(238,92,19,0.3)]">Ver Cardápio</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
              {items.map((item) => (
                <div key={item.id} className="bg-[#141414] rounded-xl border border-white/6 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center text-2xl shrink-0">{item.image}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-sm leading-tight">{item.name}</h4>
                      {item.customization && <p className="text-xs text-white/35 mt-1 leading-relaxed">{customizationSummary(item.customization)}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[#EE5C13] font-bold text-sm">{formatCurrency(item.price * item.quantity)}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full border border-white/12 flex items-center justify-center hover:bg-white/8 transition-colors text-white/70"><Minus size={12} /></button>
                          <span className="w-6 text-center text-sm font-medium text-white">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full border border-white/12 flex items-center justify-center hover:bg-white/8 transition-colors text-white/70"><Plus size={12} /></button>
                          <button onClick={() => removeItem(item.id)} className="w-7 h-7 rounded-full text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors ml-1"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 pb-6 pt-4 border-t border-white/8 space-y-4 bg-[#0D0D0D]">
              <div>
                <p className="text-xs font-semibold text-white/35 uppercase tracking-wider mb-2">Tipo de pedido</p>
                <div className="flex gap-2">
                  {(['entrega', 'retirada'] as const).map((type) => (
                    <button key={type} onClick={() => handleOrderType(type)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all ${
                        orderType === type ? 'border-[#EE5C13] bg-[#EE5C13]/10 text-[#EE5C13]' : 'border-white/10 text-white/50 hover:border-white/20'
                      }`}>
                      {type === 'entrega' ? <Truck size={15} /> : <Store size={15} />}
                      {type === 'entrega' ? 'Entrega' : 'Retirada'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-white/35 uppercase tracking-wider mb-2">Cupom de desconto</p>
                {coupon ? (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                      <Tag size={14} />
                      {coupon.code} ({coupon.type === 'percentage' ? `${coupon.discount}%` : formatCurrency(coupon.discount)} off)
                    </div>
                    <button onClick={removeCoupon} className="text-red-400 hover:text-red-300 text-xs">Remover</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input placeholder="Digite seu cupom" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()} className="flex-1 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#EE5C13]" />
                    <Button onClick={handleApplyCoupon} variant="outline" className="border-[#EE5C13] text-[#EE5C13] hover:bg-[#EE5C13]/10 text-sm bg-transparent">Aplicar</Button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm text-white/50"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-sm text-emerald-400"><span>Desconto</span><span>-{formatCurrency(discount)}</span></div>}
                <div className="flex justify-between text-sm text-white/50"><span>Taxa de entrega</span><span>{deliveryFee === 0 ? 'Grátis' : formatCurrency(deliveryFee)}</span></div>
                <div className="h-px bg-white/8 my-1" />
                <div className="flex justify-between font-bold text-white text-base"><span>Total</span><span className="text-[#EE5C13]">{formatCurrency(total)}</span></div>
              </div>

              <div className="space-y-2">
                <Link href="/checkout" onClick={closeCart} className="block">
                  <Button className="w-full bg-[#EE5C13] hover:bg-[#ff6b1a] text-white font-bold py-3 rounded-full text-base transition-all shadow-[0_0_30px_rgba(238,92,19,0.3)]">Finalizar Pedido</Button>
                </Link>
                <Button onClick={() => { if (items.length === 0) return; openWhatsApp(formatCartForWhatsApp(items, total)) }} variant="outline" className="w-full border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 rounded-full font-medium bg-transparent">
                  Pedir via WhatsApp
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
