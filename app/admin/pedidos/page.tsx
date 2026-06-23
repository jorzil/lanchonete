"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, ChevronLeft, ChevronRight, Eye, MapPin, Phone, FileText, Inbox, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { formatCurrency, type Order, type OrderStatus } from "@/lib/store"
import {
  STATUS_LABELS,
  STATUS_STYLES,
  STATUS_ORDER,
  PAYMENT_LABELS,
} from "@/lib/mock-orders"
import { loadOrders, saveOrders } from "@/lib/orders-storage"

const PAGE_SIZE = 6

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function customizationSummary(order: Order, index: number): string | null {
  const c = order.items[index]?.customization
  if (!c) return null
  const parts: string[] = [c.size]
  if (c.cheeses.length) parts.push(c.cheeses.join(", "))
  if (c.salads.length) parts.push(c.salads.join(", "))
  if (c.sauces.length) parts.push(c.sauces.join(", "))
  return parts.join(" · ")
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loaded, setLoaded] = useState(false)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "todos">("todos")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Order | null>(null)
  const [toDelete, setToDelete] = useState<Order | null>(null)

  useEffect(() => {
    setOrders(loadOrders())
    setLoaded(true)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders
      .filter((o) => (statusFilter === "todos" ? true : o.status === statusFilter))
      .filter((o) =>
        !q
          ? true
          : o.customer.name.toLowerCase().includes(q) ||
            o.orderNumber.toLowerCase().includes(q),
      )
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [orders, statusFilter, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function confirmDelete() {
    if (!toDelete) return
    const id = toDelete.id
    setOrders((prev) => {
      const next = prev.filter((o) => o.id !== id)
      saveOrders(next)
      return next
    })
    setSelected((prev) => (prev?.id === id ? null : prev))
    setToDelete(null)
  }

  function updateStatus(id: string, status: OrderStatus) {
    setOrders((prev) => {
      const next = prev.map((o) =>
        o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o,
      )
      saveOrders(next)
      return next
    })
    setSelected((prev) => (prev && prev.id === id ? { ...prev, status } : prev))
  }

  const isEmpty = loaded && orders.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-sm text-gray-500">Acompanhe e gerencie os pedidos da loja</p>
      </div>

      {isEmpty ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
            <Inbox className="h-7 w-7 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Nenhum pedido ainda</h2>
          <p className="max-w-sm text-sm text-gray-500">
            Os pedidos realizados no site aparecerão aqui automaticamente.
          </p>
        </Card>
      ) : (
        <>
          {/* Filtros */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por cliente ou nº do pedido..."
                className="pl-10"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as OrderStatus | "todos")
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                    <th className="px-5 py-3 font-medium">Pedido</th>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Data</th>
                    <th className="px-5 py-3 font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((o) => (
                    <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{o.orderNumber}</td>
                      <td className="px-5 py-3">
                        <div className="text-gray-900">{o.customer.name}</div>
                        <div className="text-xs text-gray-400 capitalize">{o.orderType}</div>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{formatDate(o.createdAt)}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{formatCurrency(o.total)}</td>
                      <td className="px-5 py-3">
                        <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as OrderStatus)}>
                          <SelectTrigger className="h-8 w-44 border-0 bg-transparent p-0 shadow-none focus:ring-0">
                            <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[o.status])}>
                              {STATUS_LABELS[o.status]}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_ORDER.map((s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelected(o)}>
                            <Eye className="mr-1 h-4 w-4" /> Detalhes
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => setToDelete(o)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                        Nenhum pedido encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
              <span>
                {filtered.length} pedido(s) · página {currentPage} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Modal confirmar exclusão */}
      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Excluir pedido?</h3>
            <p className="mt-1 text-sm text-gray-500">
              O pedido <strong>{toDelete.orderNumber}</strong> de{" "}
              <strong>{toDelete.customer.name}</strong> será removido permanentemente.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setToDelete(null)}
              >
                Cancelar
              </button>
              <button
                className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600"
                onClick={confirmDelete}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalhe */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="admin-theme max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {selected.orderNumber}
                    <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[selected.status])}>
                      {STATUS_LABELS[selected.status]}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => setToDelete(selected)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Excluir
                  </Button>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="font-medium text-gray-900">{selected.customer.name}</div>
                  <div className="mt-1 flex items-center gap-1 text-gray-500">
                    <Phone className="h-3.5 w-3.5" /> {selected.customer.phone}
                  </div>
                  {selected.address && (
                    <div className="mt-1 flex items-start gap-1 text-gray-500">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        {selected.address.street}, {selected.address.number}
                        {selected.address.complement && ` - ${selected.address.complement}`} ·{" "}
                        {selected.address.neighborhood}, {selected.address.city}/{selected.address.state}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Itens</p>
                  <div className="space-y-2">
                    {selected.items.map((item, i) => {
                      const custom = customizationSummary(selected, i)
                      return (
                        <div key={item.id} className="flex justify-between gap-3">
                          <div>
                            <span className="font-medium text-gray-900">
                              {item.quantity}x {item.name}
                            </span>
                            {custom && <p className="text-xs text-gray-400">{custom}</p>}
                          </div>
                          <span className="whitespace-nowrap text-gray-700">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {selected.notes && (
                  <div className="flex items-start gap-2 rounded-lg bg-yellow-50 p-3 text-yellow-800">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{selected.notes}</span>
                  </div>
                )}

                <div className="space-y-1 border-t border-gray-100 pt-3">
                  <Row label="Subtotal" value={formatCurrency(selected.subtotal)} />
                  <Row label="Taxa de entrega" value={formatCurrency(selected.deliveryFee)} />
                  {selected.discount > 0 && (
                    <Row label="Desconto" value={`- ${formatCurrency(selected.discount)}`} />
                  )}
                  <div className="flex justify-between pt-1 text-base font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatCurrency(selected.total)}</span>
                  </div>
                  <p className="pt-1 text-xs text-gray-400">
                    Pagamento: {PAYMENT_LABELS[selected.paymentMethod]}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-400">
                    Atualizar status
                  </p>
                  <Select
                    value={selected.status}
                    onValueChange={(v) => updateStatus(selected.id, v as OrderStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-gray-500">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
