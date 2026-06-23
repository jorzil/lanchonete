commit 6e7c7a707d9efe4f906d3186913e7723097a897e
Merge: 2e43805 3c5e179
Author: Claude <noreply@anthropic.com>
Date:   Mon Jun 22 23:04:48 2026 +0000

    WIP on main: 2e43805 chore: update tsbuildinfo

diff --cc app/admin/financeiro/page.tsx
index a378fc8,a378fc8..115d4c9
--- a/app/admin/financeiro/page.tsx
+++ b/app/admin/financeiro/page.tsx
@@@ -1,242 -1,242 +1,638 @@@
  "use client"
  
  import { useEffect, useMemo, useState } from "react"
--import { Wallet, Plus, Trash2, TrendingUp, TrendingDown, FileBarChart } from "lucide-react"
--import { Card } from "@/components/ui/card"
--import { Badge } from "@/components/ui/badge"
--import { Button } from "@/components/ui/button"
--import { Input } from "@/components/ui/input"
--import { Label } from "@/components/ui/label"
  import {
--  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
--} from "@/components/ui/select"
--import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
++  Wallet, Plus, Trash2, TrendingUp, TrendingDown, FileBarChart,
++  ArrowDownCircle, ArrowUpCircle, CheckCircle2, AlertCircle,
++  Clock, Ban, ChevronDown, X,
++} from "lucide-react"
  import { formatCurrency } from "@/lib/store"
  import {
    loadTransactions, addTransaction, deleteTransaction, calcDRE,
    EXPENSE_CATEGORY_LABELS,
    type Transaction, type TxKind, type ExpenseCategory,
  } from "@/lib/finance-storage"
