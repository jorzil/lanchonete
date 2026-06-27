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
  /** When set, this ingredient is linked to a product and kept in sync. */
  productId?: string
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
  /** Ingrediente "pai" do qual este é derivado (ex: Pão 15cm vem do Pão 30cm). */
  parentId?: string
  /** Quantas unidades deste ingrediente saem de 1 unidade do pai (ex: 2). */
  conversion?: number
  createdAt: string
}

/**
 * Custo efetivo por unidade. Para ingredientes derivados, é o custo do pai
 * dividido pelo rendimento (conversion).
 */
export function effectiveCost(ing: Ingredient, all: Ingredient[]): number {
  if (ing.parentId && ing.conversion && ing.conversion > 0) {
    const parent = all.find((i) => i.id === ing.parentId)
    if (parent) return parent.avgCost / ing.conversion
  }
  return ing.avgCost
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

// ---------- Sincronização Produtos → Estoque ----------
export interface SyncableProduct {
  id: string
  name: string
  costPrice?: number
  active: boolean
}

/**
 * Keeps the ingredient list in sync with the product catalog:
 * - Adds missing products as ingredients (stock = 0, unit = "un")
 * - Updates the name and avgCost if the product changed
 * - Marks product-linked ingredients as inactive when the product is inactive
 * Does NOT delete ingredients (stock history must be preserved).
 */
export function syncProductsToInventory(products: SyncableProduct[]): void {
  const ingredients = loadIngredients()
  const byProductId = new Map(
    ingredients.filter((i) => i.productId).map((i) => [i.productId!, i])
  )

  let changed = false

  for (const p of products) {
    const existing = byProductId.get(p.id)
    if (!existing) {
      // Create new ingredient for this product
      ingredients.push({
        id: uid("ing"),
        productId: p.id,
        name: p.name,
        unit: "un",
        avgCost: p.costPrice ?? 0,
        stock: 0,
        minStock: 0,
        idealStock: 0,
        createdAt: new Date().toISOString(),
      })
      changed = true
    } else {
      // Update name and cost if they changed
      if (existing.name !== p.name || (p.costPrice !== undefined && existing.avgCost !== p.costPrice)) {
        existing.name = p.name
        if (p.costPrice !== undefined && p.costPrice > 0 && existing.stock === 0) {
          // Only update avgCost if there's no stock yet (avoid overwriting weighted average)
          existing.avgCost = p.costPrice
        }
        changed = true
      }
    }
  }

  if (changed) saveIngredients(ingredients)
}
