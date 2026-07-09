"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Search, Package, X, Copy, RefreshCw, Trash2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { formatCurrency, PRODUCTS, type Product } from "@/lib/data"
import { syncProductsToInventory } from "@/lib/inventory-storage"
import { patchDisabledProducts } from "@/lib/products-availability"
import { fetchProductOverrides, patchProductOverrides, materializeCustomProducts, type OverridesMap as ProductOverridesMap } from "@/lib/product-overrides"

// Extend Product locally to support cost price
type ProductWithCost = Product & { costPrice?: number }

// Overrides persisted per product ID (never the full list)
type OverridesMap = ProductOverridesMap

const BASE_IDS = new Set(PRODUCTS.map(p => p.id))

function mergeOverrides(base: Product[], overrides: OverridesMap): ProductWithCost[] {
  return [
    ...base.map(p => ({ ...p, ...(overrides[p.id] ?? {}) })),
    ...materializeCustomProducts(overrides, BASE_IDS).map(p => ({
      ...p,
      costPrice: overrides[p.id]?.costPrice,
    })),
  ]
}

const CATEGORIES: Product["category"][] = ["subs-15cm", "subs-30cm", "combos", "cookies", "bebidas"]

const CATEGORY_LABELS: Record<Product["category"], string> = {
  "subs-15cm": "Subs 15cm",
  "subs-30cm": "Subs 30cm",
  combos:   "Combos",
  cookies:  "Cookies",
  bebidas:  "Bebidas",
}

const CATEGORY_COLORS: Record<Product["category"], string> = {
  "subs-15cm": "bg-orange-100 text-orange-700",
  "subs-30cm": "bg-amber-100 text-amber-700",
  combos:      "bg-blue-100 text-blue-700",
  cookies:     "bg-yellow-100 text-yellow-700",
  bebidas:     "bg-teal-100 text-teal-700",
}

