// ==================== CAIXA (CASH REGISTER) STORAGE ====================
// Controle de caixa do PDV: abertura, fechamento, sangria e suprimento.

export type CashMovementType = "abertura" | "venda" | "sangria" | "suprimento"

export interface CashMovement {
  id: string
  type: CashMovementType
  amount: number
  paymentMethod?: string
  note?: string
  createdAt: string
}

export interface CashSession {
  id: string
  openedAt: string
  closedAt?: string
  openingAmount: number
  /** Valor contado no fechamento (informado pelo operador). */
  closingCountedAmount?: number
  operator: string
  movements: CashMovement[]
  status: "aberto" | "fechado"
}

const SESSION_KEY = "mais_sub_cash_session"
const HISTORY_KEY = "mais_sub_cash_history"

function uid(p: string): string {
  return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

/** Sessão de caixa atualmente aberta, ou null. */
export function getOpenSession(): CashSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as CashSession
    return session.status === "aberto" ? session : null
  } catch {
    return null
  }
}

function persistSession(session: CashSession | null): void {
  if (typeof window === "undefined") return
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

export function loadHistory(): CashSession[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CashSession[]) : []
  } catch {
    return []
  }
}

/** Abre o caixa com um valor inicial (fundo de troco). */
export function openCash(openingAmount: number, operator: string): CashSession {
  const now = new Date().toISOString()
  const session: CashSession = {
    id: uid("cash"),
    openedAt: now,
    openingAmount,
    operator,
    status: "aberto",
    movements: [
      { id: uid("mov"), type: "abertura", amount: openingAmount, note: "Fundo de troco", createdAt: now },
    ],
  }
  persistSession(session)
  return session
}

/** Registra uma movimentação na sessão aberta. */
export function addCashMovement(
  type: CashMovementType,
  amount: number,
  opts: { paymentMethod?: string; note?: string } = {},
): CashSession | null {
  const session = getOpenSession()
  if (!session) return null
  session.movements.unshift({
    id: uid("mov"),
    type,
    amount,
    paymentMethod: opts.paymentMethod,
    note: opts.note,
    createdAt: new Date().toISOString(),
  })
  persistSession(session)
  return session
}

/** Registra uma venda no caixa (apenas dinheiro afeta o saldo físico). */
export function registerCashSale(amount: number, paymentMethod: string): void {
  addCashMovement("venda", amount, { paymentMethod })
}

export interface CashSummary {
  openingAmount: number
  cashSales: number // vendas em dinheiro
  otherSales: number // vendas em outros métodos
  suprimentos: number
  sangrias: number
  expectedCash: number // saldo esperado em dinheiro na gaveta
  totalSales: number
}

export function getSummary(session: CashSession): CashSummary {
  let cashSales = 0
  let otherSales = 0
  let suprimentos = 0
  let sangrias = 0
  for (const m of session.movements) {
    if (m.type === "venda") {
      if (m.paymentMethod === "dinheiro") cashSales += m.amount
      else otherSales += m.amount
    } else if (m.type === "suprimento") {
      suprimentos += m.amount
    } else if (m.type === "sangria") {
      sangrias += m.amount
    }
  }
  return {
    openingAmount: session.openingAmount,
    cashSales,
    otherSales,
    suprimentos,
    sangrias,
    expectedCash: session.openingAmount + cashSales + suprimentos - sangrias,
    totalSales: cashSales + otherSales,
  }
}

/** Fecha o caixa, move para o histórico e limpa a sessão ativa. */
export function closeCash(countedAmount: number): CashSession | null {
  const session = getOpenSession()
  if (!session) return null
  session.status = "fechado"
  session.closedAt = new Date().toISOString()
  session.closingCountedAmount = countedAmount

  const history = loadHistory()
  history.unshift(session)
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    /* ignore */
  }
  persistSession(null)
  return session
}
