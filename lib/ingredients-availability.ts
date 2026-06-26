'use client'

// Disponibilidade de ingredientes do "Monte Seu Sub".
// Cada item é identificado por uma chave namespaced: `categoria:key`
// (ex: "meat:carne-suprema", "salad:alface"). Quando uma chave está na lista
// de "disabled", o ingrediente não aparece para o cliente montar.

export type IngredientCategory = 'bread' | 'meat' | 'cheese' | 'salad' | 'sauce' | 'extra'

export function ingKey(cat: IngredientCategory, key: string): string {
  return `${cat}:${key}`
}

export async function fetchDisabledIngredients(): Promise<Set<string>> {
  try {
    const res = await fetch('/api/ingredients', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      return new Set<string>(Array.isArray(data.disabled) ? data.disabled : [])
    }
  } catch {}
  return new Set<string>()
}

export async function patchDisabledIngredients(disabled: string[]): Promise<string[]> {
  try {
    const res = await fetch('/api/ingredients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabled }),
    })
    if (res.ok) {
      const data = await res.json()
      return Array.isArray(data.disabled) ? data.disabled : disabled
    }
  } catch {}
  return disabled
}
