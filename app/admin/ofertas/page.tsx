"use client"

import { useEffect, useMemo, useState } from "react"
import { Megaphone, Plus, Trash2, Loader2, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { formatCurrency, PRODUCTS } from "@/lib/store"
import { fetchOrderBumps, patchOrderBumps, type OrderBumpOffer } from "@/lib/order-bumps"

// Produtos que podem ser oferecidos como bump (cookies + bebidas)
const POOL = PRODUCTS.filter((p) => p.category === "cookies" || p.category === "bebidas")
const PRODUCT_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]))

export default function OfertasPage() {
  const [offers, setOffers] = useState<OrderBumpOffer[]>([])
  const [metrics, setMetrics] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  useEffect(() => {
    fetchOrderBumps().then((c) => { setOffers(c.offers); setMetrics(c.metrics); setLoading(false) })
  }, [])

  function addOffer() {
    setOffers((prev) => [...prev, { id: `b${Date.now()}`, category: "cookies", bumpPrice: 14.9, enabled: true }])
  }
  // Define o "tipo" da oferta: categoria (cliente escolhe) ou produto específico
  function setOfferType(id: string, value: string) {
    if (value === "cookies" || value === "bebidas") {
      updateOffer(id, { category: value, productId: undefined })
    } else {
      updateOffer(id, { productId: value, category: undefined })
    }
  }
  function updateOffer(id: string, patch: Partial<OrderBumpOffer>) {
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }
  function removeOffer(id: string) {
    setOffers((prev) => prev.filter((o) => o.id !== id))
  }

  async function save() {
    setSaving(true)
    await patchOrderBumps(offers)
    setSaving(false)
    setSavedAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }))
  }

  const totalAdds = useMemo(() => Object.values(metrics).reduce((a, b) => a + b, 0), [metrics])

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Megaphone className="h-6 w-6 text-[#EE5C13]" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Ofertas &amp; Order Bump</h1>
          <p className="text-sm text-gray-500">Ofereça itens com desconto no carrinho e acompanhe os resultados</p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[11px] text-gray-400 flex items-center gap-1"><TrendingUp size={12} /> Adições via bump</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalAdds}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] text-gray-400">Ofertas ativas</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{offers.filter((o) => o.enabled).length}</p>
        </Card>
      </div>

      {/* Ofertas */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Ofertas no carrinho</h2>
          <Button variant="outline" size="sm" onClick={addOffer}><Plus size={15} className="mr-1" /> Nova oferta</Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-400 text-sm"><Loader2 size={16} className="animate-spin mr-2" /> Carregando…</div>
        ) : offers.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-sm text-gray-400">Nenhuma oferta. Clique em “Nova oferta”.</p>
        ) : (
          <div className="space-y-3">
            {offers.map((o) => {
              const prod = o.productId ? PRODUCT_BY_ID.get(o.productId) : undefined
              const adds = o.productId ? (metrics[o.productId] ?? 0) : Object.entries(metrics)
                .filter(([pid]) => PRODUCT_BY_ID.get(pid)?.category === o.category)
                .reduce((a, [, n]) => a + n, 0)
              const typeValue = o.category ?? o.productId ?? ""
              return (
                <div key={o.id} className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 p-3">
                  <div className="flex-1 min-w-[180px] space-y-1.5">
                    <Label className="text-xs">Oferta</Label>
                    <Select value={typeValue} onValueChange={(v) => setOfferType(o.id, v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cookies">🍪 Cookie (cliente escolhe)</SelectItem>
                        <SelectItem value="bebidas">🥤 Bebida (cliente escolhe)</SelectItem>
                        {POOL.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-28 space-y-1.5">
                    <Label className="text-xs">Preço bump (R$)</Label>
                    <Input type="number" min="0" step="any" value={o.bumpPrice || ""}
                      onChange={(e) => updateOffer(o.id, { bumpPrice: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Label className="text-xs">{o.enabled ? "Ativa" : "Inativa"}</Label>
                    <Switch checked={o.enabled} onCheckedChange={(v) => updateOffer(o.id, { enabled: v })} />
                  </div>
                  <div className="text-center px-2">
                    <p className="text-[10px] text-gray-400 uppercase">Adições</p>
                    <p className="font-bold text-gray-900">{adds}</p>
                  </div>
                  <button onClick={() => removeOffer(o.id)} className="rounded-md p-2 hover:bg-gray-100 self-center">
                    <Trash2 className="h-4 w-4 text-gray-400" />
                  </button>
                  {prod && o.bumpPrice < prod.price && (
                    <p className="w-full text-[11px] text-emerald-600">Desconto de {formatCurrency(prod.price - o.bumpPrice)} ({Math.round((1 - o.bumpPrice / prod.price) * 100)}%)</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button onClick={save} disabled={saving} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">
            {saving ? <Loader2 size={15} className="mr-1 animate-spin" /> : null} Salvar ofertas
          </Button>
          {savedAt && <span className="text-xs text-emerald-600">✓ Salvo às {savedAt}</span>}
        </div>
      </Card>

      <p className="text-xs text-gray-400">
        As ofertas aparecem no carrinho do cliente (seção “Aproveite e adicione”), com o preço de bump destacado.
        Itens desativados em Produtos ou já no carrinho não são oferecidos.
      </p>
    </div>
  )
}
