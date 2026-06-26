"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { MENU } from "@/lib/data"
import {
  fetchDisabledIngredients,
  patchDisabledIngredients,
  ingKey,
  type IngredientCategory,
} from "@/lib/ingredients-availability"
import { Check, X, Loader2 } from "lucide-react"

interface Group {
  category: IngredientCategory
  title: string
  emoji: string
  items: { key: string; name: string }[]
}

const GROUPS: Group[] = [
  { category: "bread",  title: "Pães",    emoji: "🍞", items: MENU.breads.map((b) => ({ key: b.key, name: b.name })) },
  { category: "meat",   title: "Carnes",  emoji: "🥩", items: MENU.meats.map((m) => ({ key: m.key, name: m.name })) },
  { category: "cheese", title: "Queijos", emoji: "🧀", items: MENU.cheeses.map((c) => ({ key: c.key, name: c.name })) },
  { category: "salad",  title: "Saladas", emoji: "🥗", items: MENU.salads.filter((s) => s.key !== "salada-completa").map((s) => ({ key: s.key, name: s.name })) },
  { category: "sauce",  title: "Molhos",  emoji: "🥫", items: MENU.sauces.map((s) => ({ key: s.key, name: s.name })) },
  { category: "extra",  title: "Adicionais (Turbinar)", emoji: "⚡", items: MENU.extras.map((e) => ({ key: e.key, name: e.name })) },
]

export default function DisponibilidadePage() {
  const [disabled, setDisabled] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDisabledIngredients().then((set) => {
      setDisabled(set)
      setLoaded(true)
    })
  }, [])

  async function toggle(category: IngredientCategory, key: string) {
    const id = ingKey(category, key)
    const next = new Set(disabled)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setDisabled(next)
    setSaving(true)
    await patchDisabledIngredients([...next])
    setSaving(false)
  }

  const disabledCount = disabled.size

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disponibilidade de Ingredientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Desative um ingrediente para que ele fique indisponível no &ldquo;Monte Seu Sub&rdquo;.
            Útil quando um item acaba no estoque.
          </p>
        </div>
        {saving && (
          <span className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
            <Loader2 size={13} className="animate-spin" /> Salvando…
          </span>
        )}
      </div>

      {disabledCount > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <strong>{disabledCount}</strong> ingrediente{disabledCount > 1 ? "s" : ""} indisponível{disabledCount > 1 ? "is" : ""} no momento.
        </div>
      )}

      {!loaded ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
          <Loader2 size={16} className="animate-spin mr-2" /> Carregando…
        </div>
      ) : (
        <div className="space-y-5">
          {GROUPS.map((group) => (
            <Card key={group.category} className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{group.emoji}</span>
                <h2 className="font-bold text-gray-900">{group.title}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.items.map((item) => {
                  const id = ingKey(group.category, item.key)
                  const isOff = disabled.has(id)
                  return (
                    <button
                      key={item.key}
                      onClick={() => toggle(group.category, item.key)}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                        isOff
                          ? "border-red-200 bg-red-50"
                          : "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50"
                      )}
                    >
                      <span className={cn("text-sm font-semibold", isOff ? "text-red-400 line-through" : "text-gray-800")}>
                        {item.name}
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full shrink-0",
                          isOff ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                        )}
                      >
                        {isOff ? <><X size={11} /> Indisponível</> : <><Check size={11} /> Disponível</>}
                      </span>
                    </button>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
