// ============================================================================
// Integração iFood — Cliente da API oficial (SERVER-ONLY)
// Docs: https://developer.ifood.com.br/  (Merchant API v1/v2)
// Fluxo: OAuth client_credentials → Events polling → Order details →
//        Status (confirm/dispatch/...) → Acknowledge events.
// ============================================================================

import { getConfig, patchRuntime, isConfigured } from './config'
import { logIFood } from './logs'
import type { IFoodConfig, IFoodEvent, IFoodOrder } from './types'

const BASE = 'https://merchant-api.ifood.com.br'

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

// ─── OAuth ───────────────────────────────────────────────────────────────────
export async function getAccessToken(force = false): Promise<string> {
  const cfg = await getConfig()
  if (!isConfigured(cfg)) throw new Error('Integração iFood não configurada (clientId/secret/merchantId).')

  const now = Date.now()
  if (!force && cfg.accessToken && cfg.tokenExpiresAt && cfg.tokenExpiresAt - 60_000 > now) {
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
  await patchRuntime({ accessToken: token, tokenExpiresAt: now + expiresIn * 1000 })
  await logIFood('success', 'auth', 'Token de acesso renovado')
  return token
}

async function api(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const token = await getAccessToken()
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...authHeader(token), ...(init.headers || {}) } })
  if (res.status === 401 && retry) {
    await getAccessToken(true)
    return api(path, init, false)
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
      await patchRuntime({ connected: true, lastSyncAt: new Date().toISOString() })
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
export async function pollEvents(): Promise<IFoodEvent[]> {
  const cfg = await getConfig()
  const res = await api('/events/v1.0/events:polling', {
    method: 'GET',
    headers: { 'x-polling-merchants': cfg.merchantId },
  })
  if (res.status === 204) return []
  if (!res.ok) {
    await logIFood('error', 'polling', `Polling falhou (${res.status})`, await res.text().catch(() => ''))
    return []
  }
  const events = (await res.json()) as IFoodEvent[]
  await patchRuntime({ lastSyncAt: new Date().toISOString() })
  return events ?? []
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
  em_preparo: null,            // iFood não tem "em preparo" explícito
  pronto: 'readyToPickup',
  saiu_entrega: 'dispatch',
  entregue: null,              // concluído pelo iFood/entregador
  cancelado: 'requestCancellation',
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
