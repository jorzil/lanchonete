'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Logo } from '@/components/brand/logo'
import { formatCurrency, type Order } from '@/lib/data'
import { MapPin, Phone, Lock, LogOut, RotateCcw, CheckCircle2, Loader2, Bike, Navigation } from 'lucide-react'

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
  // Compartilhamento de localização em tempo real
  const [sharingId, setSharingId] = useState<string | null>(null)
  const [geoError, setGeoError] = useState('')
  const watchRef = useRef<number | null>(null)
  const lastSentRef = useRef(0)
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null)
  const [lastSentAt, setLastSentAt] = useState<number | null>(null)
  const [sentAgo, setSentAgo] = useState('')

  const sendLocation = useCallback(async (orderId: string, lat: number, lng: number) => {
    try {
      const token = sessionStorage.getItem(TOKEN_KEY) ?? ''
      const res = await fetch('/api/entregas/localizacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-entregas-token': token },
        body: JSON.stringify({ orderId, lat, lng }),
      })
      if (res.ok) {
        lastSentRef.current = Date.now()
        setLastSentAt(Date.now())
        setGeoError('')
      } else {
        setGeoError('Falha ao enviar a posição ao servidor.')
      }
    } catch {
      setGeoError('Sem conexão — a posição não está sendo enviada.')
    }
  }, [])

  const stopSharing = useCallback(async (orderId?: string) => {
    const id = orderId ?? sharingId
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }
    if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null }
    if (wakeLockRef.current) { wakeLockRef.current.release().catch(() => {}); wakeLockRef.current = null }
    setSharingId(null)
    setGeoError('')
    setLastSentAt(null)
    if (id) {
      try {
        const token = sessionStorage.getItem(TOKEN_KEY) ?? ''
        await fetch(`/api/entregas/localizacao?orderId=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { 'x-entregas-token': token },
        })
      } catch {}
    }
  }, [sharingId])

  function startSharing(orderId: string) {
    if (!('geolocation' in navigator)) {
      setGeoError('Este aparelho não permite localização.')
      return
    }
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current)
    if (pingRef.current) clearInterval(pingRef.current)
    setGeoError('')
    setSharingId(orderId)
    lastSentRef.current = 0

    const onError = (err: GeolocationPositionError) => {
      setGeoError(
        err.code === err.PERMISSION_DENIED
          ? 'Permissão negada. Libere a localização para este site nas configurações do navegador.'
          : err.code === err.TIMEOUT
            ? 'GPS demorou a responder — tentando de novo…'
            : 'Não foi possível obter a localização (sinal fraco?).',
      )
    }

    // 1) watchPosition: reage a cada movimento detectado pelo GPS
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        // Limita a 1 envio a cada 4s para não sobrecarregar
        if (Date.now() - lastSentRef.current < 4000) return
        sendLocation(orderId, pos.coords.latitude, pos.coords.longitude)
      },
      onError,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 25_000 },
    )

    // 2) Batida periódica: garante posição nova mesmo se o watch não disparar
    //    (parado no semáforo, GPS "preguiçoso", aba em segundo plano…)
    const ping = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendLocation(orderId, pos.coords.latitude, pos.coords.longitude),
        onError,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 25_000 },
      )
    }
    ping()
    pingRef.current = setInterval(ping, 10_000)

    // 3) Mantém a tela ligada — com o celular bloqueado o GPS para
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    nav.wakeLock?.request('screen').then((lock) => { wakeLockRef.current = lock }).catch(() => {})
  }

  // Reativa a tela ligada ao voltar para a aba
  useEffect(() => {
    if (!sharingId) return
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
      nav.wakeLock?.request('screen').then((lock) => { wakeLockRef.current = lock }).catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [sharingId])

  // "enviado há X" para o entregador conferir se está funcionando
  useEffect(() => {
    if (!sharingId) { setSentAgo(''); return }
    const tick = () => {
      if (!lastSentAt) { setSentAgo('aguardando o GPS…'); return }
      const s = Math.round((Date.now() - lastSentAt) / 1000)
      setSentAgo(s < 15 ? 'enviando agora' : s < 60 ? `última: há ${s}s` : `última: há ${Math.round(s / 60)} min`)
    }
    tick()
    const t = setInterval(tick, 5000)
    return () => clearInterval(t)
  }, [sharingId, lastSentAt])

  // Encerra o watch ao sair da tela
  useEffect(() => () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current)
  }, [])

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
        // Entrega concluída: encerra o compartilhamento de localização
        if (sharingId === order.id) stopSharing(order.id)
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

                {/* Compartilhar localização em tempo real */}
                <div className="border-t border-white/10 pt-3">
                  <button
                    onClick={() => (sharingId === order.id ? stopSharing() : startSharing(order.id))}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                      sharingId === order.id
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-white/8 text-white/70 hover:bg-white/15 border border-white/10'
                    }`}
                  >
                    <Navigation size={15} className={sharingId === order.id ? 'animate-pulse' : ''} />
                    {sharingId === order.id ? 'Compartilhando localização — parar' : 'Compartilhar minha localização'}
                  </button>
                  {sharingId === order.id && (
                    <p className="mt-1.5 text-center text-[11px] text-emerald-400">
                      O cliente está acompanhando você no mapa · {sentAgo}
                    </p>
                  )}
                  {sharingId === order.id && (
                    <p className="mt-1 text-center text-[10px] text-white/30">
                      Mantenha esta tela aberta durante o trajeto.
                    </p>
                  )}
                  {geoError && sharingId === order.id && (
                    <p className="mt-1.5 text-center text-[11px] text-red-400">{geoError}</p>
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