++import {
++  loadBills, addBill, updateBill, deleteBill, markPaid,
++  getBillsSummary,
++  BILL_CATEGORY_LABELS, PAGAR_CATEGORIES, RECEBER_CATEGORIES,
++  type Bill, type BillType, type BillCategory,
++} from "@/lib/bills-storage"
++
++const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
++
++const STATUS_CONFIG = {
++  pendente:  { label: "Pendente",  cls: "bg-amber-100 text-amber-700",  icon: Clock },
++  pago:      { label: "Pago",      cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
++  vencido:   { label: "Vencido",   cls: "bg-red-100 text-red-700",       icon: AlertCircle },
++  cancelado: { label: "Cancelado", cls: "bg-gray-100 text-gray-500",     icon: Ban },
++}
++
++const inputCls = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
++const selectCls = `${inputCls} appearance-none cursor-pointer pr-8`
++
++/* ─── Modal de conta ─────────────────────────────────────────────────────── */
++function BillModal({
++  open, type, editing, onClose, onSave,
++}: {
++  open: boolean
++  type: BillType
++  editing: Bill | null
++  onClose: () => void
++  onSave: (data: Omit<Bill, "id" | "createdAt" | "status">) => void
++}) {
++  const isReceber = type === "receber"
++  const cats = isReceber ? RECEBER_CATEGORIES : PAGAR_CATEGORIES
++
++  const [category, setCategory]    = useState<BillCategory>(cats[0])
++  const [description, setDesc]     = useState("")
++  const [amount, setAmount]        = useState("")
++  const [amountPaid, setAmtPaid]   = useState("0")
++  const [dueDate, setDueDate]      = useState(new Date().toISOString().slice(0, 10))
++  const [paidDate, setPaidDate]    = useState<string>("")
++  const [notes, setNotes]          = useState("")
++
++  useEffect(() => {
++    if (editing) {
++      setCategory(editing.category)
++      setDesc(editing.description)
++      setAmount(String(editing.amount))
++      setAmtPaid(String(editing.amountPaid))
++      setDueDate(editing.dueDate)
++      setPaidDate(editing.paidDate ?? "")
++      setNotes(editing.notes ?? "")
++    } else {
++      setCategory(cats[0])
++      setDesc(""); setAmount(""); setAmtPaid("0")
++      setDueDate(new Date().toISOString().slice(0, 10))
++      setPaidDate(""); setNotes("")
++    }
++  }, [editing, open]) // eslint-disable-line react-hooks/exhaustive-deps
++
++  if (!open) return null
++
++  const totalAmt = parseFloat(amount) || 0
++  const paidAmt  = parseFloat(amountPaid) || 0
++  const remaining = Math.max(0, totalAmt - paidAmt)
++
++  function handleSave() {
++    if (!description.trim() || totalAmt <= 0 || !dueDate) return
++    onSave({
++      type, category, description: description.trim(),
++      amount: totalAmt, amountPaid: paidAmt,
++      dueDate, paidDate: paidDate || null, notes: notes.trim() || undefined,
++    })
++  }
  
--const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
++  return (
++    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
++      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
++      <div className="relative z-10 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl flex flex-col max-h-[95vh]">
++
++        {/* Header */}
++        <div className={`flex items-center justify-between px-6 py-4 rounded-t-3xl sm:rounded-t-2xl border-b ${isReceber ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
++          <div className="flex items-center gap-3">
++            {isReceber
++              ? <ArrowDownCircle size={22} className="text-emerald-600 shrink-0" />
++              : <ArrowUpCircle size={22} className="text-red-600 shrink-0" />}
++            <div>
++              <h2 className="text-base font-black text-gray-900">
++                {editing ? "Editar" : "Nova"} Conta a {isReceber ? "Receber" : "Pagar"}
++              </h2>
++              <p className="text-xs text-gray-500 mt-0.5">Preencha os dados abaixo</p>
++            </div>
++          </div>
++          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-gray-500 transition-colors">
++            <X size={15} />
++          </button>
++        </div>
++
++        {/* Body */}
++        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
++
++          <div className="space-y-1.5">
++            <label className="block text-sm font-semibold text-gray-700">Descrição *</label>
++            <input className={inputCls} value={description} onChange={e => setDesc(e.target.value)} placeholder={isReceber ? "Ex: Venda do dia, serviço prestado..." : "Ex: Conta de luz, fornecedor X..."} />
++          </div>
++
++          <div className="grid grid-cols-2 gap-3">
++            <div className="space-y-1.5">
++              <label className="block text-sm font-semibold text-gray-700">Categoria</label>
++              <div className="relative">
++                <select className={selectCls} value={category} onChange={e => setCategory(e.target.value as BillCategory)}>
++                  {cats.map(c => <option key={c} value={c}>{BILL_CATEGORY_LABELS[c]}</option>)}
++                </select>
++                <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
++              </div>
++            </div>
++
++            <div className="space-y-1.5">
++              <label className="block text-sm font-semibold text-gray-700">Vencimento *</label>
++              <input type="date" className={inputCls} value={dueDate} onChange={e => setDueDate(e.target.value)} />
++            </div>
++          </div>
++
++          {/* Valores */}
++          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
++            <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Valores</p>
++            <div className="grid grid-cols-2 gap-3">
++              <div className="space-y-1.5">
++                <label className="block text-sm font-semibold text-gray-700">Valor total (R$) *</label>
++                <input type="number" min="0" step="0.01" className={inputCls} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" />
++              </div>
++              <div className="space-y-1.5">
++                <label className="block text-sm font-semibold text-gray-700">{isReceber ? "Já recebido (R$)" : "Já pago (R$)"}</label>
++                <input type="number" min="0" step="0.01" className={inputCls} value={amountPaid} onChange={e => setAmtPaid(e.target.value)} placeholder="0,00" />
++              </div>
++            </div>
++            {totalAmt > 0 && (
++              <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${remaining === 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
++                <span className="text-gray-600 font-medium">Saldo restante</span>
++                <span className={`font-black text-base ${remaining === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>{formatCurrency(remaining)}</span>
++              </div>
++            )}
++          </div>
++
++          <div className="grid grid-cols-2 gap-3">
++            <div className="space-y-1.5">
++              <label className="block text-sm font-semibold text-gray-700">{isReceber ? "Data recebimento" : "Data pagamento"}</label>
++              <input type="date" className={inputCls} value={paidDate} onChange={e => setPaidDate(e.target.value)} />
++            </div>
++          </div>
++
++          <div className="space-y-1.5">
++            <label className="block text-sm font-semibold text-gray-700">Observações</label>
++            <textarea rows={2} className={`${inputCls} resize-none`} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Informações adicionais..." />
++          </div>
++        </div>
++
++        {/* Footer */}
++        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
++          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
++            Cancelar
++          </button>
++          <button
++            onClick={handleSave}
++            disabled={!description.trim() || totalAmt <= 0 || !dueDate}
++            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-black shadow-sm disabled:opacity-40 transition-all ${isReceber ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
++          >
++            {editing ? "Salvar" : "Lançar"}
++          </button>
++        </div>
++      </div>
++    </div>
++  )
++}
++
++/* ─── Tabela de contas ───────────────────────────────────────────────────── */
++function BillsTable({
++  bills, type, onEdit, onDelete, onMarkPaid,
++}: {
++  bills: Bill[]
++  type: BillType
++  onEdit: (b: Bill) => void
++  onDelete: (id: string) => void
++  onMarkPaid: (id: string) => void
++}) {
++  const isReceber = type === "receber"
++  if (bills.length === 0) {
++    return (
++      <div className="py-16 text-center">
++        <div className="text-4xl mb-3 opacity-30">{isReceber ? "💰" : "📋"}</div>
++        <p className="text-gray-500 font-semibold">Nenhuma conta cadastrada</p>
++        <p className="text-gray-400 text-sm mt-1">Clique em "+ Nova" para adicionar</p>
++      </div>
++    )
++  }
++
++  return (
++    <div className="overflow-x-auto">
++      <table className="w-full text-sm">
++        <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
++          <tr>
++            <th className="px-4 py-3 font-semibold">Descrição</th>
++            <th className="px-4 py-3 font-semibold">Vencimento</th>
++            <th className="px-4 py-3 font-semibold text-right">Total</th>
++            <th className="px-4 py-3 font-semibold text-right">Pago</th>
++            <th className="px-4 py-3 font-semibold text-right">Saldo</th>
++            <th className="px-4 py-3 font-semibold">Status</th>
++            <th className="px-4 py-3 font-semibold text-right">Ações</th>
++          </tr>
++        </thead>
++        <tbody className="divide-y divide-gray-100">
++          {bills.map((b) => {
++            const cfg = STATUS_CONFIG[b.status]
++            const StatusIcon = cfg.icon
++            const remaining = b.amount - b.amountPaid
++            const overdue   = b.status === "vencido"
++            return (
++              <tr key={b.id} className={`hover:bg-gray-50 transition-colors ${overdue ? 'bg-red-50/30' : ''}`}>
++                <td className="px-4 py-3">
++                  <p className="font-semibold text-gray-900 leading-tight">{b.description}</p>
++                  <p className="text-xs text-gray-400 mt-0.5">{BILL_CATEGORY_LABELS[b.category]}</p>
++                  {b.notes && <p className="text-xs text-gray-400 italic mt-0.5 line-clamp-1">{b.notes}</p>}
++                </td>
++                <td className="px-4 py-3 text-sm">
++                  <p className={`font-medium tabular-nums ${overdue ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
++                    {new Date(b.dueDate + 'T00:00:00').toLocaleDateString("pt-BR")}
++                  </p>
++                  {b.paidDate && (
++                    <p className="text-xs text-emerald-600 mt-0.5">
++                      Pago: {new Date(b.paidDate + 'T00:00:00').toLocaleDateString("pt-BR")}
++                    </p>
++                  )}
++                </td>
++                <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-800">{formatCurrency(b.amount)}</td>
++                <td className="px-4 py-3 text-right tabular-nums text-emerald-600 font-medium">{formatCurrency(b.amountPaid)}</td>
++                <td className="px-4 py-3 text-right tabular-nums font-bold">
++                  <span className={remaining > 0 ? (overdue ? 'text-red-600' : 'text-amber-600') : 'text-emerald-600'}>
++                    {formatCurrency(remaining)}
++                  </span>
++                </td>
++                <td className="px-4 py-3">
++                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.cls}`}>
++                    <StatusIcon size={11} />
++                    {cfg.label}
++                  </span>
++                </td>
++                <td className="px-4 py-3">
++                  <div className="flex items-center justify-end gap-1">
++                    {b.status !== "pago" && b.status !== "cancelado" && (
++                      <button
++                        onClick={() => onMarkPaid(b.id)}
++                        title="Marcar como pago"
++                        className="rounded-md px-2 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors border border-emerald-200 hover:border-emerald-400"
++                      >
++                        ✓ Pagar
++                      </button>
++                    )}
++                    <button onClick={() => onEdit(b)} title="Editar" className="rounded-md p-1.5 hover:bg-gray-100 transition-colors">
++                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
++                    </button>
++                    <button onClick={() => onDelete(b.id)} title="Excluir" className="rounded-md p-1.5 hover:bg-red-50 transition-colors">
++                      <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
++                    </button>
++                  </div>
++                </td>
++              </tr>
++            )
++          })}
++        </tbody>
++      </table>
++    </div>
++  )
++}
  
++/* ─── Main page ──────────────────────────────────────────────────────────── */
  export default function FinanceiroPage() {
--  const now = new Date()
++  const now  = new Date()
++  const [tab, setTab]     = useState<"dre" | "receber" | "pagar">("dre")
    const [month, setMonth] = useState(now.getMonth())
--  const [year, setYear] = useState(now.getFullYear())
--  const [txs, setTxs] = useState<Transaction[]>([])
++  const [year, setYear]   = useState(now.getFullYear())
++  const [txs, setTxs]     = useState<Transaction[]>([])
++  const [bills, setBills] = useState<Bill[]>([])
  
--  const [open, setOpen] = useState(false)
--  const [kind, setKind] = useState<TxKind>("despesa")
--  const [category, setCategory] = useState<ExpenseCategory>("insumos")
--  const [description, setDescription] = useState("")
--  const [amount, setAmount] = useState("")
--  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
++  // Modals
++  const [txOpen, setTxOpen]   = useState(false)
++  const [txKind, setTxKind]   = useState<TxKind>("despesa")
++  const [txCat, setTxCat]     = useState<ExpenseCategory>("insumos")
++  const [txDesc, setTxDesc]   = useState("")
++  const [txAmt, setTxAmt]     = useState("")
++  const [txDate, setTxDate]   = useState(now.toISOString().slice(0, 10))
  
--  function refresh() { setTxs(loadTransactions()) }
++  const [billModalOpen, setBillModalOpen] = useState(false)
++  const [billModalType, setBillModalType] = useState<BillType>("receber")
++  const [editingBill, setEditingBill]     = useState<Bill | null>(null)
++
++  // Filter for bills
++  const [billFilter, setBillFilter] = useState<"todos" | "pendente" | "vencido" | "pago">("todos")
++
++  function refresh() {
++    setTxs(loadTransactions())
++    setBills(loadBills())
++  }
    useEffect(() => { refresh() }, [])
  
--  const dre = useMemo(() => calcDRE(month, year), [month, year, txs])
++  const dre     = useMemo(() => calcDRE(month, year), [month, year, txs])
++  const summary = useMemo(() => getBillsSummary(), [bills])
  
    const monthTxs = txs.filter((t) => {
      const d = new Date(t.date)
      return d.getMonth() === month && d.getFullYear() === year
    })
  
--  function openNew(k: TxKind) {
--    setKind(k)
--    setCategory(k === "despesa" ? "insumos" : "outros")
--    setDescription("")
--    setAmount("")
--    setDate(new Date().toISOString().slice(0, 10))
--    setOpen(true)
++  const filteredBills = (type: BillType) => {
++    let list = bills.filter(b => b.type === type)
++    if (billFilter !== "todos") list = list.filter(b => b.status === billFilter)
++    return list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    }
  
--  function save() {
--    const value = parseFloat(amount)
--    if (!description.trim() || isNaN(value) || value <= 0) return
--    addTransaction({
--      kind,
--      category: kind === "receita" ? "outros" : category,
--      description: description.trim(),
--      amount: value,
--      date,
--    })
--    setOpen(false)
++  function saveTx() {
++    const value = parseFloat(txAmt)
++    if (!txDesc.trim() || isNaN(value) || value <= 0) return
++    addTransaction({ kind: txKind, category: txKind === "receita" ? "outros" : txCat, description: txDesc.trim(), amount: value, date: txDate })
++    setTxOpen(false)
++    setTxDesc(""); setTxAmt("")
      refresh()
    }
  
--  function remove(id: string) {
--    deleteTransaction(id)
++  function openNewBill(type: BillType) {
++    setEditingBill(null)
++    setBillModalType(type)
++    setBillModalOpen(true)
++  }
++
++  function saveBill(data: Omit<Bill, "id" | "createdAt" | "status">) {
++    if (editingBill) {
++      updateBill(editingBill.id, data)
++    } else {
++      addBill(data)
++    }
++    setBillModalOpen(false)
++    setEditingBill(null)
      refresh()
    }
  
    const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]
  
++  const TAB_BTNS = [
++    { id: "dre",     label: "DRE / Lançamentos",   icon: FileBarChart },
++    { id: "receber", label: "Contas a Receber",     icon: ArrowDownCircle },
++    { id: "pagar",   label: "Contas a Pagar",       icon: ArrowUpCircle },
++  ] as const
++
    return (
      <div className="space-y-6">
++
++      {/* Page header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
--          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
--          <p className="text-sm text-gray-500">Receitas, despesas e DRE gerencial</p>
--        </div>
--        <div className="flex flex-wrap gap-2">
--          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
--            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
--            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
--          </Select>
--          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
--            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
--            <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
--          </Select>
--          <Button variant="outline" onClick={() => openNew("receita")}><TrendingUp className="mr-1 h-4 w-4 text-emerald-600" /> Receita</Button>
--          <Button onClick={() => openNew("despesa")} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]"><TrendingDown className="mr-1 h-4 w-4" /> Despesa</Button>
++          <h1 className="text-2xl font-black text-gray-900">Financeiro</h1>
++          <p className="text-sm text-gray-500">Fluxo de caixa, contas e DRE gerencial</p>
          </div>
++        {tab === "dre" && (
++          <div className="flex flex-wrap gap-2 items-center">
++            <div className="relative">
++              <select className="appearance-none h-9 pl-3 pr-7 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 outline-none focus:border-orange-400" value={month} onChange={e => setMonth(Number(e.target.value))}>
++                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
++              </select>
++              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
++            </div>
++            <div className="relative">
++              <select className="appearance-none h-9 pl-3 pr-7 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 outline-none focus:border-orange-400" value={year} onChange={e => setYear(Number(e.target.value))}>
++                {years.map(y => <option key={y} value={y}>{y}</option>)}
++              </select>
++              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
++            </div>
++            <button onClick={() => { setTxKind("receita"); setTxOpen(true) }} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-sm font-bold transition-colors">
++              <TrendingUp size={14} /> Receita
++            </button>
++            <button onClick={() => { setTxKind("despesa"); setTxOpen(true) }} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors shadow-sm">
++              <TrendingDown size={14} /> Despesa
++            </button>
++          </div>
++        )}
++        {(tab === "receber" || tab === "pagar") && (
++          <button
++            onClick={() => openNewBill(tab)}
++            className={`inline-flex items-center gap-2 h-9 px-5 rounded-lg text-white text-sm font-bold shadow-sm transition-colors ${tab === "receber" ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
++          >
++            <Plus size={15} /> Nova conta a {tab === "receber" ? "receber" : "pagar"}
++          </button>
++        )}
        </div>
  
--      {/* KPIs */}
--      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
--        <Stat label="Receita total" value={formatCurrency(dre.receitaTotal)} tint="text-emerald-600 bg-emerald-50" icon={TrendingUp} />
--        <Stat label="CMV (insumos)" value={formatCurrency(dre.cmv)} tint="text-amber-600 bg-amber-50" icon={Wallet} />
--        <Stat label="Despesas" value={formatCurrency(dre.despesasTotais)} tint="text-red-600 bg-red-50" icon={TrendingDown} />
--        <Stat
--          label="Resultado líquido"
--          value={formatCurrency(dre.resultadoLiquido)}
--          tint={dre.resultadoLiquido >= 0 ? "text-blue-600 bg-blue-50" : "text-red-600 bg-red-50"}
--          icon={FileBarChart}
--        />
++      {/* Summary cards — always visible */}
++      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
++        <SummaryCard label="A Receber" value={summary.receberPendente} sub={summary.receberVencido > 0 ? `${formatCurrency(summary.receberVencido)} vencido` : undefined} color="emerald" icon={ArrowDownCircle} />
++        <SummaryCard label="A Pagar" value={summary.pagarPendente} sub={summary.pagarVencido > 0 ? `${formatCurrency(summary.pagarVencido)} vencido` : undefined} color="red" icon={ArrowUpCircle} />
++        <SummaryCard label="Saldo Líquido" value={summary.saldoLiquido} color={summary.saldoLiquido >= 0 ? "blue" : "red"} icon={Wallet} />
++        <SummaryCard label="Resultado Mês" value={dre.resultadoLiquido} sub={`Margem ${dre.margemLiquida.toFixed(1)}%`} color={dre.resultadoLiquido >= 0 ? "blue" : "red"} icon={FileBarChart} />
        </div>
  
--      <div className="grid gap-6 lg:grid-cols-5">
--        {/* DRE */}
--        <Card className="lg:col-span-2">
--          <div className="mb-4 flex items-center gap-2">
--            <FileBarChart className="h-5 w-5 text-[#EE5C13]" />
--            <h2 className="font-bold text-gray-900">DRE — {MONTHS[month]}/{year}</h2>
--          </div>
--          <div className="space-y-1 text-sm">
--            <DreLine label="Faturamento (pedidos)" value={dre.faturamento} />
--            <DreLine label="(+) Receitas extras" value={dre.receitasExtras} />
--            <DreLine label="(=) Receita total" value={dre.receitaTotal} strong />
--            <DreLine label="(−) CMV / Insumos" value={-dre.cmv} />
--            <DreLine label="(=) Lucro bruto" value={dre.lucroBruto} strong />
--            <DreLine label="(−) Despesas operacionais" value={-dre.despesasTotais} />
--            <div className="my-2 h-px bg-gray-200" />
--            <DreLine label="(=) Resultado líquido" value={dre.resultadoLiquido} strong highlight />
--            <div className="flex items-center justify-between pt-1 text-xs text-gray-500">
--              <span>Margem líquida</span>
--              <span className={dre.margemLiquida >= 0 ? "font-bold text-emerald-600" : "font-bold text-red-600"}>
--                {dre.margemLiquida.toFixed(1)}%
--              </span>
--            </div>
--          </div>
++      {/* Tabs */}
++      <div className="border-b border-gray-200">
++        <div className="flex gap-0">
++          {TAB_BTNS.map(({ id, label, icon: Icon }) => (
++            <button
++              key={id}
++              onClick={() => setTab(id)}
++              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all -mb-px ${
++                tab === id
++                  ? 'border-orange-500 text-orange-600'
++                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
++              }`}
++            >
++              <Icon size={15} />
++              <span className="hidden sm:inline">{label}</span>
++              <span className="sm:hidden">{label.split(" ")[label.split(" ").length - 1]}</span>
++            </button>
++          ))}
++        </div>
++      </div>
  
--          {Object.keys(dre.despesasPorCategoria).length > 0 && (
--            <div className="mt-4 border-t border-gray-100 pt-3">
--              <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Despesas por categoria</p>
--              <div className="space-y-1">
++      {/* ── DRE TAB ── */}
++      {tab === "dre" && (
++        <div className="grid gap-6 lg:grid-cols-5">
++          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5">
++            <div className="flex items-center gap-2 mb-4">
++              <FileBarChart size={18} className="text-orange-500" />
++              <h2 className="font-bold text-gray-900">DRE — {MONTHS[month]}/{year}</h2>
++            </div>
++            <div className="space-y-1 text-sm">
++              <DreLine label="Faturamento (pedidos)"   value={dre.faturamento} />
++              <DreLine label="(+) Receitas extras"     value={dre.receitasExtras} />
++              <DreLine label="(=) Receita total"       value={dre.receitaTotal} strong />
++              <DreLine label="(−) CMV / Insumos"       value={-dre.cmv} />
++              <DreLine label="(=) Lucro bruto"         value={dre.lucroBruto} strong />
++              <DreLine label="(−) Despesas operacionais" value={-dre.despesasTotais} />
++              <div className="my-2 h-px bg-gray-200" />
++              <DreLine label="(=) Resultado líquido"   value={dre.resultadoLiquido} strong highlight />
++              <div className="flex justify-between pt-1 text-xs text-gray-500">
++                <span>Margem líquida</span>
++                <span className={`font-bold ${dre.margemLiquida >= 0 ? "text-emerald-600" : "text-red-600"}`}>
++                  {dre.margemLiquida.toFixed(1)}%
++                </span>
++              </div>
++            </div>
++            {Object.keys(dre.despesasPorCategoria).length > 0 && (
++              <div className="mt-4 border-t border-gray-100 pt-3 space-y-1">
++                <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Por categoria</p>
                  {Object.entries(dre.despesasPorCategoria).map(([cat, val]) => (
--                  <div key={cat} className="flex items-center justify-between text-xs text-gray-600">
++                  <div key={cat} className="flex justify-between text-xs text-gray-600">
                      <span>{EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory] ?? cat}</span>
                      <span className="tabular-nums">{formatCurrency(val)}</span>
                    </div>
                  ))}
                </div>
--            </div>
--          )}
--        </Card>
--
--        {/* Lançamentos */}
--        <Card className="lg:col-span-3 p-0">
--          <div className="border-b border-gray-100 px-4 py-3">
--            <h2 className="font-bold text-gray-900">Lançamentos — {MONTHS[month]}/{year}</h2>
++            )}
            </div>
--          {monthTxs.length === 0 ? (
--            <p className="py-12 text-center text-sm text-gray-400">Nenhum lançamento manual neste período.</p>
--          ) : (
--            <div className="max-h-[50vh] overflow-y-auto">
--              <table className="w-full text-sm">
--                <thead className="sticky top-0 border-b border-gray-200 bg-white text-left text-xs uppercase text-gray-500">
--                  <tr>
--                    <th className="px-4 py-2 font-semibold">Data</th>
--                    <th className="px-4 py-2 font-semibold">Descrição</th>
--                    <th className="px-4 py-2 text-right font-semibold">Valor</th>
--                    <th className="px-4 py-2"></th>
--                  </tr>
--                </thead>
--                <tbody className="divide-y divide-gray-100">
--                  {monthTxs.map((t) => (
--                    <tr key={t.id} className="hover:bg-gray-50">
--                      <td className="px-4 py-2 text-xs text-gray-500">{new Date(t.date).toLocaleDateString("pt-BR")}</td>
--                      <td className="px-4 py-2">
--                        <p className="font-medium text-gray-800">{t.description}</p>
--                        {t.kind === "despesa" && (
--                          <span className="text-xs text-gray-400">{EXPENSE_CATEGORY_LABELS[t.category as ExpenseCategory] ?? t.category}</span>
--                        )}
--                      </td>
--                      <td className="px-4 py-2 text-right">
--                        <span className={`font-bold tabular-nums ${t.kind === "receita" ? "text-emerald-600" : "text-red-600"}`}>
--                          {t.kind === "receita" ? "+" : "−"}{formatCurrency(t.amount)}
--                        </span>
--                      </td>
--                      <td className="px-4 py-2 text-right">
--                        <button onClick={() => remove(t.id)} className="rounded-md p-1.5 hover:bg-gray-100"><Trash2 className="h-4 w-4 text-gray-400" /></button>
--                      </td>
--                    </tr>
--                  ))}
--                </tbody>
--              </table>
--            </div>
--          )}
--        </Card>
--      </div>
  
--      {/* Modal lançamento */}
--      <Dialog open={open} onOpenChange={setOpen}>
--        <DialogContent className="admin-theme max-w-md">
--          <DialogHeader>
--            <DialogTitle className="flex items-center gap-2">
--              {kind === "receita" ? <TrendingUp className="h-5 w-5 text-emerald-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
--              Novo lançamento — {kind === "receita" ? "Receita" : "Despesa"}
--            </DialogTitle>
--          </DialogHeader>
--          <div className="space-y-4">
--            {kind === "despesa" && (
--              <div className="space-y-2">
--                <Label>Categoria</Label>
--                <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
--                  <SelectTrigger><SelectValue /></SelectTrigger>
--                  <SelectContent>
--                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, label]) => (
--                      <SelectItem key={k} value={k}>{label}</SelectItem>
++          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 overflow-hidden">
++            <div className="border-b border-gray-100 px-4 py-3">
++              <h2 className="font-bold text-gray-900">Lançamentos — {MONTHS[month]}/{year}</h2>
++            </div>
++            {monthTxs.length === 0 ? (
++              <p className="py-12 text-center text-sm text-gray-400">Nenhum lançamento neste período.</p>
++            ) : (
++              <div className="max-h-[50vh] overflow-y-auto">
++                <table className="w-full text-sm">
++                  <thead className="sticky top-0 border-b border-gray-200 bg-white text-left text-xs uppercase text-gray-500">
++                    <tr>
++                      <th className="px-4 py-2 font-semibold">Data</th>
++                      <th className="px-4 py-2 font-semibold">Descrição</th>
++                      <th className="px-4 py-2 text-right font-semibold">Valor</th>
++                      <th className="px-4 py-2" />
++                    </tr>
++                  </thead>
++                  <tbody className="divide-y divide-gray-100">
++                    {monthTxs.map((t) => (
++                      <tr key={t.id} className="hover:bg-gray-50">
++                        <td className="px-4 py-2 text-xs text-gray-500 tabular-nums">{new Date(t.date).toLocaleDateString("pt-BR")}</td>
++                        <td className="px-4 py-2">
++                          <p className="font-medium text-gray-800">{t.description}</p>
++                          {t.kind === "despesa" && <span className="text-xs text-gray-400">{EXPENSE_CATEGORY_LABELS[t.category as ExpenseCategory] ?? t.category}</span>}
++                        </td>
++                        <td className="px-4 py-2 text-right">
++                          <span className={`font-bold tabular-nums ${t.kind === "receita" ? "text-emerald-600" : "text-red-600"}`}>
++                            {t.kind === "receita" ? "+" : "−"}{formatCurrency(t.amount)}
++                          </span>
++                        </td>
++                        <td className="px-4 py-2 text-right">
++                          <button onClick={() => { deleteTransaction(t.id); refresh() }} className="rounded-md p-1.5 hover:bg-gray-100">
++                            <Trash2 size={13} className="text-gray-400" />
++                          </button>
++                        </td>
++                      </tr>
                      ))}
--                  </SelectContent>
--                </Select>
++                  </tbody>
++                </table>
                </div>
              )}
--            <div className="space-y-2"><Label>Descrição</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Conta de luz, salário..." /></div>
--            <div className="grid grid-cols-2 gap-4">
--              <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
--              <div className="space-y-2"><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
++          </div>
++        </div>
++      )}
++
++      {/* ── CONTAS A RECEBER / PAGAR ── */}
++      {(tab === "receber" || tab === "pagar") && (
++        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
++          {/* Filter bar */}
++          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-wrap">
++            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">Filtrar:</span>
++            {(["todos","pendente","vencido","pago"] as const).map(f => (
++              <button
++                key={f}
++                onClick={() => setBillFilter(f)}
++                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
++                  billFilter === f
++                    ? 'bg-orange-500 text-white border-orange-500'
++                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
++                }`}
++              >
++                {f === "todos" ? "Todos" : STATUS_CONFIG[f].label}
++              </button>
++            ))}
++            <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
++              <span>Total: <strong className="text-gray-800 tabular-nums">{formatCurrency(filteredBills(tab).reduce((a, b) => a + b.amount, 0))}</strong></span>
++              <span>Pendente: <strong className={`tabular-nums ${tab === "receber" ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(filteredBills(tab).filter(b => b.status !== "pago" && b.status !== "cancelado").reduce((a, b) => a + (b.amount - b.amountPaid), 0))}</strong></span>
              </div>
            </div>
--          <DialogFooter>
--            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
--            <Button onClick={save} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">Lançar</Button>
--          </DialogFooter>
--        </DialogContent>
--      </Dialog>
++
++          <BillsTable
++            bills={filteredBills(tab)}
++            type={tab}
++            onEdit={(b) => { setEditingBill(b); setBillModalType(b.type); setBillModalOpen(true) }}
++            onDelete={(id) => { if (confirm("Excluir esta conta?")) { deleteBill(id); refresh() } }}
++            onMarkPaid={(id) => { markPaid(id); refresh() }}
++          />
++        </div>
++      )}
++
++      {/* Modal lançamento DRE */}
++      {txOpen && (
++        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
++          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setTxOpen(false)} />
++          <div className="relative z-10 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl">
++            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
++              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
++                {txKind === "receita" ? <TrendingUp size={18} className="text-emerald-600" /> : <TrendingDown size={18} className="text-red-600" />}
++                Novo lançamento — {txKind === "receita" ? "Receita" : "Despesa"}
++              </h2>
++              <button onClick={() => setTxOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"><X size={15} /></button>
++            </div>
++            <div className="px-6 py-5 space-y-4">
++              {txKind === "despesa" && (
++                <div className="space-y-1.5">
++                  <label className="block text-sm font-semibold text-gray-700">Categoria</label>
++                  <div className="relative">
++                    <select className={selectCls} value={txCat} onChange={e => setTxCat(e.target.value as ExpenseCategory)}>
++                      {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
++                    </select>
++                    <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
++                  </div>
++                </div>
++              )}
++              <div className="space-y-1.5">
++                <label className="block text-sm font-semibold text-gray-700">Descrição</label>
++                <input className={inputCls} value={txDesc} onChange={e => setTxDesc(e.target.value)} placeholder="Ex.: Conta de luz, salário..." />
++              </div>
++              <div className="grid grid-cols-2 gap-3">
++                <div className="space-y-1.5">
++                  <label className="block text-sm font-semibold text-gray-700">Valor (R$)</label>
++                  <input type="number" min="0" step="any" className={inputCls} value={txAmt} onChange={e => setTxAmt(e.target.value)} placeholder="0,00" />
++                </div>
++                <div className="space-y-1.5">
++                  <label className="block text-sm font-semibold text-gray-700">Data</label>
++                  <input type="date" className={inputCls} value={txDate} onChange={e => setTxDate(e.target.value)} />
++                </div>
++              </div>
++            </div>
++            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
++              <button onClick={() => setTxOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700">Cancelar</button>
++              <button onClick={saveTx} disabled={!txDesc.trim() || !txAmt} className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-black disabled:opacity-40 transition-all">Lançar</button>
++            </div>
++          </div>
++        </div>
++      )}
++
++      {/* Modal conta a receber/pagar */}
++      <BillModal
++        open={billModalOpen}
++        type={billModalType}
++        editing={editingBill}
++        onClose={() => { setBillModalOpen(false); setEditingBill(null) }}
++        onSave={saveBill}
++      />
      </div>
    )
  }
  
--function Stat({ icon: Icon, label, value, tint }: { icon: typeof Wallet; label: string; value: string; tint: string }) {
++/* ─── Sub-components ─────────────────────────────────────────────────────── */
++function SummaryCard({ label, value, sub, color, icon: Icon }: {
++  label: string; value: number; sub?: string
++  color: "emerald" | "red" | "blue"; icon: typeof Wallet
++}) {
++  const colors = {
++    emerald: "bg-emerald-50 text-emerald-600",
++    red:     "bg-red-50 text-red-600",
++    blue:    "bg-blue-50 text-blue-600",
++  }
++  const textColors = {
++    emerald: "text-emerald-700",
++    red:     "text-red-700",
++    blue:    "text-blue-700",
++  }
    return (
--    <Card className="p-4">
--      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}><Icon className="h-5 w-5" /></div>
--      <p className="text-xs text-gray-500">{label}</p>
--      <p className="text-xl font-bold text-gray-900">{value}</p>
--    </Card>
++    <div className="bg-white rounded-2xl border border-gray-200 p-4">
++      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${colors[color]}`}>
++        <Icon size={18} />
++      </div>
++      <p className="text-xs text-gray-500 font-medium">{label}</p>
++      <p className={`text-xl font-black tabular-nums leading-tight ${value < 0 ? 'text-red-700' : textColors[color]}`}>
++        {formatCurrency(value)}
++      </p>
++      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
++    </div>
    )
  }
  
