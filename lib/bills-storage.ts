// ==================== CONTAS A RECEBER / A PAGAR ====================

export type BillType   = "receber" | "pagar"
export type BillStatus = "pendente" | "pago" | "vencido" | "cancelado"

export type BillCategory =
  | "fornecedor" | "aluguel" | "pessoal" | "utilidades"
  | "taxas" | "marketing" | "manutencao" | "outros"
  | "venda" | "servico" | "adiantamento"

export const BILL_CATEGORY_LABELS: Record<BillCategory, string> = {
  fornecedor:   "Fornecedor",
  aluguel:      "Aluguel",
  pessoal:      "Pessoal / Salários",
  utilidades:   "Água / Luz / Internet",
  taxas:        "Taxas / Impostos",
  marketing:    "Marketing",
  manutencao:   "Manutenção",
  outros:       "Outros",
  venda:        "Venda / Pedido",
  servico:      "Serviço Prestado",
  adiantamento: "Adiantamento",
}

export const PAGAR_CATEGORIES: BillCategory[] = [
  "fornecedor","aluguel","pessoal","utilidades","taxas","marketing","manutencao","outros",
]
export const RECEBER_CATEGORIES: BillCategory[] = [
  "venda","servico","adiantamento","outros",
]

// ---------- Categorias personalizadas (ex.: outros tipos de fornecedor) ----------
export interface CustomCategory {
  /** chave única, ex.: custom_fornecedor_bebidas */
  key: string
  label: string
  /** a qual aba a categoria pertence */
  type: BillType
}

const CUSTOM_CAT_KEY = "mais_sub_custom_bill_categories"

export function loadCustomCategories(): CustomCategory[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CUSTOM_CAT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CustomCategory[]) : []
  } catch { return [] }
}

export function saveCustomCategories(list: CustomCategory[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(CUSTOM_CAT_KEY, JSON.stringify(list)) } catch { /* */ }
}

export function addCustomCategory(label: string, type: BillType): CustomCategory {
  const slug = label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
  const cat: CustomCategory = { key: `custom_${slug || Date.now()}`, label: label.trim(), type }
  const list = loadCustomCategories()
  if (!list.some((c) => c.key === cat.key)) {
    list.push(cat)
    saveCustomCategories(list)
  }
  return cat
}

export function deleteCustomCategory(key: string): void {
  saveCustomCategories(loadCustomCategories().filter((c) => c.key !== key))
}

/** Label de qualquer categoria (padrão ou personalizada). */
export function billCategoryLabel(cat: string): string {
  const std = (BILL_CATEGORY_LABELS as Record<string, string>)[cat]
  if (std) return std
  const custom = loadCustomCategories().find((c) => c.key === cat)
  return custom?.label ?? cat
}

export type Recurrence = "none" | "semanal" | "mensal" | "anual"

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  none:    "Não repetir",
  semanal: "Semanal",
  mensal:  "Mensal",
  anual:   "Anual",
}

// Quantas parcelas geramos ao criar uma conta recorrente
const RECURRENCE_COUNT: Record<Exclude<Recurrence, "none">, number> = {
  semanal: 12,
  mensal:  12,
  anual:   3,
}

export interface Bill {
  id: string
  type: BillType
  /** categoria padrão (BillCategory) ou chave de categoria personalizada */
  category: BillCategory | (string & {})
  description: string
  /** Valor total da conta (R$) */
  amount: number
  /** Valor já pago/recebido (R$) */
  amountPaid: number
  /** Data de vencimento (YYYY-MM-DD) */
  dueDate: string
  /** Data de pagamento/recebimento (YYYY-MM-DD | null) */
  paidDate: string | null
  status: BillStatus
  notes?: string
  createdAt: string
  /** Periodicidade da conta recorrente (padrão: none) */
  recurrence?: Recurrence
  /** Id que agrupa as parcelas de uma mesma conta recorrente */
  recurringId?: string
}

const KEY = "mais_sub_bills"

function load(): Bill[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Bill[]) : []
  } catch { return [] }
}

function save(list: Bill[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* */ }
}

