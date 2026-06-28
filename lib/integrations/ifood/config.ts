// ============================================================================
// Integração iFood — Armazenamento de configuração (SERVER-ONLY)
// As credenciais nunca são enviadas ao front. Preferência: variáveis de
// ambiente (IFOOD_CLIENT_ID, IFOOD_CLIENT_SECRET, IFOOD_MERCHANT_ID). Como
// fallback editável pelo admin, persiste numa system row do Supabase.
// ============================================================================

import { supabase, supabaseConfigured } from '@/lib/supabase'
import type { IFoodConfig, IFoodConfigPublic, IFoodEnvironment } from './types'

const SYSTEM_PHONE = '__ifood_config__'

const DEFAULTS: IFoodConfig = {
  clientId: '',
  clientSecret: '',
  merchantId: '',
  environment: 'sandbox',
  webhookUrl: '',
  connected: false,
  lastSyncAt: null,
}

function fromEnv(): Partial<IFoodConfig> {
  return {
    clientId: process.env.IFOOD_CLIENT_ID || undefined,
    clientSecret: process.env.IFOOD_CLIENT_SECRET || undefined,
    merchantId: process.env.IFOOD_MERCHANT_ID || undefined,
    environment: (process.env.IFOOD_ENVIRONMENT as IFoodEnvironment) || undefined,
  } as Partial<IFoodConfig>
}

async function readRow(): Promise<Partial<IFoodConfig> | null> {
  if (!supabaseConfigured) return null
  const { data } = await supabase
    .from('customers')
    .select('address_reference')
    .eq('phone', SYSTEM_PHONE)
    .maybeSingle()
  if (data?.address_reference) {
    try { return JSON.parse(data.address_reference) } catch {}
  }
  return null
}

async function writeRow(value: Partial<IFoodConfig>): Promise<void> {
  if (!supabaseConfigured) return
  await supabase.from('customers').upsert(
    { phone: SYSTEM_PHONE, name: '__system__', address_reference: JSON.stringify(value) },
    { onConflict: 'phone' }
  )
}

/** Config completa (server-side). Env tem prioridade sobre o que está salvo. */
export async function getConfig(): Promise<IFoodConfig> {
  const row = (await readRow()) ?? {}
  const env = fromEnv()
  const merged: IFoodConfig = {
    ...DEFAULTS,
    ...row,
    ...Object.fromEntries(Object.entries(env).filter(([, v]) => v != null)),
  } as IFoodConfig
  return merged
}

/** Salva alterações vindas da tela (não sobrescreve secret vazio). */
export async function saveConfig(patch: Partial<IFoodConfig>): Promise<IFoodConfig> {
  const current = (await readRow()) ?? {}
  const next: Partial<IFoodConfig> = { ...current, ...patch }
  // Mantém secret atual se vier vazio
  if (patch.clientSecret === '' || patch.clientSecret == null) {
    next.clientSecret = (current as IFoodConfig).clientSecret ?? ''
  }
  await writeRow(next)
  return getConfig()
}

/** Atualiza apenas o cache do token / estado de conexão. */
export async function patchRuntime(patch: Partial<IFoodConfig>): Promise<void> {
  const current = (await readRow()) ?? {}
  await writeRow({ ...current, ...patch })
}

export function toPublic(cfg: IFoodConfig): IFoodConfigPublic {
  const secret = cfg.clientSecret ?? ''
  return {
    clientId: cfg.clientId,
    clientSecretMasked: secret ? `${'•'.repeat(Math.max(0, secret.length - 4))}${secret.slice(-4)}` : '',
    hasSecret: !!secret,
    merchantId: cfg.merchantId,
    environment: cfg.environment,
    webhookUrl: cfg.webhookUrl,
    connected: cfg.connected,
    lastSyncAt: cfg.lastSyncAt,
  }
}

export function isConfigured(cfg: IFoodConfig): boolean {
  return !!(cfg.clientId && cfg.clientSecret && cfg.merchantId)
}
