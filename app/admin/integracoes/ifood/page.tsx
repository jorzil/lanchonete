"use client"

import { useEffect, useState } from "react"
import { Plug, CheckCircle2, XCircle, Loader2, RefreshCw, Copy } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

interface PublicConfig {
  clientId: string
  clientSecretMasked: string
  hasSecret: boolean
  merchantId: string
  environment: "sandbox" | "production"
  webhookUrl: string
  commissionPercent?: number
  autoConfirm?: boolean
  homologationMode?: boolean
  connected: boolean
  lastSyncAt: string | null
}

interface LogEntry { ts: string; level: string; scope: string; message: string; detail?: string }

const LEVEL_COLOR: Record<string, string> = {
  info: "text-gray-500", success: "text-emerald-600", error: "text-red-600", warn: "text-amber-600",
}

export default function IFoodIntegrationPage() {
  const [cfg, setCfg] = useState<PublicConfig | null>(null)
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [merchantId, setMerchantId] = useState("")
  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [commissionPercent, setCommissionPercent] = useState("")
  const [autoConfirm, setAutoConfirm] = useState(true)
  const [homologationMode, setHomologationMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [merchants, setMerchants] = useState<{ id: string; name: string }[]>([])
  const [finSales, setFinSales] = useState<Array<{ salesDate?: string; orderId?: string; shortOrderId?: string; grossValue?: number; netValue?: number }>>([])
  const [finBegin, setFinBegin] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  })
  const [finEnd, setFinEnd] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  })
  const [finLoading, setFinLoading] = useState(false)
  const [finError, setFinError] = useState("")

  // ── Loja (Merchant): detalhes, status, pausas e horários ──
  type Shift = { dayOfWeek: string; start: string; end: string }
  const [mLoading, setMLoading] = useState(false)
  const [mError, setMError] = useState("")
  const [mDetail, setMDetail] = useState<Record<string, unknown> | null>(null)
  const [mStatus, setMStatus] = useState<unknown[]>([])
  const [mPauses, setMPauses] = useState<Array<{ id: string; description?: string; start?: string; end?: string }>>([])
  const [mShifts, setMShifts] = useState<Shift[]>([])
  const [pauseDesc, setPauseDesc] = useState("")
  const [pauseMin, setPauseMin] = useState("30")
  const [savingHours, setSavingHours] = useState(false)
  const [findingMerchants, setFindingMerchants] = useState(false)
  const [merchantsMsg, setMerchantsMsg] = useState("")

  async function loadConfig() {
    const res = await fetch("/api/integrations/ifood/config", { cache: "no-store" })
    if (res.ok) {
      const data: PublicConfig = await res.json()
      setCfg(data)
      setClientId(data.clientId)
      setMerchantId(data.merchantId)
      setEnvironment(data.environment)
      setWebhookUrl(data.webhookUrl || (typeof window !== "undefined" ? `${window.location.origin}/api/integrations/ifood/webhook` : ""))
      setCommissionPercent(data.commissionPercent ? String(data.commissionPercent) : "")
      setAutoConfirm(data.autoConfirm !== false)
      setHomologationMode(!!data.homologationMode)
    }
  }
  async function loadLogs() {
    const res = await fetch("/api/integrations/ifood/logs", { cache: "no-store" })
    if (res.ok) { const { logs } = await res.json(); setLogs(logs ?? []) }
  }

  useEffect(() => { loadConfig(); loadLogs() }, [])

  const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const DAYS: Array<{ key: string; label: string }> = [
    { key: "MONDAY", label: "Segunda" }, { key: "TUESDAY", label: "Terça" },
    { key: "WEDNESDAY", label: "Quarta" }, { key: "THURSDAY", label: "Quinta" },
    { key: "FRIDAY", label: "Sexta" }, { key: "SATURDAY", label: "Sábado" },
    { key: "SUNDAY", label: "Domingo" },
  ]
  const dayLabel = (k: string) => DAYS.find((d) => d.key === k)?.label ?? k

  // duração (min) → hora final "HH:MM"
  const shiftToEnd = (start: string, duration: number) => {
    const [h, m] = start.split(":").map(Number)
    const total = h * 60 + m + duration
    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
  }

  async function loadMerchant() {
    setMLoading(true); setMError("")
    try {
      const res = await fetch("/api/integrations/ifood/merchant", { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        setMDetail(data.detail ?? null)
        setMStatus(Array.isArray(data.status) ? data.status : [])
        setMPauses(Array.isArray(data.interruptions) ? data.interruptions : [])
        const shifts = data.openingHours?.shifts
        if (Array.isArray(shifts)) {
          setMShifts(shifts.map((s: { dayOfWeek: string; start: string; duration: number }) => ({
            dayOfWeek: s.dayOfWeek,
            start: (s.start ?? "00:00:00").slice(0, 5),
            end: shiftToEnd((s.start ?? "00:00:00").slice(0, 5), s.duration ?? 0),
          })))
        }
      } else setMError(data.error || "Falha ao carregar a loja.")
    } catch { setMError("Falha ao carregar a loja.") }
    finally { setMLoading(false) }
  }

  async function merchantAction(body: Record<string, unknown>) {
    const res = await fetch("/api/integrations/ifood/merchant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return !!(res.ok && data.ok)
  }

  async function addPause() {
    if (!pauseDesc.trim()) return
    const ok = await merchantAction({ action: "createInterruption", description: pauseDesc.trim(), minutes: parseInt(pauseMin) || 30 })
    if (ok) { setPauseDesc(""); await loadMerchant() }
    else setMError("Falha ao criar a pausa — veja os logs.")
  }

  async function removePause(id: string) {
    const ok = await merchantAction({ action: "deleteInterruption", id })
    if (ok) await loadMerchant()
    else setMError("Falha ao remover a pausa — veja os logs.")
  }

  async function saveHours() {
    setSavingHours(true)
    const shifts = mShifts
      .filter((s) => s.start && s.end)
      .map((s) => {
        const [sh, sm] = s.start.split(":").map(Number)
        const [eh, em] = s.end.split(":").map(Number)
        return { dayOfWeek: s.dayOfWeek, start: `${s.start}:00`, duration: (eh * 60 + em) - (sh * 60 + sm) }
      })
      .filter((s) => s.duration > 0)
    const ok = await merchantAction({ action: "setOpeningHours", shifts })
    setSavingHours(false)
    if (ok) await loadMerchant()
    else setMError("Falha ao salvar os horários — veja os logs.")
  }

  async function loadFinancial() {
    setFinLoading(true); setFinError(""); setFinSales([])
    try {
      const res = await fetch(`/api/integrations/ifood/financial?begin=${finBegin}&end=${finEnd}`, { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) setFinSales(Array.isArray(data.sales) ? data.sales : [])
      else setFinError(data.error || "Falha na consulta financeira.")
    } catch {
      setFinError("Falha na consulta financeira.")
    } finally {
      setFinLoading(false)
    }
  }

  async function save() {
    setSaving(true)
    await fetch("/api/integrations/ifood/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret, merchantId, environment, webhookUrl, commissionPercent: parseFloat(commissionPercent) || 0, autoConfirm, homologationMode }),
    })
    setClientSecret("")
    await loadConfig()
    setSaving(false)
  }

  async function test() {
    setTesting(true); setTestMsg(null)
    try {
      const res = await fetch("/api/integrations/ifood/test", { method: "POST" })
      const data = await res.json()
      setTestMsg({ ok: res.ok && data.ok, text: data.message ?? (res.ok ? "Conectado" : "Falha") })
    } catch {
      setTestMsg({ ok: false, text: "Erro de conexão." })
    } finally {
      setTesting(false); loadConfig(); loadLogs()
    }
  }

  async function findMerchants() {
    setFindingMerchants(true); setMerchantsMsg("")
    try {
      // garante que clientId/secret estão salvos no servidor antes de listar
      await fetch("/api/integrations/ifood/config", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret, merchantId, environment, webhookUrl, commissionPercent: parseFloat(commissionPercent) || 0, autoConfirm, homologationMode }),
      })
      const res = await fetch("/api/integrations/ifood/merchants", { cache: "no-store" })
      const data = await res.json()
      if (res.ok && data.ok && Array.isArray(data.merchants) && data.merchants.length) {
        setMerchants(data.merchants)
        if (!merchantId) setMerchantId(data.merchants[0].id)
      } else {
        setMerchantsMsg(data.error ?? "Nenhuma loja encontrada. Confira Client ID/Secret.")
      }
    } catch {
      setMerchantsMsg("Erro ao buscar lojas.")
    } finally {
      setFindingMerchants(false); setClientSecret(""); loadConfig()
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🍔</span>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Integração iFood</h1>
          <p className="text-sm text-gray-500">Conecte o iFood ao seu ERP via API oficial</p>
        </div>
        {cfg && (
          <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${cfg.connected ? "text-emerald-600" : "text-gray-400"}`}>
            {cfg.connected ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {cfg.connected ? "Conectado" : "Desconectado"}
          </span>
        )}
      </div>

      {/* Credenciais */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2"><Plug className="h-4 w-4 text-[#EE5C13]" /><h2 className="font-bold text-gray-900">Credenciais</h2></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Client ID</Label>
            <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="seu client id" />
          </div>
          <div className="space-y-1.5">
            <Label>Client Secret</Label>
            <Input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)}
              placeholder={cfg?.hasSecret ? `salvo (${cfg.clientSecretMasked})` : "seu client secret"} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Merchant ID</Label>
              <button onClick={findMerchants} disabled={findingMerchants} className="text-[11px] font-semibold text-[#EE5C13] hover:underline disabled:opacity-50">
                {findingMerchants ? "Buscando…" : "Buscar minhas lojas"}
              </button>
            </div>
            {merchants.length > 0 ? (
              <Select value={merchantId} onValueChange={setMerchantId}>
                <SelectTrigger><SelectValue placeholder="Selecione a loja" /></SelectTrigger>
                <SelectContent>
                  {merchants.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input value={merchantId} onChange={(e) => setMerchantId(e.target.value)} placeholder="id da loja no iFood" />
            )}
            {merchantsMsg && <p className="text-[11px] text-red-500">{merchantsMsg}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Ambiente</Label>
            <Select value={environment} onValueChange={(v) => setEnvironment(v as "sandbox" | "production")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (testes)</SelectItem>
                <SelectItem value="production">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Taxas do iFood (%)</Label>
            <Input
              type="number" min="0" max="100" step="0.1"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(e.target.value)}
              placeholder="ex: 26.2"
            />
            <p className="text-[11px] text-gray-400">
              Comissão + taxa de pagamento online (Plano Básico ≈ 12% + 3,2% · Plano Entrega ≈ 23% + 3,2%).
              Usado para estimar o valor líquido dos pedidos iFood.
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 cursor-pointer accent-[#EE5C13]"
              checked={autoConfirm}
              onChange={(e) => setAutoConfirm(e.target.checked)}
            />
            <span className="text-sm">
              <span className="font-medium text-gray-900">Confirmar pedidos automaticamente</span>
              <span className="block text-[11px] text-gray-500">
                O pedido entra já aceito no iFood. Sem isso ele fica aguardando confirmação até
                alguém clicar no painel — e o iFood cancela sozinho depois de alguns minutos.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 cursor-pointer accent-[#EE5C13]"
              checked={homologationMode}
              onChange={(e) => setHomologationMode(e.target.checked)}
            />
            <span className="text-sm">
              <span className="font-medium text-gray-900">Modo homologação</span>
              <span className="block text-[11px] text-gray-500">
                Leva o pedido sozinho até &quot;saiu para entrega&quot;. Use <strong>somente</strong> durante os
                testes do Portal do iFood — em produção isso marcaria como despachado um pedido que
                nem foi preparado. Desligue assim que a homologação for aprovada.
              </span>
            </span>
          </label>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button onClick={save} disabled={saving} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Salvar
          </Button>
          <Button variant="outline" onClick={test} disabled={testing}>
            {testing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />} Testar conexão
          </Button>
          {cfg?.lastSyncAt && <span className="text-xs text-gray-400">Última sincronização: {new Date(cfg.lastSyncAt).toLocaleString("pt-BR")}</span>}
        </div>
        {testMsg && (
          <div className={`rounded-lg border px-4 py-2.5 text-sm ${testMsg.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-700"}`}>
            {testMsg.ok ? "✓ " : "⚠ "}{testMsg.text}
          </div>
        )}
      </Card>

      {/* Webhook */}
      <Card className="p-5 space-y-3">
        <h2 className="font-bold text-gray-900">Webhook</h2>
        <p className="text-sm text-gray-500">Cadastre esta URL no painel do iFood (Portal do Desenvolvedor) para receber os pedidos automaticamente:</p>
        <div className="flex items-center gap-2">
          <Input readOnly value={webhookUrl} className="font-mono text-xs" />
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(webhookUrl)}>
            <Copy size={14} />
          </Button>
        </div>
      </Card>

      {/* Loja (Merchant): detalhes, status, pausas e horários */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Loja iFood (Merchant)</h2>
            <p className="text-xs text-gray-500 mt-0.5">Detalhes, disponibilidade, pausas e horário de funcionamento da loja.</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadMerchant} disabled={mLoading}>
            {mLoading ? <Loader2 size={13} className="mr-1 animate-spin" /> : <RefreshCw size={13} className="mr-1" />} Carregar dados
          </Button>
        </div>
        {mError && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{mError}</p>}

        {mDetail && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm space-y-1">
            <p className="font-bold text-gray-900">{String(mDetail.name ?? mDetail.corporateName ?? "Loja")}</p>
            <p className="text-xs text-gray-500 font-mono">ID: {String(mDetail.id ?? "—")}</p>
            {mDetail.averageTicket != null && <p className="text-xs text-gray-500">Ticket médio: {String(mDetail.averageTicket)}</p>}
            {(() => {
              const addr = mDetail.address as Record<string, unknown> | undefined
              return addr ? (
                <p className="text-xs text-gray-500">
                  {String(addr.streetName ?? "")} {String(addr.streetNumber ?? "")} — {String(addr.city ?? "")}/{String(addr.state ?? "")}
                </p>
              ) : null
            })()}
            {mStatus.length > 0 && (
              <div className="pt-1 flex flex-wrap gap-2">
                {mStatus.map((s, i) => {
                  const st = s as { state?: string; operation?: string; available?: boolean; message?: { title?: string } }
                  const ok = st.available ?? st.state === "OK"
                  return (
                    <span key={i} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {ok ? "● Disponível" : "● Indisponível"}
                      {st.operation ? ` — ${st.operation}` : ""}
                      {st.message?.title ? ` (${st.message.title})` : ""}
                    </span>
                  )
                })}
              </div>
            )}

            {/* Detalhes completos (exigido no cenário 1 da homologação) */}
            <details className="pt-2">
              <summary className="cursor-pointer text-xs font-bold text-[#EE5C13] hover:underline">
                Ver detalhes completos da loja
              </summary>
              <div className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                {Object.entries(mDetail).map(([k, v]) => (
                  <div key={k} className="flex gap-2 border-b border-gray-100 py-1 text-xs">
                    <span className="min-w-32 font-semibold text-gray-500">{k}</span>
                    <span className="break-all text-gray-800">
                      {v !== null && typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {mDetail && (
          <>
            {/* Pausas */}
            <div className="space-y-2">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Pausas (interrupções)</p>
              {mPauses.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhuma pausa ativa.</p>
              ) : (
                mPauses.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
                    <span className="text-amber-800">
                      <strong>{p.description ?? "Pausa"}</strong>
                      {p.start && p.end && ` · ${new Date(p.start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} → ${new Date(p.end).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                    </span>
                    <button onClick={() => removePause(p.id)} className="font-bold text-red-500 hover:text-red-700">Remover</button>
                  </div>
                ))
              )}
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-40 space-y-1">
                  <Label className="text-xs">Motivo da pausa</Label>
                  <Input value={pauseDesc} onChange={(e) => setPauseDesc(e.target.value)} placeholder="Ex: Sem entregador" className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Duração (min)</Label>
                  <Input type="number" min="1" value={pauseMin} onChange={(e) => setPauseMin(e.target.value)} className="h-9 w-24" />
                </div>
                <Button variant="outline" size="sm" onClick={addPause}>Pausar loja</Button>
              </div>
            </div>

            {/* Horários */}
            <div className="space-y-2">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Horário de funcionamento</p>
              {mShifts.map((s, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <select
                    value={s.dayOfWeek}
                    onChange={(e) => setMShifts((prev) => prev.map((x, xi) => xi === i ? { ...x, dayOfWeek: e.target.value } : x))}
                    className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm"
                  >
                    {DAYS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                  </select>
                  <Input type="time" value={s.start} onChange={(e) => setMShifts((prev) => prev.map((x, xi) => xi === i ? { ...x, start: e.target.value } : x))} className="h-9 w-28" />
                  <span className="text-xs text-gray-400">às</span>
                  <Input type="time" value={s.end} onChange={(e) => setMShifts((prev) => prev.map((x, xi) => xi === i ? { ...x, end: e.target.value } : x))} className="h-9 w-28" />
                  <button onClick={() => setMShifts((prev) => prev.filter((_, xi) => xi !== i))} className="text-xs font-bold text-red-400 hover:text-red-600">remover</button>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setMShifts((prev) => [...prev, { dayOfWeek: "MONDAY", start: "18:00", end: "23:00" }])}>
                  + Adicionar turno
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => setMShifts([
                    { dayOfWeek: "SATURDAY", start: "10:00", end: "19:00" },
                    { dayOfWeek: "SUNDAY", start: "09:00", end: "12:00" },
                    { dayOfWeek: "SUNDAY", start: "13:00", end: "16:00" },
                    { dayOfWeek: "SUNDAY", start: "17:00", end: "23:00" },
                  ])}
                  title="Preenche os horários do cenário 3 da homologação iFood"
                >
                  Preencher cenário de teste
                </Button>
                <Button size="sm" onClick={saveHours} disabled={savingHours} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">
                  {savingHours ? <Loader2 size={13} className="mr-1 animate-spin" /> : null} Salvar horários no iFood
                </Button>
              </div>
              <p className="text-[11px] text-gray-400">Um dia pode ter vários turnos (ex: Domingo 09–12, 13–16 e 17–23). Os horários salvos aqui refletem no Portal do Parceiro.</p>
            </div>
          </>
        )}
      </Card>

      {/* Financeiro (bruto/líquido oficiais) */}
      <Card className="p-5 space-y-3">
        <div>
          <h2 className="font-bold text-gray-900">Financeiro iFood</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Valores bruto e líquido oficiais por venda (requer o módulo <strong>financial</strong> habilitado no app do portal iFood).
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">De</Label>
            <Input type="date" value={finBegin} onChange={(e) => setFinBegin(e.target.value)} className="h-9 w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Até</Label>
            <Input type="date" value={finEnd} onChange={(e) => setFinEnd(e.target.value)} className="h-9 w-40" />
          </div>
          <Button variant="outline" size="sm" onClick={loadFinancial} disabled={finLoading}>
            {finLoading ? <Loader2 size={13} className="mr-1 animate-spin" /> : <RefreshCw size={13} className="mr-1" />} Consultar
          </Button>
        </div>
        {finError && (
          <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">{finError}</p>
        )}
        {finSales.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Vendas</p>
                <p className="text-lg font-black text-gray-900">{finSales.length}</p>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Bruto</p>
                <p className="text-lg font-black text-gray-900">{fmtBRL(finSales.reduce((a, s) => a + (s.grossValue ?? 0), 0))}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
                <p className="text-[10px] text-emerald-500 uppercase font-bold">Líquido</p>
                <p className="text-lg font-black text-emerald-700">{fmtBRL(finSales.reduce((a, s) => a + (s.netValue ?? 0), 0))}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-400">
                    <th className="py-2 pr-3 font-medium">Data</th>
                    <th className="py-2 pr-3 font-medium">Pedido</th>
                    <th className="py-2 pr-3 font-medium text-right">Bruto</th>
                    <th className="py-2 pr-3 font-medium text-right">Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {finSales.map((s, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="py-1.5 pr-3 text-gray-500">{s.salesDate ?? '—'}</td>
                      <td className="py-1.5 pr-3 font-mono text-gray-700">{s.shortOrderId ?? s.orderId ?? '—'}</td>
                      <td className="py-1.5 pr-3 text-right font-semibold text-gray-900">{fmtBRL(s.grossValue ?? 0)}</td>
                      <td className="py-1.5 pr-3 text-right font-semibold text-emerald-600">{fmtBRL(s.netValue ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Logs */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Logs de Integração</h2>
          <Button variant="outline" size="sm" onClick={loadLogs}><RefreshCw size={13} className="mr-1" /> Atualizar</Button>
        </div>
        {logs.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Sem registros ainda.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-1 text-xs font-mono">
            {logs.map((l, i) => (
              <div key={i} className="border-b border-gray-50 py-1">
                <div className="flex gap-2">
                  <span className="text-gray-400 shrink-0">{new Date(l.ts).toLocaleTimeString("pt-BR")}</span>
                  <span className={`shrink-0 font-bold uppercase ${LEVEL_COLOR[l.level] ?? "text-gray-500"}`}>{l.level}</span>
                  <span className="text-gray-400 shrink-0">[{l.scope}]</span>
                  <span className="text-gray-700">{l.message}</span>
                </div>
                {l.detail && (
                  <details className="ml-2 mt-0.5">
                    <summary className="cursor-pointer text-[10px] text-gray-400 hover:text-gray-600">ver detalhe</summary>
                    <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-gray-50 p-2 text-[10px] text-gray-600">{l.detail}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
