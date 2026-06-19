// ==================== COMPRAS (PURCHASES) STORAGE ====================
// Recebimento de mercadorias: dá entrada no estoque (com recálculo de
// custo médio) e mantém histórico de notas/compras por fornecedor.

import { registerMovement } from "@/lib/inventory-storage"

export interface PurchaseItem {
  ingredientId: string
  ingredientName: string
  quantity: number
  unitCost: number
}

export interface Purchase {
  id: string
  supplierId?: string
  supplierName: string
  invoice?: string // número da nota fiscal
  items: PurchaseItem[]
  total: number
  createdAt: string
}

const PURCHASES_KEY = "mais_sub_purchases"

export function loadPurchases(): Purchase[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(PURCHASES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Purchase[]) : []
  } catch {
    return []
  }
}

export function savePurchases(list: Purchase[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

/**
 * Registra uma compra (recebimento) e dá entrada de cada item no estoque,
 * recalculando o custo médio ponderado dos ingredientes.
 */
export function registerPurchase(
  data: Omit<Purchase, "id" | "createdAt" | "total">,
): Purchase {
  const total = data.items.reduce((acc, i) => acc + i.unitCost * i.quantity, 0)
  const purchase: Purchase = {
    ...data,
    total,
    id: `pur_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  }

  const list = loadPurchases()
  list.unshift(purchase)
  savePurchases(list)

  // Entrada no estoque com recálculo de custo médio
  for (const item of data.items) {
    if (item.quantity <= 0) continue
    registerMovement({
      ingredientId: item.ingredientId,
      type: "entrada",
      quantity: item.quantity,
      unitCost: item.unitCost,
      reason: `Compra${data.invoice ? ` NF ${data.invoice}` : ""} — ${data.supplierName}`,
    })
  }

  return purchase
}

export interface PurchaseStats {
  count: number
  totalSpent: number
  thisMonthSpent: number
}

export function getPurchaseStats(): PurchaseStats {
  const list = loadPurchases()
  const now = new Date()
  const thisMonth = list.filter((p) => {
    const d = new Date(p.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  return {
    count: list.length,
    totalSpent: list.reduce((acc, p) => acc + p.total, 0),
    thisMonthSpent: thisMonth.reduce((acc, p) => acc + p.total, 0),
  }
}
