"use client"

import { useEffect, useMemo, useState } from "react"
import { Calculator, Info } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/store"
import { loadIngredients } from "@/lib/inventory-storage"
import { loadRecipes, calcRecipeCost, type Recipe } from "@/lib/recipes-storage"
import { pullFichas } from "@/lib/fichas-sync"

const STORAGE_KEY = "mais_sub_pricing_calc"

interface CalcState {
  cmv: number            // custo dos ingredientes (R$)
  embalagem: number      // R$ por unidade
  custoFixoMensal: number // R$/mês
  vendasMes: number      // unidades/mês
  taxaCartao: number     // %
  imposto: number        // %
  marketplace: number    // % (iFood etc.)
  margemModo: "pct" | "valor" // como definir o lucro
  margemLucro: number    // % desejada sobre venda
  margemValor: number    // R$ de lucro por unidade
}

const DEFAULT_STATE: CalcState = {
  cmv: 0,
  embalagem: 0,
  custoFixoMensal: 0,
  vendasMes: 0,
  taxaCartao: 0,
  imposto: 0,
  marketplace: 0,
  margemModo: "pct",
  margemLucro: 30,
  margemValor: 0,
}

function NumberField({ label, hint, value, onChange, prefix, suffix }: {
  label: string; hint?: string; value: number
  onChange: (v: number) => void; prefix?: string; suffix?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{prefix}</span>}
        <Input
          type="number" min="0" step="any" value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={prefix ? "pl-9" : suffix ? "pr-9" : ""}
          placeholder="0"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{suffix}</span>}
      </div>
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  )
}

