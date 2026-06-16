'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Phone, CreditCard, Banknote, QrCode, Loader2, Truck, Store } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  { key: 'pix' as PaymentMethod, label: 'PIX', icon: QrCode, description: 'Aprovação instantânea' },
  { key: 'cartao-credito' as PaymentMethod, label: 'Crédito', icon: CreditCard, description: 'Parcelamento disponível' },
  { key: 'cartao-debito' as PaymentMethod, label: 'Débito', icon: CreditCard, description: 'Débito na entrega' },
  { key: 'dinheiro' as PaymentMethod, label: 'Dinheiro', icon: Banknote, description: 'Troco disponível' },
]

function customizationLabel(c: NonNullable<import('@/lib/store').CartItem['customization']>): string {
  const parts: string[] = [c.size]
  if (c.meat) { const m = MENU.meats.find((m) => m.key === c.meat); if (m) parts.push(m.name) }
  if (c.cheese) { const ch = MENU.cheeses.find((ch) => ch.key === c.cheese); if (ch) parts.push(ch.name) }
  return parts.join(' • ')
}

function Card({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-[#E8E0D0] rounded-2xl p-7"
    >
      {children}
    </motion.div>
  )
}

function SectionTitle({ step, title }: { step: string; title: string }) {
  return (
    <div className="mb-6 flex items-baseline gap-3">
      <span className="text-[11px] font-medium tabular-nums text-[#EE5C13] tracking-wider">{step}</span>
      <h2 className="h-editorial text-[#0E1F3C] text-[22px]">{title}</h2>
    </div>
  )
}

const inputClass = 'h-11 bg-white border-[#E8E0D0] text-[#0E1F3C] placeholder:text-[#8B95A8] focus-visible:ring-1 focus-visible:ring-[#0E1F3C] focus-visible:ring-offset-0 focus-visible:border-[#0E1F3C]'

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
        <main className="pt-[72px] min-h-screen bg-[#FAF6EE] flex items-center justify-center">
          <div className="text-center p-8 max-w-sm">
            <h2 className="h-editorial text-[40px] text-[#0E1F3C] mb-3">Carrinho vazio</h2>
            <p className="text-[14px] text-[#8B95A8] mb-7">Adicione itens antes de finalizar o pedido.</p>
            <Link href="/cardapio">
              <Button className="bg-[#0E1F3C] hover:bg-[#1a2e54] text-[#FAF6EE] rounded-full px-7 h-11">Ver Cardápio</Button>
            </Link>
          </div>
        </main>
        <Footer /></>
    )
  }

  return (
    <><Header />
      <main className="pt-[72px] bg-[#FAF6EE] min-h-screen">
        <div className="max-w-[1180px] mx-auto px-6 sm:px-10 py-14">
          <div className="mb-10">
            <Link href="/cardapio" className="inline-flex items-center gap-2 text-[#8B95A8] hover:text-[#0E1F3C] transition-colors text-[13px] font-medium">
              <ArrowLeft size={14} strokeWidth={1.8} />Voltar ao cardápio
            </Link>
            <h1 className="h-editorial mt-6 text-[#0E1F3C] text-[44px] sm:text-[56px]">Finalizar pedido</h1>
          </div>

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-5">
              <Card>
                <SectionTitle step="01" title="Seus dados" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-[12px] font-medium text-[#3D4D6A]">Nome completo *</Label>
                    <Input id="name" placeholder="Seu nome" value={form.name} onChange={set('name')} required className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[12px] font-medium text-[#3D4D6A]">WhatsApp *</Label>
                    <div className="relative">
                      <Phone size={14} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B95A8]" />
                      <Input id="phone" placeholder="(33) 99999-9999" value={form.phone} onChange={set('phone')} required className={`${inputClass} pl-9`} />
                    </div>
                  </div>
                </div>
              </Card>

              <Card delay={0.05}>
                <SectionTitle step="02" title="Tipo de pedido" />
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {(['entrega', 'retirada'] as OrderType[]).map((type) => (
                    <button key={type} type="button" onClick={() => handleOrderType(type)}
                      className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${
                        form.orderType === type ? 'border-[#0E1F3C] bg-[#0E1F3C]/[0.025]' : 'border-[#E8E0D0] hover:border-[#0E1F3C]/40'
                      }`}>
                      {type === 'entrega' ? <Truck size={16} strokeWidth={1.8} className="text-[#EE5C13]" /> : <Store size={16} strokeWidth={1.8} className="text-[#EE5C13]" />}
                      <span className="font-medium text-[14px] text-[#0E1F3C]">{type === 'entrega' ? 'Entrega' : 'Retirada'}</span>
                    </button>
                  ))}
                </div>
                {form.orderType === 'entrega' && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 text-[12px] text-[#8B95A8]"><MapPin size={13} strokeWidth={1.8} className="text-[#EE5C13]" />Endereço de entrega</div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cep" className="text-[12px] font-medium text-[#3D4D6A]">CEP *</Label>
                      <div className="flex gap-2">
                        <Input id="cep" placeholder="00000-000" value={form.cep} onChange={set('cep')} onBlur={() => fetchCep(form.cep)} className={inputClass} />
                        {loadingCep && <Loader2 size={16} className="animate-spin text-[#EE5C13] self-center" />}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label htmlFor="street" className="text-[12px] font-medium text-[#3D4D6A]">Rua *</Label>
                        <Input id="street" placeholder="Nome da rua" value={form.street} onChange={set('street')} className={inputClass} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="number" className="text-[12px] font-medium text-[#3D4D6A]">Número *</Label>
                        <Input id="number" placeholder="123" value={form.number} onChange={set('number')} className={inputClass} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="complement" className="text-[12px] font-medium text-[#3D4D6A]">Complemento</Label>
                      <Input id="complement" placeholder="Apto, bloco..." value={form.complement} onChange={set('complement')} className={inputClass} />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5"><Label htmlFor="neighborhood" className="text-[12px] font-medium text-[#3D4D6A]">Bairro *</Label><Input id="neighborhood" placeholder="Bairro" value={form.neighborhood} onChange={set('neighborhood')} className={inputClass} /></div>
                      <div className="space-y-1.5"><Label htmlFor="city" className="text-[12px] font-medium text-[#3D4D6A]">Cidade *</Label><Input id="city" placeholder="Cidade" value={form.city} onChange={set('city')} className={inputClass} /></div>
                      <div className="space-y-1.5"><Label htmlFor="state" className="text-[12px] font-medium text-[#3D4D6A]">UF</Label><Input id="state" placeholder="MG" value={form.state} onChange={set('state')} maxLength={2} className={inputClass} /></div>
                    </div>
                  </div>
                )}
                {form.orderType === 'retirada' && (
                  <div className="bg-[#F2ECDF] border border-[#E8E0D0] rounded-xl p-4 text-[13px] text-[#3D4D6A]">
                    <p className="font-medium text-[#0E1F3C] mb-1">Endereço para retirada</p>
                    <p>Rua Exemplo, 123 — Centro, Governador Valadares/MG</p>
                    <p className="text-[#8B95A8] mt-1">Seg-Sex 11h–22h · Sáb-Dom 11h–23h</p>
                  </div>
                )}
              </Card>

              <Card delay={0.1}>
                <SectionTitle step="03" title="Pagamento" />
                <div className="grid sm:grid-cols-2 gap-3">
                  {PAYMENT_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const active = form.paymentMethod === opt.key
                    return (
                      <button key={opt.key} type="button" onClick={() => setForm((prev) => ({ ...prev, paymentMethod: opt.key }))}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          active ? 'border-[#0E1F3C] bg-[#0E1F3C]/[0.025]' : 'border-[#E8E0D0] hover:border-[#0E1F3C]/40'
                        }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={16} strokeWidth={1.8} className="text-[#EE5C13]" />
                          <span className="font-medium text-[14px] text-[#0E1F3C]">{opt.label}</span>
                        </div>
                        <p className="text-[12px] text-[#8B95A8]">{opt.description}</p>
                      </button>
                    )
                  })}
                </div>
                {form.paymentMethod === 'pix' && (
                  <div className="mt-4 p-4 bg-[#F2ECDF] rounded-xl text-center border border-dashed border-[#E8E0D0]">
                    <p className="text-[12px] uppercase tracking-wider text-[#8B95A8] mb-2">Chave PIX</p>
                    <p className="text-[14px] font-medium text-[#0E1F3C]">maissub@email.com</p>
                    <p className="text-[11.5px] text-[#8B95A8] mt-2">Confirme o pagamento enviando o comprovante no WhatsApp</p>
                  </div>
                )}
              </Card>

              <Card delay={0.15}>
                <SectionTitle step="04" title="Observações" />
                <Textarea placeholder="Alguma observação para seu pedido?" value={form.notes} onChange={set('notes')} className="resize-none h-24 bg-white border-[#E8E0D0] text-[#0E1F3C] placeholder:text-[#8B95A8] focus-visible:ring-1 focus-visible:ring-[#0E1F3C] focus-visible:ring-offset-0 focus-visible:border-[#0E1F3C]" />
              </Card>
            </div>

            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white border border-[#E8E0D0] rounded-2xl p-7 sticky top-[92px]"
              >
                <h2 className="h-editorial text-[#0E1F3C] text-[22px] mb-5">Resumo</h2>
                <div className="space-y-4 max-h-64 overflow-y-auto mb-5 custom-scrollbar pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-11 h-11 bg-[#F2ECDF] rounded-lg flex items-center justify-center text-xl shrink-0">{item.image}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#0E1F3C] leading-tight">{item.name}</p>
                        {item.customization && <p className="text-[11.5px] text-[#8B95A8] truncate mt-0.5">{customizationLabel(item.customization)}</p>}
                        <p className="text-[11.5px] text-[#8B95A8] mt-0.5">× {item.quantity}</p>
                      </div>
                      <div className="text-[13px] font-medium text-[#0E1F3C] tabular-nums shrink-0">{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-[#E8E0D0] my-5" />
                <div className="space-y-2.5 text-[13px]">
                  <div className="flex justify-between text-[#3D4D6A]"><span>Subtotal</span><span className="tabular-nums">{formatCurrency(subtotal)}</span></div>
                  {discount > 0 && <div className="flex justify-between text-emerald-700"><span>Desconto ({coupon?.code})</span><span className="tabular-nums">-{formatCurrency(discount)}</span></div>}
                  <div className="flex justify-between text-[#3D4D6A]"><span>Entrega</span><span className="tabular-nums">{deliveryFee === 0 ? 'Grátis' : formatCurrency(deliveryFee)}</span></div>
                  <div className="h-px bg-[#E8E0D0] my-2" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#0E1F3C] font-medium">Total</span>
                    <span className="h-editorial text-[#0E1F3C] text-[28px] tabular-nums">{formatCurrency(total)}</span>
                  </div>
                </div>
                <Button type="submit" disabled={submitting} className="w-full mt-7 bg-[#0E1F3C] hover:bg-[#1a2e54] text-[#FAF6EE] font-medium py-6 rounded-full text-[14px] disabled:opacity-60">
                  {submitting ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />Processando…</span> : 'Confirmar pedido'}
                </Button>
                <p className="text-center text-[11.5px] text-[#8B95A8] mt-3">Ao confirmar, você será redirecionado para o WhatsApp</p>
              </motion.div>
            </div>
          </form>
        </div>
      </main>
      <Footer /></>
  )
}
