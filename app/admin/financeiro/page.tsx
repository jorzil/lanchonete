"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Wallet, Plus, Trash2, TrendingUp, TrendingDown, FileBarChart,
  ArrowDownCircle, ArrowUpCircle, CheckCircle2, AlertCircle,
  Clock, Ban, X,
} from "lucide-react"
import { formatCurrency } from "@/lib/store"
import {
  loadTransactions, addTransaction, deleteTransaction, calcDRE,
  replaceTransactions, fetchTransactionsRemote, pushFinanceRemote,
  EXPENSE_CATEGORY_LABELS,
  type Transaction, type TxKind, type ExpenseCategory,
} from "@/lib/finance-storage"
import {
  loadBills, addBill, updateBill, deleteBill, deleteSeries, markPaid,
  getBillsSummary, replaceBills, fetchBillsRemote,
  loadCustomCategories, saveCustomCategories, addCustomCategory, billCategoryLabel,
  loadCashBase, saveCashBase, loadBankBase, saveBankBase,
  MONEY_ACCOUNT_LABELS, type MoneyAccount,
  BILL_CATEGORY_LABELS, PAGAR_CATEGORIES, RECEBER_CATEGORIES,
  RECURRENCE_LABELS,
  type Bill, type BillType, type BillCategory, type Recurrence, type CustomCategory,
} from "@/lib/bills-storage"

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

