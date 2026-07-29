// ============================================================================
// Integração iFood — Tipos
// Módulo independente. Nenhuma outra parte do sistema importa daqui diretamente,
// exceto as rotas /api/integrations/ifood/* e a tela de configuração.
// ============================================================================

export type IFoodEnvironment = 'sandbox' | 'production'

export interface IFoodConfig {
  clientId: string
  clientSecret: string
  merchantId: string
  environment: IFoodEnvironment
  webhookUrl: string
  /** % total de taxas do iFood (comissão + pagamento online) para estimar o líquido */
  commissionPercent?: number
  // estado de conexão (preenchido pelo sistema)
  connected: boolean
  lastSyncAt: string | null
  // token (cache server-side; nunca exposto ao front)
  accessToken?: string
  tokenExpiresAt?: number // epoch ms
  /** Quando o iFood recusou o polling (403). No modo webhook o polling é bloqueado. */
  pollingBlockedAt?: string | null
}

// Versão segura para o front (sem secret nem token)
export interface IFoodConfigPublic {
  clientId: string
  clientSecretMasked: string
  hasSecret: boolean
  merchantId: string
  environment: IFoodEnvironment
  webhookUrl: string
  commissionPercent?: number
  connected: boolean
  lastSyncAt: string | null
}

// ─── Eventos do iFood (polling/webhook) ──────────────────────────────────────
export interface IFoodEvent {
  id: string
  code: string          // código curto: PLC, CFM, CAN, DSP, ...
  fullCode?: string     // código completo: PLACED, CONFIRMED, CANCELLED, ...
  orderId: string
  createdAt?: string
  merchantId?: string
}

/** True quando o evento representa um pedido novo (o iFood usa PLC/PLACED). */
export function isPlacedEvent(ev: IFoodEvent): boolean {
  const full = (ev.fullCode ?? '').toUpperCase()
  const short = (ev.code ?? '').toUpperCase()
  return full === 'PLACED' || short === 'PLC' || short === 'PLACED'
}

// ─── Normalização de payload ─────────────────────────────────────────────────
// O iFood não entrega o mesmo formato no webhook e no polling: dependendo da
// versão do app o corpo vem como objeto único, array, ou embrulhado em
// { events: [...] } / { payload: ... }, e o id do pedido aparece como orderId,
// order_id, merchantOrderId ou dentro de metadata. Aceitamos todas as formas —
// um evento descartado aqui é um pedido perdido.

function pick(o: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return undefined
}

function normalizeEvent(raw: unknown): IFoodEvent | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const meta = (o.metadata && typeof o.metadata === 'object' ? o.metadata : {}) as Record<string, unknown>

  const orderId =
    pick(o, ['orderId', 'order_id', 'merchantOrderId', 'correlationId', 'resourceId']) ??
    pick(meta, ['orderId', 'order_id'])
  if (!orderId) return null

  return {
    id: pick(o, ['id', 'eventId', 'event_id']) ?? orderId,
    code: pick(o, ['code']) ?? '',
    fullCode: pick(o, ['fullCode', 'full_code', 'eventType', 'type']),
    orderId,
    createdAt: pick(o, ['createdAt', 'created_at']),
    merchantId: pick(o, ['merchantId', 'merchant_id']) ?? pick(meta, ['merchantId']),
  }
}

/** Extrai a lista de eventos de um payload de webhook/polling em qualquer formato. */
export function normalizeEvents(payload: unknown): IFoodEvent[] {
  if (!payload) return []
  let list: unknown[]
  if (Array.isArray(payload)) {
    list = payload
  } else if (typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (Array.isArray(o.events)) list = o.events
    else if (Array.isArray(o.payload)) list = o.payload
    else if (o.payload && typeof o.payload === 'object') list = [o.payload]
    else list = [o]
  } else {
    return []
  }
  return list.map(normalizeEvent).filter((e): e is IFoodEvent => e !== null)
}

// ─── Pedido do iFood (resumo dos campos usados) ──────────────────────────────
export interface IFoodOrder {
  id: string
  displayId?: string
  createdAt?: string
  orderType?: string // DELIVERY | TAKEOUT | INDOOR
  customer?: { name?: string; phone?: { number?: string } }
  delivery?: {
    deliveryAddress?: {
      formattedAddress?: string
      streetName?: string
      streetNumber?: string
      neighborhood?: string
      city?: string
      state?: string
      postalCode?: string
      complement?: string
      reference?: string
    }
  }
  items?: Array<{
    name: string
    quantity: number
    unitPrice?: number
    totalPrice?: number
    observations?: string
    options?: Array<{ name: string; quantity?: number }>
  }>
  total?: { orderAmount?: number; deliveryFee?: number; benefits?: number; subTotal?: number }
  payments?: { methods?: Array<{ method?: string; type?: string }> }
}

// ─── Log de integração ───────────────────────────────────────────────────────
export type IFoodLogLevel = 'info' | 'success' | 'error' | 'warn'
export interface IFoodLog {
  ts: string
  level: IFoodLogLevel
  scope: string   // auth, webhook, polling, order, status, catalog, config
  message: string
  detail?: string
}
