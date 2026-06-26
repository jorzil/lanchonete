'use client'

// Produtos (lanches, bebidas, etc.) desativados pelo admin — persistido no
// Supabase para valer em todos os dispositivos. Guarda uma lista de IDs.

export async function fetchDisabledProducts(): Promise<Set<string>> {
  try {
    const res = await fetch('/api/products-availability', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      return new Set<string>(Array.isArray(data.disabled) ? data.disabled : [])
    }
  } catch {}
  return new Set<string>()
}

export async function patchDisabledProducts(disabled: string[]): Promise<string[]> {
  try {
    const res = await fetch('/api/products-availability', {
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
