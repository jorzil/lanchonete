"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Search, ChevronLeft, ChevronRight, Eye, MapPin, Phone, FileText, Inbox, Trash2, Bell, Wifi, WifiOff, Printer, Copy, Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { formatCurrency, MENU, PRODUCTS, ORDER_SOURCE_LABELS, type Order, type OrderStatus, type OrderSource, type CartItem } from "@/lib/store"
import { PAYMENT_LABELS } from "@/lib/mock-orders"
import { loadOrders, saveOrders } from "@/lib/orders-storage"
import { supabase, supabaseConfigured } from "@/lib/supabase"
import { setOrderStatus, setOrderPayment, deleteDbOrder } from "@/lib/db-orders"
import { toast } from "sonner"
import { printOrder, getPrintSettings, getPrintQueue } from "@/lib/print-order"

const PAGE_SIZE = 8

const STATUS_CONFIG: Record<string, { label: string; cls: string; next?: string }> = {
  novo:          { label: "Novo Pedido",       cls: "bg-orange-100 text-orange-700 border-orange-200", next: "aceito" },
  aceito:        { label: "Aceito",            cls: "bg-blue-100 text-blue-700 border-blue-200",       next: "em_preparo" },
  em_preparo:    { label: "Em Preparo",        cls: "bg-purple-100 text-purple-700 border-purple-200", next: "pronto" },
  pronto:        { label: "Pronto",            cls: "bg-emerald-100 text-emerald-700 border-emerald-200", next: "saiu_entrega" },
  saiu_entrega:  { label: "Saiu p/ Entrega",  cls: "bg-cyan-100 text-cyan-700 border-cyan-200",       next: "entregue" },
  entregue:      { label: "Entregue",          cls: "bg-green-100 text-green-700 border-green-200" },
  cancelado:     { label: "Cancelado",         cls: "bg-red-100 text-red-700 border-red-200" },
}

function buildWaMessage(status: string, orderNumber: string): string {
  const trackUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://www.maissub.com.br'}/acompanhar/${orderNumber}`
  const track = `\n\n🔍 *Acompanhe seu pedido em tempo real:*\n${trackUrl}`
  const msgs: Record<string, string> = {
    aceito:       `✅ *Seu pedido #${orderNumber} foi aceito!* Entrou na fila de preparo. Em breve começamos a preparar. 🥪${track}`,
    em_preparo:   `👨‍🍳 *Seu pedido #${orderNumber} está sendo preparado!* Caprichamos em cada detalhe. Em breve fica pronto!${track}`,
    pronto:       `✨ *Seu pedido #${orderNumber} ficou pronto!* Será enviado em instantes. 🚀${track}`,
    saiu_entrega: `🛵 *Seu pedido #${orderNumber} saiu para entrega!* Estamos a caminho. Fique de olho!${track}`,
    entregue:     `🎉 *Pedido #${orderNumber} entregue!* Obrigado por escolher a Mais Sub. Bom apetite! 🥖`,
    cancelado:    `❌ *Seu pedido #${orderNumber} foi cancelado.* Lamentamos o inconveniente. Entre em contato: (33) 98461-9205`,
  }
  return msgs[status] ?? ''
}

// Mensagem completa (inclui o código de entrega quando "saiu para entrega")
function buildStatusMessage(status: string, orderNumber: string, deliveryCode?: string): string {
  let msg = buildWaMessage(status, orderNumber)
  if (!msg) return ''
  if (status === 'saiu_entrega' && deliveryCode) {
    msg += `\n\n🔐 *Código de entrega:* ${deliveryCode}\nInforme este código ao entregador para confirmar o recebimento.`
  }
  return msg
}

// ─── Sirene contínua ────────────────────────────────────────────────────────
let sirenCtx: AudioContext | null = null
let sirenOsc: OscillatorNode | null = null
let sirenGain: GainNode | null = null
let sirenInterval: ReturnType<typeof setInterval> | null = null

// Mantém UM contexto de áudio vivo e desbloqueado (autoplay policy dos browsers).
function ensureAudio(): AudioContext | null {
  try {
    if (!sirenCtx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      sirenCtx = new Ctx()
    }
    if (sirenCtx.state === 'suspended') sirenCtx.resume()
    return sirenCtx
  } catch { return null }
}

