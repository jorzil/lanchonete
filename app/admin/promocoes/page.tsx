"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Trash2, Clock, Loader2, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PRODUCTS, formatCurrency } from "@/lib/store"
import {
  fetchPromotions, patchPromotions, isPromotionActive, minutesUntilStart,
  formatHour, DAY_LABELS, type Promotion,
} from "@/lib/promotions"
import { toast } from "sonner"

// Só subs entram na promoção: o preço é definido por tamanho (15cm / 30cm).
const SUBS = PRODUCTS.filter((p) => p.category === "subs-15cm" || p.category === "subs-30cm")
const SUBS_15 = SUBS.filter((p) => p.category === "subs-15cm")
const SUBS_30 = SUBS.filter((p) => p.category === "subs-30cm")

function novaPromocao(): Promotion {
  return {
    id: `promo-${Date.now().toString(36)}`,
    name: "Almoço Mais Sub",
    enabled: true,
    productIds: [],
    price15: 25.99,
    price30: 48.99,
    start: "12:00",
    end: "15:30",
    days: [1, 2, 3, 4, 5],
  }
}

export default function PromocoesPage() {
  const [promos, setPromos] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // Relógio próprio: sem ele o selo "ativa agora" congelaria na hora da carga
  const [agora, setAgora] = useState(() => new Date())

  useEffect(() => {
    fetchPromotions().then((p) => { setPromos(p); setLoading(false) })
    const t = setInterval(() => setAgora(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  async function salvar(next: Promotion[]) {
    setPromos(next)
    setSaving(true)
    const ok = await patchPromotions(next)
    setSaving(false)
    if (ok) toast.success("Promoções salvas")
    else toast.error("Não foi possível salvar. Tente novamente.")
  }

  function atualizar(id: string, patch: Partial<Promotion>) {
    setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function alternarProduto(promo: Promotion, productId: string) {
    const has = promo.productIds.includes(productId)
    atualizar(promo.id, {
      productIds: has ? promo.productIds.filter((i) => i !== productId) : [...promo.productIds, productId],
    })
  }

  function alternarDia(promo: Promotion, dia: number) {
    const has = promo.days.includes(dia)
    atualizar(promo.id, { days: has ? promo.days.filter((d) => d !== dia) : [...promo.days, dia].sort() })
  }

  const resumo = useMemo(
    () => promos.map((p) => ({ id: p.id, ativa: isPromotionActive(p, agora), faltam: minutesUntilStart(p, agora) })),
    [promos, agora],
  )

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando…</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Promoções por horário</h1>
          <p className="text-sm text-gray-500">
            Preço especial em subs escolhidos, valendo só dentro da faixa de horário.
          </p>
        </div>
        <Button
          onClick={() => salvar([...promos, novaPromocao()])}
          className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]"
        >
          <Plus size={16} className="mr-1" /> Nova promoção
        </Button>
      </div>

      {promos.length === 0 && (
        <Card className="p-10 text-center">
          <Clock className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="font-bold text-gray-700">Nenhuma promoção cadastrada</p>
          <p className="mt-1 text-sm text-gray-400">
            Crie uma para oferecer, por exemplo, o almoço com preço reduzido das 12h às 15h30.
          </p>
        </Card>
      )}

      {promos.map((promo) => {
        const info = resumo.find((r) => r.id === promo.id)
        const semProduto = promo.productIds.length === 0
        const semDia = promo.days.length === 0
        return (
          <Card key={promo.id} className="space-y-5 p-5">
            {/* Cabeçalho */}
            <div className="flex flex-wrap items-center gap-3">
              <Input
                value={promo.name}
                onChange={(e) => atualizar(promo.id, { name: e.target.value })}
                onBlur={() => salvar(promos)}
                className="h-10 max-w-xs font-bold"
                placeholder="Nome da promoção"
              />
              {info?.ativa ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Ativa agora
                </span>
              ) : info?.faltam != null ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  Começa em {Math.floor(info.faltam / 60)}h{String(info.faltam % 60).padStart(2, "0")}
                </span>
              ) : (
                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-500">
                  Fora do horário
                </span>
              )}
              <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer accent-[#EE5C13]"
                  checked={promo.enabled}
                  onChange={(e) => salvar(promos.map((p) => (p.id === promo.id ? { ...p, enabled: e.target.checked } : p)))}
                />
                <span className="font-medium text-gray-700">Ligada</span>
              </label>
              <Button
                variant="ghost" size="sm"
                className="text-red-400 hover:bg-red-50 hover:text-red-600"
                onClick={() => { if (confirm(`Excluir a promoção "${promo.name}"?`)) salvar(promos.filter((p) => p.id !== promo.id)) }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Horário e preços */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Começa às</Label>
                <Input type="time" value={promo.start} onChange={(e) => atualizar(promo.id, { start: e.target.value })} onBlur={() => salvar(promos)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Termina às</Label>
                <Input type="time" value={promo.end} onChange={(e) => atualizar(promo.id, { end: e.target.value })} onBlur={() => salvar(promos)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Preço 15cm</Label>
                <Input
                  type="number" step="0.01" min="0" value={promo.price15}
                  onChange={(e) => atualizar(promo.id, { price15: parseFloat(e.target.value) || 0 })}
                  onBlur={() => salvar(promos)}
                />
                <p className="text-[11px] text-gray-400">Normal: {formatCurrency(27.9)}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Preço 30cm</Label>
                <Input
                  type="number" step="0.01" min="0" value={promo.price30}
                  onChange={(e) => atualizar(promo.id, { price30: parseFloat(e.target.value) || 0 })}
                  onBlur={() => salvar(promos)}
                />
                <p className="text-[11px] text-gray-400">Normal: {formatCurrency(52.9)}</p>
              </div>
            </div>

            {/* Dias da semana */}
            <div>
              <Label className="text-xs text-gray-500">Dias da semana</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {DAY_LABELS.map((label, dia) => {
                  const on = promo.days.includes(dia)
                  return (
                    <button
                      key={dia}
                      onClick={() => { alternarDia(promo, dia); }}
                      onBlur={() => salvar(promos)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                        on ? "border-[#EE5C13] bg-[#EE5C13] text-white" : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              {semDia && <p className="mt-1.5 text-[11px] font-medium text-amber-600">Escolha ao menos um dia — sem isso a promoção nunca vale.</p>}
            </div>

            {/* Produtos */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-500">Subs na promoção</Label>
                <span className="text-[11px] text-gray-400">{promo.productIds.length} selecionado(s)</span>
              </div>
              <div className="mt-2 grid gap-4 sm:grid-cols-2">
                {[
                  { titulo: "15cm", lista: SUBS_15, preco: promo.price15 },
                  { titulo: "30cm", lista: SUBS_30, preco: promo.price30 },
                ].map(({ titulo, lista, preco }) => (
                  <div key={titulo} className="rounded-xl border border-gray-100 p-3">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                      {titulo} · {formatCurrency(preco)}
                    </p>
                    <div className="space-y-1.5">
                      {lista.map((p) => {
                        const on = promo.productIds.includes(p.id)
                        const caro = preco >= p.price
                        return (
                          <label key={p.id} className="flex cursor-pointer items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              className="h-4 w-4 cursor-pointer accent-[#EE5C13]"
                              checked={on}
                              onChange={() => { alternarProduto(promo, p.id) }}
                              onBlur={() => salvar(promos)}
                            />
                            <span className={on ? "font-medium text-gray-900" : "text-gray-600"}>{p.name}</span>
                            {on && caro && (
                              <span className="text-[10px] font-bold text-amber-600">
                                não aplica (≥ {formatCurrency(p.price)})
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {semProduto && <p className="mt-1.5 text-[11px] font-medium text-amber-600">Escolha ao menos um sub.</p>}
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <p className="text-[12px] text-gray-500">
                {promo.days.length > 0
                  ? `${promo.days.map((d) => DAY_LABELS[d]).join(", ")} · ${formatHour(promo.start)} às ${formatHour(promo.end)}`
                  : "Sem dias definidos"}
              </p>
              <Button size="sm" onClick={() => salvar(promos)} disabled={saving} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">
                {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
                Salvar
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
