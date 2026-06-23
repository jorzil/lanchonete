'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, User, Phone, CreditCard, Banknote, QrCode, Loader2, Truck, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useCart } from '@/contexts/cart-context'
import { formatCurrency, generateOrderNumber, MENU, type PaymentMethod, type Order } from '@/lib/store'
import { generateOrderMessage, openWhatsApp } from '@/lib/whatsapp'
import { addOrder } from '@/lib/orders-storage'
import { supabaseConfigured } from '@/lib/supabase'
import { toast } from 'sonner'
import { getStoreStatus, computeIsOpen } from '@/lib/store-status'

type OrderType = 'entrega' | 'retirada'

interface FormData {
  name: string; phone: string; cpf: string; orderType: OrderType
  cep: string; street: string; number: string; complement: string
  neighborhood: string; city: string; state: string; reference: string
  paymentMethod: PaymentMethod; notes: string
}

const PAYMENT_OPTIONS = [
  { key: 'pix' as PaymentMethod, label: 'PIX', icon: <QrCode size={19} />, description: 'Aprovação instantânea' },
  { key: 'cartao-credito' as PaymentMethod, label: 'Crédito', icon: <CreditCard size={19} />, description: 'Parcelamento disponível' },
  { key: 'cartao-debito' as PaymentMethod, label: 'Débito', icon: <CreditCard size={19} />, description: 'Débito na entrega' },
  { key: 'dinheiro' as PaymentMethod, label: 'Dinheiro', icon: <Banknote size={19} />, description: 'Troco disponível' },
]

