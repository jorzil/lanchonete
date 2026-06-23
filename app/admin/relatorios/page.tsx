"use client"

import { useEffect, useState, useMemo } from "react"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/store"
import { PAYMENT_LABELS } from "@/lib/mock-orders"
import { loadOrders } from "@/lib/orders-storage"
import { supabaseConfigured } from "@/lib/supabase"
import { getCoupons } from "@/lib/coupon-storage"
import type { Order } from "@/lib/data"

const COLORS = ["#EE5C13", "#0B2C5C", "#163A6E", "#FF6B1A", "#6366f1", "#10b981", "#f59e0b"]

export default function RelatoriosPage() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    async function load() {
      if (supabaseConfigured) {
        try {
          const res = await fetch('/api/orders')
          if (res.ok) { const { orders: rows } = await res.json(); setOrders(rows); return }
        } catch {}
      }
      setOrders(loadOrders())
    }
    load()
  }, [])

  const coupons = useMemo(() => getCoupons(), [])

  const data = useMemo(() => {
    const valid = orders.filter(o => o.status !== 'cancelado')

    // Payment breakdown
    const byPayment = new Map<string, number>()
    const byProduct = new Map<string, number>()
    const byDay = new Map<string, number>()
    const byStatus = new Map<string, number>()

    for (const o of valid) {
      const label = PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod
      byPayment.set(label, (byPayment.get(label) ?? 0) + o.total)

      for (const item of o.items) {
        byProduct.set(item.name, (byProduct.get(item.name) ?? 0) + item.quantity)
      }

      const day = new Date(o.createdAt).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
      byDay.set(day, (byDay.get(day) ?? 0) + o.total)

      byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1)
    }

    const payment = [...byPayment.entries()].map(([name, value]) => ({ name, value }))
    const topProducts = [...byProduct.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([name, qty]) => ({ name, qty }))
    const dailyRevenue = [...byDay.entries()].slice(-14).map(([day, total]) => ({ day, total }))
    const statusBreakdown = [...byStatus.entries()].map(([status, count]) => ({ status, count }))

    const revenue = valid.reduce((s, o) => s + o.total, 0)
    const avgTicket = valid.length ? revenue / valid.length : 0
    const totalDiscount = orders.reduce((s, o) => s + o.discount, 0)
    const cancelRate = orders.length ? (orders.filter(o => o.status === 'cancelado').length / orders.length) * 100 : 0

    return { payment, topProducts, dailyRevenue, statusBreakdown, revenue, avgTicket, totalDiscount, cancelRate, totalOrders: orders.length, validOrders: valid.length }
  }, [orders])

  // Coupon stats
  const couponStats = useMemo(() => {
    return coupons
      .filter(c => c.usedCount > 0)
      .sort((a, b) => b.usedCount - a.usedCount)
      .map(c => ({
        code: c.code,
        name: c.name,
        type: c.type,
        discount: c.discount,
        usedCount: c.usedCount,
        totalDiscount: c.type === 'percentage' ? 0 : c.usedCount * c.discount,
      }))
  }, [coupons])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-500">{orders.length === 0 ? 'Nenhum pedido ainda' : `${orders.length} pedidos carregados`}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total de Pedidos', value: data.totalOrders },
          { label: 'Receita Total', value: formatCurrency(data.revenue) },
          { label: 'Ticket Médio', value: formatCurrency(data.avgTicket) },
          { label: 'Taxa de Cancelamento', value: `${data.cancelRate.toFixed(1)}%` },
        ].map(k => (
          <Card key={k.label} className="p-4">
            <p className="text-[11px] text-gray-400">{k.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{k.value}</p>
          </Card>
        ))}
      </div>

      {orders.length === 0 ? (
        <Card className="p-10 text-center text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-medium">Nenhum dado disponível ainda.</p>
          <p className="text-sm mt-1">Os relatórios aparecerão aqui após os primeiros pedidos.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Payment breakdown */}
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Faturamento por forma de pagamento</h3>
            {data.payment.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">Sem dados</p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.payment} dataKey="value" nameKey="name" outerRadius={90} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                      {data.payment.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Top products */}
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Produtos mais vendidos</h3>
            {data.topProducts.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">Sem dados</p>
            ) : (
              <div className="space-y-2">
                {data.topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EE5C13]/10 text-xs font-bold text-[#EE5C13] shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-700 truncate">{p.name}</div>
                      <div className="h-1.5 rounded-full bg-gray-100 mt-1">
                        <div className="h-1.5 rounded-full bg-[#EE5C13]" style={{ width: `${(p.qty / data.topProducts[0].qty) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 shrink-0">{p.qty} un.</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Daily revenue */}
          {data.dailyRevenue.length > 1 && (
            <Card className="p-5 lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Faturamento diário (últimos 14 dias)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.dailyRevenue} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="total" fill="#EE5C13" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Coupon report */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Relatório de Cupons</h2>
        {couponStats.length === 0 ? (
          <Card className="p-6 text-center text-gray-400 text-sm">Nenhum cupom utilizado ainda.</Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                    <th className="px-5 py-3 font-medium">Código</th>
                    <th className="px-5 py-3 font-medium">Nome</th>
                    <th className="px-5 py-3 font-medium">Desconto</th>
                    <th className="px-5 py-3 font-medium">Utilizações</th>
                    <th className="px-5 py-3 font-medium">Desconto Total</th>
                  </tr>
                </thead>
                <tbody>
                  {couponStats.map(c => (
                    <tr key={c.code} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-[12px] font-bold text-gray-800">{c.code}</code>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{c.name}</td>
                      <td className="px-5 py-3 text-gray-700">
                        {c.type === 'percentage' ? `${c.discount}%` : c.type === 'fixed' ? formatCurrency(c.discount) : 'Frete grátis'}
                      </td>
                      <td className="px-5 py-3 font-semibold text-gray-900">{c.usedCount}×</td>
                      <td className="px-5 py-3 font-semibold text-red-600">
                        {c.type === 'fixed' ? `-${formatCurrency(c.totalDiscount)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
