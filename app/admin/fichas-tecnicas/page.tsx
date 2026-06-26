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
import { loadIngredients, type Ingredient } from "@/lib/inventory-storage"
import {
  loadRecipes, getRecipe, upsertRecipe, deleteRecipe, calcRecipeCost,
  type Recipe, type RecipeItem,
} from "@/lib/recipes-storage"

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

  function refresh() {
    setProducts(loadProducts())
    setIngredients(loadIngredients())
    setRecipes(loadRecipes())
  }
  useEffect(() => { refresh() }, [])

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
  }

  function remove(p: Product) {
    if (!confirm(`Remover ficha técnica de "${p.name}"?`)) return
    deleteRecipe(p.id)
    refresh()
  }

  // Custo da ficha em edição (ao vivo)
  const liveCost = useMemo(() => {
    if (!product) return null
    return calcRecipeCost({ productId: product.id, productName: product.name, salePrice, items, updatedAt: "" }, ingredients)
  }, [product, salePrice, items, ingredients])

  const noIngredients = ingredients.length === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fichas Técnicas</h1>
          <p className="text-sm text-gray-500">Composição, custo (CMV) e margem por produto</p>
        </div>
      </div>

      {noIngredients && (
        <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Cadastre ingredientes no módulo <strong>Estoque</strong> antes de montar as fichas técnicas.
        </Card>
      )}

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
                <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditor(p)} disabled={noIngredients}>
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
                <Button size="sm" variant="outline" onClick={addItem}><Plus className="mr-1 h-3.5 w-3.5" /> Adicionar</Button>
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
                        <Input type="number" min="0" step="any" className="w-24" value={item.quantity}
                          onChange={(e) => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })} />
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
    </div>
  )
}
