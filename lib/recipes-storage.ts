// ==================== FICHAS TÉCNICAS (RECIPES) STORAGE ====================
// Liga produtos a ingredientes (quantidades por produto), permitindo
// cálculo de CMV/margem e baixa automática de estoque na venda.

import {
  loadIngredients,
  registerMovement,
  effectiveCost,
  type Ingredient,
} from "@/lib/inventory-storage"

export interface RecipeItem {
  ingredientId: string
  /** Quantidade consumida por unidade vendida, na unidade do ingrediente. */
  quantity: number
}

export interface Recipe {
  productId: string
  productName: string
  /** Preço de venda registrado na ficha (para cálculo de margem). */
  salePrice: number
  items: RecipeItem[]
  updatedAt: string
}

const RECIPES_KEY = "mais_sub_recipes"

export function loadRecipes(): Recipe[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(RECIPES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Recipe[]) : []
  } catch {
    return []
  }
}

export function saveRecipes(list: Recipe[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(RECIPES_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

export function getRecipe(productId: string): Recipe | undefined {
  return loadRecipes().find((r) => r.productId === productId)
}

/** Cria ou atualiza a ficha de um produto. */
export function upsertRecipe(recipe: Omit<Recipe, "updatedAt">): Recipe {
  const full: Recipe = { ...recipe, updatedAt: new Date().toISOString() }
  const list = loadRecipes()
  const idx = list.findIndex((r) => r.productId === recipe.productId)
  if (idx >= 0) list[idx] = full
  else list.push(full)
  saveRecipes(list)
  return full
}

export function deleteRecipe(productId: string): void {
  saveRecipes(loadRecipes().filter((r) => r.productId !== productId))
}

// ---------- Cálculos ----------
export interface RecipeCost {
  cost: number
  salePrice: number
  margin: number // valor R$
  marginPct: number // % sobre venda
  markup: number // % sobre custo
}

/** Calcula o CMV (custo) de uma ficha com base no custo médio dos ingredientes. */
export function calcRecipeCost(recipe: Recipe, ingredients?: Ingredient[]): RecipeCost {
  const list = ingredients ?? loadIngredients()
  const cost = recipe.items.reduce((acc, item) => {
    const ing = list.find((i) => i.id === item.ingredientId)
    return acc + (ing ? effectiveCost(ing, list) * item.quantity : 0)
  }, 0)
  const salePrice = recipe.salePrice
  const margin = salePrice - cost
  const marginPct = salePrice > 0 ? (margin / salePrice) * 100 : 0
  const markup = cost > 0 ? (margin / cost) * 100 : 0
  return { cost, salePrice, margin, marginPct, markup }
}

/**
 * Dá baixa no estoque dos ingredientes de um produto vendido.
 * Multiplica as quantidades da ficha pela quantidade vendida.
 */
export function consumeStockForProduct(productId: string, soldQty = 1): void {
  const recipe = getRecipe(productId)
  if (!recipe) return
  const list = loadIngredients()
  for (const item of recipe.items) {
    if (item.quantity <= 0) continue
    const ing = list.find((i) => i.id === item.ingredientId)
    // Ingrediente derivado: dá baixa no PAI, convertendo pela proporção.
    if (ing?.parentId && ing.conversion && ing.conversion > 0) {
      registerMovement({
        ingredientId: ing.parentId,
        type: "saida",
        quantity: (item.quantity * soldQty) / ing.conversion,
        reason: `Venda: ${recipe.productName}${soldQty > 1 ? ` ×${soldQty}` : ""} (via ${ing.name})`,
      })
    } else {
      registerMovement({
        ingredientId: item.ingredientId,
        type: "saida",
        quantity: item.quantity * soldQty,
        reason: `Venda: ${recipe.productName}${soldQty > 1 ? ` ×${soldQty}` : ""}`,
      })
    }
  }
}
