"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  Plus,
  Download,
  Upload,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  BarChart3,
  ArrowDownCircle,
  Receipt,
  Users,
  Phone,
  MapPin,
  Search,
  Award,
  Flame,
  RefreshCw,
  Printer,
} from "lucide-react"
import { formatCurrency, type Product, type Sale, type StockEntry, type Expense, type Customer } from "@/lib/store"

// ==================== PRODUCTS TABLE ====================
interface ProductsViewProps {
  products: Product[]
  onUpdateProduct: (id: number, field: string, value: string | number | boolean) => void
  onDeleteProduct: (id: number) => void
  onAddProduct: (product: Product) => void
  onToggleActive: (id: number) => void
  categories?: string[]
  onAddCategory?: (cat: string) => void
  onDeleteCategory?: (cat: string) => void
  onRestoreProducts?: () => void
}

export function ProductsView({
  products,
  onUpdateProduct,
  onDeleteProduct,
  onAddProduct,
  onToggleActive,
  categories = ["bebidas", "lanches", "combos"],
  onAddCategory,
  onDeleteCategory,
  onRestoreProducts,
}: ProductsViewProps) {
  const [showModal, setShowModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [productToDelete, setProductToDelete] = useState<number | null>(null)
  const [newCategory, setNewCategory] = useState("")
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: "",
    category: "bebidas",
    price: "",
    cost: "",
    stock: "",
    image: "",
    active: true,
  })
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openNew = () => {
    setEditId(null)
    setForm({ name: "", category: categories[0] || "bebidas", price: "", cost: "", stock: "", image: "", active: true })
    setShowModal(true)
  }

  const openEdit = (p: Product) => {
    setEditId(p.id)
    setForm({
      name: p.name,
      category: p.category,
      price: p.price.toFixed(2),
      cost: p.cost.toFixed(2),
      stock: p.stock.toString(),
      image: p.image,
      active: p.active,
    })
    setShowModal(true)
  }

  const handleSave = () => {
    const product: Product = {
      id: editId || Date.now(),
      name: form.name,
      category: form.category,
      price: parseFloat(form.price) || 0,
      cost: parseFloat(form.cost) || 0,
      stock: parseInt(form.stock) || 0,
      image: form.image,
      active: form.active,
    }
    if (editId) {
      Object.entries(product).forEach(([key, value]) => {
        if (key !== "id") onUpdateProduct(editId, key, value as string | number | boolean)
      })
    } else {
      onAddProduct(product)
    }
    setShowModal(false)
  }

  const exportProducts = () => {
    const dataStr = JSON.stringify(products, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `produtos-${new Date().toISOString().split("T")[0]}.json`
    a.click()
  }

  const confirmDelete = (id: number) => {
    setProductToDelete(id)
    setShowDeleteAlert(true)
  }

  const executeDelete = () => {
    if (productToDelete) {
      onDeleteProduct(productToDelete)
      setShowDeleteAlert(false)
      setProductToDelete(null)
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="bg-card shadow-sm border-b border-border px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Gerenciar Produtos</h2>
          <p className="text-sm text-muted-foreground hidden sm:block">Edite precos, estoque e informacoes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportProducts}>
            <Download className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Importar</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowCategoryModal(true)}>
            <Edit2 className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Categorias</span>
          </Button>
          {onRestoreProducts && (
            <Button variant="outline" size="sm" onClick={onRestoreProducts} title="Restaurar produtos padrão/antigos">
              <RefreshCw className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Restaurar Backup</span>
            </Button>
          )}
          <Button size="sm" className="bg-primary text-primary-foreground" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Novo Produto</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="px-4 md:px-6 py-4 pb-0">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar produto por nome ou categoria..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Mobile cards view */}
        <div className="md:hidden space-y-3">
          {filteredProducts.map((p) => (
            <div key={p.id} className={cn("bg-card rounded-xl shadow-sm border border-border p-4", !p.active && "opacity-50")}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-foreground">{p.name}</h3>
                  <Badge variant="secondary" className="capitalize text-xs mt-1">{p.category}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(p)}>
                    <Edit2 className="h-4 w-4 text-chart-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => confirmDelete(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Preco</span>
                  <p className="font-bold text-foreground">{formatCurrency(p.price)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Custo</span>
                  <p className="font-mono text-muted-foreground">{formatCurrency(p.cost)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Estoque</span>
                  <p className={cn("font-mono", p.stock <= 10 ? "text-destructive font-bold" : "text-foreground")}>{p.stock}</p>
                </div>
              </div>
              <div className="mt-2 flex justify-between items-center">
                <button onClick={() => onToggleActive(p.id)}>
                  <Badge variant={p.active ? "default" : "secondary"} className={p.active ? "bg-primary text-primary-foreground" : ""}>
                    {p.active ? "Ativo" : "Inativo"}
                  </Badge>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase text-xs w-16">ID</th>
                  <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase text-xs">Produto</th>
                  <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase text-xs w-32">Categoria</th>
                  <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase text-xs w-28">Preco (R$)</th>
                  <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase text-xs w-28">Custo (R$)</th>
                  <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase text-xs w-24">Estoque</th>
                  <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase text-xs w-20">Status</th>
                  <th className="px-4 py-3 text-right font-bold text-muted-foreground uppercase text-xs w-24">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className={`hover:bg-muted/50 ${!p.active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.id}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{p.name}</td>
                    <td className="px-4 py-3"><Badge variant="secondary" className="capitalize">{p.category}</Badge></td>
                    <td className="px-4 py-3 font-mono text-foreground">{formatCurrency(p.price)}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{formatCurrency(p.cost)}</td>
                    <td className={`px-4 py-3 font-mono ${p.stock <= 10 ? "text-destructive font-bold" : "text-foreground"}`}>{p.stock}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => onToggleActive(p.id)}>
                        <Badge variant={p.active ? "default" : "secondary"} className={p.active ? "bg-primary text-primary-foreground" : ""}>
                          {p.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Edit2 className="h-4 w-4 text-chart-3" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => confirmDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Preco (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Custo (R$)</Label><Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
            </div>
            <div><Label>Estoque</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
            <div><Label>URL da Imagem</Label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>Produto ativo</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button className="flex-1 bg-primary text-primary-foreground" onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Management Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nova categoria..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCategory.trim() && onAddCategory) {
                    onAddCategory(newCategory.trim())
                    setNewCategory("")
                  }
                }}
              />
              <Button
                size="sm"
                className="bg-primary text-primary-foreground"
                disabled={!newCategory.trim()}
                onClick={() => {
                  if (newCategory.trim() && onAddCategory) {
                    onAddCategory(newCategory.trim())
                    setNewCategory("")
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {categories.map((cat) => {
                const productCount = products.filter((p) => p.category === cat).length
                return (
                  <div key={cat} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <span className="font-semibold text-foreground capitalize">{cat}</span>
                      <span className="text-xs text-muted-foreground ml-2">({productCount} produtos)</span>
                    </div>
                    {productCount === 0 && onDeleteCategory ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => onDeleteCategory(cat)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {productCount > 0 ? "Em uso" : ""}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">Apenas categorias sem produtos podem ser removidas.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Excluir Produto?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O produto será removido permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteAlert(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={executeDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================== STOCK VIEW (EDITABLE) ====================
interface StockViewProps {
  products: Product[]
  stockHistory: StockEntry[]
  onAdjustStock: (productId: number, quantity: number, type: "add" | "remove" | "set", reason: string) => void
  onEditStockEntry?: (entry: StockEntry) => void
  onDeleteStockEntry?: (id: number) => void
}

export function StockView({ products, stockHistory, onAdjustStock, onEditStockEntry, onDeleteStockEntry }: StockViewProps) {
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState("")
  const [stockType, setStockType] = useState<"add" | "remove" | "set">("add")
  const [reason, setReason] = useState("")
  const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null)
  const [editForm, setEditForm] = useState({ productName: "", type: "", quantity: "", reason: "" })

  const handleSubmit = () => {
    if (!selectedProduct || !quantity) return
    onAdjustStock(parseInt(selectedProduct), parseInt(quantity), stockType, reason || "Ajuste")
    setQuantity("")
    setReason("")
  }

  const startEdit = (entry: StockEntry) => {
    setEditingEntry(entry)
    setEditForm({
      productName: entry.productName,
      type: entry.type,
      quantity: Math.abs(entry.quantity).toString(),
      reason: entry.reason,
    })
  }

  const saveEdit = () => {
    if (!editingEntry || !onEditStockEntry) return
    const qty = parseInt(editForm.quantity) || 0
    onEditStockEntry({
      ...editingEntry,
      productName: editForm.productName,
      type: editForm.type,
      quantity: editForm.type === "Saida" ? -Math.abs(qty) : Math.abs(qty),
      reason: editForm.reason,
    })
    setEditingEntry(null)
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="bg-card shadow-sm border-b border-border px-4 md:px-6 py-4">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Controle de Estoque</h2>
      </div>
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-card p-4 md:p-6 rounded-xl shadow-sm border border-border">
            <h3 className="font-bold text-foreground mb-4">Ajuste Rapido</h3>
            <div className="space-y-3">
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger><SelectValue placeholder="Selecione um produto..." /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name} (Atual: {p.stock})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input type="number" placeholder="Qtd" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-24" />
                <Select value={stockType} onValueChange={(v) => setStockType(v as "add" | "remove" | "set")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Entrada (+)</SelectItem>
                    <SelectItem value="remove">Saida (-)</SelectItem>
                    <SelectItem value="set">Ajustar (=)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} />
              <Button className="w-full bg-chart-3 text-card hover:bg-chart-3/90" onClick={handleSubmit}>Registrar</Button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">Historico de Movimentacoes</h3>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden p-3 space-y-2">
              {stockHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma movimentacao registrada</p>
              ) : (
                stockHistory.slice(0, 30).map((h) => (
                  <div key={h.id} className="bg-muted/50 rounded-lg p-3 border border-border">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-foreground text-sm">{h.productName}</span>
                      <div className="flex gap-1">
                        {onEditStockEntry && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(h)}>
                            <Edit2 className="h-3.5 w-3.5 text-chart-3" />
                          </Button>
                        )}
                        {onDeleteStockEntry && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onDeleteStockEntry(h.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={h.quantity > 0 ? "default" : "destructive"} className={cn("text-xs", h.quantity > 0 && "bg-primary text-primary-foreground")}>{h.type}</Badge>
                      <span className={cn("font-mono text-sm", h.quantity > 0 ? "text-primary" : "text-destructive")}>{h.quantity > 0 ? "+" : ""}{h.quantity}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{h.reason} - {new Date(h.date).toLocaleString("pt-BR")}</p>
                  </div>
                ))
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground text-xs">Data</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground text-xs">Produto</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground text-xs">Tipo</th>
                    <th className="px-4 py-3 text-right font-bold text-muted-foreground text-xs">Qtd</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground text-xs">Motivo</th>
                    <th className="px-4 py-3 text-right font-bold text-muted-foreground text-xs">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stockHistory.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhuma movimentacao registrada</td></tr>
                  ) : (
                    stockHistory.slice(0, 30).map((h) => (
                      <tr key={h.id} className="hover:bg-muted/50">
                        <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(h.date).toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-2 font-semibold text-foreground">{h.productName}</td>
                        <td className="px-4 py-2">
                          <Badge variant={h.quantity > 0 ? "default" : "destructive"} className={h.quantity > 0 ? "bg-primary text-primary-foreground" : ""}>{h.type}</Badge>
                        </td>
                        <td className={`px-4 py-2 text-right font-mono ${h.quantity > 0 ? "text-primary" : "text-destructive"}`}>{h.quantity > 0 ? "+" : ""}{h.quantity}</td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">{h.reason}</td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            {onEditStockEntry && (
                              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => startEdit(h)}>
                                <Edit2 className="h-3.5 w-3.5 text-chart-3" />
                              </Button>
                            )}
                            {onDeleteStockEntry && (
                              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onDeleteStockEntry(h.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Stock Entry Modal */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader><DialogTitle>Editar Movimentacao</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Produto</Label><Input value={editForm.productName} onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entrada">Entrada</SelectItem>
                  <SelectItem value="Saida">Saida</SelectItem>
                  <SelectItem value="Ajuste">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Quantidade</Label><Input type="number" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} /></div>
            <div><Label>Motivo</Label><Input value={editForm.reason} onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })} /></div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditingEntry(null)}>Cancelar</Button>
              <Button className="flex-1 bg-primary text-primary-foreground" onClick={saveEdit}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================== EXPENSES VIEW (EDITABLE + CUSTOM CATEGORIES) ====================
const DEFAULT_EXPENSE_CATEGORIES = [
  "Fornecedores", "Aluguel", "Energia", "Agua", "Internet",
  "Manutencao", "Funcionarios", "Transporte", "Material de Limpeza", "Embalagens", "Outros",
]

interface ExpensesViewProps {
  expenses: Expense[]
  onAddExpense: (expense: Expense) => void
  onEditExpense?: (expense: Expense) => void
  onDeleteExpense: (id: number) => void
  customCategories?: string[]
  onAddCategory?: (cat: string) => void
}

export function ExpensesView({ expenses, onAddExpense, onEditExpense, onDeleteExpense, customCategories = [], onAddCategory }: ExpensesViewProps) {
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [form, setForm] = useState({ description: "", amount: "", category: "Outros" })
  const [newCategory, setNewCategory] = useState("")

  const allCategories = [...DEFAULT_EXPENSE_CATEGORIES, ...customCategories.filter((c) => !DEFAULT_EXPENSE_CATEGORIES.includes(c))]

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const todayExpenses = expenses
    .filter((e) => new Date(e.date).toDateString() === new Date().toDateString())
    .reduce((sum, e) => sum + e.amount, 0)

  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})

  const openNew = () => {
    setEditingExpense(null)
    setForm({ description: "", amount: "", category: "Outros" })
    setShowModal(true)
  }

  const openEdit = (e: Expense) => {
    setEditingExpense(e)
    setForm({ description: e.description, amount: e.amount.toFixed(2), category: e.category })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.description || !form.amount) return
    if (editingExpense && onEditExpense) {
      onEditExpense({
        ...editingExpense,
        description: form.description,
        amount: parseFloat(form.amount) || 0,
        category: form.category,
      })
    } else {
      onAddExpense({
        id: Date.now(),
        date: new Date().toISOString(),
        description: form.description,
        amount: parseFloat(form.amount) || 0,
        category: form.category,
        user: "Admin",
      })
    }
    setForm({ description: "", amount: "", category: "Outros" })
    setShowModal(false)
    setEditingExpense(null)
  }

  const handleAddCategory = () => {
    if (!newCategory.trim() || !onAddCategory) return
    onAddCategory(newCategory.trim())
    setNewCategory("")
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="bg-card shadow-sm border-b border-border px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Despesas e Saidas</h2>
          <p className="text-sm text-muted-foreground hidden sm:block">Controle de despesas e saidas de caixa</p>
        </div>
        <Button size="sm" className="bg-destructive text-destructive-foreground" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1 md:mr-2" />
          Nova Despesa
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
          <div className="bg-card p-4 md:p-6 rounded-xl shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownCircle className="h-5 w-5 text-destructive" />
              <h3 className="text-sm font-semibold text-muted-foreground">Total de Despesas</h3>
            </div>
            <p className="text-xl md:text-2xl font-black text-destructive">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="bg-card p-4 md:p-6 rounded-xl shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-5 w-5 text-accent-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground">Despesas Hoje</h3>
            </div>
            <p className="text-xl md:text-2xl font-black text-foreground">{formatCurrency(todayExpenses)}</p>
          </div>
          <div className="bg-card p-4 md:p-6 rounded-xl shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-chart-3" />
              <h3 className="text-sm font-semibold text-muted-foreground">Registros</h3>
            </div>
            <p className="text-xl md:text-2xl font-black text-foreground">{expenses.length}</p>
          </div>
        </div>

        {/* By Category */}
        {Object.keys(byCategory).length > 0 && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-4 md:p-6 mb-6">
            <h3 className="font-bold text-foreground mb-4">Despesas por Categoria</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(byCategory).sort(([, a], [, b]) => b - a).map(([cat, amount]) => (
                <div key={cat} className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-semibold text-foreground">{cat}</p>
                  <p className="text-lg font-bold text-destructive">{formatCurrency(amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-border">
            <h3 className="font-bold text-foreground">Historico de Despesas</h3>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden p-3 space-y-2">
            {expenses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma despesa registrada</p>
            ) : (
              expenses.slice(0, 50).map((e) => (
                <div key={e.id} className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <span className="font-semibold text-foreground text-sm">{e.description}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{e.category}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {onEditExpense && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(e)}>
                          <Edit2 className="h-3.5 w-3.5 text-chart-3" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onDeleteExpense(e.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-muted-foreground">{new Date(e.date).toLocaleString("pt-BR")}</span>
                    <span className="font-bold text-destructive">-{formatCurrency(e.amount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-muted-foreground text-xs">Data</th>
                  <th className="px-4 py-3 text-left font-bold text-muted-foreground text-xs">Descricao</th>
                  <th className="px-4 py-3 text-left font-bold text-muted-foreground text-xs">Categoria</th>
                  <th className="px-4 py-3 text-right font-bold text-muted-foreground text-xs">Valor</th>
                  <th className="px-4 py-3 text-left font-bold text-muted-foreground text-xs">Usuario</th>
                  <th className="px-4 py-3 text-right font-bold text-muted-foreground text-xs">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhuma despesa registrada</td></tr>
                ) : (
                  expenses.slice(0, 50).map((e) => (
                    <tr key={e.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(e.date).toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{e.description}</td>
                      <td className="px-4 py-3"><Badge variant="secondary">{e.category}</Badge></td>
                      <td className="px-4 py-3 text-right font-bold text-destructive">-{formatCurrency(e.amount)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{e.user}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {onEditExpense && (
                            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEdit(e)}>
                              <Edit2 className="h-3.5 w-3.5 text-chart-3" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onDeleteExpense(e.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Expense Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Editar Despesa" : "Nova Despesa / Saida de Caixa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Descricao</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Compra de ingredientes" />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Add new category inline */}
            {onAddCategory && (
              <div>
                <Label className="text-xs text-muted-foreground">Criar nova categoria</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nome da categoria" className="h-9 text-sm" />
                  <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={handleAddCategory} disabled={!newCategory.trim()}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Criar
                  </Button>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditingExpense(null) }}>Cancelar</Button>
              <Button className="flex-1 bg-destructive text-destructive-foreground" onClick={handleSave} disabled={!form.description || !form.amount}>
                {editingExpense ? "Salvar" : "Registrar Despesa"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================== CUSTOMERS VIEW ====================
interface CustomersViewProps {
  customers: Customer[]
  onAddCustomer: (customer: Customer) => void
  onEditCustomer: (customer: Customer) => void
  onDeleteCustomer: (id: number) => void
}

export function CustomersView({ customers, onAddCustomer, onEditCustomer, onDeleteCustomer }: CustomersViewProps) {
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [form, setForm] = useState({ name: "", phone: "", address: "" })
  const [search, setSearch] = useState("")

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  const openNew = () => {
    setEditingCustomer(null)
    setForm({ name: "", phone: "", address: "" })
    setShowModal(true)
  }

  const openEdit = (c: Customer) => {
    setEditingCustomer(c)
    setForm({ name: c.name, phone: c.phone, address: c.address })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.name) return
    if (editingCustomer) {
      onEditCustomer({ ...editingCustomer, ...form })
    } else {
      onAddCustomer({ id: Date.now(), ...form })
    }
    setShowModal(false)
    setEditingCustomer(null)
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="bg-card shadow-sm border-b border-border px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Clientes</h2>
          <p className="text-sm text-muted-foreground hidden sm:block">Cadastro de clientes</p>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1 md:mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6">
          <div className="bg-card p-4 md:p-6 rounded-xl shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-muted-foreground">Total de Clientes</h3>
            </div>
            <p className="text-2xl font-black text-foreground">{customers.length}</p>
          </div>
          <div className="bg-card p-4 md:p-6 rounded-xl shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="h-5 w-5 text-chart-3" />
              <h3 className="text-sm font-semibold text-muted-foreground">Com WhatsApp</h3>
            </div>
            <p className="text-2xl font-black text-foreground">{customers.filter((c) => c.phone).length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone..." className="pl-10" />
        </div>

        {/* Customer list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-card rounded-xl shadow-sm border border-border p-8 text-center text-muted-foreground">
              {customers.length === 0 ? "Nenhum cliente cadastrado" : "Nenhum cliente encontrado"}
            </div>
          ) : (
            filtered.map((c) => (
              <div key={c.id} className="bg-card rounded-xl shadow-sm border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="font-bold text-foreground truncate">{c.name}</h3>
                    </div>
                    {c.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="break-words">{c.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(c)}>
                      <Edit2 className="h-4 w-4 text-chart-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onDeleteCustomer(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <Label>Endereco</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rua, numero, bairro" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditingCustomer(null) }}>Cancelar</Button>
              <Button className="flex-1 bg-primary text-primary-foreground" onClick={handleSave} disabled={!form.name}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================== REPORTS VIEW (WITH POPULAR ITEMS) ====================
interface ReportsViewProps {
  sales: Sale[]
  expenses?: Expense[]
  onDeleteSale: (id: number) => void
  onUpdateSale: (id: number, updatedData: Partial<Sale>) => void
  onReprint?: (sale: Sale) => void
}

export function ReportsView({ sales, expenses = [], onDeleteSale, onUpdateSale, onReprint }: ReportsViewProps) {
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [editForm, setEditForm] = useState({
    date: "",
    customer: "",
    orderType: "pickup" as Sale["orderType"],
    paymentMethod: "",
    total: "",
    observation: "",
  })
  const [expandedSaleId, setExpandedSaleId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"sales" | "popular">("sales")
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [filterMode, setFilterMode] = useState<"day" | "all">("day")

  // Filter by date
  const filteredSales = filterMode === "all" ? sales : sales.filter((s) => {
    const saleDate = new Date(s.date).toISOString().split("T")[0]
    return saleDate === selectedDate
  })
  const filteredExpenses = filterMode === "all" ? expenses : expenses.filter((e) => {
    const expDate = new Date(e.date).toISOString().split("T")[0]
    return expDate === selectedDate
  })

  const revenue = filteredSales.reduce((sum, s) => sum + s.total, 0)
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
  const profit = filteredSales.reduce((sum, s) => {
    const cost = s.items.reduce((c, i) => c + ((i.cost || i.price * 0.4) * i.quantity), 0)
    return sum + (s.total - cost)
  }, 0) - totalExpenses
  const avgTicket = filteredSales.length > 0 ? revenue / filteredSales.length : 0

  // Popular items analysis
  const itemCounts: Record<string, { name: string; qty: number; revenue: number }> = {}
  filteredSales.forEach((s) => {
    s.items.forEach((item) => {
      const key = item.name
      if (!itemCounts[key]) itemCounts[key] = { name: item.name, qty: 0, revenue: 0 }
      itemCounts[key].qty += item.quantity
      itemCounts[key].revenue += item.price * item.quantity
    })
  })
  const popularItems = Object.values(itemCounts).sort((a, b) => b.qty - a.qty)

  const paymentMethodLabels: Record<string, string> = {
    money: "Dinheiro",
    pix: "Pix",
    debit: "Débito",
    credit: "Crédito",
  }

  const startEdit = (s: Sale) => {
    setEditingSale(s)
    setEditForm({
      date: new Date(s.date).toISOString().slice(0, 16), // Format for datetime-local
      customer: s.customer,
      orderType: s.orderType,
      paymentMethod: s.paymentMethod,
      total: s.total.toString(),
      observation: s.observation || "",
    })
  }

  const saveEdit = () => {
    if (!editingSale) return
    onUpdateSale(editingSale.id, {
      date: new Date(editForm.date).toISOString(),
      customer: editForm.customer,
      orderType: editForm.orderType,
      paymentMethod: editForm.paymentMethod,
      total: parseFloat(editForm.total) || 0,
      observation: editForm.observation,
    })
    setEditingSale(null)
  }

  // Parse custom burger observations for ingredient popularity
  const ingredientCounts: Record<string, number> = {}
  filteredSales.forEach((s) => {
    s.items.forEach((item) => {
      if (item.isCustom && item.observation) {
        const lines = item.observation.split("\n")
        lines.forEach((line) => {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith("Tamanho:") || trimmed.startsWith("Extras:")) return
          const prefixes = ["Carne: ", "Queijos: ", "Salada: ", "Molhos: "]
          for (const prefix of prefixes) {
            if (trimmed.startsWith(prefix)) {
              const val = trimmed.slice(prefix.length)
              if (val === "Sem carne" || val === "Sem queijo" || val === "Sem salada" || val === "Sem molho") return
              val.split(", ").forEach((v) => {
                if (v.trim()) {
                  const key = `${prefix.replace(": ", "")} - ${v.trim()}`
                  ingredientCounts[key] = (ingredientCounts[key] || 0) + 1
                }
              })
            }
          }
        })
      }
    })
  })
  const popularIngredients = Object.entries(ingredientCounts).sort(([, a], [, b]) => b - a)

  const exportCSV = () => {
    let csv = "Data,Cliente,Tipo,Total,Pagamento\n"
    filteredSales.forEach((s) => { csv += `${s.date},${s.customer},${s.orderType},${s.total.toFixed(2)},${s.paymentMethod}\n` })
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `vendas-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const stats = [
    { label: "Faturamento", value: formatCurrency(revenue), icon: DollarSign, color: "text-primary" },
    { label: "Vendas", value: sales.length.toString(), icon: ShoppingBag, color: "text-chart-3" },
    { label: "Despesas", value: formatCurrency(totalExpenses), icon: ArrowDownCircle, color: "text-destructive" },
    { label: "Ticket Medio", value: formatCurrency(avgTicket), icon: BarChart3, color: "text-accent-foreground" },
    { label: "Lucro Liquido", value: formatCurrency(profit), icon: TrendingUp, color: profit >= 0 ? "text-primary" : "text-destructive" },
  ]

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="bg-card shadow-sm border-b border-border px-4 md:px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Relatorios</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setFilterMode("day")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                  filterMode === "day" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"
                )}
              >
                Por Dia
              </button>
              <button
                onClick={() => setFilterMode("all")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                  filterMode === "all" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"
                )}
              >
                Geral
              </button>
            </div>
            {filterMode === "day" && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const d = new Date(selectedDate + "T12:00:00")
                    d.setDate(d.getDate() - 1)
                    setSelectedDate(d.toISOString().split("T")[0])
                  }}
                  className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {"<"}
                </button>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-8 text-xs w-[140px]"
                />
                <button
                  onClick={() => {
                    const d = new Date(selectedDate + "T12:00:00")
                    d.setDate(d.getDate() + 1)
                    setSelectedDate(d.toISOString().split("T")[0])
                  }}
                  className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {">"}
                </button>
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                  className="h-8 px-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                >
                  Hoje
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="bg-card p-3 md:p-6 rounded-xl shadow-sm border border-border">
                <div className="flex items-center gap-2 mb-1 md:mb-2">
                  <Icon className={`h-4 w-4 md:h-5 md:w-5 ${s.color}`} />
                  <h3 className="text-xs md:text-sm font-semibold text-muted-foreground">{s.label}</h3>
                </div>
                <p className="text-lg md:text-2xl font-black text-foreground">{s.value}</p>
              </div>
            )
          })}
        </div>

        {/* Tab Switch */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === "sales" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("sales")}
            className={cn(activeTab === "sales" && "bg-primary text-primary-foreground")}
          >
            <ShoppingBag className="h-4 w-4 mr-1.5" />
            Vendas
          </Button>
          <Button
            variant={activeTab === "popular" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("popular")}
            className={cn(activeTab === "popular" && "bg-primary text-primary-foreground")}
          >
            <Flame className="h-4 w-4 mr-1.5" />
            Mais Vendidos
          </Button>
        </div>

        {/* Popular Items Tab */}
        {activeTab === "popular" && (
          <div className="space-y-6">
            {/* Top Products */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b border-border">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Produtos Mais Vendidos
                </h3>
              </div>
              <div className="p-4 md:p-6">
                {popularItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Nenhuma venda registrada ainda</p>
                ) : (
                  <div className="space-y-3">
                    {popularItems.slice(0, 15).map((item, idx) => {
                      const maxQty = popularItems[0]?.qty || 1
                      const pct = Math.round((item.qty / maxQty) * 100)
                      return (
                        <div key={item.name} className="flex items-center gap-3">
                          <span className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                            idx === 0 ? "bg-primary text-primary-foreground" :
                            idx === 1 ? "bg-chart-3 text-card" :
                            idx === 2 ? "bg-accent text-accent-foreground" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-semibold text-foreground text-sm truncate">{item.name}</span>
                              <span className="text-sm font-bold text-foreground ml-2 shrink-0">{item.qty}x</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{formatCurrency(item.revenue)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Popular Ingredients */}
            {popularIngredients.length > 0 && (
              <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-4 md:px-6 py-4 border-b border-border">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Flame className="h-4 w-4 text-destructive" />
                    Ingredientes Mais Pedidos (Lanches Personalizados)
                  </h3>
                </div>
                <div className="p-4 md:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {popularIngredients.slice(0, 12).map(([name, count], idx) => (
                      <div key={name} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <span className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                          idx < 3 ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
                        )}>
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                          <p className="text-xs text-muted-foreground">{count} pedido{count !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === "sales" && (
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-border flex flex-wrap justify-between items-center gap-2">
              <h3 className="font-bold text-foreground">Vendas Recentes</h3>
              <Button variant="ghost" size="sm" className="text-primary" onClick={exportCSV}>Exportar CSV</Button>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden p-3 space-y-2">
              {filteredSales.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {filterMode === "day" ? `Nenhuma venda em ${new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR")}` : "Nenhuma venda registrada"}
                </p>
              ) : (
                filteredSales.slice(0, 50).map((s) => (
                  <div key={s.id} className="bg-muted/50 rounded-lg p-3 border border-border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-foreground text-sm">{s.customer}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={s.orderType === "delivery" ? "default" : "secondary"} className={cn("text-xs", s.orderType === "delivery" ? "bg-chart-3 text-card" : s.orderType === "table" ? "bg-primary/20 text-primary" : "")}>
                            {s.orderType === "delivery" ? "Entrega" : s.orderType === "table" ? "Mesa" : "Retirada"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{paymentMethodLabels[s.paymentMethod] || s.paymentMethod}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-foreground">{formatCurrency(s.total)}</span>
                        <div className="flex gap-1 mt-1 justify-end">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setExpandedSaleId(expandedSaleId === s.id ? null : s.id)}>
                            <ShoppingBag className="h-3 w-3 text-chart-3" />
                          </Button>
                          {onReprint && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Reimprimir" onClick={() => onReprint(s)}>
                              <Printer className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => startEdit(s)}>
                            <Edit2 className="h-3 w-3 text-accent-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onDeleteSale(s.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(s.date).toLocaleString("pt-BR")}</span>
                    {expandedSaleId === s.id && (
                      <div className="mt-2 pt-2 border-t border-border text-sm space-y-1">
                        {s.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="text-foreground">{item.quantity}x {item.name}</span>
                            <span className="font-mono text-foreground">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground text-xs">Data</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground text-xs">Cliente</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground text-xs">Tipo</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground text-xs">Pagamento</th>
                    <th className="px-4 py-3 text-right font-bold text-muted-foreground text-xs">Total</th>
                    <th className="px-4 py-3 text-right font-bold text-muted-foreground text-xs">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSales.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      {filterMode === "day" ? `Nenhuma venda em ${new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR")}` : "Nenhuma venda registrada"}
                    </td></tr>
                  ) : (
                    filteredSales.slice(0, 50).map((s) => (
                      <React.Fragment key={s.id}>
                        <tr className="hover:bg-muted/50">
                          <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.date).toLocaleString("pt-BR")}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">{s.customer}</td>
                          <td className="px-4 py-3">
                            <Badge variant={s.orderType === "delivery" ? "default" : "secondary"} className={s.orderType === "delivery" ? "bg-chart-3 text-card" : s.orderType === "table" ? "bg-primary/20 text-primary" : ""}>
                              {s.orderType === "delivery" ? "Entrega" : s.orderType === "table" ? "Mesa" : "Retirada"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {paymentMethodLabels[s.paymentMethod] || s.paymentMethod}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-foreground">
                            {formatCurrency(s.total)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-7 px-2" title="Ver itens" onClick={() => setExpandedSaleId(expandedSaleId === s.id ? null : s.id)}>
                                <ShoppingBag className="h-3.5 w-3.5 text-chart-3" />
                              </Button>
                              {onReprint && (
                                <Button variant="ghost" size="sm" className="h-7 px-2" title="Reimprimir pedido" onClick={() => onReprint(s)}>
                                  <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" className="h-7 px-2" title="Editar venda" onClick={() => startEdit(s)}>
                                <Edit2 className="h-3.5 w-3.5 text-accent-foreground" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2" title="Excluir venda" onClick={() => onDeleteSale(s.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {expandedSaleId === s.id && (
                          <tr>
                            <td colSpan={6} className="bg-muted/30 px-6 py-3">
                              <div className="text-sm space-y-1">
                                <p className="font-bold text-foreground mb-2">Itens do pedido:</p>
                                {s.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-start py-1 border-b border-border last:border-0">
                                    <div>
                                      <span className="font-semibold text-foreground">{item.quantity}x {item.name}</span>
                                      {item.observation && <p className="text-xs text-muted-foreground whitespace-pre-line ml-4">{item.observation}</p>}
                                    </div>
                                    <span className="font-mono text-foreground">{formatCurrency(item.price * item.quantity)}</span>
                                  </div>
                                ))}
                                {s.deliveryFee > 0 && (
                                  <div className="flex justify-between pt-1 text-muted-foreground">
                                    <span>Taxa de entrega</span><span className="font-mono">{formatCurrency(s.deliveryFee)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between pt-2 font-bold text-foreground border-t border-border mt-1">
                                  <span>Total</span><span>{formatCurrency(s.total)}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Sale Modal */}
      <Dialog open={!!editingSale} onOpenChange={(open) => !open && setEditingSale(null)}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Editar Venda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data e Hora</Label>
              <Input type="datetime-local" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
            </div>
            <div>
              <Label>Cliente</Label>
              <Input value={editForm.customer} onChange={(e) => setEditForm({ ...editForm, customer: e.target.value })} />
            </div>
            <div>
              <Label>Tipo de Pedido</Label>
              <Select value={editForm.orderType} onValueChange={(v) => setEditForm({ ...editForm, orderType: v as Sale["orderType"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Retirada</SelectItem>
                  <SelectItem value="delivery">Entrega</SelectItem>
                  <SelectItem value="table">Mesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Metodo de Pagamento</Label>
              <Select value={editForm.paymentMethod} onValueChange={(v) => setEditForm({ ...editForm, paymentMethod: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethodLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Total (R$)</Label>
              <Input type="number" step="0.01" value={editForm.total} onChange={(e) => setEditForm({ ...editForm, total: e.target.value })} />
            </div>
            <div>
              <Label>Observação do Pedido</Label>
              <Textarea value={editForm.observation} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm({ ...editForm, observation: e.target.value })} rows={2} className="text-sm resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditingSale(null)}>Cancelar</Button>
              <Button className="flex-1 bg-primary text-primary-foreground" onClick={saveEdit}>Salvar Alteracoes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================== CASHIER VIEW ====================
interface CashierViewProps {
  cashierOpen: boolean
  cashierData: { opening: number; sales: Record<string, number>; openedAt?: string }
  onOpenCashier: (amount: number) => void
  onCloseCashier: () => void
  expenses?: Expense[]
}

export function CashierView({ cashierOpen, cashierData, onOpenCashier, onCloseCashier, expenses }: CashierViewProps) {
  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState<"open" | "close">("open")
  const [amount, setAmount] = useState("")

  const totalSales = Object.values(cashierData.sales).reduce((a, b) => a + b, 0)
  // Only count expenses from the current cashier session
  const sessionExpenses = (expenses || []).filter((e) => {
    if (!cashierData.openedAt) return new Date(e.date).toDateString() === new Date().toDateString()
    return new Date(e.date) >= new Date(cashierData.openedAt)
  })
  const totalExpenses = sessionExpenses.reduce((sum, e) => sum + e.amount, 0)
  const cashierTotal = cashierData.opening + totalSales - totalExpenses

  const openModal = (action: "open" | "close") => {
    setModalAction(action)
    setAmount(action === "close" ? cashierTotal.toFixed(2) : "")
    setShowModal(true)
  }

  const handleConfirm = () => {
    if (modalAction === "open") {
      onOpenCashier(parseFloat(amount) || 0)
    } else {
      onCloseCashier()
    }
    setShowModal(false)
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="bg-card shadow-sm border-b border-border px-4 md:px-6 py-4 flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Controle de Caixa</h2>
        <div className="flex gap-2">
          {!cashierOpen ? (
            <Button className="bg-primary text-primary-foreground" onClick={() => openModal("open")}>
              <Unlock className="h-4 w-4 mr-2" />Abrir Caixa
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => openModal("close")}>
              <Lock className="h-4 w-4 mr-2" />Fechar Caixa
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          {!cashierOpen ? (
            <div className="bg-destructive/5 border-2 border-destructive/20 rounded-xl p-8 text-center">
              <Lock className="h-12 w-12 mx-auto mb-4 text-destructive/40" />
              <h3 className="text-xl font-bold text-destructive">Caixa Fechado</h3>
              <p className="text-muted-foreground mt-2">Abra o caixa para comecar a vender</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-card p-4 md:p-6 rounded-xl shadow-sm border border-border">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h3 className="font-bold text-foreground">Resumo do Dia</h3>
                  {cashierData.openedAt && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      Aberto em: {new Date(cashierData.openedAt).toLocaleString("pt-BR")}
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Abertura:</span>
                    <span className="font-semibold text-foreground">{formatCurrency(cashierData.opening)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Vendas (Dinheiro):</span>
                    <span className="font-semibold text-primary">{formatCurrency(cashierData.sales.money || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Vendas (Pix):</span>
                    <span className="font-semibold text-chart-3">{formatCurrency(cashierData.sales.pix || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Vendas (Debito):</span>
                    <span className="font-semibold text-chart-5">{formatCurrency(cashierData.sales.debit || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Vendas (Credito):</span>
                    <span className="font-semibold text-accent-foreground">{formatCurrency(cashierData.sales.credit || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Total Vendas:</span>
                    <span className="font-semibold text-primary">{formatCurrency(totalSales)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <ArrowDownCircle className="h-3.5 w-3.5 text-destructive" />
                      Despesas / Saidas:
                    </span>
                    <span className="font-semibold text-destructive">-{formatCurrency(totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between py-3 text-lg font-bold">
                    <span className="text-foreground">Saldo em Caixa:</span>
                    <span className={cashierTotal >= 0 ? "text-primary" : "text-destructive"}>{formatCurrency(cashierTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>{modalAction === "open" ? "Abrir Caixa" : "Fechar Caixa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{modalAction === "open" ? "Valor de abertura (R$):" : "Valor em caixa (R$):"}</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button className="flex-1 bg-primary text-primary-foreground" onClick={handleConfirm}>Confirmar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
