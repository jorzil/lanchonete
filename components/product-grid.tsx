"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sandwich, CupSoda, Droplets, Zap, GlassWater, Package, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency, type Product } from "@/lib/store"

function getBevIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes("coca") || n.includes("guarana") || n.includes("redbull") || n.includes("fanta") || n.includes("sprite") || n.includes("schweppes")) return CupSoda
  if (n.includes("agua") || n.includes("water") || n.includes("h2oh")) return Droplets
  if (n.includes("gatorade")) return Zap
  if (n.includes("suco") || n.includes("limoneto") || n.includes("del valle") || n.includes("chá")) return GlassWater
  return CupSoda
}

interface ProductGridProps {
  products: Product[]
  onAddToCart: (product: Product) => void
  onStartCustomBurger: () => void
}

export function ProductGrid({ products, onAddToCart, onStartCustomBurger }: ProductGridProps) {
  const [category, setCategory] = useState<string>("all")

  // Derive categories dynamically from products
  const productCategories = Array.from(new Set(products.filter((p) => p.active).map((p) => p.category)))
  const categories: { key: string; label: string }[] = [
    { key: "all", label: "Todos" },
    ...productCategories.map((cat) => ({ key: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) })),
  ]

  const filtered =
    category === "all" ? products.filter((p) => p.active) : products.filter((p) => p.category === category && p.active)

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Category Filter */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <Button
              key={cat.key}
              size="sm"
              variant={category === cat.key ? "default" : "outline"}
              className={cn(
                "rounded-full whitespace-nowrap font-bold text-sm",
                category === cat.key && "bg-accent text-accent-foreground shadow-sm"
              )}
              onClick={() => setCategory(cat.key)}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-4">
        {category === "lanches" && filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-accent/20 rounded-full flex items-center justify-center">
              <Sandwich className="h-10 w-10 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Monte seu Lanche!</h3>
            <p className="text-muted-foreground mb-4">Personalize do seu jeito</p>
            <Button size="lg" className="bg-primary text-primary-foreground" onClick={onStartCustomBurger}>
              <Sandwich className="h-5 w-5 mr-2" />
              Monte seu Lanche
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {/* Always show "Monte seu Lanche" card */}
            <button
              onClick={onStartCustomBurger}
              className="bg-primary/5 rounded-xl border-2 border-dashed border-primary/40 overflow-hidden hover:border-primary hover:shadow-md transition-all cursor-pointer flex flex-col items-center justify-center p-4 min-h-[160px] active:scale-95"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <Sandwich className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-sm text-primary text-center">Monte seu Lanche</h3>
              <p className="text-xs text-muted-foreground mt-1">Personalizado</p>
            </button>

            {filtered.map((product) => {
              const Icon = product.category === "bebidas" ? getBevIcon(product.name) : Package
              const isOutOfStock = product.stock <= 0

              return (
                <button
                  key={product.id}
                  disabled={isOutOfStock}
                  onClick={() => onAddToCart(product)}
                  className={cn(
                    "bg-card rounded-xl shadow-sm border border-border overflow-hidden transition-all text-left relative group",
                    isOutOfStock ? "opacity-60 cursor-not-allowed bg-muted" : "hover:shadow-md hover:-translate-y-1 cursor-pointer active:scale-95"
                  )}
                >
                  {isOutOfStock && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                      <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Esgotado
                      </span>
                    </div>
                  )}
                  <div className="aspect-square bg-muted/50 relative flex items-center justify-center">
                    <Icon className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm text-foreground mb-1 leading-tight">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-lg font-black", isOutOfStock ? "text-muted-foreground" : "text-primary")}>
                        {formatCurrency(product.price)}
                      </span>
                      <span className={cn("text-xs", product.stock <= 5 && !isOutOfStock ? "text-destructive font-bold" : "text-muted-foreground")}>
                        Est: {product.stock}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
