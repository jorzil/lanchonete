"use client"

import { useEffect, useMemo, useState } from "react"
import { ClipboardList, Plus, Trash2, Pencil, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatCurrency, PRODUCTS, type Product } from "@/lib/store"
import { loadIngredients, addIngredient, deleteIngredient, type Ingredient, type StockUnit } from "@/lib/inventory-storage"
import {
  loadRecipes, getRecipe, upsertRecipe, deleteRecipe, calcRecipeCost,
  type Recipe, type RecipeItem,
} from "@/lib/recipes-storage"
import { pullFichas, pushFichas } from "@/lib/fichas-sync"

// Unidade de compra → unidade base usada na receita + fator de conversão
const PURCHASE_UNITS: { value: string; label: string; base: StockUnit; factor: number }[] = [
  { value: "kg",    label: "Quilo (kg)",      base: "g",  factor: 1000 },
  { value: "g",     label: "Grama (g)",       base: "g",  factor: 1 },
  { value: "L",     label: "Litro (L)",       base: "ml", factor: 1000 },
  { value: "ml",    label: "Mililitro (ml)",  base: "ml", factor: 1 },
  { value: "un",    label: "Unidade (un)",    base: "un", factor: 1 },
  { value: "fatia", label: "Fatia",           base: "fatia", factor: 1 },
  { value: "pct",   label: "Pacote (pct)",    base: "pct", factor: 1 },
]

const UNIT_LABEL: Record<string, string> = { g: "g", ml: "ml", un: "un", fatia: "fatia", pct: "pct", kg: "kg", L: "L" }

// Lista base de ingredientes da Mais Sub (preço de compra → custo por unidade)
const SEED_INGREDIENTS: { name: string; price: number; qty: number; unit: string }[] = [
  { name: "Pão 30cm",          price: 4.50,  qty: 1,     unit: "un" },
  { name: "Pão 15cm",          price: 2.25,  qty: 1,     unit: "un" },
  { name: "Carne",             price: 32.00, qty: 1,     unit: "kg" },
  { name: "Frango",            price: 18.00, qty: 1,     unit: "kg" },
  { name: "Lombo",             price: 23.00, qty: 1,     unit: "kg" },
  { name: "Requeijão",         price: 53.90, qty: 1.5,   unit: "kg" },
  { name: "Mussarela",         price: 39.98, qty: 1,     unit: "kg" },
  { name: "Cheddar",           price: 57.15, qty: 1.8,   unit: "kg" },
  { name: "Cream Cheese",      price: 30.30, qty: 1.010, unit: "kg" },
  { name: "Alface",            price: 3.75,  qty: 1,     unit: "un" },
  { name: "Tomate",            price: 8.50,  qty: 1,     unit: "kg" },
  { name: "Cebola roxa",       price: 7.95,  qty: 1,     unit: "kg" },
  { name: "Picles",            price: 19.00, qty: 400,   unit: "g" },
  { name: "Rúcula",            price: 3.75,  qty: 1,     unit: "un" },
  { name: "Pimentão",          price: 13.50, qty: 1,     unit: "kg" },
  { name: "Cenoura",           price: 7.50,  qty: 1,     unit: "kg" },
  { name: "Salaminho italiano",price: 10.90, qty: 100,   unit: "g" },
  { name: "Bacon",             price: 32.90, qty: 1,     unit: "kg" },
  { name: "Baconese",          price: 56.00, qty: 1.1,   unit: "kg" },
  { name: "Barbecue",          price: 29.00, qty: 1.1,   unit: "kg" },
  { name: "Mostarda e mel",    price: 36.00, qty: 1.1,   unit: "kg" },
  { name: "Maionese temperada",price: 39.00, qty: 1.1,   unit: "kg" },
  { name: "Ranch",             price: 34.00, qty: 1.1,   unit: "kg" },
  { name: "Chipotle",          price: 49.00, qty: 1.1,   unit: "kg" },
]

function loadProducts(): Product[] {
  if (typeof window === "undefined") return PRODUCTS
  try {
    const raw = localStorage.getItem("admin_products")
    if (!raw) return PRODUCTS
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Product[]) : PRODUCTS
  } catch {
    return PRODUCTS
  }
}

