"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Banknote,
  QrCode,
  CreditCard,
  CheckCircle2,
  ShoppingCart,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  PRODUCTS,
  formatCurrency,
  generateOrderNumber,
  type Product,
  type CartItem,
  type Order,
  type PaymentMethod,
} from "@/lib/store"
import { addOrder } from "@/lib/orders-storage"
import { consumeStockForProduct } from "@/lib/recipes-storage"

type Category = "subs-15cm" | "subs-30cm" | "combos" | "bebidas"
type DiscountType = "percentage" | "fixed"

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "subs-15cm", label: "Subs 15cm" },
  { key: "subs-30cm", label: "Subs 30cm" },
  { key: "combos", label: "Combos" },
  { key: "bebidas", label: "Bebidas" },
]

const PAYMENTS: { key: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { key: "dinheiro", label: "Dinheiro", icon: Banknote },
  { key: "pix", label: "PIX", icon: QrCode },
  { key: "cartao-debito", label: "Débito", icon: CreditCard },
  { key: "cartao-credito", label: "Crédito", icon: CreditCard },
]

type SaleItem = CartItem

export default function PdvPage() {
  const [now, setNow] = useState<Date | null>(null)
  const [category, setCategory] = useState<Category>("subs-15cm")
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<SaleItem[]>([])
  const [notes, setNotes] = useState("")
  const [payment, setPayment] = useState<PaymentMethod>("dinheiro")
  const [discountType, setDiscountType] = useState<DiscountType>("fixed")
  const [discountValue, setDiscountValue] = useState("")
  const [received, setReceived] = useState("")
  const [confirmed, setConfirmed] = useState<Order | null>(null)

  // Relógio do header (atualiza a cada minuto)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const products = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PRODUCTS.filter((p) => p.active).filter((p) => {
      if (q) {
        return (
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
        )
      }
      return p.category === category
    })
  }, [query, category])

  function addProduct(p: Product) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === p.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i,
        )
      }
      return [
        ...prev,
        {
          id: `pdv-${p.id}-${Date.now()}`,
          productId: p.id,
          name: p.name,
          price: p.price,
          quantity: 1,
          image: p.image,
        },
      ]
    })
  }

  function changeQty(id: string, delta: number) {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0),
    )
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const subtotal = useMemo(
    () => items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    [items],
  )

  const discount = useMemo(() => {
    const v = parseFloat(discountValue.replace(",", ".")) || 0
    if (v <= 0) return 0
    const raw = discountType === "percentage" ? subtotal * (v / 100) : v
    return Math.min(raw, subtotal)
  }, [discountValue, discountType, subtotal])

  const total = Math.max(0, subtotal - discount)

  const receivedNum = parseFloat(received.replace(",", ".")) || 0
  const change = payment === "dinheiro" ? Math.max(0, receivedNum - total) : 0

  function resetSale() {
    setItems([])
    setNotes("")
    setPayment("dinheiro")
    setDiscountType("fixed")
    setDiscountValue("")
    setReceived("")
  }

  function finishSale() {
    if (items.length === 0) return
    const nowIso = new Date().toISOString()
    const order: Order = {
      id: `pdv-${Date.now()}`,
      orderNumber: generateOrderNumber(),
      items,
      customer: { name: "Venda no balcão (PDV)", phone: "" },
      orderType: "retirada",
      paymentMethod: payment,
      subtotal,
      deliveryFee: 0,
      discount,
      total,
      status: "entregue", // venda presencial = já entregue
      notes: notes.trim() || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    }
    addOrder(order)
    // Baixa automática de estoque conforme as fichas técnicas
    items.forEach((i) => consumeStockForProduct(i.productId, i.quantity))
    setConfirmed(order)
  }

  function newSale() {
    setConfirmed(null)
    resetSale()
  }

  return (
    <div className="-m-4 lg:-m-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 lg:px-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ponto de Venda</h1>
          <p className="text-sm text-gray-500">
            {now
              ? now.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                }) +
                " · " +
                now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
              : "—"}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/10">
          <ShoppingCart className="h-5 w-5 text-emerald-600" />
        </div>
      </div>

      <div className="flex flex-col lg:h-[calc(100vh-8.5rem)] lg:flex-row">
        {/* ─── ESQUERDA: Catálogo ─────────────────────────────── */}
        <div className="flex flex-1 flex-col bg-gray-50 lg:w-[60%]">
          <div className="space-y-4 p-4 lg:p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar produto ou código..."
                className="bg-white pl-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {!query && (
              <Tabs value={category} onValueChange={(v) => setCategory(v as Category)}>
                <TabsList className="w-full">
                  {CATEGORIES.map((c) => (
                    <TabsTrigger key={c.key} value={c.key} className="flex-1 text-xs sm:text-sm">
                      {c.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6 lg:px-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addProduct(p)}
                  className="group flex flex-col rounded-xl border border-gray-200 bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                >
                  <div className="mb-2 flex h-14 items-center justify-center rounded-lg bg-gray-50 text-3xl">
                    {p.image}
                  </div>
                  <p className="line-clamp-2 text-sm font-medium leading-tight text-gray-900">
                    {p.name}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(p.price)}
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white transition-colors group-hover:bg-emerald-700">
                      <Plus className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              ))}
              {products.length === 0 && (
                <p className="col-span-full py-12 text-center text-sm text-gray-400">
                  Nenhum produto encontrado.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─── DIREITA: Carrinho da venda ─────────────────────── */}
        <div className="flex flex-col border-t border-gray-200 bg-white lg:w-[40%] lg:border-l lg:border-t-0">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-bold text-gray-900">Venda Atual</h2>
            <p className="text-xs text-gray-400">{items.length} item(ns)</p>
          </div>

          {/* Itens */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-center text-sm text-gray-400">
                <ShoppingCart className="h-8 w-8 text-gray-300" />
                Clique nos produtos para adicionar à venda.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-xl">
                      {item.image}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => changeQty(item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => changeQty(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="w-16 shrink-0 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-300 transition-colors hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé: observação, pagamento, desconto, total */}
          <div className="space-y-4 border-t border-gray-100 px-5 py-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Observação</label>
              <Textarea
                placeholder="Ex: sem cebola, embalar para viagem..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-16 resize-none text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">
                Forma de pagamento
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PAYMENTS.map((pm) => {
                  const Icon = pm.icon
                  const active = payment === pm.key
                  return (
                    <button
                      key={pm.key}
                      onClick={() => setPayment(pm.key)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-xs font-medium transition-colors",
                        active
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {pm.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">Desconto</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="flex-1"
                />
                <div className="flex overflow-hidden rounded-md border border-gray-200">
                  {(["fixed", "percentage"] as DiscountType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setDiscountType(t)}
                      className={cn(
                        "px-3 text-sm font-semibold transition-colors",
                        discountType === t
                          ? "bg-gray-900 text-white"
                          : "bg-white text-gray-500 hover:bg-gray-50",
                      )}
                    >
                      {t === "fixed" ? "R$" : "%"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumo */}
            <div className="space-y-1 border-t border-gray-100 pt-3 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Desconto</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium text-gray-500">TOTAL</span>
                <span className="text-3xl font-black text-gray-900">{formatCurrency(total)}</span>
              </div>
            </div>

            {payment === "dinheiro" && (
              <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm text-gray-600">Valor recebido</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0,00"
                    value={received}
                    onChange={(e) => setReceived(e.target.value)}
                    className="w-32 bg-white text-right"
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Troco</span>
                  <span className="font-bold text-gray-900">{formatCurrency(change)}</span>
                </div>
              </div>
            )}

            <Button
              onClick={finishSale}
              disabled={items.length === 0}
              className="h-14 w-full bg-emerald-600 text-lg font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              FINALIZAR VENDA
            </Button>
            <Button
              variant="outline"
              onClick={resetSale}
              disabled={items.length === 0}
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              CANCELAR VENDA
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de confirmação */}
      <Dialog open={!!confirmed} onOpenChange={(open) => !open && newSale()}>
        <DialogContent className="sm:max-w-md">
          {confirmed && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                  Venda finalizada
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p className="text-gray-500">
                  Pedido <span className="font-semibold text-gray-900">{confirmed.orderNumber}</span>{" "}
                  registrado com sucesso.
                </p>
                <div className="space-y-1.5 rounded-lg bg-gray-50 p-3">
                  {confirmed.items.map((i) => (
                    <div key={i.id} className="flex justify-between text-gray-700">
                      <span>
                        {i.quantity}x {i.name}
                      </span>
                      <span>{formatCurrency(i.price * i.quantity)}</span>
                    </div>
                  ))}
                  <div className="mt-1 flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatCurrency(confirmed.total)}</span>
                  </div>
                  {confirmed.paymentMethod === "dinheiro" && receivedNum > 0 && (
                    <div className="flex justify-between pt-1 text-gray-500">
                      <span>Troco</span>
                      <span>{formatCurrency(change)}</span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={newSale}
                  className="h-12 w-full bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                >
                  Nova Venda
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
