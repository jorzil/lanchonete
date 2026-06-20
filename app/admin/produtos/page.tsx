"use client"

import { useState } from "react"
import { Plus, Pencil, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { formatCurrency, usePersistedState, PRODUCTS, type Product } from "@/lib/store"

const CATEGORIES: Product["category"][] = ["subs-15cm", "subs-30cm", "combos", "bebidas"]

const CATEGORY_LABELS: Record<Product["category"], string> = {
  "subs-15cm": "Subs 15cm",
  "subs-30cm": "Subs 30cm",
  combos: "Combos",
  bebidas: "Bebidas",
}

function emptyProduct(): Product {
  return {
    id: "",
    name: "",
    description: "",
    price: 0,
    image: "🥖",
    category: "subs-15cm",
    active: true,
  }
}

export default function ProdutosPage() {
  const [products, setProducts] = usePersistedState<Product[]>("admin_products", PRODUCTS)
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<Product | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [open, setOpen] = useState(false)

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase()),
  )

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500">Gerencie o cardápio da Mais Sub</p>
        </div>
        <Button onClick={openNew} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">
          <Plus className="mr-1 h-4 w-4" /> Novo produto
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar produto..."
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <Card key={p.id} className={cn("flex flex-col p-4", !p.active && "opacity-60")}>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-2xl">
                {p.image}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold text-gray-900">{p.name}</h3>
                  {p.badge && (
                    <Badge className="bg-[#EE5C13]/10 text-[#EE5C13] hover:bg-[#EE5C13]/10">
                      {p.badge.label}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">{p.description || "—"}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="font-bold text-gray-900">{formatCurrency(p.price)}</span>
              <Badge variant="outline">{CATEGORY_LABELS[p.category]}</Badge>
            </div>

            <div className="mt-auto flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <Switch checked={p.active} onCheckedChange={() => toggleActive(p.id)} />
                <span className="text-xs text-gray-500">{p.active ? "Ativo" : "Inativo"}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                <Pencil className="mr-1 h-4 w-4" /> Editar
              </Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-gray-400">Nenhum produto encontrado.</p>
        )}
      </div>

      {/* Modal de edição/criação */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isNew ? "Novo produto" : "Editar produto"}</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="p-name">Nome</Label>
                <Input
                  id="p-name"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="p-desc">Descrição</Label>
                <Input
                  id="p-desc"
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={editing.category}
                    onValueChange={(v) =>
                      setEditing({ ...editing, category: v as Product["category"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {CATEGORY_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-price">Preço (R$)</Label>
                  <Input
                    id="p-price"
                    type="number"
                    step="0.01"
                    value={editing.price}
                    onChange={(e) =>
                      setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="p-badge">Badge / promoção (opcional)</Label>
                <Input
                  id="p-badge"
                  placeholder="Ex: 🔥 Mais Pedido"
                  value={editing.badge?.label ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      badge: e.target.value
                        ? { label: e.target.value, color: editing.badge?.color ?? "bg-[#EE5C13]" }
                        : undefined,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <Label htmlFor="p-active">Produto ativo</Label>
                <Switch
                  id="p-active"
                  checked={editing.active}
                  onCheckedChange={(v) => setEditing({ ...editing, active: v })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={save}
              className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]"
              disabled={!editing?.name.trim()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
