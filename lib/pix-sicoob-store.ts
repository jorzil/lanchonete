// Configuração e cobranças do Sicoob em system rows (SERVER-ONLY).
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { SICOOB_DEFAULTS, type SicoobConfig } from '@/lib/pix-sicoob'

const CFG_PHONE = '__sicoob_pix__'
const COB_PHONE = '__sicoob_cobrancas__'

async function read(phone: string): Promise<Record<string, unknown> | null> {
  if (!supabaseConfigured) return null
  const { data } = await supabase
    .from('customers').select('address_reference').eq('phone', phone).maybeSingle()
  if (data?.address_reference) {
    try { return JSON.parse(data.address_reference) } catch {}
  }
  return null
}

async function write(phone: string, value: object) {
  if (!supabaseConfigured) return new Error('Supabase não configurado')
  const { error } = await supabase.from('customers').upsert(
    { phone, name: '__system__', address_reference: JSON.stringify(value) },
    { onConflict: 'phone' },
  )
  return error
}

export async function getSicoobConfig(): Promise<SicoobConfig> {
  const row = await read(CFG_PHONE)
  return { ...SICOOB_DEFAULTS, ...((row?.sicoob as Partial<SicoobConfig>) ?? {}) }
}

export async function saveSicoobConfig(patch: Partial<SicoobConfig>): Promise<SicoobConfig> {
  const atual = await getSicoobConfig()
  const next = { ...atual, ...patch }
  await write(CFG_PHONE, { sicoob: next, updatedAt: new Date().toISOString() })
  return next
}

// ─── Cobranças: txid → pedido, para o webhook saber quem pagou ───────────────
type CobMap = Record<string, { orderNumber: string; valor: number; at: number; pago?: boolean }>
const MAX_IDADE = 24 * 60 * 60 * 1000

export async function registrarCobranca(txid: string, orderNumber: string, valor: number) {
  const todas = ((await read(COB_PHONE))?.cobrancas as CobMap) ?? {}
  const agora = Date.now()
  for (const [k, v] of Object.entries(todas)) if (agora - v.at > MAX_IDADE) delete todas[k]
  todas[txid] = { orderNumber, valor, at: agora }
  await write(COB_PHONE, { cobrancas: todas })
}

export async function acharPedidoPorTxid(txid: string) {
  const todas = ((await read(COB_PHONE))?.cobrancas as CobMap) ?? {}
  return todas[txid] ?? null
}

export async function marcarPago(txid: string) {
  const todas = ((await read(COB_PHONE))?.cobrancas as CobMap) ?? {}
  if (todas[txid]) { todas[txid].pago = true; await write(COB_PHONE, { cobrancas: todas }) }
}
