"use client"

import { useState, useEffect } from "react"
import { Check, Printer, Store, Clock, RotateCcw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { usePersistedState } from "@/lib/store"
import {
  getStoreStatus,
  saveStoreStatus,
  setManualOverride,
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

  // Impressão
  const [printSettings, setPrintSettings] = useState<PrintSettings | null>(null)
  const [printQueue, setPrintQueue] = useState<PrintJob[]>([])
  const [printSaved, setPrintSaved] = useState(false)

  useEffect(() => {
    setStoreStatus(getStoreStatus())
    setPrintSettings(getPrintSettings())
    setPrintQueue(getPrintQueue())
  }, [])

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Store status helpers
  function updateScheduleDay(dayIndex: number, field: keyof DaySchedule, value: string | boolean) {
    if (!storeStatus) return
    const newSchedule = { ...storeStatus.schedule }
    newSchedule[dayIndex as keyof typeof newSchedule] = {
      ...newSchedule[dayIndex as keyof typeof newSchedule],
      [field]: value,
    }
    const next = saveStoreStatus({ schedule: newSchedule })
    setStoreStatus(next)
  }

  function handleManualOverride(open: boolean | null) {
    const next = setManualOverride(open)
    setStoreStatus(next)
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
