"use client"

import { useState } from "react"
import { Plus, Pencil, Search, Package, ToggleLeft, ToggleRight, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { formatCurrency, usePersistedState, PRODUCTS, type Product } from "@/lib/store"

const CATEGORIES: Product["category"][] = ["subs-15cm", "subs-30cm", "combos", "bebidas"]

const CATEGORY_LABELS: Record<Product["category"], string> = {
  "subs-15cm": "Subs 15cm",
  "subs-30cm": "Subs 30cm",
  combos: "Combos",
  bebidas: "Bebidas",
}

const CATEGORY_COLORS: Record<Product["category"], string> = {
  "subs-15cm": "bg-orange-100 text-orange-700",
  "subs-30cm": "bg-amber-100 text-amber-700",
  combos: "bg-blue-100 text-blue-700",
  bebidas: "bg-teal-100 text-teal-700",
}

function emptyProduct(): Product {
  return { id: "", name: "", description: "", price: 0, image: "🥖", category: "subs-15cm", active: true }
}

/* ── Field component ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  )
}

function TextInput({
  id, value, onChange, placeholder, type = "text", step,
}: {
  id?: string; value: string | number; onChange: (v: string) => void
  placeholder?: string; type?: string; step?: string
}) {
  return (
    <input
      id={id}
      type={type}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
    />
  )
}

/* ── Product Form Modal ── */
function ProductModal({
  open, onClose, editing, setEditing, isNew, onSave,
}: {
  open: boolean
  onClose: () => void
  editing: Product | null
  setEditing: (p: Product) => void
  isNew: boolean
  onSave: () => void
}) {
  if (!open || !editing) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
              <Package size={18} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 leading-tight">
                {isNew ? "Novo produto" : "Editar produto"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Preencha os dados do produto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          <Field label="Nome do produto *">
            <TextInput
              id="p-name"
              value={editing.name}
              onChange={(v) => setEditing({ ...editing, name: v })}
              placeholder="Ex: Frango com Cream Cheese"
            />
          </Field>

          <Field label="Descrição">
            <textarea
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              placeholder="Descreva o produto brevemente..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoria">
              <div className="relative">
                <select
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value as Product["category"] })}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-8 text-sm text-gray-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </Field>

            <Field label="Preço (R$)">
              <TextInput
                id="p-price"
                type="number"
                step="0.01"
                value={editing.price}
                onChange={(v) => setEditing({ ...editing, price: parseFloat(v) || 0 })}
                placeholder="0,00"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Emoji / ícone">
              <TextInput
                value={editing.image}
                onChange={(v) => setEditing({ ...editing, image: v })}
                placeholder="🥖"
              />
            </Field>

            <Field label="Badge / promoção">
              <TextInput
                id="p-badge"
                value={editing.badge?.label ?? ""}
                onChange={(v) =>
                  setEditing({
                    ...editing,
                    badge: v ? { label: v, color: editing.badge?.color ?? "bg-[#EE5C13]" } : undefined,
                  })
                }
                placeholder="Ex: 🔥 Mais Pedido"
              />
            </Field>
          </div>

          {/* Status toggle */}
          <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">Produto ativo</p>
              <p className="text-xs text-gray-500 mt-0.5">Visível no cardápio</p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className={`text-xs font-bold ${editing.active ? 'text-emerald-600' : 'text-gray-400'}`}>
                {editing.active ? 'Ativo' : 'Inativo'}
              </span>
              <Switch
                id="p-active"
                checked={editing.active}
                onCheckedChange={(v) => setEditing({ ...editing, active: v })}
              />
            </div>
          </div>

          {/* Preview */}
          {editing.name && (
            <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
              <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-3">Pré-visualização</p>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm border border-orange-100 shrink-0">
                  {editing.image || '🥖'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">{editing.name}</span>
                    {editing.badge && (
                      <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                        {editing.badge.label}
                      </span>
                    )}
                  </div>
                  {editing.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{editing.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-black text-orange-600 text-sm">{formatCurrency(editing.price)}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[editing.category]}`}>
                      {CATEGORY_LABELS[editing.category]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={!editing.name.trim()}
            className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isNew ? 'Criar produto' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function ProdutosPage() {
  const [products, setProducts] = usePersistedState<Product[]>("admin_products", PRODUCTS)
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<Product | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [open, setOpen] = useState(false)
  const [catFilter, setCatFilter] = useState<Product["category"] | "all">("all")

  const filtered = products.filter((p) => {
    const matchQuery = p.name.toLowerCase().includes(query.trim().toLowerCase())
    const matchCat   = catFilter === "all" || p.category === catFilter
    return matchQuery && matchCat
  })

  function openNew() {
    setEditing(emptyProduct())
    setIsNew(true)
    setOpen(true)
  }

  function openEdit(p: Product) {
    setEditing({ ...p })
    setIsNew(false)
    setOpen(true)
  }

  function save() {
    if (!editing || !editing.name.trim()) return
    setProducts((prev) => {
      if (isNew) {
        const id = editing.id.trim() || `prod-${Date.now().toString(36)}`
        return [...prev, { ...editing, id }]
      }
      return prev.map((p) => (p.id === editing.id ? editing : p))
    })
    setOpen(false)
    setEditing(null)
  }

  function toggleActive(id: string) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)))
  }

  const activeCount   = products.filter(p => p.active).length
  const inactiveCount = products.length - activeCount

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500">Gerencie o cardápio da Mais Sub</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 text-sm shadow-sm transition-all"
        >
          <Plus size={16} />
          Novo produto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: products.length, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Ativos', value: activeCount, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { label: 'Inativos', value: inactiveCount, color: 'bg-gray-50 text-gray-500 border-gray-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.color}`}>
            <p className="text-2xl font-black leading-none">{s.value}</p>
            <p className="text-xs font-semibold mt-1 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                catFilter === cat
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
              }`}
            >
              {cat === 'all' ? 'Todos' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <div
            key={p.id}
            className={cn(
              "bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3 hover:shadow-md hover:border-orange-200 transition-all",
              !p.active && "opacity-60"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl shrink-0 border border-orange-100">
                {p.image}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-1.5 flex-wrap">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">{p.name}</h3>
                  {p.badge && (
                    <span className="text-[10px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-full leading-none mt-0.5">
                      {p.badge.label}
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-gray-500 leading-relaxed">
                  {p.description || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-black text-orange-600 text-base">{formatCurrency(p.price)}</span>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[p.category]}`}>
                {CATEGORY_LABELS[p.category]}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Switch checked={p.active} onCheckedChange={() => toggleActive(p.id)} />
                <span className={`text-xs font-semibold ${p.active ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {p.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <button
                onClick={() => openEdit(p)}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-orange-600 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-orange-100"
              >
                <Pencil size={13} />
                Editar
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <div className="text-4xl mb-3 opacity-30">📦</div>
            <p className="text-gray-400 font-medium">Nenhum produto encontrado.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <ProductModal
        open={open}
        onClose={() => { setOpen(false); setEditing(null) }}
        editing={editing}
        setEditing={setEditing}
        isNew={isNew}
        onSave={save}
      />
    </div>
  )
}
