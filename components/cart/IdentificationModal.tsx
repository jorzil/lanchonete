'use client'

import { useState } from 'react'
import { X, User, Phone, Loader2, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generateOrderNumber, formatCurrency, type Order, type PaymentMethod } from '@/lib/store'
import { generateOrderMessage, openWhatsApp } from '@/lib/whatsapp'
import { addOrder } from '@/lib/orders-storage'
import { supabaseConfigured } from '@/lib/supabase'
import { getStoreStatus, computeIsOpen } from '@/lib/store-status'
import { toast } from 'sonner'
import type { CartItem } from '@/lib/data'

interface Props {
  open: boolean
  onClose: () => void
  items: CartItem[]
  subtotal: number
  total: number
  deliveryFee: number
  onSuccess?: () => void
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
}

export function IdentificationModal({ open, onClose, items, subtotal, total, deliveryFee, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})

  if (!open) return null

  function validate() {
    const e: typeof errors = {}
    if (!name.trim() || name.trim().length < 3) e.name = 'Informe seu nome completo (mínimo 3 caracteres).'
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) e.phone = 'Informe um telefone/WhatsApp válido.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSend() {
    if (!validate()) return

    const storeStatus = getStoreStatus()
    if (!computeIsOpen(storeStatus)) {
      toast.error('Estamos fechados no momento. Retornaremos em breve.')
      return
    }

    if (items.length === 0) {
      toast.error('Adicione itens ao carrinho antes de continuar.')
      return
    }

    setLoading(true)

    const orderNumber = generateOrderNumber()
    const order: Order = {
      id: `order-${Date.now()}`,
      orderNumber,
      items,
      customer: { name: name.trim(), phone },
      orderType: 'entrega',
      paymentMethod: 'pix' as PaymentMethod,
      subtotal,
      deliveryFee,
      discount: 0,
      total,
      status: 'novo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Always save locally
    addOrder(order)

    // Try Supabase
    if (supabaseConfigured) {
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber,
            customerName: name.trim(),
            customerPhone: phone,
            customerCpf: cpf || undefined,
            orderType: 'entrega',
            items,
            paymentMethod: 'pix',
            subtotal,
            deliveryFee,
            discount: 0,
            total,
          }),
        })
      } catch (err) {
        console.error('Supabase save failed (saved locally):', err)
      }
    }

    const msg = generateOrderMessage(order)
    openWhatsApp(msg)
    toast.success(`Pedido ${orderNumber} registrado!`)

    setLoading(false)
    onSuccess?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-[#0D1B2E] border border-white/10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <h2 className="font-bold text-white text-lg">Identificação do Cliente</h2>
            <p className="text-white/40 text-[13px] mt-0.5">Obrigatório para registrar seu pedido</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Order summary */}
        <div className="border-b border-white/6 px-5 py-3 bg-white/3">
          <p className="text-white/40 text-[12px] font-medium uppercase tracking-wide mb-1">Resumo do pedido</p>
          <div className="flex justify-between">
            <span className="text-white/60 text-[13px]">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            <span className="text-white font-bold">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-white/60 text-[13px] flex items-center gap-1.5">
              <User size={13} /> Nome Completo <span className="text-red-400">*</span>
            </Label>
            <Input
              placeholder="Seu nome completo"
              value={name}
              onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: undefined })) }}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#EE5C13] h-11"
              autoFocus
            />
            {errors.name && <p className="text-red-400 text-[12px]">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/60 text-[13px] flex items-center gap-1.5">
              <Phone size={13} /> Telefone / WhatsApp <span className="text-red-400">*</span>
            </Label>
            <Input
              placeholder="(33) 99999-9999"
              value={phone}
              onChange={e => { setPhone(maskPhone(e.target.value)); if (errors.phone) setErrors(p => ({ ...p, phone: undefined })) }}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#EE5C13] h-11"
              inputMode="tel"
            />
            {errors.phone && <p className="text-red-400 text-[12px]">{errors.phone}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/60 text-[13px]">CPF (opcional)</Label>
            <Input
              placeholder="000.000.000-00"
              value={cpf}
              onChange={e => setCpf(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#EE5C13] h-11"
              inputMode="numeric"
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={loading}
            className="w-full h-12 bg-[#25D366] hover:bg-[#1fbd5b] text-white font-bold text-[15px] rounded-xl flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <><MessageCircle size={18} /> Confirmar e Enviar pelo WhatsApp</>
            )}
          </Button>

          <p className="text-center text-white/25 text-[11px]">
            Seus dados são usados apenas para identificar seu pedido. Não compartilhamos com terceiros.
          </p>
        </div>
      </div>
    </div>
  )
}
