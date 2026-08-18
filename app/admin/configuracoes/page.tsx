"use client"

import { useState, useEffect } from "react"
import { Check, Printer, Store, Clock, RotateCcw, QrCode, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { usePersistedState } from "@/lib/store"
import { fetchPixConfig, patchPixConfig, buildPixPayload, DEFAULT_PIX_CONFIG, type PixConfig } from "@/lib/pix"
import {
  fetchStoreStatus,
  patchStoreStatus,
  computeIsOpen,
  DAY_NAMES,
  type StoreStatus,
  type DaySchedule,
} from "@/lib/store-status"
import {
  getPrintSettings,
  savePrintSettings,
  getPrintQueue,
  updatePrintJob,
  type PrintSettings,
  type PrintJob,
} from "@/lib/print-order"

interface Settings {
  companyName: string
  whatsapp: string
  address: string
  hours: string
  deliveryFee: number
  prepTime: number
  whatsappMessage: string
  email: string
}

const DEFAULT_SETTINGS: Settings = {
  companyName: "Mais Sub",
  whatsapp: "(33) 98461-9205",
  address: "Rua Israel Pinheiro, 1000 - Centro, Governador Valadares - MG",
  hours: "Seg a Dom, 18h às 23h",
  deliveryFee: 6.0,
  prepTime: 30,
  whatsappMessage: "Olá! Recebemos seu pedido na Mais Sub. Em breve atualizaremos o status. 🥪",
  email: "admin@maissub.com.br",
}

export default function ConfiguracoesPage() {
  const [settings, setSettings] = usePersistedState<Settings>("admin_settings", DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)

  // Loja
  const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null)
  const [waStatus, setWaStatus] = useState<boolean | null>(null)
  const [waChecking, setWaChecking] = useState(false)
  const [waSending, setWaSending] = useState(false)
  const [waTestPhone, setWaTestPhone] = useState("")
  const [waMsg, setWaMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Impressão
  const [printSettings, setPrintSettings] = useState<PrintSettings | null>(null)
  const [printQueue, setPrintQueue] = useState<PrintJob[]>([])
  const [printSaved, setPrintSaved] = useState(false)

  useEffect(() => {
    fetchStoreStatus().then(setStoreStatus)
    setPrintSettings(getPrintSettings())
    setPrintQueue(getPrintQueue())
    // Status do envio automático de WhatsApp
    fetch("/api/whatsapp", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setWaStatus(!!d.configured))
      .catch(() => setWaStatus(false))
  }, [])

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Store status helpers
  async function updateScheduleDay(dayIndex: number, field: keyof DaySchedule, value: string | boolean) {
    if (!storeStatus) return
    const newSchedule = { ...storeStatus.schedule }
    newSchedule[dayIndex as keyof typeof newSchedule] = {
      ...newSchedule[dayIndex as keyof typeof newSchedule],
      [field]: value,
    }
    const next = await patchStoreStatus({ schedule: newSchedule })
    setStoreStatus(next)
  }

  async function handleManualOverride(open: boolean | null) {
    const next = await patchStoreStatus({ manualOverride: open })
    setStoreStatus(next)
  }

  async function handlePickupOnly(value: boolean) {
    const next = await patchStoreStatus({ pickupOnly: value })
    setStoreStatus(next)
  }

  // ── Chave PIX da loja ──
  const [pix, setPix] = useState<PixConfig>(DEFAULT_PIX_CONFIG)
  const [pixSaving, setPixSaving] = useState(false)
  const [pixMsg, setPixMsg] = useState<{ ok: boolean; text: string } | null>(null)
  useEffect(() => { fetchPixConfig().then(setPix) }, [])

  async function salvarPix() {
    if (pix.enabled && !pix.key.trim()) {
      setPixMsg({ ok: false, text: "Informe a chave PIX antes de ativar." })
      return
    }
    setPixSaving(true); setPixMsg(null)
    const ok = await patchPixConfig(pix)
    setPixSaving(false)
    setPixMsg(ok
      ? { ok: true, text: "Chave salva. O QR aparece para o cliente no acompanhamento do pedido." }
      : { ok: false, text: "Não foi possível salvar. Tente novamente." })
  }

  // Prévia: se o código não fecha, a chave está incompleta
  const pixPreview = pix.key.trim() ? buildPixPayload(pix, 49.9, "MS-EXEMPLO") : ""

  // ── Cobrança PIX pelo Sicoob ──
  type Sicoob = {
    enabled: boolean; environment: "sandbox" | "producao"; clientId: string; pixKey: string
    tokenUrl: string; apiBaseUrl: string; expiracaoMinutos: number; autoConfirmar: boolean
  }
  const [sic, setSic] = useState<Sicoob | null>(null)
  const [sicCert, setSicCert] = useState(false)
  const [sicSaving, setSicSaving] = useState(false)
  const [sicTesting, setSicTesting] = useState(false)
  const [sicEtapas, setSicEtapas] = useState<Array<{ etapa: string; ok: boolean; detalhe: string }>>([])

  useEffect(() => {
    fetch("/api/pix/sicoob/config", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.sicoob) { setSic(d.sicoob); setSicCert(!!d.certificadoPresente) } })
      .catch(() => {})
  }, [])

  async function salvarSicoob() {
    if (!sic) return
    setSicSaving(true)
    const res = await fetch("/api/pix/sicoob/config", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sicoob: sic }),
    }).catch(() => null)
    setSicSaving(false)
    setSicEtapas([{ etapa: "Salvar", ok: !!res?.ok, detalhe: res?.ok ? "Configuração salva." : "Falha ao salvar." }])
  }

  async function testarSicoob(cadastrarWebhook: boolean) {
    setSicTesting(true); setSicEtapas([])
    try {
      const res = await fetch("/api/pix/sicoob/test", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cadastrarWebhook }),
      })
      const d = await res.json().catch(() => ({}))
      setSicEtapas(Array.isArray(d.etapas) ? d.etapas : [{ etapa: "Teste", ok: false, detalhe: "Sem resposta." }])
    } catch {
      setSicEtapas([{ etapa: "Teste", ok: false, detalhe: "Falha de conexão com o servidor." }])
    } finally { setSicTesting(false) }
  }

  // ── Diagnóstico do WhatsApp automático ──
  async function checkWa() {
    setWaChecking(true); setWaMsg(null)
    try {
      const res = await fetch("/api/whatsapp", { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      setWaStatus(!!data.configured)
      if (!data.configured) {
        setWaMsg({ ok: false, text: "Faltam as variáveis EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE_NAME na Vercel." })
      }
    } catch {
      setWaStatus(false)
      setWaMsg({ ok: false, text: "Não foi possível verificar. Confira sua conexão." })
    } finally {
      setWaChecking(false)
    }
  }

  async function sendWaTest() {
    const phone = waTestPhone.replace(/\D/g, "")
    if (phone.length < 10) { setWaMsg({ ok: false, text: "Informe um número válido com DDD." }); return }
    setWaSending(true); setWaMsg(null)
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, text: "🥪 Mensagem de teste da Mais Sub — o envio automático está funcionando!" }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) setWaMsg({ ok: true, text: "✅ Mensagem enviada! Confira o WhatsApp do número informado." })
      else setWaMsg({ ok: false, text: `Falha no envio: ${data.error ?? `erro ${res.status}`}` })
    } catch {
      setWaMsg({ ok: false, text: "Falha na requisição de envio." })
    } finally {
      setWaSending(false)
    }
  }

  // Print helpers
  function updatePrint<K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) {
    if (!printSettings) return
    const next = { ...printSettings, [key]: value }
    setPrintSettings(next)
  }

  function handlePrintSave() {
    if (!printSettings) return
    savePrintSettings(printSettings)
    setPrintSaved(true)
    setTimeout(() => setPrintSaved(false), 2000)
  }

  const isOpen = storeStatus ? computeIsOpen(storeStatus) : false

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500">Ajustes da loja e da conta</p>
      </div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="loja">Status da Loja</TabsTrigger>
          <TabsTrigger value="impressao">Impressão</TabsTrigger>
          <TabsTrigger value="entrega">Entrega</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="conta">Conta</TabsTrigger>
        </TabsList>

        {/* GERAL */}
        <TabsContent value="geral">
          <Card className="max-w-2xl space-y-4 p-6">
            <Field label="Nome da empresa">
              <Input value={settings.companyName} onChange={(e) => update("companyName", e.target.value)} />
            </Field>
            <Field label="Endereço">
              <Input value={settings.address} onChange={(e) => update("address", e.target.value)} />
            </Field>
            <Field label="Horário de funcionamento (exibição)">
              <Input value={settings.hours} onChange={(e) => update("hours", e.target.value)} />
            </Field>
          </Card>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleSave} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">Salvar</Button>
            {saved && <span className="flex items-center gap-1 text-sm text-green-600"><Check className="h-4 w-4" /> Salvo!</span>}
          </div>
        </TabsContent>

        {/* STATUS DA LOJA */}
        <TabsContent value="loja">
          <div className="max-w-2xl space-y-4">
            {/* Status atual */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-4 w-4 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <div>
                    <p className="font-semibold text-gray-900">{isOpen ? 'Loja Aberta' : 'Loja Fechada'}</p>
                    {storeStatus?.manualOverride !== null && (
                      <p className="text-xs text-amber-600">Controle manual ativo</p>
                    )}
                    {storeStatus?.manualOverride === null && (
                      <p className="text-xs text-gray-400">Seguindo horário automático</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleManualOverride(true)}
                    className="bg-green-600 text-white hover:bg-green-700"
                    disabled={isOpen && storeStatus?.manualOverride === true}
                  >
                    <Store className="mr-1 h-3.5 w-3.5" /> Abrir Agora
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleManualOverride(false)}
                    disabled={!isOpen && storeStatus?.manualOverride === false}
                  >
                    Fechar Agora
                  </Button>
                  {storeStatus?.manualOverride !== null && (
                    <Button size="sm" variant="outline" onClick={() => handleManualOverride(null)}>
                      <RotateCcw className="mr-1 h-3.5 w-3.5" /> Auto
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Horários por dia */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold text-gray-800">Horários Automáticos</h3>
              </div>
              <div className="space-y-3">
                {storeStatus && DAY_NAMES.map((name, idx) => {
                  const day = storeStatus.schedule[idx as keyof typeof storeStatus.schedule]
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={day.enabled}
                        onChange={(e) => updateScheduleDay(idx, 'enabled', e.target.checked)}
                        className="h-4 w-4 accent-[#EE5C13]"
                      />
                      <span className="w-20 text-sm font-medium text-gray-700">{name}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={day.open}
                          disabled={!day.enabled}
                          onChange={(e) => updateScheduleDay(idx, 'open', e.target.value)}
                          className="rounded border border-gray-200 px-2 py-1 text-sm disabled:opacity-40"
                        />
                        <span className="text-gray-400 text-xs">às</span>
                        <input
                          type="time"
                          value={day.close}
                          disabled={!day.enabled}
                          onChange={(e) => updateScheduleDay(idx, 'close', e.target.value)}
                          className="rounded border border-gray-200 px-2 py-1 text-sm disabled:opacity-40"
                        />
                      </div>
                      {!day.enabled && <span className="text-xs text-gray-400">Fechado</span>}
                    </div>
                  )
                })}
              </div>
              <p className="mt-3 text-xs text-gray-400">As alterações nos horários são salvas automaticamente.</p>
            </Card>

            {/* Somente retirada */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Store className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold text-gray-800">Modo de Atendimento</h3>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">Apenas retirada na loja</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Quando ativado, o site aceita somente pedidos para retirada — a opção de entrega fica indisponível para os clientes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePickupOnly(!storeStatus?.pickupOnly)}
                  role="switch"
                  aria-checked={!!storeStatus?.pickupOnly}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    storeStatus?.pickupOnly ? 'bg-[#EE5C13]' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    storeStatus?.pickupOnly ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              {storeStatus?.pickupOnly && (
                <div className="mt-3 rounded-lg bg-orange-50 border border-orange-100 px-3 py-2 text-xs text-orange-700 font-medium">
                  🏪 O site está aceitando apenas retirada na loja.
                </div>
              )}
            </Card>

            {/* PIX */}
            <Card className="space-y-4 p-6">
              <div className="mb-2 flex items-center gap-2">
                <QrCode className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold text-gray-800">Pagamento por PIX</h3>
              </div>
              <p className="text-sm text-gray-500">
                Com a chave cadastrada, quem escolhe PIX vê o QR Code e o &quot;copia e cola&quot; na
                tela de acompanhamento, já com o valor do pedido preenchido.
              </p>

              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 cursor-pointer accent-[#EE5C13]"
                  checked={pix.enabled}
                  onChange={(e) => setPix({ ...pix, enabled: e.target.checked })}
                />
                <span className="text-sm">
                  <span className="font-medium text-gray-900">Mostrar o QR Code para o cliente</span>
                  <span className="block text-[11px] text-gray-500">
                    Desligado, o pedido segue normal e o cliente combina o pagamento pelo WhatsApp.
                  </span>
                </span>
              </label>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Chave PIX</Label>
                <Input
                  value={pix.key}
                  onChange={(e) => setPix({ ...pix, key: e.target.value })}
                  placeholder="CPF, CNPJ, telefone, e-mail ou chave aleatória"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">Nome do recebedor</Label>
                  <Input
                    value={pix.receiverName}
                    maxLength={25}
                    onChange={(e) => setPix({ ...pix, receiverName: e.target.value })}
                  />
                  <p className="text-[11px] text-gray-400">Como aparece no app do cliente · máx. 25</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">Cidade</Label>
                  <Input
                    value={pix.city}
                    maxLength={15}
                    onChange={(e) => setPix({ ...pix, city: e.target.value })}
                  />
                  <p className="text-[11px] text-gray-400">Máx. 15 caracteres</p>
                </div>
              </div>

              {pixPreview && (
                <details className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <summary className="cursor-pointer text-xs font-medium text-gray-500">
                    Ver o código gerado (exemplo de R$ 49,90)
                  </summary>
                  <p className="mt-2 break-all font-mono text-[10px] leading-relaxed text-gray-600">
                    {pixPreview}
                  </p>
                  <p className="mt-2 text-[11px] text-gray-400">
                    Cole no app do seu banco para conferir se o recebedor está correto antes de ativar.
                  </p>
                </details>
              )}

              <div className="flex items-center gap-3">
                <Button onClick={salvarPix} disabled={pixSaving} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">
                  {pixSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                  Salvar chave PIX
                </Button>
                {pixMsg && (
                  <p className={`text-xs font-medium ${pixMsg.ok ? "text-emerald-600" : "text-red-500"}`}>
                    {pixMsg.text}
                  </p>
                )}
              </div>
            </Card>

            {/* Cobrança PIX pelo Sicoob */}
            {sic && (
              <Card className="space-y-4 p-6">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <QrCode className="h-4 w-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-800">Cobrança PIX pelo Sicoob</h3>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                    sic.environment === "producao"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}>
                    {sic.environment === "producao" ? "Produção" : "Sandbox (teste)"}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Com isto ligado, o QR vem do banco e o pedido é confirmado sozinho quando o
                  PIX cai. Sem isto, o cliente vê o QR da chave cadastrada acima e você confere
                  o comprovante.
                </p>

                <div className="flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 cursor-pointer accent-[#EE5C13]"
                      checked={sic.enabled} onChange={(e) => setSic({ ...sic, enabled: e.target.checked })} />
                    <span className="font-medium text-gray-900">Ligada</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 cursor-pointer accent-[#EE5C13]"
                      checked={sic.autoConfirmar} onChange={(e) => setSic({ ...sic, autoConfirmar: e.target.checked })} />
                    <span className="font-medium text-gray-900">Aceitar o pedido ao receber o PIX</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 cursor-pointer accent-[#EE5C13]"
                      checked={sic.environment === "producao"}
                      onChange={(e) => setSic({ ...sic, environment: e.target.checked ? "producao" : "sandbox" })} />
                    <span className="font-medium text-gray-900">Produção</span>
                  </label>
                </div>

                <div className={`rounded-lg border p-3 text-[12px] ${
                  sicCert ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"
                }`}>
                  {sicCert
                    ? "Certificado ICP-Brasil carregado. Produção liberada."
                    : "Sem certificado: dá para testar no sandbox. Para produção, cadastre SICOOB_CERT_PEM e SICOOB_KEY_PEM (o .pfx convertido para PEM, em base64) nas variáveis da Vercel."}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">Client ID</Label>
                    <Input value={sic.clientId} onChange={(e) => setSic({ ...sic, clientId: e.target.value })}
                      placeholder="do portal, em Meus Aplicativos" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">Chave PIX que recebe</Label>
                    <Input value={sic.pixKey} onChange={(e) => setSic({ ...sic, pixKey: e.target.value })}
                      placeholder="a chave cadastrada no Sicoob" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">Endereço do token (OAuth)</Label>
                  <Input value={sic.tokenUrl} onChange={(e) => setSic({ ...sic, tokenUrl: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">Endereço da API PIX</Label>
                  <Input value={sic.apiBaseUrl} onChange={(e) => setSic({ ...sic, apiBaseUrl: e.target.value })} />
                  <p className="text-[11px] text-gray-400">
                    Copie os dois endereços do portal do Sicoob — eles mudam entre sandbox e produção.
                  </p>
                </div>

                <div className="space-y-1.5 sm:max-w-[200px]">
                  <Label className="text-xs text-gray-500">Validade da cobrança (min)</Label>
                  <Input type="number" min="1" max="1440" value={sic.expiracaoMinutos}
                    onChange={(e) => setSic({ ...sic, expiracaoMinutos: parseInt(e.target.value) || 30 })} />
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                  <Button onClick={salvarSicoob} disabled={sicSaving} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">
                    {sicSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => testarSicoob(false)} disabled={sicTesting}>
                    {sicTesting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Testar conexão
                  </Button>
                  <Button variant="outline" onClick={() => testarSicoob(true)} disabled={sicTesting}>
                    Testar e cadastrar webhook
                  </Button>
                </div>

                {sicEtapas.length > 0 && (
                  <div className="space-y-1.5 rounded-lg border border-gray-100 bg-gray-50 p-3">
                    {sicEtapas.map((e, i) => (
                      <div key={i} className="flex gap-2 text-[12px]">
                        <span className={e.ok ? "text-emerald-600" : "text-red-500"}>{e.ok ? "✓" : "✕"}</span>
                        <span className="font-medium text-gray-700">{e.etapa}:</span>
                        <span className="break-all text-gray-500">{e.detalhe}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </TabsContent>

        {/* IMPRESSÃO */}
        <TabsContent value="impressao">
          <div className="max-w-2xl space-y-4">
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Printer className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold text-gray-800">Configurações de Impressão</h3>
              </div>

              {printSettings && (
                <>
                  <Field label="Nome da impressora (opcional)">
                    <Input
                      placeholder="Ex: EPSON TM-T20"
                      value={printSettings.printerName}
                      onChange={(e) => updatePrint('printerName', e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1">Defina a impressora térmica como padrão no Windows/Android para impressão automática.</p>
                  </Field>

                  <Field label="Número de cópias">
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={printSettings.copies}
                      onChange={(e) => updatePrint('copies', parseInt(e.target.value) || 1)}
                    />
                  </Field>

                  <div className="space-y-2">
                    <Label>Impressão automática</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="accent-[#EE5C13]"
                          checked={printSettings.autoPrintOnNew}
                          onChange={(e) => updatePrint('autoPrintOnNew', e.target.checked)}
                        />
                        Imprimir automaticamente ao receber pedido novo
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="accent-[#EE5C13]"
                          checked={printSettings.autoPrintOnAccept}
                          onChange={(e) => updatePrint('autoPrintOnAccept', e.target.checked)}
                        />
                        Imprimir ao aceitar o pedido
                      </label>
                    </div>
                  </div>

                  <Field label="Cabeçalho do cupom">
                    <textarea
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={printSettings.header}
                      onChange={(e) => updatePrint('header', e.target.value)}
                    />
                  </Field>

                  <Field label="Rodapé do cupom">
                    <textarea
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={printSettings.footer}
                      onChange={(e) => updatePrint('footer', e.target.value)}
                    />
                  </Field>
                </>
              )}
            </Card>

            <div className="flex items-center gap-3">
              <Button onClick={handlePrintSave} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">
                Salvar configurações de impressão
              </Button>
              {printSaved && <span className="flex items-center gap-1 text-sm text-green-600"><Check className="h-4 w-4" /> Salvo!</span>}
            </div>

            {/* Fila de impressão */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Fila de Impressão</h3>
              {printQueue.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhuma impressão registrada.</p>
              ) : (
                <div className="space-y-2">
                  {printQueue.slice(0, 20).map(job => (
                    <div key={job.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-800">#{job.orderNumber}</span>
                        <span className="ml-2 text-gray-400 text-xs">
                          {new Date(job.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          job.status === 'printed' ? 'bg-green-100 text-green-700' :
                          job.status === 'failed' ? 'bg-red-100 text-red-600' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {job.status === 'printed' ? 'Impressa' : job.status === 'failed' ? 'Falhou' : 'Pendente'}
                        </span>
                        {(job.status === 'failed' || job.status === 'pending') && (
                          <button
                            onClick={() => {
                              updatePrintJob(job.id, { status: 'pending' })
                              setPrintQueue(getPrintQueue())
                            }}
                            className="text-xs text-[#EE5C13] hover:underline"
                          >
                            Reimprimir
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* ENTREGA */}
        <TabsContent value="entrega">
          <Card className="max-w-2xl space-y-4 p-6">
            <Field label="Taxa de entrega (R$)">
              <Input
                type="number"
                step="0.01"
                value={settings.deliveryFee}
                onChange={(e) => update("deliveryFee", parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="Tempo de preparo (minutos)">
              <Input
                type="number"
                value={settings.prepTime}
                onChange={(e) => update("prepTime", parseInt(e.target.value) || 0)}
              />
            </Field>
          </Card>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleSave} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">Salvar</Button>
            {saved && <span className="flex items-center gap-1 text-sm text-green-600"><Check className="h-4 w-4" /> Salvo!</span>}
          </div>
        </TabsContent>

        {/* WHATSAPP */}
        <TabsContent value="whatsapp">
          <Card className="max-w-2xl space-y-4 p-6">
            <Field label="Número do WhatsApp">
              <Input value={settings.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
            </Field>
            <Field label="Mensagem automática de confirmação">
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={settings.whatsappMessage}
                onChange={(e) => update("whatsappMessage", e.target.value)}
              />
            </Field>

            {/* Diagnóstico do envio automático */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Envio automático (Evolution API)</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {waStatus === null && "Verificando…"}
                    {waStatus === true && "✅ Configurado — as mensagens de status são enviadas sozinhas."}
                    {waStatus === false && "⚠️ Não configurado — o sistema abre o WhatsApp Web para envio manual."}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={checkWa} disabled={waChecking}>
                  {waChecking ? "Verificando…" : "Verificar"}
                </Button>
              </div>

              {waStatus && (
                <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-gray-200 pt-3">
                  <div className="flex-1 min-w-48">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Enviar teste para (com DDD)</label>
                    <Input value={waTestPhone} onChange={(e) => setWaTestPhone(e.target.value)} placeholder="33988887777" className="h-9" />
                  </div>
                  <Button variant="outline" size="sm" onClick={sendWaTest} disabled={waSending}>
                    {waSending ? "Enviando…" : "Enviar teste"}
                  </Button>
                </div>
              )}

              {waMsg && (
                <p className={`mt-2 rounded-lg px-3 py-2 text-xs font-medium ${waMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {waMsg.text}
                </p>
              )}
            </div>
          </Card>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleSave} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">Salvar</Button>
            {saved && <span className="flex items-center gap-1 text-sm text-green-600"><Check className="h-4 w-4" /> Salvo!</span>}
          </div>
        </TabsContent>

        {/* CONTA */}
        <TabsContent value="conta">
          <Card className="max-w-2xl space-y-4 p-6">
            <Field label="Email do administrador">
              <Input value={settings.email} onChange={(e) => update("email", e.target.value)} />
            </Field>
            <p className="text-xs text-gray-400">
              A senha padrão de acesso é definida no código (demo). Em produção, integre um provedor de autenticação real.
            </p>
          </Card>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleSave} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">Salvar</Button>
            {saved && <span className="flex items-center gap-1 text-sm text-green-600"><Check className="h-4 w-4" /> Salvo!</span>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