export default function PrecificacaoPage() {
  const [s, setS] = useState<CalcState>(DEFAULT_STATE)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [ingredients, setIngredients] = useState(loadIngredients())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setS({ ...DEFAULT_STATE, ...JSON.parse(raw) })
    } catch {}
    pullFichas().then(() => {
      setRecipes(loadRecipes())
      setIngredients(loadIngredients())
    })
  }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {}
  }, [s])

  const set = (patch: Partial<CalcState>) => setS((prev) => ({ ...prev, ...patch }))

  // Carrega o CMV de uma ficha técnica existente
  function loadFromRecipe(productId: string) {
    const r = recipes.find((x) => x.productId === productId)
    if (!r) return
    const { cost } = calcRecipeCost(r, ingredients)
    set({ cmv: Number(cost.toFixed(2)) })
  }

  const result = useMemo(() => {
    const fixoUnit = s.vendasMes > 0 ? s.custoFixoMensal / s.vendasMes : 0
    const custoTotal = s.cmv + s.embalagem + fixoUnit
    const taxasPct = s.taxaCartao + s.imposto + s.marketplace
    let precoSugerido = 0
    let invalid = false
    if (s.margemModo === "pct") {
      // Preço = custo / (1 - (taxas% + margem%))
      const divisor = 1 - (taxasPct + s.margemLucro) / 100
      invalid = divisor <= 0
      precoSugerido = invalid ? 0 : custoTotal / divisor
    } else {
      // Lucro fixo em R$: Preço = (custo + lucro) / (1 - taxas%)
      const divisor = 1 - taxasPct / 100
      invalid = divisor <= 0
      precoSugerido = invalid ? 0 : (custoTotal + s.margemValor) / divisor
    }
    const taxasReais = precoSugerido * taxasPct / 100
    const lucro = precoSugerido - custoTotal - taxasReais
    const margemReal = precoSugerido > 0 ? (lucro / precoSugerido) * 100 : 0
    const markup = custoTotal > 0 ? (lucro / custoTotal) * 100 : 0
    const pctSobreVenda = taxasPct + (s.margemModo === "pct" ? s.margemLucro : margemReal)
    return { fixoUnit, custoTotal, pctSobreVenda, precoSugerido, taxasReais, lucro, margemReal, markup, invalid }
  }, [s])

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-2">
        <Calculator className="h-6 w-6 text-[#EE5C13]" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calculadora de Precificação</h1>
          <p className="text-sm text-gray-500">CMV, custos fixos, taxas e margem — preço de venda ideal</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Inputs */}
        <div className="space-y-5 lg:col-span-2">
          {/* Custo do produto */}
          <Card className="p-5 space-y-4">
            <h2 className="font-bold text-gray-900">1. Custo do produto</h2>
            {recipes.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-sm">Puxar CMV de uma ficha técnica</Label>
                <Select onValueChange={loadFromRecipe}>
                  <SelectTrigger><SelectValue placeholder="Selecione um produto..." /></SelectTrigger>
                  <SelectContent>
                    {recipes.map((r) => (
                      <SelectItem key={r.productId} value={r.productId}>
                        {r.productName} — {formatCurrency(calcRecipeCost(r, ingredients).cost)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="CMV — custo dos ingredientes" hint="Custo da ficha técnica" prefix="R$" value={s.cmv} onChange={(v) => set({ cmv: v })} />
              <NumberField label="Embalagem / descartáveis" hint="Por unidade" prefix="R$" value={s.embalagem} onChange={(v) => set({ embalagem: v })} />
            </div>
          </Card>

          {/* Custos fixos */}
          <Card className="p-5 space-y-4">
            <h2 className="font-bold text-gray-900">2. Custos fixos</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="Custo fixo mensal total" hint="Aluguel, energia, salários, internet…" prefix="R$" value={s.custoFixoMensal} onChange={(v) => set({ custoFixoMensal: v })} />
              <NumberField label="Vendas estimadas / mês" hint="Quantidade de produtos vendidos" suffix="un" value={s.vendasMes} onChange={(v) => set({ vendasMes: v })} />
            </div>
            <div className="rounded-lg bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
              Custo fixo por produto: <strong className="text-gray-900">{formatCurrency(result.fixoUnit)}</strong>
            </div>
          </Card>

          {/* Custos variáveis */}
          <Card className="p-5 space-y-4">
            <h2 className="font-bold text-gray-900">3. Custos variáveis (% sobre a venda)</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField label="Taxa de cartão" suffix="%" value={s.taxaCartao} onChange={(v) => set({ taxaCartao: v })} />
              <NumberField label="Impostos" suffix="%" value={s.imposto} onChange={(v) => set({ imposto: v })} />
              <NumberField label="Comissão app (iFood…)" suffix="%" value={s.marketplace} onChange={(v) => set({ marketplace: v })} />
            </div>
          </Card>

          {/* Lucro */}
          <Card className="p-5 space-y-4">
            <h2 className="font-bold text-gray-900">4. Lucro desejado</h2>
            <div className="inline-flex rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => set({ margemModo: "pct" })}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${s.margemModo === "pct" ? "bg-[#EE5C13] text-white" : "text-gray-500 hover:text-gray-800"}`}
              >
                Por % (margem)
              </button>
              <button
                onClick={() => set({ margemModo: "valor" })}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${s.margemModo === "valor" ? "bg-[#EE5C13] text-white" : "text-gray-500 hover:text-gray-800"}`}
              >
                Por valor (R$)
              </button>
            </div>
            {s.margemModo === "pct" ? (
              <NumberField label="Margem de lucro sobre a venda" hint="Lucro líquido em % do preço de venda" suffix="%" value={s.margemLucro} onChange={(v) => set({ margemLucro: v })} />
            ) : (
              <NumberField label="Lucro desejado por produto" hint="Quanto você quer ganhar (líquido) em cada venda" prefix="R$" value={s.margemValor} onChange={(v) => set({ margemValor: v })} />
            )}
          </Card>
        </div>

        {/* Resultado */}
        <div className="lg:col-span-1">
          <Card className="p-5 space-y-4 lg:sticky lg:top-20 bg-gradient-to-b from-white to-orange-50/40 border-orange-200">
            <h2 className="font-bold text-gray-900">Resultado</h2>

            {result.invalid ? (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                <Info size={15} className="mt-0.5 shrink-0" />
                A soma de taxas + margem ({result.pctSobreVenda.toFixed(0)}%) chegou a 100% ou mais. Reduza algum percentual.
              </div>
            ) : (
              <>
                <div className="rounded-xl bg-[#EE5C13] p-4 text-center text-white">
                  <p className="text-[11px] uppercase tracking-wider opacity-90">Preço de venda sugerido</p>
                  <p className="text-3xl font-black mt-1">{formatCurrency(result.precoSugerido)}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <Row label="Custo total (CMV+emb.+fixo)" value={formatCurrency(result.custoTotal)} />
                  <Row label="Taxas (cartão+imposto+app)" value={`- ${formatCurrency(result.taxasReais)}`} />
                  <div className="border-t border-gray-200 pt-2">
                    <Row label="Lucro líquido" value={formatCurrency(result.lucro)} strong positive={result.lucro >= 0} />
                  </div>
                  <Row label="Margem real" value={`${result.margemReal.toFixed(1)}%`} />
                  <Row label="Markup" value={`${result.markup.toFixed(0)}%`} />
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, strong, positive }: { label: string; value: string; strong?: boolean; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={[
        strong ? "font-black text-base" : "font-semibold",
        positive === undefined ? "text-gray-900" : positive ? "text-emerald-600" : "text-red-600",
      ].join(" ")}>{value}</span>
    </div>
  )
}
