"use client"

import { useEffect, useState, useMemo } from "react"
import { Search, Star, Users, TrendingUp, ShoppingBag, Phone, MapPin, ChevronRight, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/store"
import { loadOrders } from "@/lib/orders-storage"
import { supabaseConfigured } from "@/lib/supabase"
import type { Order } from "@/lib/data"

interface CustomerStat {
  phone: string
  name: string
  orders: Order[]
  totalOrders: number
  totalSpent: number
  avgTicket: number
  firstOrder: string
  lastOrder: string
  daysSinceLast: number
  classification: 'novo' | 'recorrente' | 'vip' | 'inativo'
}

function classify(c: { totalOrders: number; totalSpent: number; daysSinceLast: number }): CustomerStat['classification'] {
  if (c.daysSinceLast > 60) return 'inativo'
  if (c.totalOrders >= 5 || c.totalSpent >= 300) return 'vip'
  if (c.totalOrders >= 2) return 'recorrente'
  return 'novo'
}

const CLASS_CONFIG = {
  vip:        { label: 'VIP',        cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  recorrente: { label: 'Recorrente', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  novo:       { label: 'Novo',       cls: 'bg-green-100 text-green-700 border-green-200' },
  inativo:    { label: 'Inativo',    cls: 'bg-gray-100 text-gray-500 border-gray-200' },
}

function buildCustomers(orders: Order[]): CustomerStat[] {
  const map = new Map<string, Order[]>()
  for (const o of orders) {
    const key = o.customer.phone
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(o)
  }

  return [...map.entries()].map(([phone, ords]) => {
    const sorted = [...ords].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const totalSpent = ords.reduce((s, o) => s + o.total, 0)
    const lastOrder = sorted[sorted.length - 1].createdAt
    const daysSinceLast = Math.floor((Date.now() - new Date(lastOrder).getTime()) / 86_400_000)
    const totalOrders = ords.length
    const stat = { totalOrders, totalSpent, daysSinceLast }
    return {
      phone,
      name: sorted[sorted.length - 1].customer.name,
      orders: sorted.reverse(),
      totalOrders,
      totalSpent,
      avgTicket: totalSpent / totalOrders,
      firstOrder: sorted[sorted.length - 1].createdAt,
      lastOrder,
      daysSinceLast,
      classification: classify(stat),
    }
  }).sort((a, b) => b.totalSpent - a.totalSpent)
}

export default function ClientesPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<CustomerStat | null>(null)

  useEffect(() => {
    async function load() {
      if (supabaseConfigured) {
        try {
          const res = await fetch('/api/orders')
          if (res.ok) {
            const { orders: rows } = await res.json()
            setOrders(rows)
            return
          }
        } catch {}
      }
      setOrders(loadOrders())
    }
    load()
  }, [])

  const customers = useMemo(() => buildCustomers(orders), [orders])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)) : customers
  }, [customers, query])

  const stats = useMemo(() => ({
    total: customers.length,
    vip: customers.filter(c => c.classification === 'vip').length,
    totalOrders: orders.length,
    revenue: orders.reduce((s, o) => s + o.total, 0),
  }), [customers, orders])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <p className="text-sm text-gray-500">CRM — base de clientes completa</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total de Clientes', value: stats.total, icon: <Users className="h-5 w-5 text-blue-500" /> },
          { label: 'Clientes VIP', value: stats.vip, icon: <Star className="h-5 w-5 text-yellow-500" /> },
          { label: 'Total de Pedidos', value: stats.totalOrders, icon: <ShoppingBag className="h-5 w-5 text-orange-500" /> },
          { label: 'Receita Total', value: formatCurrency(stats.revenue), icon: <TrendingUp className="h-5 w-5 text-green-500" /> },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gray-50 p-2">{k.icon}</div>
              <div>
                <p className="text-[11px] text-gray-400">{k.label}</p>
                <p className="text-lg font-bold text-gray-900">{k.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Telefone</th>
                <th className="px-5 py-3 font-medium">Pedidos</th>
                <th className="px-5 py-3 font-medium">Total Gasto</th>
                <th className="px-5 py-3 font-medium">Ticket Médio</th>
                <th className="px-5 py-3 font-medium">Último Pedido</th>
                <th className="px-5 py-3 font-medium">Classificação</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                  {orders.length === 0 ? 'Nenhum pedido recebido ainda.' : 'Nenhum cliente encontrado.'}
                </td></tr>
              ) : filtered.map((c) => {
                const cfg = CLASS_CONFIG[c.classification]
                return (
                  <tr key={c.phone} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(c)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EE5C13]/10 text-[#EE5C13] text-[13px] font-bold shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{c.phone}</td>
                    <td className="px-5 py-3 text-gray-700 font-medium">{c.totalOrders}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{formatCurrency(c.totalSpent)}</td>
                    <td className="px-5 py-3 text-gray-600">{formatCurrency(c.avgTicket)}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(c.lastOrder).toLocaleDateString('pt-BR')}
                      {c.daysSinceLast === 0 && <span className="ml-1 text-green-500">hoje</span>}
                      {c.daysSinceLast > 0 && <span className="ml-1 text-gray-400">({c.daysSinceLast}d)</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-300">
                      <ChevronRight className="h-4 w-4" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EE5C13]/10 text-[#EE5C13] font-bold">
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{selected.name}</p>
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CLASS_CONFIG[selected.classification].cls}`}>
                    {CLASS_CONFIG[selected.classification].label}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-5 space-y-5 text-sm">
              {/* Contact */}
              <div className="rounded-xl bg-gray-50 p-3 space-y-1.5">
                <div className="flex items-center gap-2 text-gray-600"><Phone size={13} /> {selected.phone}</div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Pedidos', value: selected.totalOrders },
                  { label: 'Total Gasto', value: formatCurrency(selected.totalSpent) },
                  { label: 'Ticket Médio', value: formatCurrency(selected.avgTicket) },
                ].map(m => (
                  <div key={m.label} className="rounded-xl border border-gray-100 p-3 text-center">
                    <p className="text-[11px] text-gray-400">{m.label}</p>
                    <p className="font-bold text-gray-900 mt-0.5">{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                <div>Primeiro pedido: <strong>{new Date(selected.firstOrder).toLocaleDateString('pt-BR')}</strong></div>
                <div>Último pedido: <strong>{new Date(selected.lastOrder).toLocaleDateString('pt-BR')}</strong></div>
              </div>

              {/* Order history */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Histórico de Pedidos</p>
                <div className="space-y-2">
                  {selected.orders.slice(0, 10).map((o, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                      <div>
                        <span className="font-medium text-gray-800">#{o.orderNumber}</span>
                        <span className="ml-2 text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{formatCurrency(o.total)}</span>
                        <span className="text-[10px] text-gray-400 capitalize">{o.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
