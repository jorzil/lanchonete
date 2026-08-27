"use client"

import { useEffect, useState } from "react"
import { Loader2, Check, Plus, Trash2, Gift } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/store"
import {
  fetchLoyaltyConfig, patchLoyaltyConfig, LOYALTY_DEFAULTS, sliceOdds, chanceTotal, sliceColor, drawSlice,
  type LoyaltyConfig, type Reward, type Tier, type WheelSlice,
} from "@/lib/loyalty"
import { Roleta } from "@/components/clube/roleta"
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
  /** Contagem dos giros de teste, por fatia. */
  const [tally, setTally] = useState<Record<string, number>>({})
  const [simulando, setSimulando] = useState(false)

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
  function upFatia(id: string, patch: Partial<WheelSlice>) {
    if (!cfg) return
    up({ roleta: { ...cfg.roleta, fatias: cfg.roleta.fatias.map((f) => (f.id === id ? { ...f, ...patch } : f)) } })
  }

  if (!cfg) {
    return <div className="flex items-center justify-center py-20 text-gray-400"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando…</div>
  }

  /** Sorteia uma vez e contabiliza — usa a MESMA função do servidor. */
  function girarTeste(): number {
    const i = drawSlice(cfg!.roleta.fatias, Math.random())
    if (i >= 0) {
      const id = cfg!.roleta.fatias[i].id
      setTally((t) => ({ ...t, [id]: (t[id] ?? 0) + 1 }))
    }
    return i
  }

  /** Muitos giros de uma vez: é assim que se confere se a chance bate. */
  function simular(vezes: number) {
    if (!cfg) return
    setSimulando(true)
    const conta: Record<string, number> = { ...tally }
    for (let n = 0; n < vezes; n++) {
      const i = drawSlice(cfg.roleta.fatias, Math.random())
      if (i >= 0) {
        const id = cfg.roleta.fatias[i].id
        conta[id] = (conta[id] ?? 0) + 1
      }
    }
    setTally(conta)
    setSimulando(false)
  }

  const totalGiros = Object.values(tally).reduce((a, b) => a + b, 0)
  const odds = sliceOdds(cfg.roleta.fatias)
  const somaChances = chanceTotal(cfg.roleta.fatias)
  const chanceDePremio = cfg.roleta.fatias
    .filter((f) => f.tipo !== "nada")
    .reduce((s, f) => s + (odds[f.id] ?? 0), 0)

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

      {/* Roleta */}
      <Card className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-bold text-gray-800">🎡 Roleta da sorte</h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 cursor-pointer accent-[#EE5C13]"
              checked={cfg.roleta.ativo}
              onChange={(e) => up({ roleta: { ...cfg.roleta, ativo: e.target.checked } })} />
            <span className="font-medium text-gray-900">Ativa</span>
          </label>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-gray-500">Ganha 1 giro a cada</Label>
            <Input type="number" min="1" value={cfg.roleta.pedidosPorGiro}
              onChange={(e) => up({ roleta: { ...cfg.roleta, pedidosPorGiro: Math.max(1, parseInt(e.target.value) || 1) } })}
              className="h-9 w-20" />
            <span className="text-sm text-gray-600">pedidos</span>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Digite a <strong>chance de cada prêmio em %</strong>. O ideal é somar 100; se não somar,
          o sistema normaliza e mostra ao lado a chance que vale de verdade.
        </p>
        <div className={`rounded-lg border px-3 py-2 text-[12px] ${
          Math.abs(somaChances - 100) < 0.01
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}>
          Soma dos percentuais: <strong>{somaChances.toFixed(1)}%</strong>
          {Math.abs(somaChances - 100) >= 0.01 && " — será normalizado para 100%"}
        </div>

        <div className="space-y-2">
          {cfg.roleta.fatias.map((f, i) => {
            const chance = odds[f.id] ?? 0
            return (
              <div key={f.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 p-2">
                <span className="h-6 w-6 shrink-0 rounded border border-gray-200"
                  style={{ backgroundColor: sliceColor(f, i, cfg.roleta.fatias.length) }}
                  title={f.cor ? "cor própria" : "cor gerada pela posição"} />
                <Input value={f.nome} onChange={(e) => upFatia(f.id, { nome: e.target.value })}
                  className="h-9 w-[150px]" />
                <select value={f.tipo} onChange={(e) => upFatia(f.id, { tipo: e.target.value as WheelSlice["tipo"] })}
                  className="h-9 rounded-md border border-gray-200 px-2 text-sm">
                  <option value="nada">Sem prêmio</option>
                  {TIPOS.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
                </select>
                <Input type="number" min="0" value={f.valor}
                  disabled={f.tipo !== "desconto_percentual" && f.tipo !== "desconto_fixo"}
                  onChange={(e) => upFatia(f.id, { valor: parseFloat(e.target.value) || 0 })}
                  className="h-9 w-20" placeholder="valor" />
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs text-gray-500">Chance</Label>
                  <Input type="number" min="0" max="100" step="0.5" value={f.chance}
                    onChange={(e) => upFatia(f.id, { chance: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="h-9 w-20" />
                  <span className="text-xs text-gray-500">%</span>
                </div>
                <span className={`ml-auto rounded-full px-2 py-1 text-xs font-bold ${
                  chance >= 20 ? "bg-emerald-50 text-emerald-700" : chance >= 5 ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {chance.toFixed(1)}%
                </span>
                <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-50 hover:text-red-600"
                  onClick={() => up({ roleta: { ...cfg.roleta, fatias: cfg.roleta.fatias.filter((x) => x.id !== f.id) } })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
          <Button size="sm" variant="outline"
            onClick={() => up({ roleta: { ...cfg.roleta, fatias: [...cfg.roleta.fatias, {
              id: `w-${Date.now().toString(36)}`, nome: "Nova fatia", tipo: "nada",
              valor: 0, chance: 10,
            }] } })}>
            <Plus size={14} className="mr-1" /> Nova fatia
          </Button>
          <p className="text-[12px] text-gray-500">
            Chance de sair algum prêmio: <strong>{chanceDePremio.toFixed(1)}%</strong>
            {chanceDePremio > 70 && <span className="ml-2 font-bold text-amber-600">alta — confira sua margem</span>}
          </p>
        </div>
      </Card>

      {/* Prévia e teste da roleta */}
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-gray-800">Testar a roleta</h2>
            <p className="text-sm text-gray-500">
              Gire à vontade: aqui nada é gasto e nenhum cupom é gerado. O sorteio usa
              exatamente a mesma regra do site.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={simulando} onClick={() => simular(100)}>
              Simular 100 giros
            </Button>
            <Button size="sm" variant="outline" disabled={simulando} onClick={() => simular(1000)}>
              Simular 1.000
            </Button>
            {totalGiros > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setTally({})}>Zerar</Button>
            )}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* A roleta como o cliente vê, sobre o fundo escuro do site */}
          <div className="rounded-2xl bg-[#0B1F3A] p-4">
            <Roleta
              config={cfg.roleta}
              saldo={{ girosDisponiveis: 999, pedidosParaProximoGiro: 0 } as never}
              phone=""
              girarLocal={girarTeste}
              ocultarCabecalho
              onFim={() => {}}
            />
          </div>

          {/* Resultado acumulado */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Resultado dos testes</p>
              <span className="text-xs font-bold text-gray-600">{totalGiros} giro(s)</span>
            </div>
            {totalGiros === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                Gire a roleta ou use &quot;Simular&quot; para comparar a chance configurada com a obtida.
              </p>
            ) : (
              <div className="space-y-1.5">
                {cfg.roleta.fatias.map((f, i) => {
                  const vezes = tally[f.id] ?? 0
                  const obtido = (vezes / totalGiros) * 100
                  const esperado = odds[f.id] ?? 0
                  const desvio = Math.abs(obtido - esperado)
                  return (
                    <div key={f.id} className="flex items-center gap-2 text-[12px]">
                      <span className="h-3 w-3 shrink-0 rounded"
                        style={{ backgroundColor: sliceColor(f, i, cfg.roleta.fatias.length) }} />
                      <span className="w-32 shrink-0 truncate text-gray-700">{f.nome}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-gray-400"
                          style={{ width: `${Math.min(100, obtido)}%` }} />
                      </div>
                      <span className="w-24 shrink-0 text-right tabular-nums text-gray-500">
                        {obtido.toFixed(1)}% <span className="text-gray-300">/</span> {esperado.toFixed(1)}%
                      </span>
                      <span className={`w-10 shrink-0 text-right tabular-nums ${
                        totalGiros < 100 ? "text-gray-300" : desvio < 3 ? "text-emerald-600" : "text-amber-600"
                      }`}>
                        {vezes}
                      </span>
                    </div>
                  )
                })}
                <p className="pt-1 text-[11px] text-gray-400">
                  Coluna: obtido / configurado. Com poucos giros a diferença é normal — simule
                  1.000 para os números convergirem.
                </p>
              </div>
            )}
          </div>
        </div>
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
