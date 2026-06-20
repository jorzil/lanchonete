// ==================== INVENTORY / ESTOQUE STORAGE ====================
// Persistência de ingredientes, fornecedores e movimentações no localStorage.
// Base para os módulos de Estoque, Compras e Fichas Técnicas.

export type StockUnit = "un" | "kg" | "g" | "L" | "ml" | "fatia" | "pct"

export interface Supplier {
  id: string
  name: string
  phone?: string
  cnpj?: string
  notes?: string
  createdAt: string
}

export interface Ingredient {
  id: string
  name: string
  unit: StockUnit
  /** Custo médio ponderado (R$ por unidade). */
  avgCost: number
  /** Quantidade atual em estoque. */
  stock: number
  /** Estoque mínimo (alerta). */
  minStock: number
  /** Estoque ideal (meta de compra). */
  idealStock: number
  supplierId?: string
  createdAt: string
}

export type MovementType = "entrada" | "saida" | "ajuste"

export interface StockMovement {
  id: string
  ingredientId: string
  type: MovementType
  /** Quantidade movimentada (sempre positiva). */
  quantity: number
  /** Custo unitário no momento (para entradas). */
  unitCost?: number
  reason: string
  createdAt: string
}

const INGREDIENTS_KEY = "mais_sub_ingredients"
const SUPPLIERS_KEY = "mais_sub_suppliers"
const MOVEMENTS_KEY = "mais_sub_stock_movements"

// ---------- Helpers genéricos ----------
function load<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function save<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ---------- Fornecedores ----------
export function loadSuppliers(): Supplier[] {
  return load<Supplier>(SUPPLIERS_KEY)
}

export function saveSuppliers(list: Supplier[]): void {
  save(SUPPLIERS_KEY, list)
}

export function addSupplier(data: Omit<Supplier, "id" | "createdAt">): Supplier {
  const supplier: Supplier = { ...data, id: uid("sup"), createdAt: new Date().toISOString() }
  const list = loadSuppliers()
  list.push(supplier)
  saveSuppliers(list)
  return supplier
}

export function deleteSupplier(id: string): void {
  saveSuppliers(loadSuppliers().filter((s) => s.id !== id))
}

// ---------- Ingredientes ----------
export function loadIngredients(): Ingredient[] {
  return load<Ingredient>(INGREDIENTS_KEY)
}

export function saveIngredients(list: Ingredient[]): void {
  save(INGREDIENTS_KEY, list)
}

export function addIngredient(data: Omit<Ingredient, "id" | "createdAt">): Ingredient {
  const ingredient: Ingredient = { ...data, id: uid("ing"), createdAt: new Date().toISOString() }
  const list = loadIngredients()
  list.push(ingredient)
  saveIngredients(list)
  return ingredient
}

export function updateIngredient(id: string, patch: Partial<Ingredient>): void {
  const list = loadIngredients().map((i) => (i.id === id ? { ...i, ...patch } : i))
  saveIngredients(list)
}

export function deleteIngredient(id: string): void {
  saveIngredients(loadIngredients().filter((i) => i.id !== id))
}

// ---------- Movimentações ----------
export function loadMovements(): StockMovement[] {
  return load<StockMovement>(MOVEMENTS_KEY)
}

export function saveMovements(list: StockMovement[]): void {
  save(MOVEMENTS_KEY, list)
}

/**
 * Registra uma movimentação de estoque e atualiza o ingrediente.
 * Entradas recalculam o custo médio ponderado.
 */
export function registerMovement(
  data: Omit<StockMovement, "id" | "createdAt">,
): StockMovement {
  const movement: StockMovement = {
    ...data,
    id: uid("mov"),
    createdAt: new Date().toISOString(),
  }
  const movements = loadMovements()
  movements.unshift(movement)
  saveMovements(movements)

  const ingredients = loadIngredients()
  const ing = ingredients.find((i) => i.id === data.ingredientId)
  if (ing) {
    if (data.type === "entrada") {
      const totalCostBefore = ing.avgCost * ing.stock
      const incomingCost = (data.unitCost ?? ing.avgCost) * data.quantity
      const newStock = ing.stock + data.quantity
      ing.avgCost = newStock > 0 ? (totalCostBefore + incomingCost) / newStock : ing.avgCost
      ing.stock = newStock
    } else if (data.type === "saida") {
      ing.stock = Math.max(0, ing.stock - data.quantity)
    } else {
      // ajuste: define o estoque diretamente para a quantidade informada
      ing.stock = Math.max(0, data.quantity)
    }
    saveIngredients(ingredients)
  }

  return movement
}

// ---------- Estatísticas ----------
export interface InventoryStats {
  totalItems: number
  totalValue: number
  belowMin: number
  outOfStock: number
}

export function getInventoryStats(): InventoryStats {
  const list = loadIngredients()
  return {
    totalItems: list.length,
    totalValue: list.reduce((acc, i) => acc + i.avgCost * i.stock, 0),
    belowMin: list.filter((i) => i.stock <= i.minStock && i.stock > 0).length,
    outOfStock: list.filter((i) => i.stock <= 0).length,
  }
}
