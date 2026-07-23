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
