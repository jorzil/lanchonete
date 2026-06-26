'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sandwich, Phone, ChevronRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, type Order } from '@/lib/data'
import { loadOrders } from '@/lib/orders-storage'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  novo:         { label: 'Aguardando',      color: 'text-orange-400' },
  aceito:       { label: 'Aceito',          color: 'text-blue-400'   },
  em_preparo:   { label: 'Em Preparo',      color: 'text-purple-400' },
  pronto:       { label: 'Pronto!',         color: 'text-emerald-400'},
  saiu_entrega: { label: 'Saiu p/ Entrega', color: 'text-cyan-400'   },
  entregue:     { label: 'Entregue',        color: 'text-green-400'  },
  cancelado:    { label: 'Cancelado',       color: 'text-red-400'    },
}

export default function AcompanharEntradaPage() {
  const [phone,   setPhone]   = useState('')
  const [results, setResults] = useState<Order[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const router = useRouter()

  function formatPhone(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 2)  return d
    if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setResults(null)

    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 8) {
      setError('Informe um telefone válido.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/orders/buscar?phone=${cleanPhone}`)
      if (res.ok) {
        const { orders } = await res.json()
        setResults(orders)
        setLoading(false)
        return
      }
      const { error: apiErr } = await res.json()
      setError(apiErr ?? 'Nenhum pedido encontrado.')
    } catch {
      // Fallback localStorage
      const local = loadOrders()
      const found = local.filter(o =>
        o.customer.phone.replace(/\D/g, '').includes(cleanPhone)
      ).slice(0, 5)

      if (found.length > 0) setResults(found)
      else setError('Nenhum pedido encontrado com esse telefone.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0B1F3A] flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-3 mb-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EE5C13]">
          <Sandwich className="h-5 w-5 text-white" />
        </div>
        <p className="text-white font-black text-xl">Mais<span className="text-[#EE5C13]">Sub</span></p>
      </Link>

      <div className="w-full max-w-sm">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h1 className="text-white font-black text-2xl mb-1 text-center">Acompanhar Pedido</h1>
          <p className="text-white/40 text-sm mb-8 text-center">
            Digite o telefone usado no pedido para ver o status.
          </p>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                placeholder="(33) 99999-9999"
                className="w-full bg-white/8 border border-white/12 rounded-xl pl-10 pr-4 py-3.5 text-white text-base font-bold placeholder:text-white/20 outline-none focus:border-[#EE5C13] transition-colors"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || phone.replace(/\D/g,'').length < 8}
              className="w-full flex items-center justify-center gap-2 bg-[#EE5C13] hover:bg-orange-600 text-white font-black py-3.5 rounded-xl text-sm transition-colors disabled:opacity-40"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Buscar meu pedido'
              }
            </button>
          </form>
        </div>

        {/* Results */}
        {results && results.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest text-center mb-3">
              {results.length} pedido{results.length > 1 ? 's' : ''} encontrado{results.length > 1 ? 's' : ''}
            </p>
            {results.map(order => {
              const cfg = STATUS_LABELS[order.status] ?? STATUS_LABELS.novo
              const date = new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
              const time = new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              return (
                <button
                  key={order.id}
                  onClick={() => router.push(`/acompanhar/${order.orderNumber}`)}
                  className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#EE5C13]/40 rounded-2xl p-4 text-left transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-black text-sm">#{order.orderNumber}</span>
                      <span className={`text-xs font-bold ${cfg.color}`}>· {cfg.label}</span>
                    </div>
                    <p className="text-white/40 text-xs truncate">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''} · {formatCurrency(order.total)}
                    </p>
                    <p className="text-white/25 text-xs flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {date} às {time}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-white/25 shrink-0" />
                </button>
              )
            })}
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/cardapio" className="text-[#EE5C13] text-sm font-bold hover:underline">
            Fazer um novo pedido →
          </Link>
        </div>
      </div>
    </div>
  )
}
