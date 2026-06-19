"use client"

import { useMemo } from "react"
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  DollarSign,
  Receipt,
  CalendarDays,
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
import { formatCurrency, type Order } from "@/lib/store"
import { MOCK_ORDERS, STATUS_LABELS, STATUS_STYLES } from "@/lib/mock-orders"

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
}: {
  title: string
  value: string
  sub?: string
  growth?: number
  icon: React.ElementType
}) {
  const up = (growth ?? 0) >= 0
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EE5C13]/10">
          <Icon className="h-5 w-5 text-[#EE5C13]" />
        </div>
      </div>
      {growth !== undefined && (
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

export default function AdminDashboard() {
  const stats = useMemo(() => {
    const valid = MOCK_ORDERS.filter((o) => o.status !== "cancelado")
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

    // Vendas por dia da semana (últimos 7 dias)
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

    // Faturamento por mês (últimos 6 meses) — base mock determinística
    const monthlyBase = [4820, 5310, 4990, 6120, 5870, monthRevenue || 6450]
    const monthLabels: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthLabels.push(d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""))
    }
    const byMonth = monthLabels.map((m, i) => ({ month: m, faturamento: monthlyBase[i] }))

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
    }
  }, [])

  const recentOrders = useMemo(
    () =>
      [...MOCK_ORDERS]
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 6),
    [],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Visão geral da operação da Mais Sub</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Pedidos hoje"
          value={String(stats.todayCount)}
          sub={`${stats.weekCount} na semana · ${stats.monthCount} no mês`}
          growth={12.5}
          icon={ShoppingBag}
        />
        <KpiCard
          title="Faturamento hoje"
          value={formatCurrency(stats.todayRevenue)}
          sub={`Semana: ${formatCurrency(stats.weekRevenue)}`}
          growth={8.3}
          icon={DollarSign}
        />
        <KpiCard
          title="Faturamento no mês"
          value={formatCurrency(stats.monthRevenue)}
          growth={15.2}
          icon={CalendarDays}
        />
        <KpiCard
          title="Ticket médio"
          value={formatCurrency(stats.ticket)}
          growth={-2.1}
          icon={Receipt}
        />
      </div>

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
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.byMonth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B2C5C" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0B2C5C" stopOpacity={0} />
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
                  stroke="#163A6E"
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
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
