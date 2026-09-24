"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import { AlertCircle, ArrowDownCircle, ArrowUpCircle, Ban, CheckCircle2, ChevronRight, Clock, CreditCard as IconeCartao, FileBarChart, Pencil, Plus, Trash2, TrendingDown, TrendingUp, Wallet, X } from "lucide-react"
import { formatCurrency } from "@/lib/store"
import {
  loadTransactions, addTransaction, deleteTransaction, calcDRE,
  loadSubcategories, addSubcategory, deleteSubcategory, replaceSubcategories,
  subcategoryLabel, type Subcategory,
  loadTxCategories, addTxCategory, deleteTxCategory, replaceTxCategories,
  expenseCategoryOptions, expenseCategoryLabel, type TxCategory,
  loadCards, addCard, deleteCard, replaceCards, cardLabel, faturasEmAberto,
  saveTransactions, type CreditCard,
  UNIDADES, unidadeLabel, precoUnitario, precoMedio,
  updateTransaction, precoUnitarioExibicao, escalarPreco, formatPrecoUnitario,
  replaceTransactions, fetchTransactionsRemote, pushFinanceRemote,
  todayLocalISO, parseLocalDay,
  type Transaction, type TxKind, type ExpenseCategory,
} from "@/lib/finance-storage"
import {
  loadBills, addBill, updateBill, deleteBill, deleteSeries, markPaid,
  getBillsSummary, replaceBills, fetchBillsRemote,
  loadCustomCategories, saveCustomCategories, addCustomCategory, billCategoryLabel,
  loadCashBase, saveCashBase, loadBankBase, saveBankBase,
  MONEY_ACCOUNT_LABELS, MONEY_ACCOUNT_ICON, SALDO_ACCOUNTS, type MoneyAccount,
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
  const today = todayLocalISO()
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
              {/* Contas a pagar/receber ainda não têm fatura de cartão: só as
                  contas que movem saldo direto. */}
              {SALDO_ACCOUNTS.map((a) => (
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
                  {MONEY_ACCOUNT_ICON[a]} {MONEY_ACCOUNT_LABELS[a]}
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
  const [catFilter, setCatFilter] = useState<string>("todos")

  const monthOptions = useMemo(() => {
    const set = new Set<string>()
    for (const b of bills) set.add(b.dueDate.slice(0, 7))
    return Array.from(set).sort().reverse()
  }, [bills])

  // Só as categorias que realmente aparecem nestas contas
  const catOptions = useMemo(() => {
    const set = new Set<string>()
    for (const b of bills) set.add(b.category)
    return Array.from(set).sort((a, b) => billCategoryLabel(a).localeCompare(billCategoryLabel(b)))
  }, [bills])

  const filtered = bills.filter((b) =>
    (filter === "todos" || b.status === filter) &&
    (monthFilter === "todos" || b.dueDate.slice(0, 7) === monthFilter) &&
    (catFilter === "todos" || b.category === catFilter)
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
        <select
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-orange-400"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="todos">Todas as categorias</option>
          {catOptions.map((c) => (
            <option key={c} value={c}>{billCategoryLabel(c)}</option>
          ))}
        </select>
        {(catFilter !== "todos" || monthFilter !== "todos" || filter !== "todos") && (
          <button
            onClick={() => { setCatFilter("todos"); setMonthFilter("todos"); setFilter("todos") }}
            className="text-xs font-semibold text-gray-400 hover:text-gray-700 underline"
          >
            limpar filtros
          </button>
        )}
      </div>

      {/* Auto-soma do filtro + total geral */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-xs">
        <span className="text-gray-500">
          {monthFilter === "todos" ? "Todas as contas" : `Mês ${(() => { const [y, mo] = monthFilter.split("-"); return `${MONTHS[+mo - 1]}/${y}` })()}`}
          {filter !== "todos" && ` · ${filters.find((f) => f.key === filter)?.label}`}
          {catFilter !== "todos" && ` · ${billCategoryLabel(catFilter)}`}
          : <span className="font-bold text-gray-900">{fmt(filteredTotal)}</span>
          <span className="ml-1 text-gray-400">({filtered.length})</span>
        </span>
        <span className="text-gray-500">Pago: <span className="font-bold text-emerald-600">{fmt(filteredPaid)}</span></span>
        <span className="text-gray-500">Falta: <span className="font-bold text-amber-600">{fmt(filteredTotal - filteredPaid)}</span></span>
        {(monthFilter !== "todos" || filter !== "todos" || catFilter !== "todos") && (
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
  /** Lançamento sendo corrigido. null = o modal está criando um novo. */
  const [editandoTx, setEditandoTx] = useState<Transaction | null>(null)
  const [billModal, setBillModal] = useState<{ type: BillType; bill: Bill | null } | null>(null)
  const [txForm, setTxForm] = useState({ kind: "receita" as TxKind, amount: "", description: "", // string, e não a lista fechada: a loja cria as suas categorias
    category: "outros" as string, subcategory: "", card: "", quantidade: "", unidade: "", date: todayLocalISO(), account: "dinheiro" as MoneyAccount })
  const [subcats, setSubcats] = useState<Subcategory[]>([])
  const [txCats, setTxCats] = useState<TxCategory[]>([])
  const [cards, setCards] = useState<CreditCard[]>([])
  const [novoCartao, setNovoCartao] = useState("")
  const [faturaModal, setFaturaModal] = useState(false)
  /** Campo de "nova categoria" aberto no modal. */
  const [novaCat, setNovaCat] = useState("")
  /** Categorias de fábrica + as criadas pela loja, na ordem de exibição. */
  const catOptions = useMemo(() => expenseCategoryOptions(txCats), [txCats])
  /** Categoria de fábrica não pode ser apagada — o histórico depende dela. */
  const catEhDaLoja = useMemo(
    () => txCats.some((c) => c.key === txForm.category),
    [txCats, txForm.category],
  )
  /** Campo de "nova subcategoria" aberto no modal. */
  const [novaSub, setNovaSub] = useState("")
  useEffect(() => {
    setSubcats(loadSubcategories()); setTxCats(loadTxCategories()); setCards(loadCards())
  }, [])
  /** Só as subcategorias da categoria escolhida — a lista inteira confundiria. */
  const subcatsDaCategoria = useMemo(
    () => subcats.filter((sc) => sc.category === txForm.category),
    [subcats, txForm.category],
  )
  const [toDeleteBill, setToDeleteBill] = useState<Bill | null>(null)
  const [txCatFilter, setTxCatFilter] = useState("todos")
  const [expenseSource, setExpenseSource] = useState<"todos" | "lancamentos" | "contas">("todos")
  /** Categoria com o detalhe por subcategoria aberto. */
  const [catAberta, setCatAberta] = useState<string | null>(null)

  // Gastos do mês agrupados por categoria (lançamentos de despesa + contas a pagar)
  const expensesByCategory = useMemo(() => {
    const inPeriod = (d: string) => {
      const x = parseLocalDay(d)
      return x.getMonth() === month && x.getFullYear() === year
    }
    const acc = new Map<string, { label: string; amount: number }>()
    const add = (key: string, label: string, amount: number) => {
      const cur = acc.get(key) ?? { label, amount: 0 }
      cur.amount += amount
      acc.set(key, cur)
    }

    // Detalhe por subcategoria dentro de cada categoria — é o que responde
    // "quanto foi de boi" em vez de só "quanto foi de insumos".
    const detalhe = new Map<string, Map<string, { label: string; amount: number; txs: Transaction[] }>>()
    const addDetalhe = (cat: string, subKey: string, label: string, amount: number, tx?: Transaction) => {
      const dentro = detalhe.get(cat) ?? new Map()
      const cur = dentro.get(subKey) ?? { label, amount: 0, txs: [] as Transaction[] }
      cur.amount += amount
      if (tx) cur.txs.push(tx)
      dentro.set(subKey, cur)
      detalhe.set(cat, dentro)
    }

    if (expenseSource !== "contas") {
      for (const t of transactions) {
        // transferencia fica de fora: pagar a fatura não é gasto novo.
        if (t.kind !== "despesa" || t.transferencia || !inPeriod(t.date)) continue
        add(t.category, expenseCategoryLabel(t.category, txCats), t.amount)
        addDetalhe(
          t.category,
          t.subcategory ?? "__sem__",
          t.subcategory ? subcategoryLabel(t.subcategory, subcats) : "Sem subcategoria",
          t.amount,
          t,
        )
      }
    }
    if (expenseSource !== "lancamentos") {
      for (const b of bills) {
        if (b.type !== "pagar" || b.status === "cancelado" || !inPeriod(b.dueDate)) continue
        add(b.category, billCategoryLabel(b.category), b.amount)
      }
    }

    const rows = [...acc.entries()]
      .map(([key, v]) => ({
        key,
        ...v,
        subs: [...(detalhe.get(key)?.entries() ?? [])]
          .map(([sk, sv]) => ({ key: sk, ...sv }))
          .sort((a, b) => b.amount - a.amount),
      }))
      .sort((a, b) => b.amount - a.amount)
    return { rows, total: rows.reduce((s, r) => s + r.amount, 0) }
  }, [transactions, bills, month, year, expenseSource, subcats, txCats])

  // Lançamentos do mês selecionado, já filtrados por categoria
  const monthTx = useMemo(() => transactions.filter((t) => {
    const d = parseLocalDay(t.date)
    if (d.getMonth() !== month || d.getFullYear() !== year) return false
    if (txCatFilter === "todos") return true
    if (txCatFilter === "receita") return t.kind === "receita"
    if (txCatFilter.startsWith("sub:")) {
      return t.kind === "despesa" && t.subcategory === txCatFilter.slice(4)
    }
    return t.kind === "despesa" && t.category === txCatFilter
  }), [transactions, month, year, txCatFilter])
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
    void pushFinanceRemote(loadBills(), loadTransactions(), loadCustomCategories(), loadCashBase(), loadBankBase(), loadSubcategories(), loadTxCategories(), loadCards())
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
        // O servidor manda a lista inteira de subcategorias, incluindo as que
        // a loja apagou — por isso substituímos em vez de mesclar.
        replaceSubcategories(remoteFinance.subcategories as Subcategory[])
        replaceTxCategories(remoteFinance.txCategories as TxCategory[])
        replaceCards(remoteFinance.cards as CreditCard[])
      }
      if (remoteTx) replaceTransactions(remoteTx)
      setTransactions(loadTransactions())
      setSubcats(loadSubcategories())
      setTxCats(loadTxCategories())
      setCards(loadCards())
      setCashBase(loadCashBase())
      setBankBase(loadBankBase())
      refreshBills()
    })()
    return () => { alive = false }
  }, [])

  const dre = useMemo(() => calcDRE(month, year), [transactions, month, year])

  const receberBills = bills.filter((b) => b.type === "receber")
  const pagarBills = bills.filter((b) => b.type === "pagar")

  function fecharTxModal() {
    setShowTxModal(false)
    setEditandoTx(null)
    setNovaSub("")
    setTxForm({ kind: "receita", amount: "", description: "", category: "outros", subcategory: "", card: "", quantidade: "", unidade: "", date: todayLocalISO(), account: "dinheiro" })
  }

  /** Abre o modal já preenchido com o lançamento, para corrigir. */
  function abrirEdicaoTx(t: Transaction) {
    setEditandoTx(t)
    setTxForm({
      kind: t.kind,
      // Sem trocar o ponto por vírgula: o campo é input[type=number], que
      // recusa "16,98" e aparece VAZIO. Com ponto, ele mostra o valor.
      amount: String(t.amount),
      description: t.description,
      category: t.category,
      subcategory: t.subcategory ?? "",
      card: t.card ?? "",
      quantidade: t.quantidade ? String(t.quantidade) : "",
      unidade: t.unidade ?? "",
      date: t.date,
      // O campo é opcional no lançamento antigo, mas o formulário sempre tem
      // uma conta escolhida.
      account: t.account ?? "dinheiro",
    })
    setShowTxModal(true)
  }

  function handleAddTx() {
    const amount = parseFloat(txForm.amount.replace(",", "."))
    if (!amount || !txForm.description.trim()) return
    // Receita não tem subcategoria: elas são todas de despesa.
    const sub = txForm.kind === "despesa" ? txForm.subcategory : ""
    const qtd = parseFloat(txForm.quantidade.replace(",", "."))
    const dados = {
      ...txForm,
      subcategory: sub || undefined,
      // Cartão só faz sentido quando a despesa foi no crédito.
      card: txForm.account === "credito" ? (txForm.card || undefined) : undefined,
      // Quantidade só vale acompanhada de unidade: "20" sozinho não diz nada.
      quantidade: qtd > 0 && txForm.unidade ? qtd : undefined,
      unidade: qtd > 0 && txForm.unidade ? txForm.unidade : undefined,
      amount,
    }
    // Corrigindo, o lançamento mantém o id — o histórico é o mesmo, com o
    // valor certo. Criando, entra um novo.
    if (editandoTx) updateTransaction(editandoTx.id, dados)
    else addTransaction(dados)
    setTransactions(loadTransactions())
    persist()
    fecharTxModal()
  }

  /** Cria a subcategoria digitada e já a deixa selecionada. */
  function criarSubcategoria() {
    const nome = novaSub.trim()
    if (!nome) return
    const nova = addSubcategory(nome, txForm.category)
    setSubcats(loadSubcategories())
    setTxForm((p) => ({ ...p, subcategory: nova.key }))
    setNovaSub("")
    persist()
  }

  /**
   * Preço médio por unidade de cada subcategoria no mês ANTERIOR.
   *
   * É a régua da comparação: saber que o boi está a R$ 45/kg só vira decisão
   * quando se sabe que mês passado estava a R$ 41.
   */
  const precoMesAnterior = useMemo(() => {
    const mesAnt = month === 0 ? 11 : month - 1
    const anoAnt = month === 0 ? year - 1 : year
    const porSub = new Map<string, Transaction[]>()
    for (const t of transactions) {
      if (t.kind !== "despesa" || t.transferencia || !t.subcategory) continue
      const d = parseLocalDay(t.date)
      if (d.getMonth() !== mesAnt || d.getFullYear() !== anoAnt) continue
      porSub.set(t.subcategory, [...(porSub.get(t.subcategory) ?? []), t])
    }
    const out: Record<string, { preco: number; unidade: string }> = {}
    for (const [k, lista] of porSub) {
      const m = precoMedio(lista)
      if (m) out[k] = { preco: m.preco, unidade: m.unidade }
    }
    return out
  }, [transactions, month, year])

  /** Preço por unidade do que está sendo digitado agora, para conferência. */
  const precoDigitado = useMemo(() => {
    const q = parseFloat(txForm.quantidade.replace(",", "."))
    const v = parseFloat(txForm.amount)
    if (!q || q <= 0 || !v || !txForm.unidade) return null
    // Mesma conta da lista, para o que se confere ao digitar bater com o que
    // aparece depois de salvar.
    return escalarPreco(v / q, txForm.unidade)
  }, [txForm.quantidade, txForm.amount, txForm.unidade])

  /** Quanto está em aberto em cada cartão. */
  const faturas = useMemo(() => faturasEmAberto(transactions), [transactions])
  const faturaTotal = useMemo(
    () => Object.values(faturas).reduce((a, v) => a + v, 0),
    [faturas],
  )

  function criarCartao() {
    const nome = novoCartao.trim()
    if (!nome) return
    const novo = addCard(nome)
    setCards(loadCards())
    setTxForm((p) => ({ ...p, card: novo.key }))
    setNovoCartao("")
    persist()
  }

  function removerCartao(key: string) {
    deleteCard(key)
    setCards(loadCards())
    if (txForm.card === key) setTxForm((p) => ({ ...p, card: "" }))
    persist()
  }

  /**
   * Paga a fatura: o dinheiro sai do caixa ou do banco AGORA, e as despesas
   * que ela cobria ficam marcadas como pagas.
   *
   * O lançamento criado é uma TRANSFERÊNCIA, não uma despesa nova — o gasto já
   * foi contado quando a compra foi lançada. Sem isso o mês fecharia com o
   * cartão em dobro.
   */
  function pagarFatura(cardKey: string, conta: MoneyAccount) {
    const lista = loadTransactions()
    const hoje = todayLocalISO()
    const alvo = lista.filter((t) =>
      t.kind === "despesa" && t.account === "credito" && !t.transferencia
      && !t.faturaPagaEm && (t.card ?? "__sem_cartao__") === cardKey)
    const total = alvo.reduce((a, t) => a + t.amount, 0)
    if (total <= 0) return

    const marcados = lista.map((t) =>
      alvo.some((x) => x.id === t.id) ? { ...t, faturaPagaEm: hoje } : t)
    saveTransactions(marcados)

    addTransaction({
      kind: "despesa",
      category: "outros",
      description: `Pagamento da fatura — ${cardLabel(cardKey, cards)}`,
      amount: total,
      date: hoje,
      account: conta,
      transferencia: true,
    })

    setTransactions(loadTransactions())
    persist()
  }

  /** Cria a categoria digitada e já a deixa selecionada. */
  function criarCategoria() {
    const nome = novaCat.trim()
    if (!nome) return
    const nova = addTxCategory(nome)
    setTxCats(loadTxCategories())
    setTxForm((p) => ({ ...p, category: nova.key, subcategory: "" }))
    setNovaCat("")
    persist()
  }

  function removerCategoria(key: string) {
    deleteTxCategory(key)
    setTxCats(loadTxCategories())
    setSubcats(loadSubcategories())
    // Lançamentos antigos guardam a chave e continuam válidos; a lista mostra
    // a chave crua em vez de sumir com o dado.
    if (txForm.category === key) setTxForm((p) => ({ ...p, category: "outros", subcategory: "" }))
    persist()
  }

  function removerSubcategoria(key: string) {
    deleteSubcategory(key)
    setSubcats(loadSubcategories())
    // Lançamentos antigos guardam a chave: eles continuam válidos e a lista
    // mostra a chave crua em vez de sumir com o dado.
    if (txForm.subcategory === key) setTxForm((p) => ({ ...p, subcategory: "" }))
    persist()
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

        {/* Fatura só aparece quando existe: cartão zerado é ruído no painel. */}
        {faturaTotal > 0 && (
          <div className="rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <IconeCartao size={16} className="text-white/80" />
              <span className="text-xs font-medium text-white/80">Fatura do cartão</span>
            </div>
            <p className="text-xl font-bold">{fmt(faturaTotal)}</p>
            <p className="text-[10px] text-white/70 mt-0.5">
              em aberto · ainda não saiu do caixa
            </p>
            <button
              onClick={() => setFaturaModal(true)}
              className="mt-2 w-full rounded-lg bg-white/20 px-2 py-1 text-[11px] font-bold transition-colors hover:bg-white/30"
            >
              Pagar fatura
            </button>
          </div>
        )}
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
              onClick={() => { setEditandoTx(null); setShowTxModal(true) }}
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

          {/* Gastos por categoria */}
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900">Gastos por categoria — {MONTHS[month]}/{year}</p>
              <div className="flex gap-1.5">
                {([
                  { key: "todos", label: "Tudo" },
                  { key: "lancamentos", label: "Lançamentos" },
                  { key: "contas", label: "Contas a pagar" },
                ] as const).map((o) => (
                  <button
                    key={o.key}
                    onClick={() => setExpenseSource(o.key)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      expenseSource === o.key ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            {expensesByCategory.total === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">Nenhum gasto registrado neste período.</p>
            ) : (
              <div className="space-y-2.5">
                {expensesByCategory.rows.map((r) => {
                  // Só vale abrir quando há mais de uma subcategoria, ou uma
                  // que não seja o "sem subcategoria" — senão é repetir a linha.
                  const vaiAbrir = r.subs.length > 1
                    || (r.subs.length === 1 && r.subs[0].key !== "__sem__")
                  const aberta = catAberta === r.key
                  return (
                    <div key={r.key}>
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            {vaiAbrir ? (
                              <button
                                onClick={() => setCatAberta(aberta ? null : r.key)}
                                className="flex min-w-0 items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
                              >
                                <ChevronRight
                                  size={13}
                                  className={`shrink-0 text-gray-400 transition-transform ${aberta ? "rotate-90" : ""}`}
                                />
                                <span className="truncate">{r.label}</span>
                                <span className="shrink-0 text-[11px] text-gray-400">
                                  ({r.subs.length})
                                </span>
                              </button>
                            ) : (
                              <span className="truncate text-sm text-gray-700">{r.label}</span>
                            )}
                            <span className="shrink-0 text-xs text-gray-400">
                              {((r.amount / expensesByCategory.total) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                            <div
                              className="h-1.5 rounded-full bg-orange-500"
                              style={{ width: `${(r.amount / expensesByCategory.total) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-28 shrink-0 text-right text-sm font-semibold text-gray-900">{fmt(r.amount)}</span>
                      </div>

                      {aberta && (
                        <div className="mt-2 space-y-1.5 border-l-2 border-orange-100 pl-4">
                          {r.subs.map((sub) => {
                            const medio = precoMedio(sub.txs)
                            const antes = precoMesAnterior[sub.key]
                            // Só compara o que é comparável: mesma unidade.
                            const variacao = medio && antes && antes.unidade === medio.unidade && antes.preco > 0
                              ? ((medio.preco - antes.preco) / antes.preco) * 100
                              : null
                            return (
                              <div key={sub.key}>
                                <div className="flex items-center gap-3">
                                  <span className={`min-w-0 flex-1 truncate text-[13px] ${
                                    sub.key === "__sem__" ? "text-gray-400 italic" : "text-gray-600"
                                  }`}>
                                    {sub.label}
                                  </span>
                                  <span className="shrink-0 text-[11px] text-gray-400">
                                    {((sub.amount / r.amount) * 100).toFixed(0)}%
                                  </span>
                                  <span className="w-28 shrink-0 text-right text-[13px] font-medium text-gray-700">
                                    {fmt(sub.amount)}
                                  </span>
                                </div>
                                {medio && (() => {
                                  const esc = escalarPreco(medio.preco, medio.unidade)
                                  return (
                                  <p className="mt-0.5 text-[11px] text-gray-400">
                                    {medio.quantidade.toLocaleString("pt-BR")} {medio.unidade} ·{" "}
                                    <strong className="font-semibold text-gray-600">
                                      {esc.exato ? "" : "≈ "}{formatPrecoUnitario(esc.preco, esc.casas)}/{esc.unidade}
                                    </strong>
                                    {variacao !== null && Math.abs(variacao) >= 1 && (
                                      <span className={`ml-1.5 font-semibold ${
                                        variacao > 0 ? "text-red-500" : "text-emerald-600"
                                      }`}>
                                        {variacao > 0 ? "▲" : "▼"} {Math.abs(variacao).toFixed(0)}% vs mês anterior
                                      </span>
                                    )}
                                  </p>
                                  )
                                })()}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
                <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                  <span className="text-sm font-bold text-gray-700">Total de gastos</span>
                  <span className="text-base font-black text-gray-900">{fmt(expensesByCategory.total)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Transactions table */}
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
            <div className="border-b border-gray-100 px-5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">Lançamentos — {MONTHS[month]}/{year}</p>
                <select
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-orange-400"
                  value={txCatFilter}
                  onChange={(e) => setTxCatFilter(e.target.value)}
                >
                  <option value="todos">Todas as categorias</option>
                  <option value="receita">Receitas</option>
                  {catOptions.map(({ key: k, label: v }) => {
                    const filhas = subcats.filter((sc) => sc.category === k)
                    return (
                      <Fragment key={k}>
                        <option value={k}>{v}</option>
                        {/* Subcategorias recuadas sob a mãe: dá para filtrar
                            "Pessoal" inteiro ou só "Motoboy". */}
                        {filhas.map((sc) => (
                          <option key={sc.key} value={`sub:${sc.key}`}>&nbsp;&nbsp;&nbsp;{sc.label}</option>
                        ))}
                      </Fragment>
                    )
                  })}
                </select>
              </div>
            </div>
            {monthTx.length === 0 ? (
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
                    {monthTx.map((t) => (
                      <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="px-5 py-3 text-gray-500">
                          {parseLocalDay(t.date).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-5 py-3 font-medium text-gray-900">
                          {t.description}
                          {t.account === "credito" && !t.transferencia && (
                            <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              t.faturaPagaEm
                                ? "bg-gray-100 text-gray-500"
                                : "bg-violet-100 text-violet-700"
                            }`}>
                              💳 {t.card ? cardLabel(t.card, cards) : "crédito"}
                              {t.faturaPagaEm ? " · paga" : ""}
                            </span>
                          )}
                          {t.transferencia && (
                            <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                              transferência
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs">
                          {t.kind === "receita" ? (
                            <span className="text-gray-400">Receita</span>
                          ) : t.subcategory ? (
                            <>
                              {/* A subcategoria é a informação que importa na
                                  leitura rápida; a categoria fica de contexto. */}
                              <span className="font-medium text-gray-700">
                                {subcategoryLabel(t.subcategory, subcats)}
                              </span>
                              <span className="block text-[11px] text-gray-400">
                                {expenseCategoryLabel(t.category, txCats)}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">
                              {expenseCategoryLabel(t.category, txCats)}
                            </span>
                          )}
                        </td>
                        <td className={`px-5 py-3 text-right font-semibold ${t.kind === "receita" ? "text-emerald-600" : "text-red-500"}`}>
                          {t.kind === "receita" ? "+" : "-"}{fmt(t.amount)}
                          {(() => {
                            // Preço na unidade em que ele se lê: 500 g de
                            // manteiga viram R$/kg, não R$ 0,03 por grama.
                            const pu = precoUnitarioExibicao(t)
                            if (!pu) return null
                            return (
                              <span className="block text-[11px] font-normal text-gray-400">
                                {t.quantidade} {t.unidade} · {pu.exato ? "" : "≈ "}
                                {formatPrecoUnitario(pu.preco, pu.casas)}/{pu.unidade}
                              </span>
                            )
                          })()}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => abrirEdicaoTx(t)}
                              title="Corrigir este lançamento"
                              aria-label={`Corrigir ${t.description}`}
                              className="rounded p-1 text-gray-300 hover:bg-gray-100 hover:text-orange-500"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteTx(t.id)}
                              title="Excluir este lançamento"
                              aria-label={`Excluir ${t.description}`}
                              className="rounded p-1 text-gray-300 hover:bg-gray-100 hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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
      {faturaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-100 px-6 py-4">
              <p className="font-semibold text-gray-900">Pagar fatura do cartão</p>
              <p className="mt-0.5 text-xs text-gray-500">
                O dinheiro sai do caixa ou do banco agora. O gasto já foi contado quando você
                lançou as compras — pagar a fatura não conta de novo.
              </p>
            </div>

            <div className="max-h-80 space-y-3 overflow-y-auto px-6 py-4">
              {Object.entries(faturas).length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400">Nenhuma fatura em aberto.</p>
              )}
              {Object.entries(faturas).map(([key, valor]) => (
                <div key={key} className="rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-800">
                      💳 {key === "__sem_cartao__" ? "Sem cartão específico" : cardLabel(key, cards)}
                    </span>
                    <span className="font-bold text-gray-900">{fmt(valor)}</span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {SALDO_ACCOUNTS.map((a) => (
                      <button
                        key={a}
                        onClick={() => { pagarFatura(key, a); setFaturaModal(false) }}
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-violet-300 hover:bg-violet-50"
                      >
                        Pagar com {MONEY_ACCOUNT_ICON[a]} {a === "dinheiro" ? "dinheiro" : "conta"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setFaturaModal(false)}
                className="w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                {editandoTx ? "Corrigir lançamento" : "Novo lançamento"}
              </h2>
              <button onClick={fecharTxModal} className="text-gray-400 hover:text-gray-600">
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
                  {(Object.keys(MONEY_ACCOUNT_LABELS) as MoneyAccount[])
                    // Receita não entra no cartão de crédito.
                    .filter((a) => a !== "credito" || txForm.kind === "despesa")
                    .map((a) => (
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
                      {MONEY_ACCOUNT_ICON[a]} {MONEY_ACCOUNT_LABELS[a]}
                    </button>
                  ))}
                </div>

                {txForm.account === "credito" && (
                  <div className="mt-3 rounded-lg border border-violet-100 bg-violet-50 p-3">
                    <label className="mb-1 block text-xs font-medium text-violet-800">
                      Qual cartão <span className="font-normal text-violet-500">(opcional)</span>
                    </label>
                    <select
                      className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-400"
                      value={txForm.card}
                      onChange={(e) => setTxForm((p) => ({ ...p, card: e.target.value }))}
                    >
                      <option value="">— sem cartão específico —</option>
                      {cards.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>

                    <div className="mt-2 flex gap-2">
                      <input
                        value={novoCartao}
                        onChange={(e) => setNovoCartao(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); criarCartao() } }}
                        placeholder="Criar novo, ex: Nubank PJ"
                        className="flex-1 rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-400"
                      />
                      <button
                        type="button"
                        onClick={criarCartao}
                        disabled={!novoCartao.trim()}
                        className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-40"
                      >
                        Criar
                      </button>
                    </div>

                    {txForm.card && (
                      <button
                        type="button"
                        onClick={() => removerCartao(txForm.card)}
                        className="mt-2 text-xs font-medium text-red-500 hover:text-red-600"
                      >
                        Apagar &quot;{cardLabel(txForm.card, cards)}&quot; da lista
                      </button>
                    )}

                    <p className="mt-2 text-[11px] leading-relaxed text-violet-700">
                      No crédito o gasto conta no mês, mas o dinheiro só sai quando você pagar
                      a fatura. O saldo em caixa não muda agora.
                    </p>
                  </div>
                )}
              </div>
              {txForm.kind === "despesa" && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Categoria</label>
                    <select
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
                      value={txForm.category}
                      onChange={(e) => setTxForm((p) => ({
                        ...p,
                        category: e.target.value,
                        // Trocar de categoria invalida a subcategoria: elas
                        // pertencem a uma categoria só.
                        subcategory: "",
                      }))}
                    >
                      {catOptions.map((c) => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>

                    {/* Mesma mecânica da subcategoria: criar sem sair daqui. */}
                    <div className="mt-2 flex gap-2">
                      <input
                        value={novaCat}
                        onChange={(e) => setNovaCat(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); criarCategoria() } }}
                        placeholder="Criar nova, ex: Frota"
                        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
                      />
                      <button
                        type="button"
                        onClick={criarCategoria}
                        disabled={!novaCat.trim()}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                      >
                        Criar
                      </button>
                    </div>

                    {/* Só as criadas pela loja podem sair: as de fábrica são
                        referência do histórico e de outras telas. */}
                    {catEhDaLoja && (
                      <button
                        type="button"
                        onClick={() => removerCategoria(txForm.category)}
                        className="mt-2 text-xs font-medium text-red-500 hover:text-red-600"
                      >
                        Apagar &quot;{expenseCategoryLabel(txForm.category, txCats)}&quot; e suas subcategorias
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Subcategoria <span className="font-normal text-gray-400">(opcional)</span>
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
                      value={txForm.subcategory}
                      onChange={(e) => setTxForm((p) => ({ ...p, subcategory: e.target.value }))}
                    >
                      <option value="">— sem subcategoria —</option>
                      {subcatsDaCategoria.map((sc) => (
                        <option key={sc.key} value={sc.key}>{sc.label}</option>
                      ))}
                    </select>

                    {/* Criar sem sair do lançamento: na correria do dia a dia,
                        mandar a pessoa a outra tela significa não usar. */}
                    <div className="mt-2 flex gap-2">
                      <input
                        value={novaSub}
                        onChange={(e) => setNovaSub(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); criarSubcategoria() } }}
                        placeholder="Criar nova, ex: Carne — costela"
                        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
                      />
                      <button
                        type="button"
                        onClick={criarSubcategoria}
                        disabled={!novaSub.trim()}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                      >
                        Criar
                      </button>
                    </div>

                    {txForm.subcategory && (
                      <button
                        type="button"
                        onClick={() => removerSubcategoria(txForm.subcategory)}
                        className="mt-2 text-xs font-medium text-red-500 hover:text-red-600"
                      >
                        Apagar &quot;{subcategoryLabel(txForm.subcategory, subcats)}&quot; da lista
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Quanto foi comprado <span className="font-normal text-gray-400">(opcional)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        inputMode="decimal"
                        value={txForm.quantidade}
                        onChange={(e) => setTxForm((p) => ({ ...p, quantidade: e.target.value }))}
                        placeholder="20"
                        className="w-24 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
                      />
                      <select
                        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400"
                        value={txForm.unidade}
                        onChange={(e) => setTxForm((p) => ({ ...p, unidade: e.target.value }))}
                      >
                        <option value="">— sem unidade —</option>
                        {UNIDADES.map((u) => (
                          <option key={u.key} value={u.key}>{u.label} ({u.key})</option>
                        ))}
                      </select>
                    </div>

                    {/* O preço por unidade aparece enquanto se digita: é o
                        número que diz se a compra foi cara, e ver na hora evita
                        fechar o lançamento com o valor errado. */}
                    {precoDigitado !== null ? (
                      <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-800">
                        Sai a{" "}
                        <strong>
                          {precoDigitado.exato ? "" : "≈ "}
                          {formatPrecoUnitario(precoDigitado.preco, precoDigitado.casas)}
                        </strong>{" "}
                        por {precoDigitado.unidade}
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-gray-400">
                        Preenchendo, o sistema calcula o preço por {txForm.unidade || "unidade"} e
                        avisa quando o insumo encarecer.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={fecharTxModal}
                className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddTx}
                className="flex-1 rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                {editandoTx ? "Salvar correção" : "Adicionar"}
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
