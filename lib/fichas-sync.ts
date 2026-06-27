'use client'

import {
  loadIngredients, saveIngredients, type Ingredient,
} from '@/lib/inventory-storage'
import { loadRecipes, saveRecipes, type Recipe } from '@/lib/recipes-storage'

// Puxa ingredientes + fichas do Supabase e grava no localStorage local.
// Retorna true se trouxe dados.
export async function pullFichas(): Promise<boolean> {
  try {
    const res = await fetch('/api/fichas-tecnicas', { cache: 'no-store' })
    if (!res.ok) return false
    const data = await res.json()
    const ingredients = Array.isArray(data.ingredients) ? (data.ingredients as Ingredient[]) : null
    const recipes = Array.isArray(data.recipes) ? (data.recipes as Recipe[]) : null
    if (ingredients) saveIngredients(ingredients)
    if (recipes) saveRecipes(recipes)
    return !!(ingredients || recipes)
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
      body: JSON.stringify({ ingredients: loadIngredients(), recipes: loadRecipes() }),
    })
    const data = await res.json().catch(() => ({}))
    return res.ok && data.ok
  } catch {
    return false
  }
}