function customizationLabel(c: NonNullable<import('@/lib/store').CartItem['customization']>): string {
  const parts: string[] = [c.size]
  if (c.meat) { const m = MENU.meats.find((m) => m.key === c.meat); if (m) parts.push(m.name) }
  if (c.cheeses && c.cheeses.length > 0) {
    const names = c.cheeses.map((ck) => MENU.cheeses.find((ch) => ch.key === ck)?.name || ck).join(', ')
    parts.push(c.cheeses.length > 1 ? `${names} (em dobro)` : names)
  }
  return parts.join(' • ')
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode; delay?: number }) {
  return (
    <div className="animate-slide-up bg-navy-surface rounded-2xl p-6 border border-white/6">
      <h2 className="font-bold text-white text-[15px] mb-5 flex items-center gap-2">
        {icon && <span className="text-brand">{icon}</span>}
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, total, deliveryFee, coupon, clearCart, setDeliveryFee, applyCoupon, removeCoupon } = useCart()
  const [form, setForm] = useState<FormData>({
    name: '', phone: '', cpf: '', orderType: 'entrega', cep: '', street: '', number: '',
    complement: '', neighborhood: '', city: '', state: '', reference: '', paymentMethod: 'pix', notes: ''
  })
  const [loadingCep, setLoadingCep] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')

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

    // Check store status
    const storeStatus = getStoreStatus()
    if (!computeIsOpen(storeStatus)) {
      toast.error('Estamos fechados no momento. Retornaremos em breve.')
      return
    }

    setSubmitting(true)

    const orderNumber = generateOrderNumber()
    const address = form.orderType === 'entrega'
      ? { cep: form.cep, street: form.street, number: form.number, complement: form.complement, neighborhood: form.neighborhood, city: form.city, state: form.state }
      : undefined

    const order: Order = {
      id: `order-${Date.now()}`,
      orderNumber,
      items,
      customer: { name: form.name, phone: form.phone },
      orderType: form.orderType,
      address,
      paymentMethod: form.paymentMethod,
      subtotal, deliveryFee, discount, total,
      status: 'novo',
      notes: form.notes,
      coupon: coupon ?? undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Increment coupon usage counter
    if (coupon) {
      try { const { incrementCouponUsage } = await import('@/lib/coupon-storage'); incrementCouponUsage(coupon.code) } catch {}
    }

    // Always save locally as fallback
    addOrder(order)

    // Try to persist to Supabase if configured
    if (supabaseConfigured) {
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber,
            customerName: form.name,
            customerPhone: form.phone,
            customerCpf: form.cpf || undefined,
            orderType: form.orderType,
            items,
            address: address ? { ...address, reference: form.reference } : undefined,
            paymentMethod: form.paymentMethod,
            subtotal, deliveryFee, discount, total,
            notes: form.notes || undefined,
          }),
        })
      } catch (err) {
        console.error('Supabase save failed (order still saved locally):', err)
      }
    }

    const msg = generateOrderMessage(order)
    openWhatsApp(msg)
    clearCart()
    toast.success(`Pedido ${orderNumber} realizado com sucesso!`)
    setTimeout(() => { setSubmitting(false); router.push('/') }, 1500)
  }

  if (items.length === 0) {
    return (
      <><Header />
        <main className="pt-16 min-h-screen bg-navy flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-7xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-white mb-3">Carrinho vazio</h2>
            <p className="text-white/35 mb-6">Adicione itens antes de finalizar o pedido.</p>
            <Link href="/cardapio"><Button className="bg-brand hover:bg-brand-hover text-white rounded-full px-8 shadow-[0_0_30px_rgba(238,92,19,0.3)]">Ver Cardápio</Button></Link>
          </div>
        </main>
        <Footer /></>
    )
  }

  const storeOpen = computeIsOpen(getStoreStatus())

  return (
    <><Header />
      <main className="pt-16 bg-navy min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {!storeOpen && (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-center">
              <p className="text-lg font-bold text-red-400">🔴 Estamos fechados no momento</p>
              <p className="mt-1 text-sm text-red-300/70">Retornaremos em breve. Você pode navegar pelo cardápio e montar seu pedido.</p>
            </div>
          )}
          <div className="mb-8">
            <Link href="/cardapio" className="flex items-center gap-2 text-white/35 hover:text-brand transition-colors text-sm font-medium">
              <ArrowLeft size={16} />Voltar ao cardápio
            </Link>
            <h1 className="text-3xl font-black text-white mt-4 tracking-[-0.03em]">Finalizar Pedido</h1>
          </div>

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <Section title="Seus Dados" icon={<User size={18} />}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white/50">Nome completo *</Label>
                    <Input id="name" placeholder="Seu nome" value={form.name} onChange={set('name')} required className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white/50">WhatsApp *</Label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                      <Input id="phone" placeholder="(33) 99999-9999" value={form.phone} onChange={set('phone')} required className="pl-9 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf" className="text-white/50">CPF <span className="text-white/25">(opcional)</span></Label>
                    <Input id="cpf" placeholder="000.000.000-00" value={form.cpf} onChange={set('cpf')} className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand" />
                  </div>
                </div>
              </Section>

              <Section title="Tipo de Pedido" delay={0.08}>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {(['entrega', 'retirada'] as OrderType[]).map((type) => (
                    <button key={type} type="button" onClick={() => handleOrderType(type)}
                      className={`p-4 rounded-xl border font-semibold capitalize transition-all flex items-center justify-center gap-2 ${
                        form.orderType === type ? 'border-brand bg-brand/10 text-brand' : 'border-white/10 text-white/50 hover:border-white/20'
                      }`}>
                      {type === 'entrega' ? <Truck size={16} /> : <Store size={16} />}
                      {type === 'entrega' ? 'Entrega' : 'Retirada'}
                    </button>
                  ))}
                </div>
                {form.orderType === 'entrega' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-white/35 mb-2"><MapPin size={15} className="text-brand" />Endereço de entrega</div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="cep" className="text-white/50">CEP *</Label>
                      <div className="flex gap-2">
                        <Input id="cep" placeholder="00000-000" value={form.cep} onChange={set('cep')} onBlur={() => fetchCep(form.cep)} className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand" />
                        {loadingCep && <Loader2 size={16} className="animate-spin text-brand self-center" />}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-2">
                        <Label htmlFor="street" className="text-white/50">Rua *</Label>
                        <Input id="street" placeholder="Nome da rua" value={form.street} onChange={set('street')} className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="number" className="text-white/50">Número *</Label>
                        <Input id="number" placeholder="123" value={form.number} onChange={set('number')} className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complement" className="text-white/50">Complemento</Label>
                      <Input id="complement" placeholder="Apto, bloco..." value={form.complement} onChange={set('complement')} className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand" />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="space-y-2"><Label htmlFor="neighborhood" className="text-white/50">Bairro *</Label><Input id="neighborhood" placeholder="Bairro" value={form.neighborhood} onChange={set('neighborhood')} className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand" /></div>
                      <div className="space-y-2"><Label htmlFor="city" className="text-white/50">Cidade *</Label><Input id="city" placeholder="Cidade" value={form.city} onChange={set('city')} className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand" /></div>
                      <div className="space-y-2"><Label htmlFor="state" className="text-white/50">Estado</Label><Input id="state" placeholder="MG" value={form.state} onChange={set('state')} maxLength={2} className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand" /></div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reference" className="text-white/50">Ponto de referência <span className="text-white/25">(opcional)</span></Label>
                      <Input id="reference" placeholder="Ex: próximo ao Supermercado X, casa azul..." value={form.reference} onChange={set('reference')} className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand" />
                    </div>
                  </div>
                )}
                {form.orderType === 'retirada' && (
                  <div className="bg-white/5 border border-white/8 rounded-xl p-4 text-sm text-white/60">
                    <p className="font-semibold text-white mb-1">📍 Endereço para retirada:</p>
                    <p>Rua Exemplo, 123 - Bairro, Cidade - SP</p>
                    <p className="text-white/30 mt-1">Seg-Sex: 11h–22h | Sáb-Dom: 11h–23h</p>
                  </div>
                )}
              </Section>

              <Section title="Forma de Pagamento" icon={<CreditCard size={18} />} delay={0.16}>
                <div className="grid sm:grid-cols-2 gap-3">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <button key={opt.key} type="button" onClick={() => setForm((prev) => ({ ...prev, paymentMethod: opt.key }))}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        form.paymentMethod === opt.key ? 'border-brand bg-brand/10' : 'border-white/10 hover:border-white/20'
                      }`}>
                      <div className={`flex items-center gap-2 font-semibold mb-1 ${form.paymentMethod === opt.key ? 'text-brand' : 'text-white/70'}`}>{opt.icon}{opt.label}</div>
                      <p className="text-xs text-white/30">{opt.description}</p>
                    </button>
                  ))}
                </div>
                {form.paymentMethod === 'pix' && (
                  <div className="mt-4 p-4 bg-white/5 rounded-xl text-center border border-dashed border-white/15">
                    <div className="text-4xl mb-2">📱</div>
                    <p className="text-sm font-medium text-white/70">Chave PIX: <span className="text-brand font-bold">maissub@email.com</span></p>
                    <p className="text-xs text-white/30 mt-1">O pedido será confirmado após comprovante no WhatsApp</p>
                  </div>
                )}
              </Section>

              <Section title="Observações" delay={0.24}>
                <Textarea placeholder="Alguma observação para seu pedido? Ex: sem cebola, campainha não funciona..." value={form.notes} onChange={set('notes')} className="resize-none h-24 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-brand" />
              </Section>
            </div>

            <div className="lg:col-span-2">
              <div className="animate-slide-up bg-navy-surface rounded-2xl p-6 border border-white/6 sticky top-24">
                <h2 className="font-bold text-white text-[15px] mb-4">Resumo do Pedido</h2>
                <div className="space-y-3 max-h-64 overflow-y-auto mb-4 custom-scrollbar pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-xl shrink-0">{item.image}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm leading-tight">{item.name}</p>
                        {item.customization && <p className="text-xs text-white/30 truncate">{customizationLabel(item.customization)}</p>}
                        <p className="text-xs text-white/30">x{item.quantity}</p>
                      </div>
                      <div className="text-sm font-semibold text-white/70 shrink-0">{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-white/8 my-4" />

                {/* Coupon input */}
                {coupon ? (
                  <div className="mb-3 flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                    <div>
                      <p className="text-xs text-emerald-400 font-semibold">Cupom aplicado</p>
                      <p className="text-sm font-mono font-bold text-emerald-300">{coupon.code}</p>
                    </div>
                    <button onClick={removeCoupon} className="text-white/30 hover:text-white/60 text-xs underline">remover</button>
                  </div>
                ) : (
                  <div className="mb-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Cupom de desconto"
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                      className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand font-mono uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!couponInput.trim()) return
                        const ok = applyCoupon(couponInput)
                        if (!ok) setCouponError('Cupom inválido, expirado ou não disponível.')
                        else { setCouponInput(''); setCouponError('') }
                      }}
                      className="rounded-lg bg-white/8 border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/15 transition-colors"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
                {couponError && <p className="mb-2 text-xs text-red-400">{couponError}</p>}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/50"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  {discount > 0 && <div className="flex justify-between text-emerald-400"><span>Desconto ({coupon?.code})</span><span>-{formatCurrency(discount)}</span></div>}
                  <div className="flex justify-between text-white/50"><span>Entrega</span><span>{deliveryFee === 0 ? 'Grátis' : formatCurrency(deliveryFee)}</span></div>
                  <div className="h-px bg-white/8 my-1" />
                  <div className="flex justify-between font-black text-lg text-white"><span>Total</span><span className="text-brand">{formatCurrency(total)}</span></div>
                </div>
                <Button type="submit" disabled={submitting} className="w-full mt-6 bg-brand hover:bg-brand-hover text-white font-bold py-4 rounded-full text-base transition-all shadow-[0_0_30px_rgba(238,92,19,0.3)] disabled:opacity-60">
                  {submitting ? <span className="flex items-center gap-2"><Loader2 size={18} className="animate-spin" />Processando...</span> : 'Confirmar Pedido'}
                </Button>
                <p className="text-center text-xs text-white/25 mt-3">Ao confirmar, você será redirecionado para o WhatsApp</p>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer /></>
  )
}
