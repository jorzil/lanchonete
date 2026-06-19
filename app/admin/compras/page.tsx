"use client"

import { useEffect, useMemo, useState } from "react"
import { Truck, Plus, Trash2, ShoppingBasket, DollarSign, CalendarDays, Receipt } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/store"
import { loadIngredients, loadSuppliers, type Ingredient, type Supplier } from "@/lib/inventory-storage"
import {
  loadPurchases, registerPurchase, getPurchaseStats,
  type Purchase, type PurchaseItem,
} from "@/lib/purchases-storage"

interface DraftItem { ingredientId: string; quantity: number; unitCost: number }

export default function ComprasPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])

  const [open, setOpen] = useState(false)
  const [supplierId, setSupplierId] = useState<string>("none")
  const [invoice, setInvoice] = useState("")
  const [draft, setDraft] = useState<DraftItem[]>([])

  function refresh() {
    setIngredients(loadIngredients())
    setSuppliers(loadSuppliers())
    setPurchases(loadPurchases())
  }
  useEffect(() => { refresh() }, [])

  const stats = useMemo(() => getPurchaseStats(), [purchases])
  const draftTotal = draft.reduce((acc, i) => acc + i.unitCost * i.quantity, 0)
  const noIngredients = ingredients.length === 0

  function openNew() {
    setSupplierId("none")
    setInvoice("")
    setDraft(ingredients[0] ? [{ ingredientId: ingredients[0].id, quantity: 1, unitCost: ingredients[0].avgCost }] : [])
    setOpen(true)
  }

  function addRow() {
    const first = ingredients[0]
    if (!first) return
    setDraft((p) => [...p, { ingredientId: first.id, quantity: 1, unitCost: first.avgCost }])
  }

  function updateRow(idx: number, patch: Partial<DraftItem>) {
    setDraft((p) => p.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  function removeRow(idx: number) {
    setDraft((p) => p.filter((_, i) => i !== idx))
  }

  function confirm() {
    if (draft.length === 0) return
    const items: PurchaseItem[] = draft
      .filter((d) => d.quantity > 0)
      .map((d) => ({
        ingredientId: d.ingredientId,
        ingredientName: ingredients.find((i) => i.id === d.ingredientId)?.name ?? "—",
        quantity: d.quantity,
        unitCost: d.unitCost,
      }))
    if (items.length === 0) return
    const supplier = suppliers.find((s) => s.id === supplierId)
    registerPurchase({
      supplierId: supplierId === "none" ? undefined : supplierId,
      supplierName: supplier?.name ?? "Fornecedor avulso",
      invoice: invoice.trim() || undefined,
      items,
    })
    setOpen(false)
    refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
          <p className="text-sm text-gray-500">Recebimento de mercadorias com entrada automática no estoque</p>
        </div>
        <Button onClick={openNew} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]" disabled={noIngredients}>
          <Plus className="mr-2 h-4 w-4" /> Nova compra
        </Button>
      </div>

      {noIngredients && (
        <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Cadastre ingredientes no módulo <strong>Estoque</strong> antes de lançar compras.
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat icon={ShoppingBasket} label="Compras registradas" value={String(stats.count)} tint="text-blue-600 bg-blue-50" />
        <Stat icon={CalendarDays} label="Gasto no mês" value={formatCurrency(stats.thisMonthSpent)} tint="text-amber-600 bg-amber-50" />
        <Stat icon={DollarSign} label="Total acumulado" value={formatCurrency(stats.totalSpent)} tint="text-emerald-600 bg-emerald-50" />
      </div>

      <Card className="overflow-hidden p-0">
        {purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Truck className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">Nenhuma compra registrada</p>
            <p className="text-xs text-gray-400">Clique em “Nova compra” para dar entrada de mercadorias</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Fornecedor</th>
                  <th className="px-4 py-3 font-semibold">NF</th>
                  <th className="px-4 py-3 font-semibold">Itens</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(p.createdAt).toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.supplierName}</td>
                    <td className="px-4 py-3">
                      {p.invoice ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500"><Receipt className="h-3.5 w-3.5" /> {p.invoice}</span>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {p.items.map((i) => `${i.ingredientName} (${i.quantity})`).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">{formatCurrency(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal nova compra */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-[#EE5C13]" /> Nova compra</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Fornecedor avulso</SelectItem>
                    {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nota fiscal (opcional)</Label>
                <Input value={invoice} onChange={(e) => setInvoice(e.target.value)} placeholder="Nº da NF" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Itens recebidos</Label>
                <Button size="sm" variant="outline" onClick={addRow}><Plus className="mr-1 h-3.5 w-3.5" /> Adicionar</Button>
              </div>
              <div className="max-h-[40vh] space-y-2 overflow-y-auto">
                {draft.map((row, idx) => {
                  const ing = ingredients.find((i) => i.id === row.ingredientId)
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <Select value={row.ingredientId} onValueChange={(v) => {
                        const next = ingredients.find((i) => i.id === v)
                        updateRow(idx, { ingredientId: v, unitCost: next?.avgCost ?? row.unitCost })
                      }}>
                        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ingredients.map((i) => <SelectItem key={i.id} value={i.id}>{i.name} ({i.unit})</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="w-20">
                        <Input type="number" min="0" step="any" value={row.quantity} title="Quantidade"
                          onChange={(e) => updateRow(idx, { quantity: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="w-24">
                        <Input type="number" min="0" step="any" value={row.unitCost} title="Custo unit."
                          onChange={(e) => updateRow(idx, { unitCost: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <span className="w-20 text-right text-xs tabular-nums text-gray-500">{formatCurrency(row.unitCost * row.quantity)}</span>
                      <button onClick={() => removeRow(idx)} className="rounded-md p-1.5 hover:bg-gray-100"><Trash2 className="h-4 w-4 text-gray-400" /></button>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-end gap-2 pt-1 text-xs text-gray-400">
                <span>Qtd · Custo unit. · Subtotal</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="text-sm font-medium text-gray-600">Total da compra</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(draftTotal)}</span>
            </div>
            <p className="text-xs text-gray-400">Ao confirmar, os itens dão entrada no estoque e o custo médio é recalculado automaticamente.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={confirm} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">Confirmar recebimento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Stat({ icon: Icon, label, value, tint }: { icon: typeof Truck; label: string; value: string; tint: string }) {
  return (
    <Card className="p-4">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </Card>
  )
}