// Desbloqueia o áudio na primeira interação do usuário (clique/tecla/toque).
function unlockAudio() {
  const ctx = ensureAudio()
  if (!ctx) return
  // toca um silêncio mínimo só para "destravar"
  try {
    const o = ctx.createOscillator(); const g = ctx.createGain()
    g.gain.value = 0; o.connect(g); g.connect(ctx.destination)
    o.start(); o.stop(ctx.currentTime + 0.01)
  } catch {}
}

function startSiren() {
  try {
    stopSiren()
    const ctx = ensureAudio()
    if (!ctx) return
    sirenOsc = ctx.createOscillator()
    sirenGain = ctx.createGain()
    sirenOsc.connect(sirenGain)
    sirenGain.connect(ctx.destination)
    sirenOsc.type = 'sawtooth'
    sirenGain.gain.setValueAtTime(0.3, ctx.currentTime)

    // Sobe e desce o tom em loop (efeito sirene)
    let up = true
    sirenOsc.frequency.setValueAtTime(600, ctx.currentTime)
    sirenOsc.start()

    sirenInterval = setInterval(() => {
      if (!sirenCtx || !sirenOsc) return
      const now = sirenCtx.currentTime
      sirenOsc.frequency.cancelScheduledValues(now)
      sirenOsc.frequency.setValueAtTime(up ? 600 : 900, now)
      sirenOsc.frequency.linearRampToValueAtTime(up ? 900 : 600, now + 0.4)
      up = !up
    }, 400)
  } catch {}
}

function stopSiren() {
  try {
    if (sirenInterval) { clearInterval(sirenInterval); sirenInterval = null }
    if (sirenOsc) { sirenOsc.stop(); sirenOsc = null }
    sirenGain = null
    // NÃO fecha o contexto — mantém desbloqueado para os próximos pedidos
  } catch {}
}

function beep() {
  try {
    const ctx = new AudioContext()
    const notes = [523, 659, 784]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = ctx.currentTime + i * 0.18
      const end = start + 0.15
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.5, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, end)
      osc.start(start)
      osc.stop(end)
    })
  } catch {}
}

// ─── Detalhes do item (ingredientes do sub pronto + personalização) ──────────
const _prodById = new Map(PRODUCTS.map((p) => [p.id, p]))
const _breadNames = new Map(MENU.breads.map((b) => [b.key, b.name]))
const _meatNames = new Map(MENU.meats.map((m) => [m.key, m.name]))
const _cheeseNames = new Map(MENU.cheeses.map((c) => [c.key, c.name]))
const _saladNames = new Map(MENU.salads.map((s) => [s.key, s.name]))
const _sauceNames = new Map(MENU.sauces.map((s) => [s.key, s.name]))
const _extraNames = new Map(MENU.extras.map((e) => [e.key, e.name]))

