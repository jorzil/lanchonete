"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Plus, Pencil, Search, AlertTriangle, PackageX, Boxes, DollarSign,
  ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, Trash2, History,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/store"
import {
  loadIngredients, addIngredient, updateIngredient, deleteIngredient,
  loadSuppliers, addSupplier, registerMovement, loadMovements, getInventoryStats,
  type Ingredient, type StockUnit, type Supplier, type StockMovement, type MovementType,
} from "@/lib/inventory-storage"

const UNITS: { value: StockUnit; label: string }[] = [
  { value: "un", label: "Unidade" },
  { value: "kg", label: "Quilo (kg)" },
  { value: "g", label: "Grama (g)" },
  { value: "L", label: "Litro (L)" },
  { value: "ml", label: "Mililitro (ml)" },
  { value: "fatia", label: "Fatia" },
  { value: "pct", label: "Pacote" },
]

const MOVEMENT_LABELS: Record<MovementType, string> = {
  entrada: "Entrada", saida: "Saída", ajuste: "Ajuste",
}

function emptyIngredient(): Omit<Ingredient, "id" | "createdAt"> {
  return { name: "", unit: "un", avgCost: 0, stock: 0, minStock: 0, idealStock: 0, supplierId: undefined }
}

export default function EstoquePage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [query, setQuery] = useState("")

  // Modais
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [form, setForm] = useState(emptyIngredient())

  const [movOpen, setMovOpen] = useState(false)
  const [movTarget, setMovTarget] = useState<Ingredient | null>(null)
  const [movType, setMovType] = useState<MovementType>("entrada")
  const [movQty, setMovQty] = useState("")
  const [movCost, setMovCost] = useState("")
  const [movReason, setMovReason] = useState("")

  const [supOpen, setSupOpen] = useState(false)
  const [supName, setSupName] = useState("")
  const [supPhone, setSupPhone] = useState("")

  const [historyOpen, setHistoryOpen] = useState(false)

  function refresh() {
    setIngredients(loadIngredients())
    setSuppliers(loadSuppliers())
    setMovements(loadMovements())
  }

  useEffect(() => { refresh() }, [])

  const stats = useMemo(() => getInventoryStats(), [ingredients])

  const filtered = ingredients.filter((i) =>
    i.name.toLowerCase().includes(query.trim().toLowerCase()),
  )

  // ---------- Ingrediente ----------
  function openNew() {
    setEditing(null)
    setForm(emptyIngredient())
    setEditOpen(true)
  }

  function openEdit(ing: Ingredient) {
    setEditing(ing)
    setForm({
      name: ing.name, unit: ing.unit, avgCost: ing.avgCost, stock: ing.stock,
      minStock: ing.minStock, idealStock: ing.idealStock, supplierId: ing.supplierId,
    })
    setEditOpen(true)
  }

  function saveIngredient() {
    if (!form.name.trim()) return
    if (editing) {
      updateIngredient(editing.id, form)
    } else {
      addIngredient(form)
    }
    setEditOpen(false)
    refresh()
  }

  function removeIngredient(ing: Ingredient) {
    if (!confirm(`Excluir "${ing.name}"?`)) return
    deleteIngredient(ing.id)
    refresh()
  }

  // ---------- Movimentação ----------
  function openMovement(ing: Ingredient, type: MovementType) {
    setMovTarget(ing)
    setMovType(type)
    setMovQty("")
    setMovCost(String(ing.avgCost || ""))
    setMovReason("")
    setMovOpen(true)
  }

  function saveMovement() {
    if (!movTarget) return
    const qty = parseFloat(movQty)
    if (isNaN(qty) || qty < 0) return
    registerMovement({
      ingredientId: movTarget.id,
      type: movType,
      quantity: qty,
      unitCost: movType === "entrada" ? parseFloat(movCost) || 0 : undefined,
      reason: movReason.trim() || MOVEMENT_LABELS[movType],
    })
    setMovOpen(false)
    refresh()
  }

  // ---------- Fornecedor ----------
  function saveSupplier() {
    if (!supName.trim()) return
    addSupplier({ name: supName.trim(), phone: supPhone.trim() || undefined })
    setSupName("")
    setSupPhone("")
    setSupOpen(false)
    refresh()
  }

  function ingredientName(id: string) {
    return ingredients.find((i) => i.id === id)?.name ?? "—"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estoque</h1>
          <p className="text-sm text-gray-500">Controle de ingredientes, custos e movimentações</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setHistoryOpen(true)}>
            <History className="mr-2 h-4 w-4" /> Movimentações
          </Button>
          <Button variant="outline" onClick={() => setSupOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Fornecedor
          </Button>
          <Button onClick={openNew} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">
            <Plus className="mr-2 h-4 w-4" /> Ingrediente
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Boxes} label="Itens cadastrados" value={String(stats.totalItems)} tint="text-blue-600 bg-blue-50" />
        <StatCard icon={DollarSign} label="Valor em estoque" value={formatCurrency(stats.totalValue)} tint="text-emerald-600 bg-emerald-50" />
        <StatCard icon={AlertTriangle} label="Abaixo do mínimo" value={String(stats.belowMin)} tint="text-amber-600 bg-amber-50" />
        <StatCard icon={PackageX} label="Sem estoque" value={String(stats.outOfStock)} tint="text-red-600 bg-red-50" />
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Buscar ingrediente..." className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {/* Tabela */}
      <Card className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Boxes className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">Nenhum ingrediente cadastrado</p>
            <p className="text-xs text-gray-400">Clique em “Ingrediente” para começar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ingrediente</th>
                  <th className="px-4 py-3 font-semibold">Estoque</th>
                  <th className="px-4 py-3 font-semibold">Custo médio</th>
                  <th className="px-4 py-3 font-semibold">Valor total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((ing) => {
                  const out = ing.stock <= 0
                  const low = !out && ing.stock <= ing.minStock
                  return (
                    <tr key={ing.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{ing.name}</p>
                        <p className="text-xs text-gray-400">
                          {ing.supplierId ? suppliers.find((s) => s.id === ing.supplierId)?.name ?? "—" : "Sem fornecedor"}
                        </p>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {ing.stock} {ing.unit}
                        <span className="ml-1 text-xs text-gray-400">/ ideal {ing.idealStock}</span>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{formatCurrency(ing.avgCost)}</td>
                      <td className="px-4 py-3 tabular-nums font-medium">{formatCurrency(ing.avgCost * ing.stock)}</td>
                      <td className="px-4 py-3">
                        {out ? (
                          <Badge className="bg-red-100 text-red-700">Sem estoque</Badge>
                        ) : low ? (
                          <Badge className="bg-amber-100 text-amber-700">Baixo</Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700">OK</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <IconBtn title="Entrada" onClick={() => openMovement(ing, "entrada")}><ArrowDownToLine className="h-4 w-4 text-emerald-600" /></IconBtn>
                          <IconBtn title="Saída" onClick={() => openMovement(ing, "saida")}><ArrowUpFromLine className="h-4 w-4 text-red-600" /></IconBtn>
                          <IconBtn title="Ajuste" onClick={() => openMovement(ing, "ajuste")}><SlidersHorizontal className="h-4 w-4 text-blue-600" /></IconBtn>
                          <IconBtn title="Editar" onClick={() => openEdit(ing)}><Pencil className="h-4 w-4 text-gray-500" /></IconBtn>
                          <IconBtn title="Excluir" onClick={() => removeIngredient(ing)}><Trash2 className="h-4 w-4 text-gray-400" /></IconBtn>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal ingrediente */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="admin-theme max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar ingrediente" : "Novo ingrediente"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Pão 15cm, Mussarela, Frango..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v as StockUnit })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select value={form.supplierId ?? "none"} onValueChange={(v) => setForm({ ...form, supplierId: v === "none" ? undefined : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem fornecedor</SelectItem>
                    {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <NumberField label="Custo médio (R$)" value={form.avgCost} onChange={(v) => setForm({ ...form, avgCost: v })} disabled={!!editing} hint={editing ? "Atualizado por entradas" : undefined} />
              <NumberField label="Estoque inicial" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} disabled={!!editing} hint={editing ? "Use movimentações" : undefined} />
              <NumberField label="Estoque mínimo" value={form.minStock} onChange={(v) => setForm({ ...form, minStock: v })} />
              <NumberField label="Estoque ideal" value={form.idealStock} onChange={(v) => setForm({ ...form, idealStock: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveIngredient} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal movimentação */}
      <Dialog open={movOpen} onOpenChange={setMovOpen}>
        <DialogContent className="admin-theme max-w-md">
          <DialogHeader><DialogTitle>{MOVEMENT_LABELS[movType]} — {movTarget?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{movType === "ajuste" ? "Novo estoque" : "Quantidade"} ({movTarget?.unit})</Label>
              <Input type="number" min="0" step="any" value={movQty} onChange={(e) => setMovQty(e.target.value)} />
            </div>
            {movType === "entrada" && (
              <div className="space-y-2">
                <Label>Custo unitário (R$)</Label>
                <Input type="number" min="0" step="any" value={movCost} onChange={(e) => setMovCost(e.target.value)} />
                <p className="text-xs text-gray-400">O custo médio será recalculado automaticamente.</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Motivo / observação</Label>
              <Input value={movReason} onChange={(e) => setMovReason(e.target.value)} placeholder="Ex.: Compra, perda, contagem..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovOpen(false)}>Cancelar</Button>
            <Button onClick={saveMovement} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal fornecedor */}
      <Dialog open={supOpen} onOpenChange={setSupOpen}>
        <DialogContent className="admin-theme max-w-md">
          <DialogHeader><DialogTitle>Novo fornecedor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={supName} onChange={(e) => setSupName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={supPhone} onChange={(e) => setSupPhone(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSupOpen(false)}>Cancelar</Button>
            <Button onClick={saveSupplier} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal histórico */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="admin-theme max-w-2xl">
          <DialogHeader><DialogTitle>Histórico de movimentações</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {movements.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Nenhuma movimentação registrada.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-b border-gray-200 bg-white text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="py-2 pr-3 font-semibold">Data</th>
                    <th className="py-2 pr-3 font-semibold">Ingrediente</th>
                    <th className="py-2 pr-3 font-semibold">Tipo</th>
                    <th className="py-2 pr-3 font-semibold">Qtd</th>
                    <th className="py-2 font-semibold">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2 pr-3 text-xs text-gray-500">{new Date(m.createdAt).toLocaleString("pt-BR")}</td>
                      <td className="py-2 pr-3">{ingredientName(m.ingredientId)}</td>
                      <td className="py-2 pr-3">
                        <Badge className={
                          m.type === "entrada" ? "bg-emerald-100 text-emerald-700"
                            : m.type === "saida" ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                        }>{MOVEMENT_LABELS[m.type]}</Badge>
                      </td>
                      <td className="py-2 pr-3 tabular-nums">{m.quantity}</td>
                      <td className="py-2 text-gray-600">{m.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, tint }: { icon: typeof Boxes; label: string; value: string; tint: string }) {
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

function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick} className="rounded-md p-1.5 transition-colors hover:bg-gray-100">
      {children}
    </button>
  )
}

function NumberField({ label, value, onChange, disabled, hint }: {
  label: string; value: number; onChange: (v: number) => void; disabled?: boolean; hint?: string
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="number" min="0" step="any" value={value} disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)} />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}
