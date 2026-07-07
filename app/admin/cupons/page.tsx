"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Plus, Trash2, Edit2, Check, X, Tag, TrendingDown, Hash, Calendar, ChevronDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, type Order } from "@/lib/store"
import { loadOrders } from "@/lib/orders-storage"
import { supabaseConfigured } from "@/lib/supabase"
import {
  getCoupons, addCoupon, updateCoupon, deleteCoupon, pullCoupons, pushCoupons,
  type CouponDef, type CouponType,
} from "@/lib/coupon-storage"

const TYPE_CONFIG: Record<CouponType, { label: string; cls: string }> = {
  percentage:    { label: '% Percentual',     cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  fixed:         { label: 'R$ Valor Fixo',    cls: 'bg-green-100 text-green-700 border-green-200' },
  free_shipping: { label: 'Frete Grátis',     cls: 'bg-purple-100 text-purple-700 border-purple-200' },
}

const EMPTY_FORM = {
  code: '', name: '', description: '',
  type: 'percentage' as CouponType,
  discount: 10,
  minOrder: 0,
  maxUses: '' as string | number,
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: '',
  active: true,
}

export default function CuponsPage() {
  const [coupons, setCoupons] = useState<CouponDef[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [toDelete, setToDelete] = useState<CouponDef | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { pullCoupons().then(() => setCoupons(getCoupons())) }, [])

  // Carrega os pedidos para vincular por cupom
  useEffect(() => {
    async function load() {
      if (supabaseConfigured) {
        try {
          const res = await fetch('/api/orders')
          if (res.ok) { const { orders } = await res.json(); setOrders(orders ?? []); return }
        } catch {}
      }
      setOrders(loadOrders())
    }
    load()
  }, [])

  // Pedidos agrupados por código de cupom
  const ordersByCoupon = useMemo(() => {
    const map = new Map<string, Order[]>()
    for (const o of orders) {
      if (!o.couponCode) continue
      const key = o.couponCode.toUpperCase()
      const arr = map.get(key) ?? []
      arr.push(o)
      map.set(key, arr)
    }
    return map
  }, [orders])

  function refresh() { setCoupons(getCoupons()); pushCoupons() }

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: typeof EMPTY_FORM[K]) {
    setForm(p => ({ ...p, [key]: value }))
    setError('')
  }

  function handleSubmit() {
    if (!form.code.trim()) { setError('Informe o código do cupom.'); return }
    if (!form.name.trim()) { setError('Informe o nome do cupom.'); return }
    if (form.type !== 'free_shipping' && (!form.discount || form.discount <= 0)) {
      setError('Informe o valor do desconto.'); return
    }

    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim(),
        type: form.type,
        discount: Number(form.discount) || 0,
        minOrder: Number(form.minOrder) || 0,
        maxUses: form.maxUses === '' || form.maxUses === 0 ? null : Number(form.maxUses),
        validFrom: form.validFrom,
        validUntil: form.validUntil || null,
        active: form.active,
      }

      if (editing) {
        updateCoupon(editing, payload)
      } else {
        addCoupon(payload)
      }
      refresh()
      setForm(EMPTY_FORM)
      setShowForm(false)
      setEditing(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar cupom.')
    }
  }

  function startEdit(c: CouponDef) {
    setForm({
      code: c.code, name: c.name, description: c.description,
      type: c.type, discount: c.discount, minOrder: c.minOrder,
      maxUses: c.maxUses ?? '', validFrom: c.validFrom,
      validUntil: c.validUntil ?? '', active: c.active,
    })
    setEditing(c.id)
    setShowForm(true)
    setError('')
  }

  function handleDelete() {
    if (!toDelete) return
    deleteCoupon(toDelete.id)
    refresh()
    setToDelete(null)
  }

  function toggleActive(c: CouponDef) {
    updateCoupon(c.id, { active: !c.active })
    refresh()
  }

  const totalDiscount = coupons.reduce((s, c) => s + c.usedCount * (c.type === 'percentage' ? 0 : c.discount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cupons de Desconto</h1>
          <p className="text-sm text-gray-500">Gerencie códigos promocionais da loja</p>
        </div>
        <Button
          onClick={() => { setForm(EMPTY_FORM); setEditing(null); setShowForm(true); setError('') }}
          className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A] flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Novo Cupom
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total de Cupons', value: coupons.length, icon: <Tag className="h-5 w-5 text-[#EE5C13]" /> },
          { label: 'Cupons Ativos', value: coupons.filter(c => c.active).length, icon: <Check className="h-5 w-5 text-green-500" /> },
          { label: 'Utilizações', value: coupons.reduce((s, c) => s + c.usedCount, 0), icon: <Hash className="h-5 w-5 text-blue-500" /> },
          { label: 'Desconto Total', value: formatCurrency(totalDiscount), icon: <TrendingDown className="h-5 w-5 text-red-500" /> },
        ].map(k => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gray-50 p-2">{k.icon}</div>
              <div>
                <p className="text-[11px] text-gray-400">{k.label}</p>
                <p className="text-lg font-bold text-gray-900">{k.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-800">{editing ? 'Editar Cupom' : 'Novo Cupom'}</h2>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Código do Cupom *</Label>
              <Input
                placeholder="EX: PROMO20"
                value={form.code}
                onChange={e => set('code', e.target.value.toUpperCase())}
                className="font-mono uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input placeholder="Ex: 20% de desconto" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <select
                value={form.type}
                onChange={e => set('type', e.target.value as CouponType)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="percentage">% Percentual</option>
                <option value="fixed">R$ Valor Fixo</option>
                <option value="free_shipping">Frete Grátis</option>
              </select>
            </div>

            {form.type !== 'free_shipping' && (
              <div className="space-y-1.5">
                <Label>{form.type === 'percentage' ? 'Desconto (%)' : 'Desconto (R$)'} *</Label>
                <Input
                  type="number"
                  min={0}
                  step={form.type === 'percentage' ? 1 : 0.01}
                  max={form.type === 'percentage' ? 100 : undefined}
                  value={form.discount}
                  onChange={e => set('discount', parseFloat(e.target.value) || 0)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Pedido mínimo (R$)</Label>
              <Input
                type="number" min={0} step={0.01}
                value={form.minOrder}
                onChange={e => set('minOrder', parseFloat(e.target.value) || 0)}
                placeholder="0 = sem mínimo"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Limite de uso</Label>
              <Input
                type="number" min={0}
                value={form.maxUses}
                onChange={e => set('maxUses', e.target.value)}
                placeholder="Vazio = ilimitado"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Válido a partir de</Label>
              <Input type="date" value={form.validFrom} onChange={e => set('validFrom', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Válido até</Label>
              <Input type="date" value={form.validUntil} onChange={e => set('validUntil', e.target.value)} placeholder="Sem expiração" />
            </div>

            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input placeholder="Descrição interna" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="accent-[#EE5C13]" checked={form.active} onChange={e => set('active', e.target.checked)} />
              Cupom ativo
            </label>
          </div>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          <div className="mt-5 flex gap-3">
            <Button onClick={handleSubmit} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">
              {editing ? 'Salvar alterações' : 'Criar cupom'}
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null) }}>Cancelar</Button>
          </div>
        </Card>
      )}

      {/* Coupons list */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                <th className="px-5 py-3 font-medium">Código</th>
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Desconto</th>
                <th className="px-5 py-3 font-medium">Mínimo</th>
                <th className="px-5 py-3 font-medium">Usos</th>
                <th className="px-5 py-3 font-medium">Validade</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-gray-400">Nenhum cupom cadastrado.</td></tr>
              ) : coupons.map(c => {
                const typeCfg = TYPE_CONFIG[c.type]
                const expired = c.validUntil && new Date(c.validUntil) < new Date()
                const limitReached = c.maxUses !== null && c.usedCount >= c.maxUses
                return (
                  <React.Fragment key={c.id}>
                  <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <code className="rounded bg-gray-100 px-2 py-0.5 text-[13px] font-mono font-bold text-gray-800">
                        {c.code}
                      </code>
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${typeCfg.cls}`}>
                        {typeCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900">
                      {c.type === 'percentage' ? `${c.discount}%` :
                       c.type === 'fixed' ? formatCurrency(c.discount) : 'Grátis'}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {c.minOrder > 0 ? formatCurrency(c.minOrder) : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {(() => {
                        const linked = ordersByCoupon.get(c.code.toUpperCase()) ?? []
                        return (
                          <button
                            onClick={() => setExpanded(expanded === c.code ? null : c.code)}
                            className="inline-flex items-center gap-1 hover:text-[#EE5C13] transition-colors"
                            title="Ver pedidos que usaram este cupom"
                          >
                            <span>{linked.length || c.usedCount}{c.maxUses !== null ? `/${c.maxUses}` : ''}</span>
                            {linked.length > 0 && <ChevronDown size={13} className={`transition-transform ${expanded === c.code ? 'rotate-180' : ''}`} />}
                          </button>
                        )
                      })()}
                      {limitReached && <span className="ml-1 text-[10px] text-red-500">esgotado</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {c.validUntil ? (
                        <span className={expired ? 'text-red-500' : ''}>
                          até {new Date(c.validUntil).toLocaleDateString('pt-BR')}
                          {expired && ' (expirado)'}
                        </span>
                      ) : '∞'}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleActive(c)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-colors ${
                          c.active && !expired && !limitReached
                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {c.active && !expired && !limitReached ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(c)}>
                          <Edit2 className="h-4 w-4 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setToDelete(c)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expanded === c.code && (() => {
                    const linked = [...(ordersByCoupon.get(c.code.toUpperCase()) ?? [])]
                      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
                    return (
                      <tr key={`${c.id}-orders`} className="bg-gray-50/60">
                        <td colSpan={9} className="px-5 py-3">
                          {linked.length === 0 ? (
                            <p className="text-xs text-gray-400">Nenhum pedido usou este cupom ainda.</p>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-[11px] font-semibold text-gray-500 mb-1">Pedidos que usaram {c.code} ({linked.length}):</p>
                              {linked.map((o) => (
                                <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600 border-b border-gray-100 last:border-0 py-1">
                                  <span className="font-medium text-gray-900">{o.orderNumber}</span>
                                  <span>{o.customer.name}</span>
                                  <span className="text-gray-400">{new Date(o.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                  <span className="text-red-600">-{formatCurrency(o.discount || 0)}</span>
                                  <span className="font-semibold text-gray-900">{formatCurrency(o.total)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })()}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete confirm */}
      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setToDelete(null)}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-2">Excluir cupom?</h3>
            <p className="text-sm text-gray-500 mb-5">
              O cupom <code className="font-mono font-bold">{toDelete.code}</code> será removido permanentemente.
            </p>
            <div className="flex gap-3">
              <Button variant="destructive" onClick={handleDelete} className="flex-1">Excluir</Button>
              <Button variant="outline" onClick={() => setToDelete(null)} className="flex-1">Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
