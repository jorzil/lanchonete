'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Phone, Package, CheckCircle2, ChefHat, Bike, PartyPopper, XCircle, Clock, RotateCcw, Sandwich } from 'lucide-react'
import { formatCurrency, type Order, type OrderStatus } from '@/lib/data'
import { loadOrders } from '@/lib/orders-storage'
import { supabaseConfigured, supabase } from '@/lib/supabase'

const STEPS: { status: OrderStatus; label: string; description: string; icon: React.ElementType; color: string }[] = [
  { status: 'novo',         label: 'Pedido Recebido',    description: 'Aguardando confirmação da loja',  icon: Package,       color: 'text-orange-500' },
  { status: 'aceito',       label: 'Pedido Aceito',      description: 'A loja confirmou seu pedido',     icon: CheckCircle2,  color: 'text-blue-500'   },
  { status: 'em_preparo',   label: 'Em Preparo',         description: 'Estamos preparando seu sub!',     icon: ChefHat,       color: 'text-purple-500' },
  { status: 'pronto',       label: 'Pronto!',            description: 'Seu pedido está pronto',          icon: Sandwich,      color: 'text-emerald-500'},
  { status: 'saiu_entrega', label: 'Saiu para Entrega',  description: 'A caminho de você 🛵',            icon: Bike,          color: 'text-cyan-500'   },
  { status: 'entregue',     label: 'Entregue!',          description: 'Bom apetite! 🎉',                 icon: PartyPopper,   color: 'text-green-600'  },
]

const RETIRADA_STEPS: { status: OrderStatus; label: string; description: string; icon: React.ElementType; color: string }[] = [
  { status: 'novo',       label: 'Pedido Recebido',  description: 'Aguardando confirmação da loja',  icon: Package,      color: 'text-orange-500' },
  { status: 'aceito',     label: 'Pedido Aceito',    description: 'A loja confirmou seu pedido',     icon: CheckCircle2, color: 'text-blue-500'   },
  { status: 'em_preparo', label: 'Em Preparo',       description: 'Estamos preparando seu sub!',     icon: ChefHat,      color: 'text-purple-500' },
  { status: 'pronto',     label: 'Pronto p/ Retirar',description: 'Pode vir buscar! 🙌',             icon: Sandwich,     color: 'text-emerald-500'},
  { status: 'entregue',   label: 'Retirado!',        description: 'Obrigado, bom apetite! 🎉',       icon: PartyPopper,  color: 'text-green-600'  },
]

