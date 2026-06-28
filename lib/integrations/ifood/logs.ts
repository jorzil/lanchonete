// ============================================================================
// Integração iFood — Logs (SERVER-ONLY)
// Guarda os últimos N registros numa system row do Supabase.
// ============================================================================

import { supabase, supabaseConfigured } from '@/lib/supabase'
import type { IFoodLog, IFoodLogLevel } from './types'

const SYSTEM_PHONE = '__ifood_logs__'
const MAX_LOGS = 300

async function read(): Promise<IFoodLog[]> {
  if (!supabaseConfigured) return []
  const { data } = await supabase
    .from('customers')
    .select('address_reference')
    .eq('phone', SYSTEM_PHONE)
    .maybeSingle()
  if (data?.address_reference) {
    try {
      const parsed = JSON.parse(data.address_reference)
      return Array.isArray(parsed.logs) ? parsed.logs : []
    } catch {}
  }
  return []
}

async function write(logs: IFoodLog[]): Promise<void> {
  if (!supabaseConfigured) return
  await supabase.from('customers').upsert(
    { phone: SYSTEM_PHONE, name: '__system__', address_reference: JSON.stringify({ logs }) },
    { onConflict: 'phone' }
  )
}

export async function logIFood(level: IFoodLogLevel, scope: string, message: string, detail?: unknown): Promise<void> {
  try {
    const logs = await read()
    logs.unshift({
      ts: new Date().toISOString(),
      level, scope, message,
      detail: detail != null ? (typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 1000) : undefined,
    })
    await write(logs.slice(0, MAX_LOGS))
  } catch {
    // logging nunca deve quebrar o fluxo principal
  }
}

export async function getLogs(): Promise<IFoodLog[]> {
  return read()
}
