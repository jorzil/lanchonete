"use client"

import { useEffect, useMemo, useState } from "react"
import { Wallet, Plus, Trash2, TrendingUp, TrendingDown, FileBarChart } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/store"
import {
  loadTransactions, addTransaction, deleteTransaction, calcDRE,
  EXPENSE_CATEGORY_LABELS,
  type Transaction, type TxKind, type ExpenseCategory,
} from "@/lib/finance-storage"

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export default function FinanceiroPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const [txs, setTxs] = useState<Transaction[]>([])

  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<TxKind>("despesa")
  const [category, setCategory] = useState<ExpenseCategory>("insumos")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  function refresh() { setTxs(loadTransactions()) }
  useEffect(() => { refresh() }, [])

  const dre = useMemo(() => calcDRE(month, year), [month, year, txs])

  const monthTxs = txs.filter((t) => {
    const d = new Date(t.date)
    return d.getMonth() === month && d.getFullYear() === year
  })

  function openNew(k: TxKind) {
    setKind(k)
    setCategory(k === "despesa" ? "insumos" : "outros")
    setDescription("")
    setAmount("")
    setDate(new Date().toISOString().slice(0, 10))
    setOpen(true)
  }

  function save() {
    const value = parseFloat(amount)
    if (!description.trim() || isNaN(value) || value <= 0) return
    addTransaction({
      kind,
      category: kind === "receita" ? "outros" : category,
      description: description.trim(),
      amount: value,
      date,
    })
    setOpen(false)
    refresh()
  }

  function remove(id: string) {
    deleteTransaction(id)
    refresh()
  }

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-sm text-gray-500">Receitas, despesas e DRE gerencial</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={() => openNew("receita")}><TrendingUp className="mr-1 h-4 w-4 text-emerald-600" /> Receita</Button>
          <Button onClick={() => openNew("despesa")} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]"><TrendingDown className="mr-1 h-4 w-4" /> Despesa</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Receita total" value={formatCurrency(dre.receitaTotal)} tint="text-emerald-600 bg-emerald-50" icon={TrendingUp} />
        <Stat label="CMV (insumos)" value={formatCurrency(dre.cmv)} tint="text-amber-600 bg-amber-50" icon={Wallet} />
        <Stat label="Despesas" value={formatCurrency(dre.despesasTotais)} tint="text-red-600 bg-red-50" icon={TrendingDown} />
        <Stat
          label="Resultado líquido"
          value={formatCurrency(dre.resultadoLiquido)}
          tint={dre.resultadoLiquido >= 0 ? "text-blue-600 bg-blue-50" : "text-red-600 bg-red-50"}
          icon={FileBarChart}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* DRE */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-[#EE5C13]" />
            <h2 className="font-bold text-gray-900">DRE — {MONTHS[month]}/{year}</h2>
          </div>
          <div className="space-y-1 text-sm">
            <DreLine label="Faturamento (pedidos)" value={dre.faturamento} />
            <DreLine label="(+) Receitas extras" value={dre.receitasExtras} />
            <DreLine label="(=) Receita total" value={dre.receitaTotal} strong />
            <DreLine label="(−) CMV / Insumos" value={-dre.cmv} />
            <DreLine label="(=) Lucro bruto" value={dre.lucroBruto} strong />
            <DreLine label="(−) Despesas operacionais" value={-dre.despesasTotais} />
            <div className="my-2 h-px bg-gray-200" />
            <DreLine label="(=) Resultado líquido" value={dre.resultadoLiquido} strong highlight />
            <div className="flex items-center justify-between pt-1 text-xs text-gray-500">
              <span>Margem líquida</span>
              <span className={dre.margemLiquida >= 0 ? "font-bold text-emerald-600" : "font-bold text-red-600"}>
                {dre.margemLiquida.toFixed(1)}%
              </span>
            </div>
          </div>

          {Object.keys(dre.despesasPorCategoria).length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Despesas por categoria</p>
              <div className="space-y-1">
                {Object.entries(dre.despesasPorCategoria).map(([cat, val]) => (
                  <div key={cat} className="flex items-center justify-between text-xs text-gray-600">
                    <span>{EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory] ?? cat}</span>
                    <span className="tabular-nums">{formatCurrency(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Lançamentos */}
        <Card className="lg:col-span-3 p-0">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="font-bold text-gray-900">Lançamentos — {MONTHS[month]}/{year}</h2>
          </div>
          {monthTxs.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">Nenhum lançamento manual neste período.</p>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-b border-gray-200 bg-white text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Data</th>
                    <th className="px-4 py-2 font-semibold">Descrição</th>
                    <th className="px-4 py-2 text-right font-semibold">Valor</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {monthTxs.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-xs text-gray-500">{new Date(t.date).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-2">
                        <p className="font-medium text-gray-800">{t.description}</p>
                        {t.kind === "despesa" && (
                          <span className="text-xs text-gray-400">{EXPENSE_CATEGORY_LABELS[t.category as ExpenseCategory] ?? t.category}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className={`font-bold tabular-nums ${t.kind === "receita" ? "text-emerald-600" : "text-red-600"}`}>
                          {t.kind === "receita" ? "+" : "−"}{formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => remove(t.id)} className="rounded-md p-1.5 hover:bg-gray-100"><Trash2 className="h-4 w-4 text-gray-400" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Modal lançamento */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {kind === "receita" ? <TrendingUp className="h-5 w-5 text-emerald-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
              Novo lançamento — {kind === "receita" ? "Receita" : "Despesa"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {kind === "despesa" && (
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2"><Label>Descrição</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Conta de luz, salário..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
              <div className="space-y-2"><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">Lançar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Stat({ icon: Icon, label, value, tint }: { icon: typeof Wallet; label: string; value: string; tint: string }) {
  return (
    <Card className="p-4">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}><Icon className="h-5 w-5" /></div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </Card>
  )
}

function DreLine({ label, value, strong, highlight }: { label: string; value: number; strong?: boolean; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${strong ? "font-bold" : ""} ${highlight ? (value >= 0 ? "text-emerald-700" : "text-red-700") : "text-gray-700"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{formatCurrency(value)}</span>
    </div>
  )
}