function uid(): string {
  return `bill_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

/** Derive status based on dueDate and payment state */
export function deriveStatus(b: Pick<Bill, "dueDate" | "amountPaid" | "amount" | "status">): BillStatus {
  if (b.status === "cancelado") return "cancelado"
  if (b.amountPaid >= b.amount) return "pago"
  if (new Date(b.dueDate) < new Date(new Date().toDateString())) return "vencido"
  return "pendente"
}

export function loadBills(): Bill[] {
  const list = load()
  // Auto-update vencido status on load
  let dirty = false
  for (const b of list) {
    const s = deriveStatus(b)
    if (s !== b.status) { b.status = s; dirty = true }
  }
  if (dirty) save(list)
  return list
}

/** Avança uma data YYYY-MM-DD conforme a periodicidade, n vezes. */
function advanceDate(iso: string, rec: Exclude<Recurrence, "none">, n: number): string {
  const [y, m, d] = iso.split("-").map(Number)
  const base = new Date(y, m - 1, d)
  if (rec === "semanal") base.setDate(base.getDate() + 7 * n)
  else if (rec === "mensal") base.setMonth(base.getMonth() + n)
  else base.setFullYear(base.getFullYear() + n)
  const yy = base.getFullYear()
  const mm = String(base.getMonth() + 1).padStart(2, "0")
  const dd = String(base.getDate()).padStart(2, "0")
  return `${yy}-${mm}-${dd}`
}

export function addBill(data: Omit<Bill, "id" | "createdAt" | "status">): Bill {
  const createdAt = new Date().toISOString()
  const rec = data.recurrence ?? "none"
  const list = load()

  if (rec !== "none") {
    // Gera uma série de parcelas recorrentes a partir do vencimento informado
    const recurringId = uid()
    const count = RECURRENCE_COUNT[rec]
    const first: Bill = {
      ...data,
      recurrence: rec,
      recurringId,
      id: uid(),
      status: deriveStatus({ ...data, status: "pendente" }),
      createdAt,
    }
    const series: Bill[] = [first]
    for (let i = 1; i < count; i++) {
      const dueDate = advanceDate(data.dueDate, rec, i)
      series.push({
        ...data,
        recurrence: rec,
        recurringId,
        dueDate,
        // parcelas futuras começam sem pagamento
        amountPaid: 0,
        paidDate: null,
        id: uid(),
        status: deriveStatus({ ...data, dueDate, amountPaid: 0, status: "pendente" }),
        createdAt,
      })
    }
    // mais antigas por último para aparecerem no topo (unshift preserva ordem)
    for (let i = series.length - 1; i >= 0; i--) list.unshift(series[i])
    save(list)
    return first
  }

  const bill: Bill = {
    ...data,
    id: uid(),
    status: deriveStatus({ ...data, status: "pendente" }),
    createdAt,
  }
  list.unshift(bill)
  save(list)
  return bill
}

export function updateBill(id: string, patch: Partial<Omit<Bill, "id" | "createdAt">>): void {
  const list = load().map((b) => {
    if (b.id !== id) return b
    const updated = { ...b, ...patch }
    updated.status = deriveStatus(updated)
    return updated
  })
  save(list)
}

export function deleteBill(id: string): void {
  save(load().filter((b) => b.id !== id))
}

/** Remove todas as parcelas de uma conta recorrente. */
export function deleteSeries(recurringId: string): void {
  save(load().filter((b) => b.recurringId !== recurringId))
}

/** Substitui a lista local (usado na hidratação a partir do Supabase). */
export function replaceBills(list: Bill[]): void {
  save(Array.isArray(list) ? list : [])
}

// ---------- Sincronização com Supabase ----------
export async function fetchBillsRemote(): Promise<{ bills: Bill[]; customCategories: CustomCategory[] } | null> {
  try {
    const res = await fetch("/api/finance", { cache: "no-store" })
    if (!res.ok) return null
    const data = await res.json()
    return {
      bills: Array.isArray(data.bills) ? (data.bills as Bill[]) : [],
      customCategories: Array.isArray(data.customCategories) ? (data.customCategories as CustomCategory[]) : [],
    }
  } catch {
    return null
  }
}

/** Mark a bill as fully paid right now */
export function markPaid(id: string, paidDate?: string): void {
  updateBill(id, {
    amountPaid: loadBills().find((b) => b.id === id)?.amount ?? 0,
    paidDate: paidDate ?? new Date().toISOString().slice(0, 10),
    status: "pago",
  })
}

export interface BillsSummary {
  totalReceber: number
  totalPagar: number
  receberPendente: number
  pagarPendente: number
  receberVencido: number
  pagarVencido: number
  saldoLiquido: number
}

export function getBillsSummary(): BillsSummary {
  const bills = loadBills()
  const receber = bills.filter((b) => b.type === "receber")
  const pagar   = bills.filter((b) => b.type === "pagar")

  const pending = (list: Bill[]) =>
    list.filter((b) => b.status === "pendente" || b.status === "vencido")
      .reduce((a, b) => a + (b.amount - b.amountPaid), 0)

  const overdue = (list: Bill[]) =>
    list.filter((b) => b.status === "vencido")
      .reduce((a, b) => a + (b.amount - b.amountPaid), 0)

  const total = (list: Bill[]) => list.reduce((a, b) => a + b.amount, 0)

  return {
    totalReceber:    total(receber),
    totalPagar:      total(pagar),
    receberPendente: pending(receber),
    pagarPendente:   pending(pagar),
    receberVencido:  overdue(receber),
    pagarVencido:    overdue(pagar),
    saldoLiquido:    pending(receber) - pending(pagar),
  }
}
