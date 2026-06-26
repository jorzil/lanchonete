'use client'

import { useState, useEffect, useCallback } from 'react'
import { Logo } from '@/components/brand/logo'
import { formatCurrency, type Order } from '@/lib/data'
import { MapPin, Phone, Lock, LogOut, RotateCcw, CheckCircle2, Loader2, Bike } from 'lucide-react'

const AUTH_KEY = 'entregas_auth'
const TOKEN_KEY = 'entregas_token'

type Delivery = Omit<Order, 'deliveryCode'> & { hasCode?: boolean }

export default function EntregasPage() {
  const [authed, setAuthed] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    setAuthed(sessionStorage.getItem(AUTH_KEY) === '1')
    setChecked(true)
  }, [])

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#0B1F3A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#EE5C13] animate-spin" />
      </div>
    )
  }

  return authed ? (
    <DeliveryDashboard onLogout={() => { sessionStorage.removeItem(AUTH_KEY); sessionStorage.removeItem(TOKEN_KEY); setAuthed(false) }} />
  ) : (
    <LoginScreen onSuccess={(token) => { sessionStorage.setItem(AUTH_KEY, '1'); sessionStorage.setItem(TOKEN_KEY, token); setAuthed(true) }} />
  )
}

function LoginScreen({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/entregas/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password }),
      })
      const data = await res.json()
      if (res.ok && data.ok) { onSuccess(data.token ?? ''); return }
      setError(data.error ?? 'Usuário ou senha inválidos')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1F3A] flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8"><Logo height={64} /></div>
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EE5C13] mx-auto mb-4">
          <Bike className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-white font-black text-2xl text-center mb-1">Área de Entregas</h1>
        <p className="text-white/40 text-sm text-center mb-7">Acesso restrito ao entregador</p>

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="text"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="Usuário"
            autoCapitalize="none"
            className="w-full bg-white border border-white/10 rounded-xl px-4 py-3.5 text-black font-bold placeholder:text-black/30 outline-none focus:border-[#EE5C13] transition-colors"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full bg-white border border-white/10 rounded-xl px-4 py-3.5 text-black font-bold placeholder:text-black/30 outline-none focus:border-[#EE5C13] transition-colors"
          />
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || !user || !password}
            className="w-full flex items-center justify-center gap-2 bg-[#EE5C13] hover:bg-orange-600 text-white font-black py-3.5 rounded-xl text-sm transition-colors disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock size={14} /> Entrar</>}
          </button>
        </form>
      </div>
    </div>
  )
}

function DeliveryDashboard({ onLogout }: { onLogout: () => void }) {
  const [orders, setOrders] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [codes, setCodes] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<Record<string, { type: 'ok' | 'err'; msg: string }>>({})
  const [confirming, setConfirming] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const token = sessionStorage.getItem(TOKEN_KEY) ?? ''
      const res = await fetch('/api/entregas', { cache: 'no-store', headers: { 'x-entregas-token': token } })
      if (res.ok) {
        const { orders } = await res.json()
        setOrders(orders ?? [])
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 20000)
    return () => clearInterval(t)
  }, [load])

  async function confirm(order: Delivery) {
    const code = (codes[order.id] ?? '').trim()
    if (code.length !== 4) {
      setFeedback((f) => ({ ...f, [order.id]: { type: 'err', msg: 'Digite os 4 dígitos do código.' } }))
      return
    }
    setConfirming(order.id)
    setFeedback((f) => { const n = { ...f }; delete n[order.id]; return n })
    try {
      const token = sessionStorage.getItem(TOKEN_KEY) ?? ''
      const res = await fetch('/api/entregas/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-entregas-token': token },
        body: JSON.stringify({ orderId: order.id, code }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setFeedback((f) => ({ ...f, [order.id]: { type: 'ok', msg: 'Entrega confirmada! ✓' } }))
        setTimeout(() => setOrders((prev) => prev.filter((o) => o.id !== order.id)), 1200)
      } else {
        setFeedback((f) => ({ ...f, [order.id]: { type: 'err', msg: data.error ?? 'Código incorreto.' } }))
      }
    } catch {
      setFeedback((f) => ({ ...f, [order.id]: { type: 'err', msg: 'Erro de conexão.' } }))
    } finally {
      setConfirming(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1F3A]">
      <header className="bg-[#0B2C5C] border-b border-white/10 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EE5C13] shrink-0">
          <Bike className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white font-black text-base leading-tight">Entregas</p>
          <p className="text-white/40 text-[11px]">Confirme com o código do cliente</p>
        </div>
        <button onClick={load} className="text-white/40 hover:text-white/70 p-2 transition-colors" title="Atualizar">
          <RotateCcw size={16} />
        </button>
        <button onClick={onLogout} className="text-white/40 hover:text-red-400 p-2 transition-colors" title="Sair">
          <LogOut size={16} />
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/40 text-sm">
            <Loader2 size={16} className="animate-spin mr-2" /> Carregando entregas…
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Bike className="w-14 h-14 text-white/15 mx-auto mb-4" />
            <p className="text-white/60 font-bold">Nenhuma entrega no momento</p>
            <p className="text-white/30 text-sm mt-1">Pedidos prontos e a caminho aparecem aqui.</p>
          </div>
        ) : (
          orders.map((order) => {
            const fb = feedback[order.id]
            return (
              <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white font-black text-lg">#{order.orderNumber}</span>
                  <span className="text-[#EE5C13] font-bold text-sm">{formatCurrency(order.total)}</span>
                </div>

                <div className="space-y-1.5 text-sm">
                  <p className="flex items-center gap-2 text-white/70">
                    <Phone size={13} className="text-[#EE5C13] shrink-0" />
                    {order.customer.name} · {order.customer.phone}
                  </p>
                  {order.address && (
                    <p className="flex items-start gap-2 text-white/70">
                      <MapPin size={13} className="text-[#EE5C13] shrink-0 mt-0.5" />
                      <span>
                        {order.address.street}, {order.address.number}
                        {order.address.complement ? ` - ${order.address.complement}` : ''} · {order.address.neighborhood}, {order.address.city}
                      </span>
                    </p>
                  )}
                </div>

                <div className="border-t border-white/10 pt-3">
                  <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-2">Código do cliente</p>
                  <div className="flex gap-2">
                    <input
                      inputMode="numeric"
                      maxLength={4}
                      value={codes[order.id] ?? ''}
                      onChange={(e) =>
                        setCodes((c) => ({ ...c, [order.id]: e.target.value.replace(/\D/g, '').slice(0, 4) }))
                      }
                      placeholder="0000"
                      className="flex-1 bg-white border border-white/10 rounded-xl px-4 py-3 text-black text-xl font-black tracking-[0.4em] text-center outline-none focus:border-[#EE5C13] transition-colors"
                    />
                    <button
                      onClick={() => confirm(order)}
                      disabled={confirming === order.id}
                      className="flex items-center gap-1.5 bg-[#EE5C13] hover:bg-orange-600 text-white font-bold px-4 rounded-xl text-sm transition-colors disabled:opacity-40 shrink-0"
                    >
                      {confirming === order.id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                      Confirmar
                    </button>
                  </div>
                  {fb && (
                    <p className={`text-xs mt-2 font-medium ${fb.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fb.msg}
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
