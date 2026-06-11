"use client"

import { useState } from "react"
import { Sandwich, CupSoda, Droplets, Zap, GlassWater, Package, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency, type Product } from "@/lib/store"

function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    lanches: "hsl(38,95%,50%)",
    bebidas: "hsl(220,70%,52%)",
    porcoes: "hsl(280,65%,58%)",
    sobremesas: "hsl(340,80%,58%)",
    acompanhamentos: "hsl(158,72%,36%)",
  }
  return map[category.toLowerCase()] ?? "hsl(220,14%,50%)"
}

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
        <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {categories.map((cat) => {
            const isActive = category === cat.key
            const color = cat.key === "all" ? "hsl(158,72%,36%)" : getCategoryColor(cat.key)
            return (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border",
                  isActive
                    ? "text-white shadow-sm border-transparent"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                )}
                style={isActive ? { background: color, borderColor: color } : {}}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Products */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {/* Custom burger card */}
          <button
            onClick={onStartCustomBurger}
            className="group relative rounded-2xl border-2 border-dashed overflow-hidden transition-all hover:shadow-md active:scale-95 flex flex-col items-center justify-center p-5 min-h-[170px]"
            style={{ borderColor: "hsl(38,95%,50%)", background: "hsl(38,95%,98%)" }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
              style={{ background: "linear-gradient(135deg, hsl(38,95%,50%), hsl(38,90%,42%))" }}
            >
              <Sandwich className="h-7 w-7 text-white" />
            </div>
            <span className="font-black text-sm text-center leading-tight" style={{ color: "hsl(30,50%,20%)" }}>
              Monte seu Lanche
            </span>
            <span className="text-xs mt-1 font-medium" style={{ color: "hsl(38,50%,50%)" }}>Personalizado</span>
          </button>

          {filtered.map((product) => {
            const Icon = product.category === "bebidas" ? getBevIcon(product.name) : Package
            const isOutOfStock = product.stock <= 0
            const isLowStock = product.stock > 0 && product.stock <= 5
            const color = getCategoryColor(product.category)

            return (
              <button
                key={product.id}
                disabled={isOutOfStock}
                onClick={() => onAddToCart(product)}
                className={cn(
                  "group bg-card rounded-2xl border border-border overflow-hidden transition-all text-left relative",
                  isOutOfStock
                    ? "opacity-55 cursor-not-allowed"
                    : "hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                )}
              >
                {/* Color stripe */}
                <div className="h-1 w-full" style={{ background: isOutOfStock ? "hsl(220,14%,88%)" : color }} />

                {/* Out of stock overlay */}
                {isOutOfStock && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                    <span className="bg-destructive text-destructive-foreground text-xs font-black px-3 py-1.5 rounded-full shadow-sm">
                      Esgotado
                    </span>
                  </div>
                )}

                {/* Icon area */}
                <div className="aspect-square flex items-center justify-center relative"
                  style={{ background: `${color}12` }}
                >
                  <Icon className="h-12 w-12 transition-transform group-hover:scale-110" style={{ color: `${color}80` }} />
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-bold text-sm text-foreground mb-2 leading-tight line-clamp-2">{product.name}</h3>
                  <div className="flex items-end justify-between gap-1">
                    <span className="text-lg font-black" style={{ color: isOutOfStock ? "hsl(220,14%,60%)" : color }}>
                      {formatCurrency(product.price)}
                    </span>
                    {isLowStock && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-destructive">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {product.stock}
                      </span>
                    )}
                    {!isLowStock && !isOutOfStock && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {product.stock} un
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {filtered.length === 0 && category !== "all" && (
          <div className="text-center py-16 mt-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
              <Package className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="font-bold text-foreground">Nenhum produto nesta categoria</p>
            <p className="text-sm text-muted-foreground mt-1">Tente selecionar outra categoria ou cadastre produtos.</p>
          </div>
        )}
      </div>
    </div>
  )
}
