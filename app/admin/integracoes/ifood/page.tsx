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
    }
  }
  async function loadLogs() {
    const res = await fetch("/api/integrations/ifood/logs", { cache: "no-store" })
    if (res.ok) { const { logs } = await res.json(); setLogs(logs ?? []) }
  }

  useEffect(() => { loadConfig(); loadLogs() }, [])

  const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

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
      body: JSON.stringify({ clientId, clientSecret, merchantId, environment, webhookUrl, commissionPercent: parseFloat(commissionPercent) || 0 }),
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
        body: JSON.stringify({ clientId, clientSecret, merchantId, environment, webhookUrl, commissionPercent: parseFloat(commissionPercent) || 0 }),
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
              <div key={i} className="flex gap-2 border-b border-gray-50 py-1">
                <span className="text-gray-400 shrink-0">{new Date(l.ts).toLocaleTimeString("pt-BR")}</span>
                <span className={`shrink-0 font-bold uppercase ${LEVEL_COLOR[l.level] ?? "text-gray-500"}`}>{l.level}</span>
                <span className="text-gray-400 shrink-0">[{l.scope}]</span>
                <span className="text-gray-700">{l.message}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
