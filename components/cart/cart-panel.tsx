'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trash2, Plus, Minus, ShoppingBag, Tag, Truck, Store } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-gray-100 bg-[#023E74] text-white">
          <SheetTitle className="text-white flex items-center gap-2">
            <ShoppingBag size={20} />
            Meu Carrinho
            {itemCount > 0 && <Badge className="ml-2 bg-[#EE5C13] text-white border-0">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</Badge>}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="text-7xl mb-4">🥖</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Seu carrinho está vazio</h3>
            <p className="text-gray-500 mb-6">Adicione subs deliciosos ao seu pedido!</p>
            <Link href="/cardapio" onClick={closeCart}>
              <Button className="bg-[#EE5C13] hover:bg-[#d94b0d] text-white rounded-full px-6">Ver Cardápio</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center text-2xl shrink-0">{item.image}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm leading-tight">{item.name}</h4>
                      {item.customization && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{customizationSummary(item.customization)}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[#EE5C13] font-bold text-sm">{formatCurrency(item.price * item.quantity)}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"><Minus size={12} /></button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"><Plus size={12} /></button>
                          <button onClick={() => removeItem(item.id)} className="w-7 h-7 rounded-full text-red-400 hover:bg-red-50 flex items-center justify-center transition-colors ml-1"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 pb-6 pt-4 border-t border-gray-100 space-y-4 bg-gray-50">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tipo de pedido</p>
                <div className="flex gap-2">
                  {(['entrega', 'retirada'] as const).map((type) => (
                    <button key={type} onClick={() => handleOrderType(type)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        orderType === type ? 'border-[#EE5C13] bg-orange-50 text-[#EE5C13]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {type === 'entrega' ? <Truck size={15} /> : <Store size={15} />}
                      {type === 'entrega' ? 'Entrega' : 'Retirada'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cupom de desconto</p>
                {coupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                      <Tag size={14} />
                      {coupon.code} ({coupon.type === 'percentage' ? `${coupon.discount}%` : formatCurrency(coupon.discount)} off)
                    </div>
                    <button onClick={removeCoupon} className="text-red-400 hover:text-red-500 text-xs">Remover</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input placeholder="Digite seu cupom" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()} className="flex-1 text-sm" />
                    <Button onClick={handleApplyCoupon} variant="outline" className="border-[#EE5C13] text-[#EE5C13] hover:bg-orange-50 text-sm">Aplicar</Button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Desconto</span><span>-{formatCurrency(discount)}</span></div>}
                <div className="flex justify-between text-sm text-gray-600"><span>Taxa de entrega</span><span>{deliveryFee === 0 ? 'Grátis' : formatCurrency(deliveryFee)}</span></div>
                <Separator />
                <div className="flex justify-between font-bold text-gray-800 text-base"><span>Total</span><span className="text-[#EE5C13]">{formatCurrency(total)}</span></div>
              </div>

              <div className="space-y-2">
                <Link href="/checkout" onClick={closeCart} className="block">
                  <Button className="w-full bg-[#EE5C13] hover:bg-[#d94b0d] text-white font-bold py-3 rounded-full text-base transition-all hover:scale-[1.02]">Finalizar Pedido</Button>
                </Link>
                <Button onClick={() => { if (items.length === 0) return; openWhatsApp(formatCartForWhatsApp(items, total)) }} variant="outline" className="w-full border-green-500 text-green-600 hover:bg-green-50 rounded-full font-medium">
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
