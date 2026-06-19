"use client"

import { useMemo } from "react"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/store"
import { MOCK_ORDERS, PAYMENT_LABELS } from "@/lib/mock-orders"

const COLORS = ["#EE5C13", "#0B2C5C", "#163A6E", "#FF6B1A", "#6366f1"]

export default function RelatoriosPage() {
  const data = useMemo(() => {
    const valid = MOCK_ORDERS.filter((o) => o.status !== "cancelado")

    const byPayment = new Map<string, number>()
    const byProduct = new Map<string, number>()
    for (const o of valid) {
      const label = PAYMENT_LABELS[o.paymentMethod]
      byPayment.set(label, (byPayment.get(label) ?? 0) + o.total)
      for (const item of o.items) {
        byProduct.set(item.name, (byProduct.get(item.name) ?? 0) + item.quantity)
      }
    }

    const payment = [...byPayment.entries()].map(([name, value]) => ({ name, value }))
    const topProducts = [...byProduct.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }))

    return { payment, topProducts }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-500">Análises da operação (dados de demonstração)</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Faturamento por forma de pagamento</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.payment} dataKey="value" nameKey="name" outerRadius={90} label>
                  {data.payment.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Produtos mais vendidos</h3>
          <div className="space-y-3">
            {data.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EE5C13]/10 text-xs font-bold text-[#EE5C13]">
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-sm text-gray-700">{p.name}</span>
                <span className="text-sm font-semibold text-gray-900">{p.qty} un.</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