export default function FichasTecnicasPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [query, setQuery] = useState("")

  const [open, setOpen] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [salePrice, setSalePrice] = useState(0)
  const [items, setItems] = useState<RecipeItem[]>([])

  // Cadastro de ingredientes
  const [ingOpen, setIngOpen] = useState(false)
  const [ingName, setIngName] = useState("")
  const [ingPrice, setIngPrice] = useState(0)   // preço de compra (R$)
  const [ingQty, setIngQty] = useState(0)       // quantidade comprada
  const [ingUnit, setIngUnit] = useState("kg")  // unidade de compra

  function refresh() {
    setProducts(loadProducts())
    setIngredients(loadIngredients())
    setRecipes(loadRecipes())
  }

  // No carregamento, puxa ingredientes + fichas do Supabase (cross-device)
  useEffect(() => {
    pullFichas().then(() => refresh())
  }, [])

  function resetIngForm() {
    setIngName(""); setIngPrice(0); setIngQty(0); setIngUnit("kg")
  }

  // Cria o ingrediente convertendo o preço de compra em custo por unidade base
  function saveIngredient() {
    const u = PURCHASE_UNITS.find((x) => x.value === ingUnit) ?? PURCHASE_UNITS[0]
    if (!ingName.trim() || ingPrice <= 0 || ingQty <= 0) return
    const baseQty = ingQty * u.factor            // ex: 1 kg → 1000 g
    const avgCost = ingPrice / baseQty           // custo por unidade base (R$/g, R$/ml, R$/un)
    addIngredient({
      name: ingName.trim(),
      unit: u.base,
      avgCost,
      stock: 0,
      minStock: 0,
      idealStock: 0,
    })
    resetIngForm()
    setIngOpen(false)
    refresh()
    pushFichas()
  }

  function removeIngredient(id: string) {
    if (!confirm("Remover este ingrediente?")) return
    deleteIngredient(id)
    refresh()
    pushFichas()
  }

  // Cadastra a lista base de ingredientes (ignora os que já existem pelo nome)
  function seedIngredients() {
    const existing = new Set(loadIngredients().map((i) => i.name.trim().toLowerCase()))
    let added = 0
    for (const seed of SEED_INGREDIENTS) {
      if (existing.has(seed.name.trim().toLowerCase())) continue
      const u = PURCHASE_UNITS.find((x) => x.value === seed.unit) ?? PURCHASE_UNITS[0]
      addIngredient({
        name: seed.name,
        unit: u.base,
        avgCost: seed.price / (seed.qty * u.factor),
        stock: 0,
        minStock: 0,
        idealStock: 0,
      })
      added++
    }
    refresh()
    pushFichas()
    alert(added > 0 ? `${added} ingrediente(s) adicionado(s)!` : "Todos os ingredientes da lista já estavam cadastrados.")
  }

  // Pré-visualização do custo por unidade base no formulário
  const ingPreview = useMemo(() => {
    const u = PURCHASE_UNITS.find((x) => x.value === ingUnit) ?? PURCHASE_UNITS[0]
    if (ingPrice <= 0 || ingQty <= 0) return null
    const avgCost = ingPrice / (ingQty * u.factor)
    return { avgCost, base: u.base }
  }, [ingPrice, ingQty, ingUnit])

  const recipeByProduct = useMemo(() => {
    const map = new Map<string, Recipe>()
    recipes.forEach((r) => map.set(r.productId, r))
    return map
  }, [recipes])

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase()),
  )

  function openEditor(p: Product) {
    const existing = getRecipe(p.id)
    setProduct(p)
    setSalePrice(existing?.salePrice ?? p.price)
    setItems(existing?.items ?? [])
    setOpen(true)
  }

  function addItem() {
    const first = ingredients[0]
    if (!first) return
    setItems((prev) => [...prev, { ingredientId: first.id, quantity: 1 }])
  }

  function updateItem(idx: number, patch: Partial<RecipeItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function save() {
    if (!product) return
    upsertRecipe({ productId: product.id, productName: product.name, salePrice, items })
    setOpen(false)
    refresh()
    pushFichas()
  }

  function remove(p: Product) {
    if (!confirm(`Remover ficha técnica de "${p.name}"?`)) return
    deleteRecipe(p.id)
    refresh()
    pushFichas()
  }

  // Custo da ficha em edição (ao vivo)
  const liveCost = useMemo(() => {
    if (!product) return null
    return calcRecipeCost({ productId: product.id, productName: product.name, salePrice, items, updatedAt: "" }, ingredients)
  }, [product, salePrice, items, ingredients])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fichas Técnicas</h1>
          <p className="text-sm text-gray-500">Composição, custo (CMV) e margem por produto</p>
        </div>
        <div className="flex gap-2 self-start">
          <Button variant="outline" onClick={seedIngredients}>
            Carregar lista base
          </Button>
          <Button onClick={() => { resetIngForm(); setIngOpen(true) }} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">
            <Plus className="mr-1 h-4 w-4" /> Novo ingrediente
          </Button>
        </div>
      </div>

      {/* Ingredientes & custos */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Ingredientes &amp; Custos</h2>
          <span className="text-xs text-gray-400">{ingredients.length} cadastrado(s)</span>
        </div>
        {ingredients.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-sm text-gray-400">
            Nenhum ingrediente. Clique em <strong>Novo ingrediente</strong> para começar a precificar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                  <th className="py-2 pr-3 font-medium">Ingrediente</th>
                  <th className="py-2 px-3 font-medium">Unidade</th>
                  <th className="py-2 px-3 font-medium text-right">Custo / unidade</th>
                  <th className="py-2 px-3 font-medium text-right">Equivale a</th>
                  <th className="py-2 pl-3"></th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ing) => {
                  const perK = (ing.unit === "g" || ing.unit === "ml")
                    ? `${formatCurrency(ing.avgCost * 1000)}/${ing.unit === "g" ? "kg" : "L"}`
                    : "—"
                  return (
                    <tr key={ing.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pr-3 font-medium text-gray-800">{ing.name}</td>
                      <td className="py-2 px-3 text-gray-500">{UNIT_LABEL[ing.unit] ?? ing.unit}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-gray-800">
                        {formatCurrency(ing.avgCost)}/{UNIT_LABEL[ing.unit] ?? ing.unit}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-gray-400">{perK}</td>
                      <td className="py-2 pl-3 text-right">
                        <button onClick={() => removeIngredient(ing.id)} className="rounded-md p-1.5 hover:bg-gray-100">
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Buscar produto..." className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const recipe = recipeByProduct.get(p.id)
          const cost = recipe ? calcRecipeCost(recipe, ingredients) : null
          return (
            <Card key={p.id} className="flex flex-col p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{p.image}</span>
                  <div>
                    <p className="font-semibold leading-tight text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">Venda {formatCurrency(p.price)}</p>
                  </div>
                </div>
                {recipe ? (
                  <Badge className="bg-emerald-100 text-emerald-700">Ficha OK</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-500">Sem ficha</Badge>
                )}
              </div>

              {cost ? (
                <div className="mb-3 grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3 text-center">
                  <div>
                    <p className="text-[10px] uppercase text-gray-400">CMV</p>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(cost.cost)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-400">Margem</p>
                    <p className={`text-sm font-bold ${cost.margin >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(cost.margin)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-400">Margem %</p>
                    <p className={`text-sm font-bold ${cost.marginPct >= 0 ? "text-emerald-600" : "text-red-600"}`}>{cost.marginPct.toFixed(0)}%</p>
                  </div>
                </div>
              ) : (
                <div className="mb-3 flex-1 rounded-lg border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">
                  Monte a ficha para calcular custo e margem
                </div>
              )}

              <div className="mt-auto flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditor(p)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" /> {recipe ? "Editar" : "Montar"}
                </Button>
                {recipe && (
                  <Button size="sm" variant="outline" onClick={() => remove(p)}>
                    <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Editor de ficha */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="admin-theme max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#EE5C13]" />
              Ficha técnica — {product?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="w-40 space-y-2">
                <Label>Preço de venda (R$)</Label>
                <Input type="number" min="0" step="any" value={salePrice}
                  onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)} />
              </div>
              {liveCost && (
                <div className="flex flex-1 items-center justify-around rounded-lg bg-gray-50 p-3 text-center">
                  <div><p className="text-[10px] uppercase text-gray-400">CMV</p><p className="font-bold text-gray-900">{formatCurrency(liveCost.cost)}</p></div>
                  <div><p className="text-[10px] uppercase text-gray-400">Margem</p><p className={`font-bold ${liveCost.margin >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(liveCost.margin)}</p></div>
                  <div><p className="text-[10px] uppercase text-gray-400">Markup</p><p className="font-bold text-blue-600">{liveCost.markup.toFixed(0)}%</p></div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ingredientes</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { resetIngForm(); setIngOpen(true) }}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Novo ingrediente
                  </Button>
                  <Button size="sm" variant="outline" onClick={addItem} disabled={ingredients.length === 0}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar à ficha
                  </Button>
                </div>
              </div>

              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-sm text-gray-400">
                  Nenhum ingrediente. Clique em “Adicionar”.
                </p>
              ) : (
                <div className="max-h-[40vh] space-y-2 overflow-y-auto">
                  {items.map((item, idx) => {
                    const ing = ingredients.find((i) => i.id === item.ingredientId)
                    const lineCost = ing ? ing.avgCost * item.quantity : 0
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <Select value={item.ingredientId} onValueChange={(v) => updateItem(idx, { ingredientId: v })}>
                          <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ingredients.map((i) => <SelectItem key={i.id} value={i.id}>{i.name} ({i.unit})</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input type="number" min="0" step="any" className="w-20" value={item.quantity}
                          onChange={(e) => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })} />
                        <span className="w-8 text-xs text-gray-400">{ing ? (UNIT_LABEL[ing.unit] ?? ing.unit) : ""}</span>
                        <span className="w-20 text-right text-xs tabular-nums text-gray-500">{formatCurrency(lineCost)}</span>
                        <button onClick={() => removeItem(idx)} className="rounded-md p-1.5 hover:bg-gray-100">
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">Salvar ficha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cadastro de ingrediente */}
      <Dialog open={ingOpen} onOpenChange={setIngOpen}>
        <DialogContent className="admin-theme max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#EE5C13]" /> Novo ingrediente
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do ingrediente</Label>
              <Input value={ingName} onChange={(e) => setIngName(e.target.value)} placeholder="Ex: Queijo mussarela" />
            </div>

            <div className="rounded-lg bg-gray-50 p-3 space-y-3">
              <p className="text-xs font-semibold text-gray-500">Quanto você pagou na compra?</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Preço (R$)</Label>
                  <Input type="number" min="0" step="any" value={ingPrice || ""}
                    onChange={(e) => setIngPrice(parseFloat(e.target.value) || 0)} placeholder="30,00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Quantidade</Label>
                  <Input type="number" min="0" step="any" value={ingQty || ""}
                    onChange={(e) => setIngQty(parseFloat(e.target.value) || 0)} placeholder="1" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Unidade</Label>
                  <Select value={ingUnit} onValueChange={setIngUnit}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PURCHASE_UNITS.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-[11px] text-gray-400">
                Ex: comprei 1 kg de queijo por R$ 30 → o sistema calcula o custo por grama.
              </p>
            </div>

            {ingPreview && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
                <p className="text-[11px] uppercase text-emerald-600">Custo calculado</p>
                <p className="text-lg font-bold text-emerald-800">
                  {formatCurrency(ingPreview.avgCost)} <span className="text-sm font-medium">/ {UNIT_LABEL[ingPreview.base]}</span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIngOpen(false)}>Cancelar</Button>
            <Button onClick={saveIngredient} disabled={!ingName.trim() || ingPrice <= 0 || ingQty <= 0}
              className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">
              Salvar ingrediente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