function getStepIndex(status: OrderStatus, steps: typeof STEPS) {
  const idx = steps.findIndex(s => s.status === status)
  return idx === -1 ? 0 : idx
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function AcompanharPage() {
  const params = useParams()
  const numero = (params.numero as string).toUpperCase()
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchOrder = useCallback(async () => {
    // Try Supabase API first
    try {
      const res = await fetch(`/api/orders/numero/${encodeURIComponent(numero)}`)
      if (res.ok) {
        const { order } = await res.json()
        setOrder(order)
        setLastUpdate(new Date())
        setLoading(false)
        return
      }
    } catch {}

    // Fallback: localStorage
    const local = loadOrders()
    const found = local.find(o => o.orderNumber.toUpperCase() === numero)
    if (found) {
      setOrder(found)
      setLastUpdate(new Date())
    } else {
      setError(true)
    }
    setLoading(false)
  }, [numero])

  useEffect(() => {
    fetchOrder()

    // Poll every 15s as fallback
    const interval = setInterval(fetchOrder, 15000)

    // Supabase realtime
    if (supabaseConfigured) {
      const channel = supabase
        .channel(`order-track-${numero}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
          if ((payload.new as { order_number: string }).order_number === numero) {
            fetchOrder()
          }
        })
        .subscribe()
      return () => { clearInterval(interval); supabase.removeChannel(channel) }
    }

    return () => clearInterval(interval)
  }, [fetchOrder, numero])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1F3A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#EE5C13] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Buscando seu pedido...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#0B1F3A] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-white text-2xl font-black mb-2">Pedido não encontrado</h1>
          <p className="text-white/50 text-sm mb-6">Verifique o número do pedido ou tente novamente.</p>
          <Link href="/" className="inline-block bg-[#EE5C13] text-white font-bold px-6 py-3 rounded-xl">
            Voltar ao início
          </Link>
        </div>
      </div>
    )
  }

  const isCancelled = order.status === 'cancelado'
  const steps = order.orderType === 'retirada' ? RETIRADA_STEPS : STEPS
  const currentIdx = getStepIndex(order.status as OrderStatus, steps)
  const isDone = order.status === 'entregue'

  return (
    <div className="min-h-screen bg-[#0B1F3A]">
      {/* Header */}
      <header className="bg-[#0B2C5C] border-b border-white/10 px-4 py-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EE5C13] shrink-0">
          <Sandwich className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-white font-black text-base leading-tight">Mais<span className="text-[#EE5C13]">Sub</span></p>
          <p className="text-white/40 text-[11px]">Acompanhe seu pedido</p>
        </div>
        <button
          onClick={fetchOrder}
          className="ml-auto flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors"
        >
          <RotateCcw size={13} />
          Atualizar
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Order number + status */}
        <div className={`rounded-2xl p-5 text-center ${isCancelled ? 'bg-red-900/30 border border-red-500/30' : 'bg-white/5 border border-white/10'}`}>
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-1">Pedido</p>
          <p className="text-white font-black text-3xl tracking-wider">#{order.orderNumber}</p>
          <p className="text-white/40 text-xs mt-1 flex items-center justify-center gap-1">
            <Clock size={11} /> {formatTime(order.createdAt)}
          </p>
          {isCancelled && (
            <div className="mt-3 bg-red-500/20 rounded-xl px-4 py-2">
              <p className="text-red-400 font-bold text-sm">Pedido cancelado</p>
              <p className="text-red-300/60 text-xs">Entre em contato: (33) 98461-9205</p>
            </div>
          )}
          {isDone && (
            <div className="mt-3 bg-green-500/10 rounded-xl px-4 py-2">
              <p className="text-green-400 font-black text-lg">🎉 Bom apetite!</p>
            </div>
          )}
        </div>

        {/* Progress tracker */}
        {!isCancelled && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-5">Status do pedido</p>
            <div className="space-y-0">
              {steps.map((step, idx) => {
                const done = idx < currentIdx
                const active = idx === currentIdx
                const upcoming = idx > currentIdx
                const Icon = step.icon
                return (
                  <div key={step.status} className="flex gap-4">
                    {/* Line + dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        done    ? 'bg-emerald-500'    :
                        active  ? 'bg-[#EE5C13] ring-4 ring-[#EE5C13]/20' :
                                  'bg-white/10'
                      }`}>
                        {done
                          ? <CheckCircle2 size={18} className="text-white" />
                          : <Icon size={18} className={active ? 'text-white' : 'text-white/20'} />
                        }
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={`w-0.5 flex-1 my-1 min-h-[24px] rounded-full transition-all ${done ? 'bg-emerald-500' : 'bg-white/10'}`} />
                      )}
                    </div>
                    {/* Text */}
                    <div className="pb-5 flex-1">
                      <p className={`font-bold text-sm leading-tight ${
                        done ? 'text-emerald-400' : active ? 'text-white' : 'text-white/25'
                      }`}>
                        {step.label}
                        {active && <span className="ml-2 inline-block w-1.5 h-1.5 bg-[#EE5C13] rounded-full animate-pulse align-middle" />}
                      </p>
                      <p className={`text-xs mt-0.5 ${
                        done ? 'text-emerald-400/60' : active ? 'text-white/50' : 'text-white/15'
                      }`}>
                        {active ? step.description : done ? '✓ Concluído' : step.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Order details */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest">Detalhes do pedido</p>

          {/* Customer */}
          <div className="flex items-center gap-2 text-sm">
            <Phone size={14} className="text-[#EE5C13] shrink-0" />
            <span className="text-white/70">{order.customer.name} · {order.customer.phone}</span>
          </div>

          {/* Address */}
          {order.orderType === 'entrega' && order.address && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin size={14} className="text-[#EE5C13] shrink-0 mt-0.5" />
              <span className="text-white/70">
                {order.address.street}, {order.address.number}
                {order.address.complement ? ` - ${order.address.complement}` : ''} · {order.address.neighborhood}, {order.address.city}
              </span>
            </div>
          )}
          {order.orderType === 'retirada' && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin size={14} className="text-[#EE5C13] shrink-0 mt-0.5" />
              <span className="text-white/70">Retirada · R. 7 de Setembro, 2480 - Centro, Gov. Valadares</span>
            </div>
          )}

          {/* Items */}
          <div className="border-t border-white/10 pt-4 space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-white/70">{item.quantity}× {item.name}</span>
                <span className="text-white/50">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t border-white/10 pt-3 space-y-1">
            <div className="flex justify-between text-sm text-white/50">
              <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-sm text-white/50">
                <span>Entrega</span><span>{formatCurrency(order.deliveryFee)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-white/50">
                <span>Desconto</span><span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-white text-lg pt-1">
              <span>Total</span><span className="text-[#EE5C13]">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Last update */}
        <p className="text-center text-white/20 text-xs">
          Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · atualiza automaticamente
        </p>

        <Link href="/cardapio" className="block text-center text-[#EE5C13] text-sm font-bold hover:underline">
          Ver cardápio →
        </Link>
      </div>
    </div>
  )
}
