'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, User, Phone, CreditCard, Banknote, QrCode, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useCart } from '@/contexts/cart-context'
import { formatCurrency, generateOrderNumber, MENU, type PaymentMethod, type Order } from '@/lib/store'
import { generateOrderMessage, openWhatsApp } from '@/lib/whatsapp'
import { toast } from 'sonner'

type OrderType = 'entrega' | 'retirada'

interface FormData {
  name: string; phone: string; orderType: OrderType
  cep: string; street: string; number: string; complement: string
  neighborhood: string; city: string; state: string
  paymentMethod: PaymentMethod; notes: string
}

const PAYMENT_OPTIONS = [
  { key: 'pix' as PaymentMethod, label: 'PIX', icon: <QrCode size={20} />, description: 'Aprovação instantânea' },
  { key: 'cartao-credito' as PaymentMethod, label: 'Cartão de Crédito', icon: <CreditCard size={20} />, description: 'Parcelamento disponível' },
  { key: 'cartao-debito' as PaymentMethod, label: 'Cartão de Débito', icon: <CreditCard size={20} />, description: 'Débito na entrega' },
  { key: 'dinheiro' as PaymentMethod, label: 'Dinheiro', icon: <Banknote size={20} />, description: 'Troco disponível' },
]

function customizationLabel(c: NonNullable<import('@/lib/store').CartItem['customization']>): string {
  const parts = [c.size]
  if (c.meat) { const m = MENU.meats.find((m) => m.key === c.meat); if (m) parts.push(m.name) }
  if (c.cheese) { const ch = MENU.cheeses.find((ch) => ch.key === c.cheese); if (ch) parts.push(ch.name) }
  return parts.join(' • ')
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, total, deliveryFee, coupon, clearCart, setDeliveryFee } = useCart()
  const [form, setForm] = useState<FormData>({
    name: '', phone: '', orderType: 'entrega', cep: '', street: '', number: '',
    complement: '', neighborhood: '', city: '', state: '', paymentMethod: 'pix', notes: ''
  })
  const [loadingCep, setLoadingCep] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const discount = coupon ? (coupon.type === 'percentage' ? subtotal * (coupon.discount / 100) : coupon.discount) : 0
  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleOrderType = (type: OrderType) => { setForm((prev) => ({ ...prev, orderType: type })); setDeliveryFee(type === 'entrega' ? 5 : 0) }

  const fetchCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) return
    setLoadingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setForm((prev) => ({ ...prev, street: data.logradouro || '', neighborhood: data.bairro || '', city: data.localidade || '', state: data.uf || '' }))
        toast.success('Endereço encontrado!')
      } else toast.error('CEP não encontrado.')
    } catch { toast.error('Erro ao buscar CEP.') }
    finally { setLoadingCep(false) }
  }

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Informe seu nome.'
    if (!form.phone.trim()) return 'Informe seu telefone/WhatsApp.'
    if (form.orderType === 'entrega') {
      if (!form.cep.trim()) return 'Informe o CEP.'
      if (!form.street.trim()) return 'Informe a rua.'
      if (!form.number.trim()) return 'Informe o número.'
      if (!form.neighborhood.trim()) return 'Informe o bairro.'
      if (!form.city.trim()) return 'Informe a cidade.'
    }
    if (items.length === 0) return 'Carrinho vazio.'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { toast.error(err); return }
    setSubmitting(true)
    const order: Order = {
      id: `order-${Date.now()}`, orderNumber: generateOrderNumber(), items,
      customer: { name: form.name, phone: form.phone },
      orderType: form.orderType,
      address: form.orderType === 'entrega' ? { cep: form.cep, street: form.street, number: form.number, complement: form.complement, neighborhood: form.neighborhood, city: form.city, state: form.state } : undefined,
      paymentMethod: form.paymentMethod, subtotal, deliveryFee, discount, total,
      status: 'novo', notes: form.notes, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    }
    try { const existing: Order[] = JSON.parse(localStorage.getItem('mais-sub-orders') || '[]'); existing.unshift(order); localStorage.setItem('mais-sub-orders', JSON.stringify(existing)) } catch { /* ignore */ }
    const msg = generateOrderMessage(order)
    openWhatsApp(msg)
    clearCart()
    toast.success(`Pedido ${order.orderNumber} realizado com sucesso!`)
    setTimeout(() => { setSubmitting(false); router.push('/') }, 1500)
  }

  if (items.length === 0) {
    return (
      <><Header />
        <main className="pt-16 min-h-screen flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-7xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Carrinho vazio</h2>
            <p className="text-gray-500 mb-6">Adicione itens antes de finalizar o pedido.</p>
            <Link href="/cardapio"><Button className="bg-[#EE5C13] hover:bg-[#d94b0d] text-white rounded-full px-8">Ver Cardápio</Button></Link>
          </div>
        </main>
        <Footer /></>
    )
  }

  return (
    <><Header />
      <main className="pt-16 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-8">
            <Link href="/cardapio" className="flex items-center gap-2 text-gray-500 hover:text-[#EE5C13] transition-colors text-sm font-medium">
              <ArrowLeft size={16} />Voltar ao cardápio
            </Link>
            <h1 className="text-3xl font-black text-[#023E74] mt-4">Finalizar Pedido</h1>
          </div>

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2"><User size={20} className="text-[#EE5C13]" />Seus Dados</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input id="name" placeholder="Seu nome" value={form.name} onChange={set('name')} required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">WhatsApp *</Label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input id="phone" placeholder="(11) 99999-9999" value={form.phone} onChange={set('phone')} required className="pl-9 h-11" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-800 text-lg mb-4">Tipo de Pedido</h2>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {(['entrega', 'retirada'] as OrderType[]).map((type) => (
                    <button key={type} type="button" onClick={() => handleOrderType(type)}
                      className={`p-4 rounded-xl border-2 font-semibold capitalize transition-all ${
                        form.orderType === type ? 'border-[#EE5C13] bg-orange-50 text-[#EE5C13]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {type === 'entrega' ? '🚚 Entrega' : '🏠 Retirada'}
                    </button>
                  ))}
                </div>
                {form.orderType === 'entrega' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2"><MapPin size={15} className="text-[#EE5C13]" />Endereço de entrega</div>
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="cep">CEP *</Label>
                        <div className="flex gap-2">
                          <Input id="cep" placeholder="00000-000" value={form.cep} onChange={set('cep')} onBlur={() => fetchCep(form.cep)} className="h-11" />
                          {loadingCep && <Loader2 size={16} className="animate-spin text-[#EE5C13] self-center" />}
                        </div>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-2">
                        <Label htmlFor="street">Rua *</Label>
                        <Input id="street" placeholder="Nome da rua" value={form.street} onChange={set('street')} className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="number">Número *</Label>
                        <Input id="number" placeholder="123" value={form.number} onChange={set('number')} className="h-11" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input id="complement" placeholder="Apto, bloco..." value={form.complement} onChange={set('complement')} className="h-11" />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="space-y-2"><Label htmlFor="neighborhood">Bairro *</Label><Input id="neighborhood" placeholder="Bairro" value={form.neighborhood} onChange={set('neighborhood')} className="h-11" /></div>
                      <div className="space-y-2"><Label htmlFor="city">Cidade *</Label><Input id="city" placeholder="Cidade" value={form.city} onChange={set('city')} className="h-11" /></div>
                      <div className="space-y-2"><Label htmlFor="state">Estado</Label><Input id="state" placeholder="SP" value={form.state} onChange={set('state')} maxLength={2} className="h-11" /></div>
                    </div>
                  </div>
                )}
                {form.orderType === 'retirada' && (
                  <div className="bg-blue-50 rounded-xl p-4 text-sm text-[#023E74]">
                    <p className="font-semibold mb-1">📍 Endereço para retirada:</p>
                    <p>Rua Exemplo, 123 - Bairro, Cidade - SP</p>
                    <p className="text-gray-500 mt-1">Seg-Sex: 11h–22h | Sáb-Dom: 11h–23h</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2"><CreditCard size={20} className="text-[#EE5C13]" />Forma de Pagamento</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <button key={opt.key} type="button" onClick={() => setForm((prev) => ({ ...prev, paymentMethod: opt.key }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        form.paymentMethod === opt.key ? 'border-[#EE5C13] bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <div className={`flex items-center gap-2 font-semibold mb-1 ${form.paymentMethod === opt.key ? 'text-[#EE5C13]' : 'text-gray-700'}`}>{opt.icon}{opt.label}</div>
                      <p className="text-xs text-gray-500">{opt.description}</p>
                    </button>
                  ))}
                </div>
                {form.paymentMethod === 'pix' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl text-center border border-dashed border-gray-300">
                    <div className="text-4xl mb-2">📱</div>
                    <p className="text-sm font-medium text-gray-700">Chave PIX: <span className="text-[#EE5C13] font-bold">maissub@email.com</span></p>
                    <p className="text-xs text-gray-500 mt-1">O pedido será confirmado após comprovante no WhatsApp</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-800 text-lg mb-4">Observações</h2>
                <Textarea placeholder="Alguma observação para seu pedido? Ex: sem cebola, campainha não funciona..." value={form.notes} onChange={set('notes')} className="resize-none h-24" />
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
                <h2 className="font-bold text-gray-800 text-lg mb-4">Resumo do Pedido</h2>
                <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-xl shrink-0">{item.image}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm leading-tight">{item.name}</p>
                        {item.customization && <p className="text-xs text-gray-500 truncate">{customizationLabel(item.customization)}</p>}
                        <p className="text-xs text-gray-500">x{item.quantity}</p>
                      </div>
                      <div className="text-sm font-semibold text-gray-700 shrink-0">{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  {discount > 0 && <div className="flex justify-between text-green-600"><span>Desconto ({coupon?.code})</span><span>-{formatCurrency(discount)}</span></div>}
                  <div className="flex justify-between text-gray-600"><span>Entrega</span><span>{deliveryFee === 0 ? 'Grátis' : formatCurrency(deliveryFee)}</span></div>
                  <Separator />
                  <div className="flex justify-between font-black text-lg text-gray-800"><span>Total</span><span className="text-[#EE5C13]">{formatCurrency(total)}</span></div>
                </div>
                <Button type="submit" disabled={submitting} className="w-full mt-6 bg-[#EE5C13] hover:bg-[#d94b0d] text-white font-bold py-4 rounded-full text-base transition-all hover:scale-[1.02] disabled:opacity-60">
                  {submitting ? <span className="flex items-center gap-2"><Loader2 size={18} className="animate-spin" />Processando...</span> : 'Confirmar Pedido'}
                </Button>
                <p className="text-center text-xs text-gray-400 mt-3">Ao confirmar, você será redirecionado para o WhatsApp</p>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer /></>
  )
}
