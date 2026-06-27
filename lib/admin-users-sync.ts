'use client'

import { loadStoredAccounts, saveStoredAccounts } from '@/lib/admin-auth'

// Puxa as contas do Supabase para o localStorage (login cross-device).
export async function pullAdminUsers(): Promise<boolean> {
  try {
    const res = await fetch('/api/admin-users', { cache: 'no-store' })
    if (!res.ok) return false
    const data = await res.json()
    if (Array.isArray(data.users) && data.users.length > 0) {
      saveStoredAccounts(data.users)
      return true
    }
    // Banco vazio mas há contas locais → sobe para semear
    if (loadStoredAccounts().length > 0) await pushAdminUsers()
    return true
  } catch {
    return false
  }
}

// Envia as contas locais para o Supabase.
export async function pushAdminUsers(): Promise<boolean> {
  try {
    const res = await fetch('/api/admin-users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: loadStoredAccounts() }),
    })
    const data = await res.json().catch(() => ({}))
    return res.ok && data.ok
  } catch {
    return false
  }
}
