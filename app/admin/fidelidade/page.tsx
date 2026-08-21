"use client"

import { useEffect, useState } from "react"
import { Loader2, Check, Plus, Trash2, Gift } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/store"
import {
  fetchLoyaltyConfig, patchLoyaltyConfig, LOYALTY_DEFAULTS,
  type LoyaltyConfig, type Reward, type Tier,
} from "@/lib/loyalty"
import { toast } from "sonner"

const TIPOS: Array<{ v: Reward["tipo"]; label: string }> = [
  { v: "desconto_percentual", label: "Desconto %" },
  { v: "desconto_fixo", label: "Desconto R$" },
  { v: "frete_gratis", label: "Frete grátis" },
  { v: "cookie", label: "Cookie grátis" },
  { v: "adicional", label: "Adicional grátis" },
]

const STATUS = [
  { v: "entregue", label: "Entregue" },
  { v: "saiu_entrega", label: "Saiu p/ entrega" },
  { v: "pronto", label: "Pronto" },
  { v: "aceito", label: "Aceito" },
]

export default function FidelidadePage() {
  const [cfg, setCfg] = useState<LoyaltyConfig | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { fetchLoyaltyConfig().then(setCfg) }, [])

  async function salvar(next?: LoyaltyConfig) {
    const alvo = next ?? cfg
    if (!alvo) return
    setSalvando(true)
    const ok = await patchLoyaltyConfig(alvo)
    setSalvando(false)
    toast[ok ? "success" : "error"](ok ? "Clube salvo" : "Não foi possível salvar")
  }

  function up(patch: Partial<LoyaltyConfig>) { setCfg((c) => (c ? { ...c, ...patch } : c)) }
  function upReward(id: string, patch: Partial<Reward>) {
    up({ recompensas: (cfg?.recompensas ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)) })
  }
  function upTier(id: string, patch: Partial<Tier>) {
    up({ niveis: (cfg?.niveis ?? []).map((n) => (n.id === id ? { ...n, ...patch } : n)) })
  }

  if (!cfg) {
    return <div className="flex items-center justify-center py-20 text-gray-400"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando…</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Clube de fidelidade</h1>
          <p className="text-sm text-gray-500">
            Pontos por real gasto, selos por pedido e níveis pelo total — o cliente consulta em{" "}
            <code className="rounded bg-gray-100 px-1">/clube</code>.
          </p>
        </div>
        <Button onClick={() => salvar()} disabled={salvando} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">
          {salvando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />} Salvar
        </Button>
      </div>

      {/* Geral */}
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 cursor-pointer accent-[#EE5C13]"
              checked={cfg.ativo} onChange={(e) => up({ ativo: e.target.checked })} />
            <span className="font-medium text-gray-900">Clube ativo</span>
          </label>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-gray-500">Nome</Label>
            <Input value={cfg.nomePrograma} onChange={(e) => up({ nomePrograma: e.target.value })} className="h-9 w-56" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-gray-500">Pontos por R$ 1</Label>
            <Input type="number" min="0" step="0.1" value={cfg.pontosPorReal}
              onChange={(e) => up({ pontosPorReal: parseFloat(e.target.value) || 0 })} className="h-9 w-20" />
          </div>
        </div>
        <div>
          <Label className="text-xs text-gray-500">Pedidos que contam pontos</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {STATUS.map((s) => {
              const on = cfg.statusQueContam.includes(s.v)
              return (
                <button key={s.v}
                  onClick={() => up({ statusQueContam: on ? cfg.statusQueContam.filter((x) => x !== s.v) : [...cfg.statusQueContam, s.v] })}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                    on ? "border-[#EE5C13] bg-[#EE5C13] text-white" : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}>
                  {s.label}
                </button>
              )
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-gray-400">
            O padrão é só &quot;Entregue&quot;: pedido cancelado não pode virar ponto.
          </p>
        </div>
      </Card>

      {/* Níveis */}
      <Card className="space-y-3 p-5">
        <h2 className="font-bold text-gray-800">Níveis</h2>
        <p className="text-sm text-gray-500">Vantagem contínua enquanto o cliente estiver no nível.</p>
        {cfg.niveis.map((n) => (
          <div key={n.id} className="grid items-end gap-3 rounded-xl border border-gray-100 p-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Nome</Label>
              <Input value={n.nome} onChange={(e) => upTier(n.id, { nome: e.target.value })} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">A partir de (R$)</Label>
              <Input type="number" min="0" value={n.minimoGasto}
                onChange={(e) => upTier(n.id, { minimoGasto: parseFloat(e.target.value) || 0 })} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Desconto %</Label>
              <Input type="number" min="0" max="100" value={n.descontoPercentual}
                onChange={(e) => upTier(n.id, { descontoPercentual: parseFloat(e.target.value) || 0 })} className="h-9" />
            </div>
            <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm">
              <input type="checkbox" className="h-4 w-4 cursor-pointer accent-[#EE5C13]"
                checked={n.freteGratis} onChange={(e) => upTier(n.id, { freteGratis: e.target.checked })} />
              <span className="text-gray-700">Frete grátis</span>
            </label>
          </div>
        ))}
      </Card>

      {/* Recompensas */}
      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Recompensas</h2>
          <Button size="sm" variant="outline"
            onClick={() => up({ recompensas: [...cfg.recompensas, {
              id: `r-${Date.now().toString(36)}`, nome: "Nova recompensa", descricao: "",
              tipo: "desconto_fixo", valor: 10, moeda: "pontos", custo: 100, ativo: true,
            }] })}>
            <Plus size={14} className="mr-1" /> Nova
          </Button>
        </div>
        <p className="text-sm text-gray-500">
          Ao resgatar, o cliente recebe um cupom exclusivo, de uso único, válido por 30 dias.
        </p>
        {cfg.recompensas.map((r) => (
          <div key={r.id} className="space-y-3 rounded-xl border border-gray-100 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Gift size={15} className="text-gray-400" />
              <Input value={r.nome} onChange={(e) => upReward(r.id, { nome: e.target.value })} className="h-9 max-w-[200px] font-medium" />
              <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                <input type="checkbox" className="h-4 w-4 cursor-pointer accent-[#EE5C13]"
                  checked={r.ativo} onChange={(e) => upReward(r.id, { ativo: e.target.checked })} />
                <span className="text-gray-600">Ativa</span>
              </label>
              <Button variant="ghost" size="sm" className="ml-auto text-red-400 hover:bg-red-50 hover:text-red-600"
                onClick={() => up({ recompensas: cfg.recompensas.filter((x) => x.id !== r.id) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input value={r.descricao} onChange={(e) => upReward(r.id, { descricao: e.target.value })}
              placeholder="Descrição para o cliente" className="h-9" />
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Tipo</Label>
                <select value={r.tipo} onChange={(e) => upReward(r.id, { tipo: e.target.value as Reward["tipo"] })}
                  className="h-9 w-full rounded-md border border-gray-200 px-2 text-sm">
                  {TIPOS.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">
                  {r.tipo === "desconto_percentual" ? "Percentual" : r.tipo === "desconto_fixo" ? "Valor R$" : "—"}
                </Label>
                <Input type="number" min="0" value={r.valor} disabled={r.tipo !== "desconto_percentual" && r.tipo !== "desconto_fixo"}
                  onChange={(e) => upReward(r.id, { valor: parseFloat(e.target.value) || 0 })} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Custa em</Label>
                <select value={r.moeda} onChange={(e) => upReward(r.id, { moeda: e.target.value as Reward["moeda"] })}
                  className="h-9 w-full rounded-md border border-gray-200 px-2 text-sm">
                  <option value="pontos">Pontos</option>
                  <option value="selos">Selos (pedidos)</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Quanto custa</Label>
                <Input type="number" min="1" value={r.custo}
                  onChange={(e) => upReward(r.id, { custo: parseInt(e.target.value) || 1 })} className="h-9" />
                {r.moeda === "pontos" && cfg.pontosPorReal > 0 && (
                  <p className="text-[11px] text-gray-400">≈ {formatCurrency(r.custo / cfg.pontosPorReal)} gastos</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {cfg.recompensas.length === 0 && (
          <Button variant="outline" onClick={() => up({ recompensas: LOYALTY_DEFAULTS.recompensas })}>
            Usar as recompensas sugeridas
          </Button>
        )}
      </Card>
    </div>
  )
}
