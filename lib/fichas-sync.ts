'use client'

import {
  loadIngredients, saveIngredients, loadMovements, saveMovements,
  type Ingredient, type StockMovement,
} from '@/lib/inventory-storage'
import { loadRecipes, saveRecipes, type Recipe } from '@/lib/recipes-storage'

// Puxa ingredientes + fichas do Supabase e grava no localStorage local.
// Retorna true se trouxe dados.
export async function pullFichas(): Promise<boolean> {
  try {
    const res = await fetch('/api/fichas-tecnicas', { cache: 'no-store' })
    if (!res.ok) return false
    const data = await res.json()
    const ingredients = Array.isArray(data.ingredients) ? (data.ingredients as Ingredient[]) : []
    const recipes = Array.isArray(data.recipes) ? (data.recipes as Recipe[]) : []
    const movements = Array.isArray(data.movements) ? (data.movements as StockMovement[]) : []

    // Só sobrescreve o local quando o banco realmente tem dados — evita apagar
    // o que já existe no aparelho quando o banco ainda está vazio.
    if (ingredients.length > 0) saveIngredients(ingredients)
    if (recipes.length > 0) saveRecipes(recipes)
    if (movements.length > 0) saveMovements(movements)

    // Se o banco está vazio mas há dados locais, sobe o local para semear o banco.
    if (ingredients.length === 0 && recipes.length === 0) {
      if (loadIngredients().length > 0 || loadRecipes().length > 0) {
        await pushFichas()
      }
    }
    return true
  } catch {
    return false
  }
}

// Envia o estado atual (localStorage) de ingredientes + fichas para o Supabase.
export async function pushFichas(): Promise<boolean> {
  try {
    const res = await fetch('/api/fichas-tecnicas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients: loadIngredients(), recipes: loadRecipes(), movements: loadMovements().slice(0, 500) }),
    })
    const data = await res.json().catch(() => ({}))
    return res.ok && data.ok
  } catch {
    return false
  }
}