const STATUS_CONFIG = {
  pendente:  { label: "Pendente",  cls: "bg-amber-100 text-amber-700",    icon: Clock },
  pago:      { label: "Pago",      cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  vencido:   { label: "Vencido",   cls: "bg-red-100 text-red-700",         icon: AlertCircle },
  cancelado: { label: "Cancelado", cls: "bg-gray-100 text-gray-500",       icon: Ban },
}

function fmt(n: number) {
  return formatCurrency(n)
}

// ─── Bill Modal ──────────────────────────────────────────────────────────────
function BillModal({
  type,
  bill,
  onClose,
  onSave,
  onCategoriesChanged,
}: {
  type: BillType
  bill: Bill | null
  onClose: () => void
  onSave: () => void
  onCategoriesChanged: () => void
}) {
  const categories = type === "pagar" ? PAGAR_CATEGORIES : RECEBER_CATEGORIES
  const today = new Date().toISOString().slice(0, 10)
  const [customCats, setCustomCats] = useState<CustomCategory[]>(() => loadCustomCategories().filter((c) => c.type === type))
  const [addingCat, setAddingCat] = useState(false)
  const [newCatLabel, setNewCatLabel] = useState("")

  const [form, setForm] = useState({
    description: bill?.description ?? "",
    amount: bill?.amount?.toString() ?? "",
    amountPaid: bill?.amountPaid?.toString() ?? "0",
    dueDate: bill?.dueDate ?? today,
    paidDate: bill?.paidDate ?? "",
    category: bill?.category ?? categories[0],
    notes: bill?.notes ?? "",
    recurrence: (bill?.recurrence ?? "none") as Recurrence,
    account: (bill?.account ?? "dinheiro") as MoneyAccount,
  })

  function set(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  function handleSubmit() {
    const amount = parseFloat(form.amount) || 0
    const amountPaid = parseFloat(form.amountPaid) || 0
    if (!form.description.trim() || amount <= 0 || !form.dueDate) return

    const data = {
      type,
      description: form.description.trim(),
      amount,
      amountPaid,
      dueDate: form.dueDate,
      paidDate: form.paidDate || null,
      category: form.category as BillCategory,
      notes: form.notes.trim() || undefined,
      recurrence: form.recurrence,
      account: form.account,
    }

    if (bill) {
      // ao editar não regeramos a série; mantemos a periodicidade original
      updateBill(bill.id, data)
    } else {
      addBill(data)
    }
    onSave()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {bill ? "Editar" : "Nova"} conta a {type === "pagar" ? "pagar" : "receber"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Descrição *</label>
            <input
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Ex: Fornecedor de pães"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Valor total (R$) *</label>
              <input
                type="number" min="0" step="0.01"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Valor pago (R$)</label>
              <input
                type="number" min="0" step="0.01"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
                value={form.amountPaid}
                onChange={(e) => set("amountPaid", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Vencimento *</label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Data pagamento</label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
                value={form.paidDate}
                onChange={(e) => set("paidDate", e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-600">Categoria</label>
              <button
                type="button"
                onClick={() => setAddingCat((v) => !v)}
                className="text-[11px] font-medium text-orange-600 hover:text-orange-700"
              >
                {addingCat ? "cancelar" : "+ nova categoria"}
              </button>
            </div>
            {addingCat ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
                  value={newCatLabel}
                  onChange={(e) => setNewCatLabel(e.target.value)}
                  placeholder={type === "pagar" ? "Ex: Fornecedor de bebidas" : "Ex: Aluguel de espaço"}
                  onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const label = newCatLabel.trim()
                    if (!label) return
                    const cat = addCustomCategory(label, type)
                    setCustomCats(loadCustomCategories().filter((c) => c.type === type))
                    set("category", cat.key)
                    setNewCatLabel("")
                    setAddingCat(false)
                    onCategoriesChanged()
                  }}
                  className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600"
                >
                  Criar
                </button>
              </div>
            ) : (
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{BILL_CATEGORY_LABELS[c]}</option>
                ))}
                {customCats.length > 0 && (
                  <optgroup label="Personalizadas">
                    {customCats.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              {type === "pagar" ? "Sai de onde?" : "Entra onde?"}
            </label>
            <div className="flex gap-2">
              {(Object.keys(MONEY_ACCOUNT_LABELS) as MoneyAccount[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => set("account", a)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    form.account === a
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {a === "dinheiro" ? "💵 " : "🏦 "}{MONEY_ACCOUNT_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          {!bill && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Repetir</label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
                value={form.recurrence}
                onChange={(e) => set("recurrence", e.target.value)}
              >
                {(Object.keys(RECURRENCE_LABELS) as Recurrence[]).map((r) => (
                  <option key={r} value={r}>{RECURRENCE_LABELS[r]}</option>
                ))}
              </select>
              {form.recurrence !== "none" && (
                <p className="mt-1 text-[11px] text-gray-400">
                  Serão criadas parcelas {RECURRENCE_LABELS[form.recurrence].toLowerCase()}s a partir do vencimento.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Observações</label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            {bill ? "Salvar" : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Bills Table ─────────────────────────────────────────────────────────────
function BillsTable({
  bills,
  onEdit,
  onDelete,
  onPay,
}: {
  bills: Bill[]
  onEdit: (b: Bill) => void
  onDelete: (b: Bill) => void
  onPay: (id: string) => void
}) {
  const [filter, setFilter] = useState<"todos" | Bill["status"]>("todos")
  // Filtro por mês de vencimento: "todos" ou "YYYY-MM"
  const [monthFilter, setMonthFilter] = useState<string>("todos")

  const monthOptions = useMemo(() => {
    const set = new Set<string>()
    for (const b of bills) set.add(b.dueDate.slice(0, 7))
    return Array.from(set).sort().reverse()
  }, [bills])

  const filtered = bills.filter((b) =>
    (filter === "todos" || b.status === filter) &&
    (monthFilter === "todos" || b.dueDate.slice(0, 7) === monthFilter)
  )

  // Auto-soma do que está filtrado + total geral de todas as contas
  const notCancelled = (list: Bill[]) => list.filter((b) => b.status !== "cancelado")
  const sumAmount = (list: Bill[]) => notCancelled(list).reduce((a, b) => a + b.amount, 0)
  const sumPaid = (list: Bill[]) => notCancelled(list).reduce((a, b) => a + b.amountPaid, 0)
  const filteredTotal = sumAmount(filtered)
  const filteredPaid = sumPaid(filtered)
  const grandTotal = sumAmount(bills)

  const filters: Array<{ key: "todos" | Bill["status"]; label: string }> = [
    { key: "todos", label: "Todos" },
    { key: "pendente", label: "Pendente" },
    { key: "vencido", label: "Vencido" },
    { key: "pago", label: "Pago" },
    { key: "cancelado", label: "Cancelado" },
  ]

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f.key
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
        <select
          className="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-orange-400"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        >
          <option value="todos">Todos os meses</option>
          {monthOptions.map((m) => {
            const [y, mo] = m.split("-")
            return <option key={m} value={m}>{MONTHS[+mo - 1]}/{y}</option>
          })}
        </select>
      </div>

      {/* Auto-soma do filtro + total geral */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-xs">
        <span className="text-gray-500">
          {monthFilter === "todos" ? "Todas as contas" : `Mês ${(() => { const [y, mo] = monthFilter.split("-"); return `${MONTHS[+mo - 1]}/${y}` })()}`}
          {filter !== "todos" && ` · ${filters.find((f) => f.key === filter)?.label}`}
          : <span className="font-bold text-gray-900">{fmt(filteredTotal)}</span>
        </span>
        <span className="text-gray-500">Pago: <span className="font-bold text-emerald-600">{fmt(filteredPaid)}</span></span>
        <span className="text-gray-500">Falta: <span className="font-bold text-amber-600">{fmt(filteredTotal - filteredPaid)}</span></span>
        {(monthFilter !== "todos" || filter !== "todos") && (
          <span className="ml-auto text-gray-400">Geral: <span className="font-bold text-gray-700">{fmt(grandTotal)}</span></span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white py-12 text-center">
          <p className="text-sm text-gray-400">Nenhuma conta encontrada.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Vencimento</th>
                  <th className="px-4 py-3 font-medium text-right">Valor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const cfg = STATUS_CONFIG[b.status]
                  const Icon = cfg.icon
                  const remaining = b.amount - b.amountPaid
                  return (
                    <tr key={b.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 flex items-center gap-1.5">
                          {b.description}
                          {b.recurrence && b.recurrence !== "none" && (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600">
                              ↻ {RECURRENCE_LABELS[b.recurrence]}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">{b.account === "banco" ? "🏦" : "💵"} {billCategoryLabel(b.category)}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(b.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-medium text-gray-900">{fmt(b.amount)}</p>
                        {b.amountPaid > 0 && b.amountPaid < b.amount && (
                          <p className="text-xs text-amber-600">Falta {fmt(remaining)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.cls}`}>
                          <Icon size={10} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {b.status !== "pago" && b.status !== "cancelado" && (
                            <button
                              onClick={() => onPay(b.id)}
                              className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              ✓ Pagar
                            </button>
                          )}
                          <button
                            onClick={() => onEdit(b)}
                            className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => onDelete(b)}
                            className="rounded-lg p-1 text-red-400 hover:bg-red-50"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FinanceiroPage() {
  const now = new Date()
  const [tab, setTab] = useState<"dre" | "receber" | "pagar">("dre")
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [summary, setSummary] = useState({ totalReceber: 0, totalPagar: 0, receberPendente: 0, pagarPendente: 0, receberVencido: 0, pagarVencido: 0, saldoLiquido: 0 })
  const [showTxModal, setShowTxModal] = useState(false)
  const [billModal, setBillModal] = useState<{ type: BillType; bill: Bill | null } | null>(null)
  const [txForm, setTxForm] = useState({ kind: "receita" as TxKind, amount: "", description: "", category: "outros" as ExpenseCategory, date: now.toISOString().slice(0, 10), account: "dinheiro" as MoneyAccount })
  const [toDeleteBill, setToDeleteBill] = useState<Bill | null>(null)
  const [cashBase, setCashBase] = useState(0)
  const [bankBase, setBankBase] = useState(0)
  // qual saldo está sendo ajustado no modal
  const [cashModal, setCashModal] = useState<MoneyAccount | null>(null)
  const [cashInput, setCashInput] = useState("")

  // Quanto entrou/saiu de fato por conta: contas recebidas − pagas + receitas − despesas
  const deltaFor = (acc: MoneyAccount) => {
    const accOf = (a?: MoneyAccount) => a ?? "dinheiro"
    const received = bills.filter((b) => b.type === "receber" && accOf(b.account) === acc).reduce((a, b) => a + b.amountPaid, 0)
    const paidOut = bills.filter((b) => b.type === "pagar" && accOf(b.account) === acc).reduce((a, b) => a + b.amountPaid, 0)
    const txNet = transactions.filter((t) => accOf(t.account) === acc).reduce((a, t) => a + (t.kind === "receita" ? t.amount : -t.amount), 0)
    return received - paidOut + txNet
  }
  const cashDelta = useMemo(() => deltaFor("dinheiro"), [bills, transactions]) // eslint-disable-line react-hooks/exhaustive-deps
  const bankDelta = useMemo(() => deltaFor("banco"), [bills, transactions]) // eslint-disable-line react-hooks/exhaustive-deps

  const cashTotal = cashBase + cashDelta
  const bankTotal = bankBase + bankDelta

  function refreshBills() {
    setBills(loadBills())
    setSummary(getBillsSummary())
  }

  // Envia contas + lançamentos + categorias + caixa ao Supabase (persistência em todos os aparelhos)
  function persist() {
    void pushFinanceRemote(loadBills(), loadTransactions(), loadCustomCategories(), loadCashBase(), loadBankBase())
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      // Hidrata a partir do Supabase (se disponível) antes de exibir
      const [remoteFinance, remoteTx] = await Promise.all([
        fetchBillsRemote(),
        fetchTransactionsRemote(),
      ])
      if (!alive) return
      if (remoteFinance) {
        replaceBills(remoteFinance.bills)
        // mescla categorias personalizadas remotas com as locais
        const local = loadCustomCategories()
        const merged = [...remoteFinance.customCategories]
        for (const c of local) if (!merged.some((m) => m.key === c.key)) merged.push(c)
        saveCustomCategories(merged)
        saveCashBase(remoteFinance.cashBase)
        saveBankBase(remoteFinance.bankBase)
      }
      if (remoteTx) replaceTransactions(remoteTx)
      setTransactions(loadTransactions())
      setCashBase(loadCashBase())
      setBankBase(loadBankBase())
      refreshBills()
    })()
    return () => { alive = false }
  }, [])

  const dre = useMemo(() => calcDRE(month, year), [transactions, month, year])

  const receberBills = bills.filter((b) => b.type === "receber")
  const pagarBills = bills.filter((b) => b.type === "pagar")

  function handleAddTx() {
    const amount = parseFloat(txForm.amount)
    if (!amount || !txForm.description.trim()) return
    addTransaction({ ...txForm, amount })
    setTransactions(loadTransactions())
    persist()
    setShowTxModal(false)
    setTxForm({ kind: "receita", amount: "", description: "", category: "outros", date: now.toISOString().slice(0, 10), account: "dinheiro" })
  }

  function handleDeleteTx(id: string) {
    deleteTransaction(id)
    setTransactions(loadTransactions())
    persist()
  }

  function handleDeleteBill(bill: Bill, whole = false) {
    if (whole && bill.recurringId) deleteSeries(bill.recurringId)
    else deleteBill(bill.id)
    setToDeleteBill(null)
    refreshBills()
    persist()
  }

  function handlePayBill(id: string) {
    markPaid(id)
    refreshBills()
    persist()
  }

  // chamado pelo BillModal após adicionar/editar
  function handleBillSaved() {
    refreshBills()
    persist()
  }

  // Summary cards
  const resultMes = dre.resultadoLiquido

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-sm text-gray-500">DRE, contas a receber e a pagar</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-white/80" />
              <span className="text-xs font-medium text-white/80">Dinheiro</span>
            </div>
            <button
              onClick={() => { setCashInput(cashTotal.toFixed(2)); setCashModal("dinheiro") }}
              className="text-[10px] font-bold bg-white/20 hover:bg-white/30 rounded-full px-2 py-0.5 transition-colors"
            >
              Ajustar
            </button>
          </div>
          <p className="text-xl font-bold">{fmt(cashTotal)}</p>
          <p className="text-[10px] text-white/70 mt-0.5">em espécie</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-white/80" />
              <span className="text-xs font-medium text-white/80">Na Conta</span>
            </div>
            <button
              onClick={() => { setCashInput(bankTotal.toFixed(2)); setCashModal("banco") }}
              className="text-[10px] font-bold bg-white/20 hover:bg-white/30 rounded-full px-2 py-0.5 transition-colors"
            >
              Ajustar
            </button>
          </div>
          <p className="text-xl font-bold">{fmt(bankTotal)}</p>
          <p className="text-[10px] text-white/70 mt-0.5">banco / Pix · total geral {fmt(cashTotal + bankTotal)}</p>
        </div>
        <div className="rounded-xl bg-white border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownCircle size={16} className="text-emerald-500" />
            <span className="text-xs font-medium text-gray-500">A Receber</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{fmt(summary.receberPendente)}</p>
          {summary.receberVencido > 0 && (
            <p className="text-xs text-red-500 mt-1">{fmt(summary.receberVencido)} vencido</p>
          )}
        </div>
        <div className="rounded-xl bg-white border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpCircle size={16} className="text-red-500" />
            <span className="text-xs font-medium text-gray-500">A Pagar</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{fmt(summary.pagarPendente)}</p>
          {summary.pagarVencido > 0 && (
            <p className="text-xs text-red-500 mt-1">{fmt(summary.pagarVencido)} vencido</p>
          )}
        </div>
        <div className="rounded-xl bg-white border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className="text-blue-500" />
            <span className="text-xs font-medium text-gray-500">Saldo Líquido</span>
          </div>
          <p className={`text-xl font-bold ${summary.saldoLiquido >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {fmt(summary.saldoLiquido)}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileBarChart size={16} className="text-orange-500" />
            <span className="text-xs font-medium text-gray-500">Resultado Mês</span>
          </div>
          <p className={`text-xl font-bold ${resultMes >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {fmt(resultMes)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {([
          { key: "dre", label: "DRE / Lançamentos" },
          { key: "receber", label: "Contas a Receber" },
          { key: "pagar", label: "Contas a Pagar" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* DRE Tab */}
      {tab === "dre" && (
        <div className="space-y-6">
          {/* Month selector */}
          <div className="flex items-center gap-3">
            <select
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
              value={month}
              onChange={(e) => setMonth(+e.target.value)}
            >
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
              value={year}
              onChange={(e) => setYear(+e.target.value)}
            >
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={() => setShowTxModal(true)}
              className="ml-auto flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              <Plus size={15} /> Lançamento
            </button>
          </div>

          {/* DRE cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={15} className="text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Receitas</span>
              </div>
              <p className="text-2xl font-bold text-emerald-700">{fmt(dre.receitaTotal)}</p>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-100 p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={15} className="text-red-600" />
                <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Despesas</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{fmt(dre.despesasTotais)}</p>
            </div>
            <div className={`rounded-xl border p-4 ${resultMes >= 0 ? "bg-blue-50 border-blue-100" : "bg-orange-50 border-orange-100"}`}>
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={15} className={resultMes >= 0 ? "text-blue-600" : "text-orange-600"} />
                <span className={`text-xs font-semibold uppercase tracking-wide ${resultMes >= 0 ? "text-blue-700" : "text-orange-700"}`}>Resultado</span>
              </div>
              <p className={`text-2xl font-bold ${resultMes >= 0 ? "text-blue-700" : "text-orange-700"}`}>{fmt(resultMes)}</p>
            </div>
          </div>

          {/* Transactions table */}
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
            <div className="border-b border-gray-100 px-5 py-3">
              <p className="text-sm font-semibold text-gray-900">Lançamentos — {MONTHS[month]}/{year}</p>
            </div>
            {transactions.filter((t) => { const d = new Date(t.date); return d.getMonth() === month && d.getFullYear() === year }).length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">Nenhum lançamento neste período.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                      <th className="px-5 py-3 font-medium">Data</th>
                      <th className="px-5 py-3 font-medium">Descrição</th>
                      <th className="px-5 py-3 font-medium">Categoria</th>
                      <th className="px-5 py-3 font-medium text-right">Valor</th>
                      <th className="px-5 py-3 font-medium text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .filter((t) => { const d = new Date(t.date); return d.getMonth() === month && d.getFullYear() === year })
                      .map((t) => (
                      <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="px-5 py-3 text-gray-500">
                          {new Date(t.date).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-5 py-3 font-medium text-gray-900">{t.description}</td>
                        <td className="px-5 py-3 text-gray-400 text-xs">
                          {t.kind === "receita" ? "Receita" : EXPENSE_CATEGORY_LABELS[t.category as ExpenseCategory] ?? t.category}
                        </td>
                        <td className={`px-5 py-3 text-right font-semibold ${t.kind === "receita" ? "text-emerald-600" : "text-red-500"}`}>
                          {t.kind === "receita" ? "+" : "-"}{fmt(t.amount)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => handleDeleteTx(t.id)} className="text-gray-300 hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contas a Receber */}
      {tab === "receber" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendente: <span className="font-semibold text-gray-900">{fmt(summary.receberPendente)}</span></p>
            </div>
            <button
              onClick={() => setBillModal({ type: "receber", bill: null })}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
            >
              <Plus size={15} /> Nova conta
            </button>
          </div>
          <BillsTable
            bills={receberBills}
            onEdit={(b) => setBillModal({ type: "receber", bill: b })}
            onDelete={(b) => setToDeleteBill(b)}
            onPay={handlePayBill}
          />
        </div>
      )}

      {/* Contas a Pagar */}
      {tab === "pagar" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendente: <span className="font-semibold text-gray-900">{fmt(summary.pagarPendente)}</span></p>
            </div>
            <button
              onClick={() => setBillModal({ type: "pagar", bill: null })}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              <Plus size={15} /> Nova conta
            </button>
          </div>
          <BillsTable
            bills={pagarBills}
            onEdit={(b) => setBillModal({ type: "pagar", bill: b })}
            onDelete={(b) => setToDeleteBill(b)}
            onPay={handlePayBill}
          />
        </div>
      )}

      {/* Transaction Modal */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Novo lançamento</h2>
              <button onClick={() => setShowTxModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Tipo</label>
                <select
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
                  value={txForm.kind}
                  onChange={(e) => setTxForm((p) => ({ ...p, kind: e.target.value as TxKind }))}
                >
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Descrição *</label>
                <input
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
                  value={txForm.description}
                  onChange={(e) => setTxForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Valor (R$) *</label>
                  <input
                    type="number" min="0" step="0.01"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
                    value={txForm.amount}
                    onChange={(e) => setTxForm((p) => ({ ...p, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Data</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
                    value={txForm.date}
                    onChange={(e) => setTxForm((p) => ({ ...p, date: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {txForm.kind === "despesa" ? "Sai de onde?" : "Entra onde?"}
                </label>
                <div className="flex gap-2">
                  {(Object.keys(MONEY_ACCOUNT_LABELS) as MoneyAccount[]).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setTxForm((p) => ({ ...p, account: a }))}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                        txForm.account === a
                          ? "border-orange-400 bg-orange-50 text-orange-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {a === "dinheiro" ? "💵 " : "🏦 "}{MONEY_ACCOUNT_LABELS[a]}
                    </button>
                  ))}
                </div>
              </div>
              {txForm.kind === "despesa" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Categoria</label>
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
                    value={txForm.category}
                    onChange={(e) => setTxForm((p) => ({ ...p, category: e.target.value as ExpenseCategory }))}
                  >
                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setShowTxModal(false)}
                className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddTx}
                className="flex-1 rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Modal */}
      {billModal && (
        <BillModal
          type={billModal.type}
          bill={billModal.bill}
          onClose={() => setBillModal(null)}
          onSave={handleBillSaved}
          onCategoriesChanged={persist}
        />
      )}

      {/* Ajustar saldo em caixa */}
      {cashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">
              Ajustar saldo — {cashModal === "dinheiro" ? "Dinheiro (espécie)" : "Na conta (banco/Pix)"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Informe o valor real agora. As próximas contas pagas/recebidas e lançamentos atualizam esse saldo automaticamente.
            </p>
            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-gray-600">Valor (R$)</label>
              <input
                type="number" step="0.01" autoFocus
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
              />
            </div>
            <div className="mt-5 flex gap-3">
              <button
                className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setCashModal(null)}
              >
                Cancelar
              </button>
              <button
                className="flex-1 rounded-lg bg-emerald-500 py-2 text-sm font-medium text-white hover:bg-emerald-600"
                onClick={() => {
                  const desired = parseFloat(cashInput)
                  if (!isFinite(desired)) return
                  // Guarda a base de forma que base + movimentações = valor informado
                  if (cashModal === "dinheiro") {
                    const base = desired - cashDelta
                    saveCashBase(base)
                    setCashBase(base)
                  } else {
                    const base = desired - bankDelta
                    saveBankBase(base)
                    setBankBase(base)
                  }
                  setCashModal(null)
                  persist()
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {toDeleteBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">Excluir conta?</h3>
            <p className="mt-1 text-sm text-gray-500">Esta ação não pode ser desfeita.</p>
            {toDeleteBill.recurringId && (
              <div className="mt-4 space-y-2">
                <button
                  className="w-full rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600"
                  onClick={() => handleDeleteBill(toDeleteBill)}
                >
                  Excluir apenas esta parcela
                </button>
                <button
                  className="w-full rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                  onClick={() => handleDeleteBill(toDeleteBill, true)}
                >
                  Excluir toda a recorrência
                </button>
                <button
                  className="w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setToDeleteBill(null)}
                >
                  Cancelar
                </button>
              </div>
            )}
            {!toDeleteBill.recurringId && (
              <div className="mt-5 flex gap-3">
                <button
                  className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setToDeleteBill(null)}
                >
                  Cancelar
                </button>
                <button
                  className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600"
                  onClick={() => handleDeleteBill(toDeleteBill)}
                >
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
