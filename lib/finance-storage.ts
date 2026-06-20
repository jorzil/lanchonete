// ==================== FINANCEIRO STORAGE ====================
// Lançamentos manuais de receitas/despesas + agregação automática de
// faturamento (pedidos) e compras de insumos para a DRE.

import { loadOrders } from "@/lib/orders-storage"
import { loadPurchases } from "@/lib/purchases-storage"

export type TxKind = "receita" | "despesa"

// Categorias de despesa (padrão delivery)
export type ExpenseCategory =
  | "insumos" | "pessoal" | "aluguel" | "utilidades"
  | "marketing" | "taxas" | "manutencao" | "outros"

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  insumos: "Insumos / Mercadoria",
  pessoal: "Pessoal / Salários",
  aluguel: "Aluguel",
  utilidades: "Água / Luz / Internet",
  marketing: "Marketing",
  taxas: "Taxas / Impostos",
  manutencao: "Manutenção",
  outros: "Outros",
}

export interface Transaction {
  id: string
  kind: TxKind
  category: ExpenseCategory | "vendas" | "outros"
  description: string
  amount: number
  /** Data de competência (YYYY-MM-DD). */
  date: string
  createdAt: string
}

const TX_KEY = "mais_sub_transactions"

export function loadTransactions(): Transaction[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(TX_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Transaction[]) : []
  } catch {
    return []
  }
}

export function saveTransactions(list: Transaction[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(TX_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

export function addTransaction(data: Omit<Transaction, "id" | "createdAt">): Transaction {
  const tx: Transaction = {
    ...data,
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  }
  const list = loadTransactions()
  list.unshift(tx)
  saveTransactions(list)
  return tx
}

export function deleteTransaction(id: string): void {
  saveTransactions(loadTransactions().filter((t) => t.id !== id))
}

// ---------- DRE ----------
function inMonth(iso: string, month: number, year: number): boolean {
  const d = new Date(iso)
  return d.getMonth() === month && d.getFullYear() === year
}

export interface DRE {
  faturamento: number // receita bruta (pedidos não cancelados)
  receitasExtras: number // receitas manuais
  receitaTotal: number
  cmv: number // custo de mercadoria (compras de insumos no período)
  despesasPorCategoria: Record<string, number>
  despesasTotais: number // despesas manuais (todas as categorias)
  lucroBruto: number // receita - cmv
  resultadoLiquido: number // receita - cmv - despesas (exceto insumos já no cmv)
  margemLiquida: number // %
}

/**
 * Calcula a DRE de um mês/ano.
 * - Faturamento: soma dos pedidos (status != cancelado) no período.
 * - CMV: compras de insumos registradas no módulo Compras no período.
 * - Despesas: lançamentos manuais de despesa.
 * - Receitas extras: lançamentos manuais de receita.
 */
export function calcDRE(month: number, year: number): DRE {
  const orders = loadOrders().filter((o) => o.status !== "cancelado" && inMonth(o.createdAt, month, year))
  const faturamento = orders.reduce((acc, o) => acc + o.total, 0)

  const purchases = loadPurchases().filter((p) => inMonth(p.createdAt, month, year))
  const cmv = purchases.reduce((acc, p) => acc + p.total, 0)

  const txs = loadTransactions().filter((t) => {
    const d = new Date(t.date)
    return d.getMonth() === month && d.getFullYear() === year
  })

  const receitasExtras = txs.filter((t) => t.kind === "receita").reduce((acc, t) => acc + t.amount, 0)

  const despesasPorCategoria: Record<string, number> = {}
  let despesasTotais = 0
  for (const t of txs) {
    if (t.kind !== "despesa") continue
    despesasPorCategoria[t.category] = (despesasPorCategoria[t.category] ?? 0) + t.amount
    despesasTotais += t.amount
  }

  const receitaTotal = faturamento + receitasExtras
  const lucroBruto = receitaTotal - cmv
  const resultadoLiquido = lucroBruto - despesasTotais
  const margemLiquida = receitaTotal > 0 ? (resultadoLiquido / receitaTotal) * 100 : 0

  return {
    faturamento, receitasExtras, receitaTotal, cmv,
    despesasPorCategoria, despesasTotais,
    lucroBruto, resultadoLiquido, margemLiquida,
  }
}