function emptyProduct(): ProductWithCost {
  return { id: "", name: "", description: "", price: 0, costPrice: 0, image: "🥖", category: "subs-15cm", active: true }
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="block text-sm font-semibold text-gray-700">{label}</label>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const inputCls = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"

function ProductModal({
  open, onClose, editing, setEditing, isNew, onSave,
}: {
  open: boolean
  onClose: () => void
  editing: ProductWithCost | null
  setEditing: (p: ProductWithCost) => void
  isNew: boolean
  onSave: () => void
}) {
  if (!open || !editing) return null

  const margin = editing.costPrice && editing.costPrice > 0 && editing.price > 0
    ? ((editing.price - editing.costPrice) / editing.price * 100).toFixed(1)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col max-h-[95vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
              <Package size={18} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 leading-tight">
                {isNew ? "Novo produto" : "Editar produto"}
              </h2>
              <p className="text-xs text-gray-400">Preencha os dados abaixo</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Nome */}
          <Field label="Nome do produto" hint="obrigatório">
            <input
              type="text"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="Ex: Frango com Cream Cheese"
              className={inputCls}
            />
          </Field>

          {/* Descrição */}
          <Field label="Descrição">
            <textarea
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              placeholder="Descreva brevemente o produto..."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>

          {/* Categoria + Emoji */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <div className="relative">
                <select
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value as Product["category"] })}
                  className={`${inputCls} appearance-none pr-8 cursor-pointer`}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" width="12" height="12" viewBox="0 0 12 12">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
            </Field>

            <Field label="Emoji / ícone">
              <input
                type="text"
                value={editing.image}
                onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                placeholder="🥖"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Preços */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Preços</p>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Preço de venda (R$)">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  className={inputCls}
                />
              </Field>

              <Field label="Custo (R$)" hint="opcional">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editing.costPrice ?? ""}
                  onChange={(e) => setEditing({ ...editing, costPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Preço promocional (R$)" hint="opcional — deixe 0 para desativar">
              <input
                type="number"
                step="0.01"
                min="0"
                value={editing.promoPrice ?? ""}
                onChange={(e) => setEditing({ ...editing, promoPrice: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
                className={inputCls}
              />
              {editing.promoPrice != null && editing.promoPrice > 0 && editing.promoPrice < editing.price && (
                <p className="mt-1 text-[11px] text-emerald-600">
                  De {formatCurrency(editing.price)} por {formatCurrency(editing.promoPrice)}
                  {' '}({Math.round((1 - editing.promoPrice / editing.price) * 100)}% off)
                </p>
              )}
              {editing.promoPrice != null && editing.promoPrice > 0 && editing.promoPrice >= editing.price && (
                <p className="mt-1 text-[11px] text-red-500">O preço promocional deve ser menor que o preço de venda.</p>
              )}
            </Field>

            {/* Margin preview */}
            {margin !== null ? (
              <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                parseFloat(margin) >= 40 ? 'bg-emerald-50 border border-emerald-200' :
                parseFloat(margin) >= 20 ? 'bg-amber-50 border border-amber-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <span className="font-medium text-gray-700">Margem de lucro</span>
                <div className="text-right">
                  <span className={`font-black text-base ${
                    parseFloat(margin) >= 40 ? 'text-emerald-700' :
                    parseFloat(margin) >= 20 ? 'text-amber-700' : 'text-red-700'
                  }`}>{margin}%</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Lucro: {formatCurrency(editing.price - (editing.costPrice ?? 0))}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center">Preencha custo e venda para ver a margem</p>
            )}
          </div>

          {/* Badge */}
          <Field label="Badge / promoção" hint="opcional">
            <input
              type="text"
              value={editing.badge?.label ?? ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  badge: e.target.value
                    ? { label: e.target.value, color: editing.badge?.color ?? "bg-orange-500" }
                    : undefined,
                })
              }
              placeholder="Ex: 🔥 Mais Pedido"
              className={inputCls}
            />
          </Field>

          {/* Status */}
          <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">Produto ativo</p>
              <p className="text-xs text-gray-500 mt-0.5">Visível no cardápio público</p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className={`text-xs font-bold ${editing.active ? 'text-emerald-600' : 'text-gray-400'}`}>
                {editing.active ? 'Ativo' : 'Inativo'}
              </span>
              <Switch
                checked={editing.active}
                onCheckedChange={(v) => setEditing({ ...editing, active: v })}
              />
            </div>
          </div>

          {/* Live preview */}
          {editing.name && (
            <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
              <p className="text-xs font-black text-orange-500 uppercase tracking-wider mb-3">Pré-visualização</p>
              <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-orange-100">
                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-2xl shrink-0">
                  {editing.image || '🥖'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">{editing.name}</span>
                    {editing.badge && (
                      <span className="text-[10px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-full">{editing.badge.label}</span>
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
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={!editing.name.trim()}
            className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-black shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
  const [overrides, setOverrides] = useState<OverridesMap>(() => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem('admin_product_overrides') ?? '{}') } catch { return {} }
  })
  useEffect(() => {
    try { localStorage.setItem('admin_product_overrides', JSON.stringify(overrides)) } catch {}
  }, [overrides])

  // Carrega do Supabase os overrides salvos (descrição, preço, ativo…) e mescla
  // com o que está no localStorage (o banco tem prioridade).
  useEffect(() => {
    fetchProductOverrides().then((dbOverrides) => {
      if (!dbOverrides || Object.keys(dbOverrides).length === 0) return
      setOverrides((prev) => {
        const next = { ...prev }
        for (const [id, ov] of Object.entries(dbOverrides)) {
          next[id] = { ...(next[id] ?? {}), ...ov }
        }
        return next
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const products: ProductWithCost[] = mergeOverrides(PRODUCTS, overrides)

  // Salva no Supabase a lista de produtos inativos (para sumir do site público)
  function syncDisabledToDb(merged: ProductWithCost[]) {
    const disabled = merged.filter((p) => !p.active).map((p) => p.id)
    patchDisabledProducts(disabled)
  }

  const [query, setQuery]       = useState("")
  const [editing, setEditing]   = useState<ProductWithCost | null>(null)
  const [isNew, setIsNew]       = useState(false)
  const [open, setOpen]         = useState(false)
  const [catFilter, setCatFilter] = useState<Product["category"] | "all">("all")

  const filtered = products.filter((p) => {
    const matchQ   = p.name.toLowerCase().includes(query.trim().toLowerCase())
    const matchCat = catFilter === "all" || p.category === catFilter
    return matchQ && matchCat
  })

  function openNew() {
    setEditing(emptyProduct())
    setIsNew(true)
    setOpen(true)
  }

  function openEdit(p: ProductWithCost) {
    setEditing({ ...p })
    setIsNew(false)
    setOpen(true)
  }

  // Abre o modal com uma cópia do produto — só é criado de fato ao salvar
  function duplicate(p: ProductWithCost) {
    setEditing({ ...p, id: `prod-${Date.now().toString(36)}`, name: `${p.name} (cópia)` })
    setIsNew(true)
    setOpen(true)
  }

  function removeCustom(id: string) {
    const nextOverrides = { ...overrides }
    delete nextOverrides[id]
    setOverrides(nextOverrides)
    syncDisabledToDb(mergeOverrides(PRODUCTS, nextOverrides))
    patchProductOverrides(nextOverrides)
  }

  function save() {
    if (!editing || !editing.name.trim()) return
    const { active, costPrice, price, promoPrice, badge, name, description, image, category } = editing
    const id = editing.id || `prod-${Date.now().toString(36)}`
    const isCustom = !BASE_IDS.has(id)
    const nextOverrides = { ...overrides, [id]: { active, costPrice, price, promoPrice, badge, name, description, image, category, ...(isCustom ? { isCustom: true } : {}) } }
    setOverrides(nextOverrides)
    const merged = mergeOverrides(PRODUCTS, nextOverrides)
    syncProductsToInventory(merged)
    syncDisabledToDb(merged)
    patchProductOverrides(nextOverrides)
    setOpen(false)
    setEditing(null)
  }

  function toggleActive(id: string) {
    const current = products.find(p => p.id === id)
    const nextOverrides = { ...overrides, [id]: { ...(overrides[id] ?? {}), active: !current?.active } }
    setOverrides(nextOverrides)
    syncDisabledToDb(mergeOverrides(PRODUCTS, nextOverrides))
    patchProductOverrides(nextOverrides)
  }

  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Envia os produtos inativos para o site (Supabase) — vale em todos os aparelhos
  async function syncNow() {
    setSyncing(true)
    setSyncMsg(null)
    const merged = mergeOverrides(PRODUCTS, overrides)
    const disabled = merged.filter((p) => !p.active).map((p) => p.id)
    const [disResult, ovResult] = await Promise.all([
      patchDisabledProducts(disabled),
      patchProductOverrides(overrides),
    ])
    syncProductsToInventory(merged)
    setSyncing(false)
    if (disResult === null || ovResult === null) {
      setSyncMsg({ ok: false, text: 'Falha ao salvar no servidor. Verifique a conexão/Supabase.' })
    } else {
      const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      setSyncMsg({ ok: true, text: `Alterações enviadas ao site às ${hora} (${disResult.length} inativo(s)).` })
    }
  }

  const activeCount   = products.filter((p) => p.active).length
  const inactiveCount = products.length - activeCount

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500">Gerencie o cardápio da Mais Sub</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button
            onClick={syncNow}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-gray-50 text-gray-600 font-bold px-4 py-2.5 text-sm border border-gray-200 shadow-sm transition-all disabled:opacity-50"
            title="Enviar produtos inativos para o site"
          >
            <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sincronizando…' : 'Sincronizar'}
          </button>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 text-sm shadow-sm transition-all"
          >
            <Plus size={16} />
            Novo produto
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className={cn(
          "rounded-xl border px-4 py-3 text-sm font-medium",
          syncMsg.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-700"
        )}>
          {syncMsg.ok ? "✓ " : "⚠ "}{syncMsg.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total de produtos', value: products.length, cls: 'bg-white border-gray-200 text-gray-900' },
          { label: 'Ativos',            value: activeCount,     cls: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
          { label: 'Inativos',          value: inactiveCount,   cls: 'bg-gray-50 border-gray-200 text-gray-500' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.cls}`}>
            <p className="text-2xl font-black leading-none">{s.value}</p>
            <p className="text-xs font-medium mt-1 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + category filters */}
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
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              {cat === 'all' ? 'Todos' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const margin = p.costPrice && p.costPrice > 0 && p.price > 0
            ? ((p.price - p.costPrice) / p.price * 100).toFixed(0)
            : null

          return (
            <div
              key={p.id}
              className={cn(
                "bg-white rounded-2xl border border-gray-200 flex flex-col gap-0 hover:shadow-md hover:border-orange-200 transition-all overflow-hidden",
                !p.active && "opacity-60"
              )}
            >
              {/* Card top */}
              <div className="p-4 flex items-start gap-3 flex-1">
                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-2xl shrink-0">
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
                  <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[p.category]}`}>
                    {CATEGORY_LABELS[p.category]}
                  </span>
                </div>
              </div>

              {/* Price row */}
              <div className="px-4 pb-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Venda</p>
                  <p className="font-black text-orange-600 text-base leading-tight">{formatCurrency(p.price)}</p>
                </div>
                {p.costPrice && p.costPrice > 0 ? (
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Custo</p>
                    <p className="font-bold text-gray-600 text-sm leading-tight">{formatCurrency(p.costPrice)}</p>
                  </div>
                ) : null}
                {margin !== null && (
                  <div className={`px-2.5 py-1.5 rounded-lg text-center ${
                    parseInt(margin) >= 40 ? 'bg-emerald-100 text-emerald-700' :
                    parseInt(margin) >= 20 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    <p className="text-[10px] font-medium leading-none">Margem</p>
                    <p className="text-sm font-black leading-tight mt-0.5">{margin}%</p>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Switch checked={p.active} onCheckedChange={() => toggleActive(p.id)} />
                  <span className={`text-xs font-semibold ${p.active ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {p.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {!BASE_IDS.has(p.id) && (
                    <button
                      onClick={() => { if (confirm(`Excluir "${p.name}"?`)) removeCustom(p.id) }}
                      title="Excluir produto duplicado"
                      className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-all border border-transparent hover:border-red-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => duplicate(p)}
                    title="Duplicar produto"
                    className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-all border border-transparent hover:border-blue-100"
                  >
                    <Copy size={13} />
                    Duplicar
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-orange-600 hover:bg-orange-50 px-2.5 py-1.5 rounded-lg transition-all border border-transparent hover:border-orange-100"
                  >
                    <Pencil size={13} />
                    Editar
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <div className="text-4xl mb-3 opacity-30">📦</div>
            <p className="text-gray-500 font-semibold">Nenhum produto encontrado.</p>
            <p className="text-gray-400 text-sm mt-1">Tente outro filtro ou crie um novo produto.</p>
          </div>
        )}
      </div>

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
