"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  DollarSign,
  Receipt,
  CalendarDays,
  Bell,
  ShoppingCart,
  Package,
  Settings,
  ArrowRight,
} from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from "recharts"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatCurrency, ORDER_SOURCE_LABELS, type Order } from "@/lib/store"
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/mock-orders"
import { loadOrders } from "@/lib/orders-storage"
import { supabaseConfigured } from "@/lib/supabase"

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function KpiCard({
  title,
  value,
  sub,
  growth,
  icon: Icon,
  empty,
}: {
  title: string
  value: string
  sub?: string
  growth?: number
  icon: React.ElementType
  empty?: boolean
}) {
  const up = (growth ?? 0) >= 0
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{empty ? "—" : value}</p>
          {empty ? (
            <p className="mt-1 text-xs text-gray-400">Sem pedidos ainda</p>
          ) : (
            sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EE5C13]/10">
          <Icon className="h-5 w-5 text-[#EE5C13]" />
        </div>
      </div>
      {!empty && growth !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span
            className={cn(
              "flex items-center gap-0.5 font-semibold",
              up ? "text-green-600" : "text-red-600",
            )}
          >
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(growth).toFixed(1)}%
          </span>
          <span className="text-gray-400">vs. período anterior</span>
        </div>
      )}
    </Card>
  )
}

const QUICK_LINKS = [
  { href: "/admin/pedidos", label: "Ver Pedidos", icon: ShoppingBag },
  { href: "/admin/pdv", label: "PDV", icon: ShoppingCart },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
]

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    async function load() {
      if (supabaseConfigured) {
        try {
          const res = await fetch("/api/orders")
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

  const hasOrders = orders.length > 0
  const newCount = useMemo(() => orders.filter((o) => o.status === "novo").length, [orders])

  const stats = useMemo(() => {
    const valid = orders.filter((o) => o.status !== "cancelado")
    const now = new Date()
    const today = startOfToday()
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(today)
    monthAgo.setDate(monthAgo.getDate() - 30)

    const inRange = (o: Order, from: Date) => new Date(o.createdAt) >= from

    const todayOrders = valid.filter((o) => isSameDay(new Date(o.createdAt), now))
    const weekOrders = valid.filter((o) => inRange(o, weekAgo))
    const monthOrders = valid.filter((o) => inRange(o, monthAgo))

    const sum = (arr: Order[]) => arr.reduce((acc, o) => acc + o.total, 0)

    const monthRevenue = sum(monthOrders)
    const ticket = monthOrders.length ? monthRevenue / monthOrders.length : 0

    const byDay: { day: string; pedidos: number; faturamento: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dayOrders = valid.filter((o) => isSameDay(new Date(o.createdAt), d))
      byDay.push({
        day: WEEKDAY_LABELS[d.getDay()],
        pedidos: dayOrders.length,
        faturamento: sum(dayOrders),
      })
    }

    // Faturamento por mês (últimos 6 meses) — dados reais de todas as datas.
    const byMonth: { month: string; faturamento: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")
      const monthRev = valid
        .filter((o) => {
          const od = new Date(o.createdAt)
          return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth()
        })
        .reduce((acc, o) => acc + o.total, 0)
      byMonth.push({ month: label, faturamento: monthRev })
    }

    // Por origem (mês)
    const sources = ["site", "whatsapp", "ifood", "pdv"] as const
    const bySource = sources.map((src) => {
      const list = monthOrders.filter((o) => (o.source ?? "site") === src)
      return { src, count: list.length, revenue: sum(list) }
    })

    return {
      todayCount: todayOrders.length,
      weekCount: weekOrders.length,
      monthCount: monthOrders.length,
      todayRevenue: sum(todayOrders),
      weekRevenue: sum(weekOrders),
      monthRevenue,
      ticket,
      byDay,
      byMonth,
      bySource,
    }
  }, [orders])

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 6),
    [orders],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Visão geral da operação da Mais Sub</p>
      </div>

      {newCount > 0 && (
        <Link
          href="/admin/pedidos"
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
        >
          <Bell className="h-4 w-4 shrink-0" />
          🔔 {newCount} pedido(s) novo(s) aguardando confirmação
          <ArrowRight className="ml-auto h-4 w-4" />
        </Link>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Pedidos hoje"
          value={String(stats.todayCount)}
          sub={`${stats.weekCount} na semana · ${stats.monthCount} no mês`}
          growth={12.5}
          icon={ShoppingBag}
          empty={!hasOrders}
        />
        <KpiCard
          title="Faturamento hoje"
          value={formatCurrency(stats.todayRevenue)}
          sub={`Semana: ${formatCurrency(stats.weekRevenue)}`}
          growth={8.3}
          icon={DollarSign}
          empty={!hasOrders}
        />
        <KpiCard
          title="Faturamento no mês"
          value={formatCurrency(stats.monthRevenue)}
          growth={15.2}
          icon={CalendarDays}
          empty={!hasOrders}
        />
        <KpiCard
          title="Ticket médio"
          value={formatCurrency(stats.ticket)}
          growth={-2.1}
          icon={Receipt}
          empty={!hasOrders}
        />
      </div>

      {/* Por origem (mês) */}
      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Pedidos por origem (mês)</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.bySource.map((s) => {
            const meta = ORDER_SOURCE_LABELS[s.src]
            return (
              <div key={s.src} className="rounded-xl border border-gray-100 p-3">
                <p className="text-sm font-medium text-gray-500">{meta.emoji} {meta.label}</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{s.count}</p>
                <p className="text-xs text-gray-400">{formatCurrency(s.revenue)}</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Acesso rápido */}
      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Acesso rápido</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-[#EE5C13]/40 hover:bg-[#EE5C13]/5 hover:text-[#EE5C13]"
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </div>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">
            Pedidos por dia (últimos 7 dias)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} stroke="#9ca3af" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#9ca3af" allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "#f3f4f6" }}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                />
                <Bar dataKey="pedidos" fill="#EE5C13" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">
            Faturamento por mês (últimos 6 meses)
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.byMonth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EE5C13" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#EE5C13" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="#9ca3af" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#9ca3af" />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="faturamento"
                  stroke="#EE5C13"
                  strokeWidth={2}
                  fill="url(#rev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Últimos pedidos */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">Últimos pedidos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                <th className="px-5 py-3 font-medium">Pedido</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{o.orderNumber}</td>
                  <td className="px-5 py-3 text-gray-700">{o.customer.name}</td>
                  <td className="px-5 py-3 capitalize text-gray-500">{o.orderType}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{formatCurrency(o.total)}</td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[o.status])}>
                      {STATUS_LABELS[o.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                    Sem pedidos ainda. Os pedidos do site aparecerão aqui.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
