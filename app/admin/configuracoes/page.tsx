"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { usePersistedState } from "@/lib/store"

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
  whatsapp: "(33) 99999-0000",
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

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    // usePersistedState já persiste; apenas feedback visual
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500">Ajustes da loja e da conta</p>
      </div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="entrega">Entrega</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="conta">Conta</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <Card className="max-w-2xl space-y-4 p-6">
            <Field label="Nome da empresa">
              <Input value={settings.companyName} onChange={(e) => update("companyName", e.target.value)} />
            </Field>
            <Field label="Endereço">
              <Input value={settings.address} onChange={(e) => update("address", e.target.value)} />
            </Field>
            <Field label="Horário de funcionamento">
              <Input value={settings.hours} onChange={(e) => update("hours", e.target.value)} />
            </Field>
          </Card>
        </TabsContent>

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
        </TabsContent>

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
        </TabsContent>

        <TabsContent value="conta">
          <Card className="max-w-2xl space-y-4 p-6">
            <Field label="Email do administrador">
              <Input value={settings.email} onChange={(e) => update("email", e.target.value)} />
            </Field>
            <p className="text-xs text-gray-400">
              A senha padrão de acesso é definida no código (demo). Em produção, integre um provedor de autenticação real.
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">
          Salvar alterações
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check className="h-4 w-4" /> Salvo!
          </span>
        )}
      </div>
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
