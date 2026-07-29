// ============================================================================
// Integração iFood — Armazenamento de configuração (SERVER-ONLY)
// As credenciais nunca são enviadas ao front. Preferência: variáveis de
// ambiente (IFOOD_CLIENT_ID, IFOOD_CLIENT_SECRET, IFOOD_MERCHANT_ID). Como
// fallback editável pelo admin, persiste numa system row do Supabase.
// ============================================================================

import { supabase, supabaseConfigured } from '@/lib/supabase'
import type { IFoodConfig, IFoodConfigPublic, IFoodEnvironment } from './types'

const SYSTEM_PHONE = '__ifood_config__'
// O token fica numa linha separada da configuração. Antes dividia a mesma
// linha, e como patchRuntime faz ler-alterar-gravar, uma gravação concorrente
// (webhook + polling + painel batem ao mesmo tempo) reescrevia um token velho
// por cima do recém-renovado — o iFood então respondia 403 "Invalid token".
const TOKEN_PHONE = '__ifood_token__'

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

type TokenRow = { accessToken?: string; tokenExpiresAt?: number }

async function readToken(): Promise<TokenRow> {
  if (!supabaseConfigured) return {}
  const { data } = await supabase
    .from('customers')
    .select('address_reference')
    .eq('phone', TOKEN_PHONE)
    .maybeSingle()
  if (data?.address_reference) {
    try { return JSON.parse(data.address_reference) as TokenRow } catch {}
  }
  return {}
}

async function writeToken(value: TokenRow): Promise<void> {
  if (!supabaseConfigured) return
  await supabase.from('customers').upsert(
    { phone: TOKEN_PHONE, name: '__system__', address_reference: JSON.stringify(value) },
    { onConflict: 'phone' }
  )
}

/** Config completa (server-side). Env tem prioridade sobre o que está salvo. */
export async function getConfig(): Promise<IFoodConfig> {
  const [row, token] = await Promise.all([readRow(), readToken()])
  const env = fromEnv()
  const merged: IFoodConfig = {
    ...DEFAULTS,
    ...(row ?? {}),
    ...token,
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
  const { accessToken, tokenExpiresAt, ...rest } = patch

  // Token vai para a linha própria — nunca junto com lastSyncAt & cia.
  if (accessToken !== undefined || tokenExpiresAt !== undefined) {
    await writeToken({ accessToken, tokenExpiresAt })
  }
  if (Object.keys(rest).length > 0) {
    const current = (await readRow()) ?? {}
    await writeRow({ ...current, ...rest })
  }
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
    commissionPercent: cfg.commissionPercent ?? 0,
    connected: cfg.connected,
    lastSyncAt: cfg.lastSyncAt,
  }
}

export function isConfigured(cfg: IFoodConfig): boolean {
  return !!(cfg.clientId && cfg.clientSecret && cfg.merchantId)
}