function buildItemDetails(item: CartItem): string[] {
  const lines: string[] = []
  const prod = _prodById.get(item.productId)
  if (prod && (prod.category === "subs-15cm" || prod.category === "subs-30cm") && prod.description) {
    lines.push(`Ingredientes: ${prod.description}`)
  }
  const c = item.customization
  if (c) {
    if (c.bread) lines.push(`Pão: ${_breadNames.get(c.bread) ?? c.bread}`)
    if (c.meat) lines.push(`Carne: ${_meatNames.get(c.meat) ?? c.meat}`)
    if (c.cheeses?.length) lines.push(`Queijos: ${c.cheeses.map((k) => _cheeseNames.get(k) ?? k).join(", ")}`)
    if (c.salads?.length) {
      const salads = c.salads.filter((s) => s !== "salada-completa")
      if (c.salads.includes("salada-completa")) lines.push("Saladas: Salada Completa")
      else if (salads.length) lines.push(`Saladas: ${salads.map((k) => _saladNames.get(k) ?? k).join(", ")}`)
    }
    if (c.sauces?.length) lines.push(`Molhos: ${c.sauces.map((k) => _sauceNames.get(k) ?? k).join(", ")}`)
    const extras = Object.entries(c.extras ?? {}).filter(([, q]) => q > 0)
    if (extras.length) lines.push(`Adicionais: ${extras.map(([k, q]) => `${_extraNames.get(k) ?? k} x${q}`).join(", ")}`)
    if (c.notes) lines.push(`Obs: ${c.notes}`)
  } else if (item.notes) {
    lines.push(item.notes)
  }
  return lines
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  })
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loaded, setLoaded] = useState(false)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "todos">("todos")
  const [sourceFilter, setSourceFilter] = useState<OrderSource | "todos">("todos")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [soundReady, setSoundReady] = useState(false)
  const [printedIds, setPrintedIds] = useState<Set<string>>(new Set())

  function refreshPrinted() {
    setPrintedIds(new Set(getPrintQueue().filter((j) => j.status === "printed").map((j) => j.orderId)))
  }
  useEffect(() => { refreshPrinted() }, [])

  function handlePrint(order: Order) {
    printOrder(order)
    setTimeout(refreshPrinted, 500)
  }

  function testSiren() {
    unlockAudio()
    setSoundReady(true)
    startSiren()
    setTimeout(() => stopSiren(), 1500)
  }

  function copyStatusMessage(order: Order) {
    const msg = buildStatusMessage(order.status, order.orderNumber, order.deliveryCode)
    if (!msg) return
    try {
      navigator.clipboard?.writeText(msg)
      setCopiedId(order.id)
      setTimeout(() => setCopiedId(null), 1800)
    } catch {}
  }
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Order | null>(null)
  const [toDelete, setToDelete] = useState<Order | null>(null)
  const [newCount, setNewCount] = useState(0)
  const [isRealtime, setIsRealtime] = useState(false)
  const prevOrderIds = useRef<Set<string>>(new Set())

  // Load orders — Supabase if configured, else localStorage
  async function loadAll() {
    if (supabaseConfigured) {
      try {
        const res = await fetch("/api/orders")
        if (res.ok) {
          const { orders: rows } = await res.json()
          setOrders(rows)
          setNewCount(rows.filter((o: Order) => o.status === "novo").length)
          rows.forEach((o: Order) => prevOrderIds.current.add(o.id))
          setLoaded(true)
          return
        }
      } catch {}
    }
    // Fallback to localStorage
    const local = loadOrders()
    setOrders(local)
    setNewCount(local.filter((o) => o.status === "novo").length)
    local.forEach((o) => prevOrderIds.current.add(o.id))
    setLoaded(true)
  }

  // Desbloqueia o áudio na primeira interação (exigência dos navegadores)
  useEffect(() => {
    const onInteract = () => { unlockAudio(); setSoundReady(true) }
    window.addEventListener("click", onInteract, { once: true })
    window.addEventListener("keydown", onInteract, { once: true })
    window.addEventListener("touchstart", onInteract, { once: true })
    return () => {
      window.removeEventListener("click", onInteract)
      window.removeEventListener("keydown", onInteract)
      window.removeEventListener("touchstart", onInteract)
    }
  }, [])

  useEffect(() => {
    loadAll()

    if (!supabaseConfigured) return

    // Realtime subscription
    const channel = supabase
      .channel("orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        loadAll()
        if (payload.eventType === "INSERT" && !prevOrderIds.current.has(payload.new.id)) {
          startSiren()
          const settings = getPrintSettings()
          if (settings.autoPrintOnNew) {
            // order will be loaded in next render; trigger after state update
            setTimeout(() => {
              setOrders((prev) => {
                const newOrder = prev.find((o) => o.id === payload.new.id)
                if (newOrder) printOrder(newOrder)
                return prev
              })
            }, 1000)
          }
        }
      })
      .subscribe((status) => {
        setIsRealtime(status === "SUBSCRIBED")
      })

    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders
      .filter((o) => statusFilter === "todos" || o.status === statusFilter)
      .filter((o) => sourceFilter === "todos" || (o.source ?? "site") === sourceFilter)
      .filter((o) => !q || o.customer.name.toLowerCase().includes(q) || o.orderNumber.toLowerCase().includes(q))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [orders, statusFilter, sourceFilter, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function openWhatsAppWeb(phone: string, status: string, orderNumber: string, deliveryCode?: string) {
    const msg = buildStatusMessage(status, orderNumber, deliveryCode)
    if (!msg) return
    const clean = phone.replace(/\D/g, "")
    const num = clean.startsWith("55") ? clean : `55${clean}`
    const url = `https://api.whatsapp.com/send/?phone=${num}&text=${encodeURIComponent(msg)}&type=phone_number&app_absent=0`
    window.open(url, "_blank", "noopener")
  }

  async function advanceStatus(order: Order, nextStatus: string) {
    if (nextStatus === 'aceito') stopSiren()
    // Pedidos do iFood: para o WhatsApp manual é dispensável; sincroniza com a API.
    if (order.source === 'ifood' && order.externalId) {
      fetch('/api/integrations/ifood/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ externalId: order.externalId, status: nextStatus }),
      }).catch(() => {})
    } else {
      // Open WhatsApp Web with the ready-to-send message (synchronous, keeps user
      // gesture so the browser does not block the popup).
      openWhatsAppWeb(order.customer.phone, nextStatus, order.orderNumber, order.deliveryCode)
    }
    const id = order.id
    if (supabaseConfigured) {
      const result = await setOrderStatus(order, nextStatus)
      if (!result.ok) {
        toast.error(`Não foi possível ${nextStatus === 'cancelado' ? 'cancelar' : 'atualizar'} o pedido: ${result.error ?? 'erro'}`)
      }
      await loadAll()
    }
    // localStorage fallback
    setOrders((prev) => {
      const next = prev.map((o) =>
        o.id === id ? { ...o, status: nextStatus as OrderStatus, updatedAt: new Date().toISOString() } : o
      )
      saveOrders(next)
      return next
    })
    setSelected((prev) => prev?.id === id ? { ...prev, status: nextStatus as OrderStatus } : prev)
  }

  async function changePayment(order: Order, paymentMethod: string) {
    // Atualiza localmente na hora
    setOrders((prev) => {
      const next = prev.map((o) => o.id === order.id ? { ...o, paymentMethod: paymentMethod as Order["paymentMethod"] } : o)
      saveOrders(next)
      return next
    })
    setSelected((prev) => prev?.id === order.id ? { ...prev, paymentMethod: paymentMethod as Order["paymentMethod"] } : prev)
    if (supabaseConfigured) {
      const result = await setOrderPayment(order, paymentMethod)
      if (!result.ok) toast.error(`Não foi possível alterar o pagamento: ${result.error ?? 'erro'}`)
      else toast.success('Forma de pagamento atualizada')
    }
  }

  async function handleDelete() {
    if (!toDelete) return
    if (supabaseConfigured) {
      try { await deleteDbOrder(toDelete.id) } catch {}
    }
    setOrders((prev) => {
      const next = prev.filter((o) => o.id !== toDelete.id)
      saveOrders(next)
      return next
    })
    if (selected?.id === toDelete.id) setSelected(null)
    setToDelete(null)
  }

  const STATUS_TABS: Array<{ key: OrderStatus | "todos"; label: string; count?: number }> = [
    { key: "todos", label: "Todos" },
    { key: "novo" as OrderStatus, label: "Novos", count: orders.filter((o) => o.status === "novo").length || undefined },
    { key: "aceito" as OrderStatus, label: "Aceitos" },
    { key: "em_preparo" as OrderStatus, label: "Em Preparo" },
    { key: "pronto" as OrderStatus, label: "Prontos" },
    { key: "saiu_entrega" as OrderStatus, label: "Entrega" },
    { key: "entregue" as OrderStatus, label: "Entregues" },
    { key: "cancelado" as OrderStatus, label: "Cancelados" },
  ]

  const isEmpty = loaded && orders.length === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Pedidos
            {newCount > 0 && (
              <span className="inline-flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                <Bell size={10} /> {newCount} novo{newCount > 1 ? "s" : ""}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
            {supabaseConfigured ? (
              isRealtime ? (
                <><Wifi size={12} className="text-emerald-500" /> Atualização em tempo real</>
              ) : (
                <><WifiOff size={12} className="text-amber-500" /> Conectando…</>
              )
            ) : (
              <><WifiOff size={12} className="text-gray-400" /> Modo offline (localStorage)</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            onClick={testSiren}
            className={cn("text-xs", soundReady ? "text-emerald-600 border-emerald-200" : "text-amber-600 border-amber-300")}
            title="Testar/ativar o som de alerta"
          >
            {soundReady ? "🔔 Som ativo" : "🔕 Ativar som"}
          </Button>
          <Button variant="outline" size="sm" onClick={loadAll} className="text-xs">
            Atualizar
          </Button>
        </div>
      </div>

      {isEmpty ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
            <Inbox className="h-7 w-7 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Nenhum pedido ainda</h2>
          <p className="max-w-sm text-sm text-gray-500">
            {supabaseConfigured
              ? "Os pedidos realizados no site aparecerão aqui em tempo real."
              : "Configure o Supabase para receber pedidos em tempo real. Por enquanto, pedidos feitos neste dispositivo aparecem aqui."}
          </p>
        </Card>
      ) : (
        <>
          {/* Status tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setStatusFilter(t.key); setPage(1) }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1",
                  statusFilter === t.key
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {t.label}
                {t.count ? (
                  <span className="bg-white/30 text-white rounded-full px-1.5 py-px text-[10px] font-bold">
                    {t.count}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {/* Filtro por origem */}
          <div className="flex gap-1.5 flex-wrap">
            {([["todos", "Todas origens"], ["site", "🌐 Site"], ["whatsapp", "📱 WhatsApp"], ["ifood", "🍔 iFood"], ["pdv", "🏪 PDV"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setSourceFilter(key as OrderSource | "todos"); setPage(1) }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  sourceFilter === key ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por cliente ou nº..."
              className="pl-10"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            />
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                    <th className="px-5 py-3 font-medium">Pedido</th>
                    <th className="px-5 py-3 font-medium">Origem</th>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Data</th>
                    <th className="px-5 py-3 font-medium text-right">Total</th>
                    <th className="px-5 py-3 font-medium">Pagamento</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((o) => {
                    const cfg = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.novo
                    const isRetirada = o.orderType === "retirada"
                    const nextStatus = cfg.next === "saiu_entrega" && isRetirada ? "entregue" : cfg.next
                    const isNew = o.status === "novo"
                    return (
                      <tr
                        key={o.id}
                        className={cn(
                          "border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors",
                          isNew && "bg-orange-50/60 border-l-2 border-l-orange-400"
                        )}
                      >
                        <td className="px-5 py-3">
                          <span className="font-medium text-gray-900">{o.orderNumber}</span>
                          {isNew && <span className="ml-2 text-[10px] font-bold text-orange-600 uppercase tracking-wide animate-pulse">novo</span>}
                          <div className="mt-1">
                            {printedIds.has(o.id) ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                <Printer size={9} /> Impresso
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                                <Printer size={9} /> Não impresso
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600">
                            {ORDER_SOURCE_LABELS[o.source ?? "site"].emoji} {ORDER_SOURCE_LABELS[o.source ?? "site"].label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="text-gray-900 font-medium">{o.customer.name}</div>
                          <div className="text-xs text-gray-400">{o.customer.phone}</div>
                          {o.deliveryCode && (
                            <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-[#EE5C13] bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                              🔐 {o.deliveryCode}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{formatDate(o.createdAt)}</td>
                        <td className="px-5 py-3 font-semibold text-gray-900 text-right">{formatCurrency(o.total)}</td>
                        <td className="px-5 py-3 text-gray-600 text-xs">
                          {PAYMENT_LABELS[o.paymentMethod as keyof typeof PAYMENT_LABELS] ?? o.paymentMethod}
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium border", cfg.cls)}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {nextStatus && (
                              <button
                                onClick={() => advanceStatus(o, nextStatus)}
                                className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 whitespace-nowrap"
                              >
                                → {isRetirada && nextStatus === "entregue" && o.status === "pronto" ? "Retirado" : STATUS_CONFIG[nextStatus]?.label}
                              </button>
                            )}
                            {o.status !== "cancelado" && o.status !== "entregue" && (
                              <button
                                onClick={() => advanceStatus(o, "cancelado")}
                                className="rounded-lg px-2 py-1 text-[11px] font-medium text-red-500 hover:bg-red-50"
                              >
                                Cancelar
                              </button>
                            )}
                            {!!buildWaMessage(o.status, o.orderNumber) && (
                              <Button
                                variant="ghost" size="sm"
                                className={cn("hover:bg-gray-100", copiedId === o.id ? "text-emerald-600" : "text-gray-400 hover:text-gray-700")}
                                onClick={() => copyStatusMessage(o)}
                                title="Copiar mensagem do status"
                              >
                                {copiedId === o.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => setSelected(o)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              className="text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => handlePrint(o)}
                              title="Imprimir cupom"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              className="text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setToDelete(o)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-gray-400">
                        Nenhum pedido encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
              <span>{filtered.length} pedido(s) · página {currentPage} de {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-gray-900">{selected.orderNumber}</h2>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", STATUS_CONFIG[selected.status]?.cls)}>
                  {STATUS_CONFIG[selected.status]?.label}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              {/* Customer */}
              <div className="rounded-xl bg-gray-50 p-3 space-y-1">
                <p className="font-semibold text-gray-900">{selected.customer.name}</p>
                <p className="flex items-center gap-1 text-gray-500"><Phone size={13} /> {selected.customer.phone}</p>
                {selected.address && (
                  <p className="flex items-start gap-1 text-gray-500">
                    <MapPin size={13} className="mt-0.5 shrink-0" />
                    {selected.address.street}, {selected.address.number}
                    {selected.address.complement ? ` - ${selected.address.complement}` : ""} · {selected.address.neighborhood}, {selected.address.city}/{selected.address.state}
                  </p>
                )}
                {selected.deliveryCode && (
                  <p className="flex items-center gap-1.5 pt-1 text-gray-700">
                    🔐 <span className="font-semibold">Código de entrega:</span>
                    <span className="font-black tracking-widest text-[#EE5C13]">{selected.deliveryCode}</span>
                  </p>
                )}
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Itens</p>
                <div className="space-y-2">
                  {selected.items.map((item, i) => {
                    const details = buildItemDetails(item)
                    return (
                      <div key={i}>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-900">{item.quantity}× {item.name}</span>
                          <span className="text-gray-600 shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                        {details.length > 0 && (
                          <ul className="mt-0.5 ml-5 space-y-0.5">
                            {details.map((d, j) => (
                              <li key={j} className="text-[11px] text-gray-500 leading-snug">– {d}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {selected.notes && (
                <div className="flex gap-2 rounded-lg bg-yellow-50 p-3 text-yellow-800">
                  <FileText size={14} className="mt-0.5 shrink-0" />
                  <span>{selected.notes}</span>
                </div>
              )}

              {/* Totals */}
              <div className="space-y-1 border-t pt-3">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(selected.subtotal)}</span></div>
                <div className="flex justify-between text-gray-500"><span>Entrega</span><span>{formatCurrency(selected.deliveryFee)}</span></div>
                {selected.discount > 0 && <div className="flex justify-between text-gray-500"><span>Desconto{selected.couponCode ? ` (${selected.couponCode})` : ''}</span><span>-{formatCurrency(selected.discount)}</span></div>}
                <div className="flex justify-between font-bold text-gray-900 text-base pt-1"><span>Total</span><span>{formatCurrency(selected.total)}</span></div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-400">Pagamento</span>
                  <select
                    value={selected.paymentMethod}
                    onChange={(e) => changePayment(selected, e.target.value)}
                    className="text-xs font-medium text-gray-700 border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-[#EE5C13]"
                  >
                    {Object.entries(PAYMENT_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status actions */}
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Avançar status</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    if (key === selected.status) return null
                    if (key === "novo") return null
                    if (key === "saiu_entrega" && selected.orderType === "retirada") return null
                    const label = key === "entregue" && selected.orderType === "retirada" ? "Retirado" : cfg.label
                    return (
                      <button
                        key={key}
                        onClick={() => advanceStatus(selected, key)}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:opacity-80", cfg.cls)}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Actions row */}
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrint(selected)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl py-2.5 text-sm transition-colors"
                >
                  <Printer size={15} /> Imprimir Cupom
                </button>
                {!!buildWaMessage(selected.status, selected.orderNumber) && (
                  <>
                    <button
                      onClick={() => copyStatusMessage(selected)}
                      className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl py-2.5 px-3 text-sm transition-colors"
                      title="Copiar mensagem do status"
                    >
                      {copiedId === selected.id ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                      {copiedId === selected.id ? "Copiado!" : "Copiar"}
                    </button>
                    <button
                      onClick={() => openWhatsAppWeb(selected.customer.phone, selected.status, selected.orderNumber, selected.deliveryCode)}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1fbd5b] text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
                    >
                      💬 WhatsApp
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Excluir pedido?</h3>
            <p className="mt-1 text-sm text-gray-500">
              O pedido <strong>{toDelete.orderNumber}</strong> será removido permanentemente.
            </p>
            <div className="mt-5 flex gap-3">
              <button className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setToDelete(null)}>
                Cancelar
              </button>
              <button className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600" onClick={handleDelete}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
