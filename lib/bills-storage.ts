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

export interface Bill {
  id: string
  type: BillType
  category: BillCategory
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

export function addBill(data: Omit<Bill, "id" | "createdAt" | "status">): Bill {
  const bill: Bill = {
    ...data,
    id: uid(),
    status: deriveStatus({ ...data, status: "pendente" }),
    createdAt: new Date().toISOString(),
  }
  const list = load()
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
