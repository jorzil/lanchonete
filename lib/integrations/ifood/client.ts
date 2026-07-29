// ============================================================================
// Integração iFood — Cliente da API oficial (SERVER-ONLY)
// Docs: https://developer.ifood.com.br/  (Merchant API v1/v2)
// Fluxo: OAuth client_credentials → Events polling → Order details →
//        Status (confirm/dispatch/...) → Acknowledge events.
// ============================================================================

import { getConfig, patchRuntime } from './config'
import { logIFood } from './logs'
import { normalizeEvents } from './types'
import type { IFoodConfig, IFoodEvent, IFoodOrder } from './types'

const BASE = 'https://merchant-api.ifood.com.br'

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

// ─── OAuth ───────────────────────────────────────────────────────────────────
// Cache em memória: além de poupar leituras, garante que esta instância use o
// token que ela mesma acabou de renovar, mesmo que a linha compartilhada esteja
// momentaneamente desatualizada.
let memToken: { token: string; expiresAt: number } | null = null

export async function getAccessToken(force = false): Promise<string> {
  const now = Date.now()
  if (!force && memToken && memToken.expiresAt - 60_000 > now) return memToken.token

  const cfg = await getConfig()
  // Para o token basta clientId + clientSecret (merchantId só é exigido nas chamadas da loja)
  if (!cfg.clientId || !cfg.clientSecret) throw new Error('Configure o Client ID e o Client Secret do iFood.')

  if (!force && cfg.accessToken && cfg.tokenExpiresAt && cfg.tokenExpiresAt - 60_000 > now) {
    memToken = { token: cfg.accessToken, expiresAt: cfg.tokenExpiresAt }
    return cfg.accessToken
  }

  const body = new URLSearchParams({
    grantType: 'client_credentials',
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
  })

  const res = await fetch(`${BASE}/authentication/v1.0/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    await logIFood('error', 'auth', `Falha ao autenticar (${res.status})`, text)
    throw new Error(`iFood auth falhou: ${res.status}`)
  }

  const data = await res.json()
  const token = data.accessToken as string
  const expiresIn = (data.expiresIn as number) ?? 3600
  const expiresAt = Date.now() + expiresIn * 1000
  memToken = { token, expiresAt }
  await patchRuntime({ accessToken: token, tokenExpiresAt: expiresAt })
  await logIFood('success', 'auth', 'Token de acesso renovado')
  return token
}

async function api(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const token = await getAccessToken()
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...authHeader(token), ...(init.headers || {}) } })
  if (!res.ok && retry && (res.status === 401 || res.status === 403)) {
    // O iFood responde 403 "Invalid token" (e não 401) quando o token expirou
    // ou foi invalidado. Sem renovar aqui, toda chamada falha até alguém abrir
    // a tela e clicar em "Testar conexão".
    const body = await res.clone().text().catch(() => '')
    if (res.status === 401 || /invalid\s*token/i.test(body)) {
      await getAccessToken(true)
      return api(path, init, false)
    }
  }
  return res
}

// ─── Conexão / Merchant ──────────────────────────────────────────────────────
export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const cfg = await getConfig()
    await getAccessToken(true)
    const res = await api(`/merchant/v1.0/merchants/${cfg.merchantId}/status`)
    if (res.ok) {
      // Novo teste = nova chance para o polling (a permissão pode ter mudado).
      await patchRuntime({ connected: true, lastSyncAt: new Date().toISOString(), pollingBlockedAt: null })
      await logIFood('success', 'config', 'Conexão testada com sucesso')
      return { ok: true, message: 'Conexão estabelecida com o iFood.' }
    }
    const text = await res.text().catch(() => '')
    await patchRuntime({ connected: false })
    await logIFood('error', 'config', `Merchant status ${res.status}`, text)
    return { ok: false, message: `Falha ao consultar merchant (${res.status}).` }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido'
    await patchRuntime({ connected: false })
    return { ok: false, message: msg }
  }
}

// ─── Eventos (polling) ───────────────────────────────────────────────────────
/** True quando o iFood recusou o polling — o app usa entrega por webhook. */
export async function isPollingBlocked(): Promise<boolean> {
  const cfg = await getConfig()
  return !!cfg.pollingBlockedAt
}

export async function pollEvents(): Promise<IFoodEvent[]> {
  const cfg = await getConfig()
  // Quando o app está configurado para receber eventos por webhook, o iFood
  // devolve 403 no polling. Insistir só enche o log de erro falso.
  if (cfg.pollingBlockedAt) return []

  const res = await api('/events/v1.0/events:polling', {
    method: 'GET',
    headers: { 'x-polling-merchants': cfg.merchantId },
  })
  if (res.status === 204) return []
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    if (res.status === 403) {
      // Chegou aqui já com token renovado (api() tenta de novo em "Invalid
      // token"), então é permissão mesmo: o app não tem o módulo de eventos.
      await patchRuntime({ pollingBlockedAt: new Date().toISOString() })
      await logIFood(
        'warn',
        'polling',
        'Polling negado pelo iFood (403) mesmo com token novo — o app não tem permissão de polling. Desativado; os pedidos continuam vindo pelo webhook.',
        body
      )
      return []
    }
    await logIFood('error', 'polling', `Polling falhou (${res.status})`, body)
    return []
  }
  const events = normalizeEvents(await res.json().catch(() => null))
  await patchRuntime({ lastSyncAt: new Date().toISOString() })
  return events
}

export async function acknowledgeEvents(events: IFoodEvent[]): Promise<void> {
  if (events.length === 0) return
  await api('/events/v1.0/events/acknowledgment', {
    method: 'POST',
    body: JSON.stringify(events.map((e) => ({ id: e.id }))),
  })
}

// ─── Pedido ──────────────────────────────────────────────────────────────────
export async function getOrder(orderId: string): Promise<IFoodOrder | null> {
  const res = await api(`/order/v1.0/orders/${orderId}`)
  if (!res.ok) {
    await logIFood('error', 'order', `Detalhe do pedido ${orderId} falhou (${res.status})`)
    return null
  }
  return (await res.json()) as IFoodOrder
}

// ─── Atualização de status (quando a API permite) ────────────────────────────
// Mapeia o status interno → ação do iFood. Nem todo status tem equivalente.
const STATUS_ACTION: Record<string, string | null> = {
  aceito: 'confirm',
  em_preparo: 'startPreparation', // iFood: Start Preparation
  pronto: 'readyToPickup',
  saiu_entrega: 'dispatch',
  entregue: null,              // concluído pelo iFood/entregador
  cancelado: 'requestCancellation',
}

// Lista as lojas (merchants) que o app tem acesso — usado para descobrir o Merchant ID
export async function listMerchants(): Promise<Array<{ id: string; name: string }>> {
  const res = await api('/merchant/v1.0/merchants')
  if (!res.ok) {
    await logIFood('error', 'config', `List merchants falhou (${res.status})`, await res.text().catch(() => ''))
    throw new Error(`Falha ao listar lojas (${res.status})`)
  }
  const data = await res.json()
  const arr = Array.isArray(data) ? data : (data?.merchants ?? [])
  return arr.map((m: { id: string; name?: string; corporateName?: string }) => ({ id: m.id, name: m.name ?? m.corporateName ?? m.id }))
}

// ─── Merchant: detalhes, status, pausas e horários ───────────────────────────
async function merchantPath(sub = ''): Promise<string> {
  const { getConfig } = await import('./config')
  const cfg = await getConfig()
  return `/merchant/v1.0/merchants/${cfg.merchantId}${sub}`
}

export async function getMerchantDetail(): Promise<Record<string, unknown> | null> {
  const res = await api(await merchantPath())
  if (!res.ok) { await logIFood('error', 'merchant', `Detalhe da loja falhou (${res.status})`); return null }
  return res.json()
}

export async function getMerchantStatus(): Promise<unknown[]> {
  const res = await api(await merchantPath('/status'))
  if (!res.ok) { await logIFood('error', 'merchant', `Status da loja falhou (${res.status})`); return [] }
  const data = await res.json()
  return Array.isArray(data) ? data : [data]
}

export interface IFoodInterruption { id: string; description?: string; start?: string; end?: string }

export async function listInterruptions(): Promise<IFoodInterruption[]> {
  const res = await api(await merchantPath('/interruptions'))
  if (!res.ok) { await logIFood('error', 'merchant', `Listar pausas falhou (${res.status})`); return [] }
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function createInterruption(description: string, minutes: number): Promise<boolean> {
  // O iFood rejeita 'start' no passado — começa 1 min à frente. Sem milissegundos.
  const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, 'Z')
  const start = new Date(Date.now() + 60_000)
  const end = new Date(start.getTime() + minutes * 60_000)
  const res = await api(await merchantPath('/interruptions'), {
    method: 'POST',
    body: JSON.stringify({ description, start: iso(start), end: iso(end) }),
  })
  if (!res.ok) {
    await logIFood('error', 'merchant', `Criar pausa falhou (${res.status})`, await res.text().catch(() => ''))
    return false
  }
  await logIFood('success', 'merchant', `Pausa criada: ${description} (${minutes} min)`)
  return true
}

export async function deleteInterruption(id: string): Promise<boolean> {
  const res = await api(await merchantPath(`/interruptions/${id}`), { method: 'DELETE' })
  if (!res.ok && res.status !== 204) {
    await logIFood('error', 'merchant', `Remover pausa falhou (${res.status})`)
    return false
  }
  await logIFood('success', 'merchant', 'Pausa removida')
  return true
}

export interface IFoodShift { dayOfWeek: string; start: string; duration: number }

export async function getOpeningHours(): Promise<{ shifts: IFoodShift[] } | null> {
  const res = await api(await merchantPath('/opening-hours'))
  if (!res.ok) { await logIFood('error', 'merchant', `Consultar horários falhou (${res.status})`); return null }
  return res.json()
}

export async function putOpeningHours(shifts: IFoodShift[]): Promise<boolean> {
  const res = await api(await merchantPath('/opening-hours'), {
    method: 'PUT',
    body: JSON.stringify({ shifts }),
  })
  if (!res.ok) {
    await logIFood('error', 'merchant', `Salvar horários falhou (${res.status})`, await res.text().catch(() => ''))
    return false
  }
  await logIFood('success', 'merchant', `Horários de funcionamento atualizados (${shifts.length} turno(s))`)
  return true
}

// ─── Financeiro (módulo financial — precisa estar habilitado no app) ─────────
// Vendas do período com valores bruto/líquido oficiais do iFood.
export interface IFoodSale {
  orderId?: string
  shortOrderId?: string
  salesDate?: string
  grossValue?: number
  netValue?: number
  totalBag?: number
  deliveryFee?: number
  commission?: number
  [key: string]: unknown
}

export async function financialSales(beginDate: string, endDate: string): Promise<IFoodSale[]> {
  const { getConfig } = await import('./config')
  const cfg = await getConfig()
  const qs = `beginSalesDate=${beginDate}&endSalesDate=${endDate}`
  const res = await api(`/financial/v2.1/merchants/${cfg.merchantId}/sales?${qs}`)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    if (res.status === 403 || res.status === 401) {
      throw new Error('Sem acesso ao módulo Financial — adicione o módulo "financial" ao app no Portal do Desenvolvedor iFood.')
    }
    if (res.status === 404) {
      // O iFood só registra a rota financeira para apps com o módulo liberado —
      // sem ele a URL simplesmente não existe (404 em vez de 403).
      await logIFood('warn', 'financial', 'Módulo Financial indisponível para este app/loja (404)', body)
      throw new Error(
        'O módulo Financial não está disponível para esta loja. Peça ao suporte do iFood para liberar o módulo "financial" no seu app — até lá, o líquido é estimado pelo percentual de taxa configurado.'
      )
    }
    await logIFood('error', 'financial', `Consulta de vendas falhou (${res.status})`, body)
    throw new Error(`Consulta financeira falhou (${res.status})`)
  }
  const data = await res.json().catch(() => null)
  const arr = Array.isArray(data) ? data : (data?.sales ?? data?.content ?? [])
  return Array.isArray(arr) ? (arr as IFoodSale[]) : []
}

export async function pushStatus(externalId: string, internalStatus: string): Promise<boolean> {
  const action = STATUS_ACTION[internalStatus]
  if (!action) return false
  const path = action === 'requestCancellation'
    ? `/order/v1.0/orders/${externalId}/requestCancellation`
    : `/order/v1.0/orders/${externalId}/${action}`
  const res = await api(path, { method: 'POST', body: JSON.stringify({}) })
  if (res.ok) {
    await logIFood('success', 'status', `Status '${internalStatus}' enviado ao iFood (${externalId})`)
    return true
  }
  await logIFood('error', 'status', `Falha ao enviar status '${internalStatus}' (${res.status})`, await res.text().catch(() => ''))
  return false
}

export type { IFoodConfig }
