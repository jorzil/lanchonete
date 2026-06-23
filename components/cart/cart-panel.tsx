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
import { toast } from 'sonner'

// O(1) lookup Maps — built once, never recreated
const _meatMap   = new Map(MENU.meats.map((m) => [m.key, m.name]))
const _cheeseMap = new Map(MENU.cheeses.map((c) => [c.key, c.name]))
const _saladMap  = new Map(MENU.salads.map((s) => [s.key, s.name]))
const _sauceMap  = new Map(MENU.sauces.map((s) => [s.key, s.name]))

function customizationSummary(c: NonNullable<import('@/lib/store').CartItem['customization']>): string {
  const parts: string[] = [c.size]
  if (c.meat) { const name = _meatMap.get(c.meat); if (name) parts.push(name) }
  if (c.cheeses && c.cheeses.length > 0) {
    const names = c.cheeses.map((ck) => _cheeseMap.get(ck) || ck).join(', ')
    parts.push(c.cheeses.length > 1 ? `${names} (em dobro)` : names)
  }
  if (c.salads.length > 0) parts.push(c.salads.map((s) => _saladMap.get(s) || s).join(', '))
  if (c.sauces.length > 0) parts.push(c.sauces.map((s) => _sauceMap.get(s) || s).join(', '))
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
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-gradient-to-b from-[#FFFFFF] to-[#F9F9F9] border-l-4 border-l-[#EE5C13] text-gray-900 shadow-2xl">
        <SheetHeader className="px-6 py-5 border-b-2 border-gray-200 bg-gradient-to-r from-navy via-navy-surface to-navy-deep">
          <SheetTitle className="text-white flex items-center gap-3">
            <div className="p-2 bg-brand-hover rounded-lg">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <span className="text-lg font-black">Meu Carrinho</span>
            {itemCount > 0 && <Badge className="ml-auto bg-brand-hover text-white border-0 font-bold text-xs px-2.5 py-1">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</Badge>}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="text-7xl mb-4">🥖</div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Seu carrinho está vazio</h3>
            <p className="text-gray-500 mb-6 text-sm">Adicione subs deliciosos ao seu pedido!</p>
            <Link href="/cardapio" onClick={closeCart}>
              <Button className="bg-gradient-to-r from-brand to-brand-hover hover:shadow-lg hover:scale-105 text-white rounded-full px-6 font-bold shadow-md transition-all">Ver Cardápio</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border-2 border-gray-200 hover:border-brand hover:shadow-md transition-all p-4 group">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#FFF5EB] to-[#FFE8D6] rounded-lg flex items-center justify-center text-2xl shrink-0">{item.image}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm leading-tight">{item.name}</h4>
                      {item.customization && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{customizationSummary(item.customization)}</p>}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-brand font-black text-lg">{formatCurrency(item.price * item.quantity)}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 hover:border-brand transition-all text-gray-700"><Minus size={12} /></button>
                          <span className="w-6 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full border-2 border-brand flex items-center justify-center hover:bg-orange-50 transition-all text-brand font-bold"><Plus size={12} /></button>
                          <button onClick={() => removeItem(item.id)} className="w-7 h-7 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all ml-1"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 pb-6 pt-4 border-t-2 border-gray-200 space-y-4 bg-gradient-to-b from-gray-50 to-white">
              <div>
                <p className="text-xs font-black text-gray-600 uppercase tracking-widest mb-3">Tipo de Pedido</p>
                <div className="flex gap-2">
                  {(['entrega', 'retirada'] as const).map((type) => (
                    <button key={type} onClick={() => handleOrderType(type)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-bold transition-all hover:scale-105 ${
                        orderType === type ? 'border-brand bg-orange-50 text-brand shadow-md' : 'border-gray-300 text-gray-700 hover:border-brand/50'
                      }`}>
                      {type === 'entrega' ? <Truck size={16} /> : <Store size={16} />}
                      {type === 'entrega' ? 'Entrega' : 'Retirada'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-black text-gray-600 uppercase tracking-widest mb-3">Cupom de Desconto</p>
                {coupon ? (
                  <div className="flex items-center justify-between bg-green-50 border-2 border-green-300 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 text-green-700 text-sm font-bold">
                      <Tag size={16} />
                      {coupon.code} ({coupon.type === 'percentage' ? `${coupon.discount}%` : formatCurrency(coupon.discount)} de desconto)
                    </div>
                    <button onClick={removeCoupon} className="text-red-500 hover:text-red-700 text-xs font-bold">✕</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input placeholder="Digite seu cupom" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()} className="flex-1 text-sm bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus-visible:ring-brand focus-visible:border-brand" />
                    <Button onClick={handleApplyCoupon} className="border-2 border-brand text-brand hover:bg-orange-50 text-sm bg-white font-bold transition-all">Aplicar</Button>
                  </div>
                )}
              </div>

              <div className="space-y-2 bg-white rounded-lg border-2 border-gray-200 p-4">
                <div className="flex justify-between text-sm text-gray-700"><span>Subtotal</span><span className="font-semibold">{formatCurrency(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-sm text-green-700"><span>Desconto</span><span className="font-bold">-{formatCurrency(discount)}</span></div>}
                <div className="flex justify-between text-sm text-gray-700"><span>Taxa de entrega</span><span className="font-semibold">{deliveryFee === 0 ? '✓ Grátis' : formatCurrency(deliveryFee)}</span></div>
                <div className="h-px bg-gray-200 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-black text-lg">Total</span>
                  <span className="text-4xl font-black text-brand-hover">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Link href="/checkout" onClick={closeCart} className="block">
                  <Button className="w-full bg-gradient-to-r from-brand to-brand-hover hover:shadow-lg hover:scale-105 text-white font-black py-3 rounded-xl text-base transition-all">
                    Finalizar Pedido
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
