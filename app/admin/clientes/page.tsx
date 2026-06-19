"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/store"
import { MOCK_ORDERS } from "@/lib/mock-orders"

export default function ClientesPage() {
  const customers = useMemo(() => {
    const map = new Map<
      string,
      { name: string; phone: string; orders: number; total: number; last: string }
    >()
    for (const o of MOCK_ORDERS) {
      const key = o.customer.phone
      const cur = map.get(key)
      if (cur) {
        cur.orders += 1
        cur.total += o.total
        if (o.createdAt > cur.last) cur.last = o.createdAt
      } else {
        map.set(key, {
          name: o.customer.name,
          phone: o.customer.phone,
          orders: 1,
          total: o.total,
          last: o.createdAt,
        })
      }
    }
    return [...map.values()].sort((a, b) => b.total - a.total)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <p className="text-sm text-gray-500">Base de clientes (dados de demonstração)</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Telefone</th>
                <th className="px-5 py-3 font-medium">Pedidos</th>
                <th className="px-5 py-3 font-medium">Total gasto</th>
                <th className="px-5 py-3 font-medium">Último pedido</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.phone} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {c.name}
                    {c.orders >= 2 && (
                      <Badge className="ml-2 bg-[#EE5C13]/10 text-[#EE5C13] hover:bg-[#EE5C13]/10">
                        Recorrente
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{c.phone}</td>
                  <td className="px-5 py-3 text-gray-700">{c.orders}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{formatCurrency(c.total)}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(c.last).toLocaleDateString("pt-BR")}
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
