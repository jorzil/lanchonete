// Delivery fee zones based on straight-line distance from the store.
// Admin can override these via localStorage key 'mais_sub_delivery_zones'.

export interface DeliveryZone {
  label: string       // e.g. "Até 3km"
  maxKm: number       // upper bound (inclusive)
  fee: number         // R$
}

export interface DeliveryConfig {
  storeAddress: string
  storeLat: number
  storeLng: number
  zones: DeliveryZone[]
  outsideAreaMessage: string
  /** Frete grátis para todos os pedidos (ignora as zonas) */
  freeDelivery?: boolean
  /** Frete grátis a partir deste valor de pedido (0 = desativado) */
  freeDeliveryMinOrder?: number
  /**
   * Quanto a rota real é mais longa que a linha reta.
   *
   * A distância que sabemos calcular é em linha reta, e o entregador não voa:
   * ele contorna quarteirão, rio e mão única. Em cidade o percurso costuma dar
   * de 1,3 a 1,4 vez a linha reta, e o erro CRESCE com a distância — a 1km são
   * 300m a mais, a 10km são 3,5km a mais, o que já vale várias faixas de taxa.
   * Era daí que vinha a cobrança curta nos endereços mais afastados.
   */
  routeFactor?: number
  /**
   * Taxa usada quando não dá para localizar o endereço no mapa.
   *
   * Antes caía na primeira faixa — a mais barata, de até 1km. Endereço de
   * bairro afastado é justamente o que o mapa costuma não achar, então quem
   * morava longe pagava R$ 5,00.
   */
  feeWhenUnknown?: number
}

/** Fator de rota válido, com um teto para ninguém errar a mão na configuração. */
export function routeFactorOf(cfg: DeliveryConfig): number {
  const f = cfg.routeFactor
  if (typeof f !== 'number' || !isFinite(f) || f < 1) return 1.35
  return Math.min(3, f)
}

/** Taxa da faixa que cobre esta distância. null = fora de toda faixa. */
export function feeForDistance(km: number, zones: DeliveryZone[]): DeliveryZone | null {
  return [...zones].sort((a, b) => a.maxKm - b.maxKm).find((z) => km <= z.maxKm) ?? null
}

/**
 * Taxa a cobrar quando o endereço não pôde ser localizado.
 *
 * Sem configuração própria, usa a faixa do meio da tabela em vez da primeira:
 * errar para cima incomoda um cliente, errar para baixo custa dinheiro em toda
 * entrega longa.
 */
export function unknownFee(cfg: DeliveryConfig): number {
  if (typeof cfg.feeWhenUnknown === 'number' && cfg.feeWhenUnknown >= 0) return cfg.feeWhenUnknown
  const ordenadas = [...cfg.zones].sort((a, b) => a.maxKm - b.maxKm)
  if (ordenadas.length === 0) return 0
  return ordenadas[Math.floor(ordenadas.length / 2)].fee
}

/** Taxa final considerando as regras de frete grátis. */
export function applyFreeDelivery(fee: number, subtotal: number, cfg: DeliveryConfig): number {
  if (cfg.freeDelivery) return 0
  const min = cfg.freeDeliveryMinOrder ?? 0
  if (min > 0 && subtotal >= min) return 0
  return fee
}

const DEFAULT_CONFIG: DeliveryConfig = {
  storeAddress: 'Governador Valadares, MG',
  storeLat: -18.8543,
  storeLng: -41.9497,
  zones: [
    { label: 'Até 1km',    maxKm: 1,    fee: 5.0  },
    { label: 'Até 1,5km',  maxKm: 1.5,  fee: 5.99 },
    { label: 'Até 2km',    maxKm: 2,    fee: 6.99 },
    { label: 'Até 2,5km',  maxKm: 2.5,  fee: 7.99 },
    { label: 'Até 3km',    maxKm: 3,    fee: 8.99 },
    { label: 'Até 4km',    maxKm: 4,    fee: 9.99 },
    { label: 'Até 5km',    maxKm: 5,    fee: 11.99 },
    { label: 'Até 5,5km',  maxKm: 5.5,  fee: 12.99 },
    { label: 'Até 6km',    maxKm: 6,    fee: 13.99 },
    { label: 'Até 6,5km',  maxKm: 6.5,  fee: 14.99 },
    { label: 'Até 7km',    maxKm: 7,    fee: 15.99 },
    { label: 'Até 7,5km',  maxKm: 7.5,  fee: 16.99 },
    { label: 'Até 8km',    maxKm: 8,    fee: 17.99 },
    { label: 'Até 8,5km',  maxKm: 8.5,  fee: 18.99 },
    { label: 'Até 9km',    maxKm: 9,    fee: 19.99 },
    { label: 'Até 9,5km',  maxKm: 9.5,  fee: 20.99 },
    { label: 'Até 10km',   maxKm: 10,   fee: 21.99 },
    { label: 'Até 12,5km', maxKm: 12.5, fee: 22.99 },
    { label: 'Até 15km',   maxKm: 15,   fee: 24.99 },
  ],
  outsideAreaMessage: 'Fora da área de entrega (máx. 15km)',
  freeDelivery: false,
  freeDeliveryMinOrder: 0,
  routeFactor: 1.35,
}

const STORAGE_KEY = 'mais_sub_delivery_zones'

export function getDeliveryConfig(): DeliveryConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {}
  return DEFAULT_CONFIG
}

export function saveDeliveryConfig(config: Partial<DeliveryConfig>): void {
  if (typeof window === 'undefined') return
  const current = getDeliveryConfig()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...config }))
}

// Haversine formula — straight-line distance in km between two coords
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

export interface FeeResult {
  fee: number
  /** Distância estimada de percurso — é ela que define a faixa. */
  distanceKm: number
  /** Distância em linha reta, para conferência. */
  straightKm: number
  zone: DeliveryZone | null
  outsideArea: boolean
}

export function calcDeliveryFee(customerLat: number, customerLng: number, cfg?: DeliveryConfig): FeeResult {
  const config = cfg ?? getDeliveryConfig()
  const straightKm = haversineKm(config.storeLat, config.storeLng, customerLat, customerLng)
  // A faixa é escolhida pela distância de PERCURSO, não pela linha reta.
  const distanceKm = straightKm * routeFactorOf(config)
  const zone = feeForDistance(distanceKm, config.zones)
  const ordenadas = [...config.zones].sort((a, b) => a.maxKm - b.maxKm)
  return {
    // Fora da área a taxa não é zero: é a da faixa mais cara. Quem chamar sem
    // olhar o outsideArea cobra a mais, nunca de graça.
    fee: zone?.fee ?? ordenadas.at(-1)?.fee ?? 0,
    distanceKm: Math.round(distanceKm * 10) / 10,
    straightKm: Math.round(straightKm * 10) / 10,
    zone,
    outsideArea: !zone,
  }
}

/** Resultado da geocodificação, com o aviso de o quanto dá para confiar. */
export interface GeoHit { lat: number; lng: number; precisao?: 'exata' | 'aproximada' }

// Geocodifica via nossa API (server-side, com cache) — mais confiável que
// chamar o Nominatim direto do navegador do cliente.
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(address)
    const res = await fetch(`/api/geocode?street=${q}`)
    if (!res.ok) return null
    const data = await res.json()
    if (typeof data.lat === 'number' && typeof data.lng === 'number') return data
  } catch {}
  return null
}

// Geocodificação estruturada (rua/cidade/UF/CEP) — usa as 3 estratégias do servidor.
export async function geocodeStructured(parts: { street?: string; city?: string; state?: string; cep?: string }): Promise<GeoHit | null> {
  try {
    const p = new URLSearchParams()
    if (parts.street) p.set('street', parts.street)
    if (parts.city) p.set('city', parts.city)
    if (parts.state) p.set('state', parts.state)
    if (parts.cep) p.set('cep', parts.cep)
    const res = await fetch(`/api/geocode?${p.toString()}`)
    if (!res.ok) return null
    const data = await res.json()
    if (typeof data.lat === 'number' && typeof data.lng === 'number') return data as GeoHit
  } catch {}
  return null
}

// ─── Sincronização com o Supabase (config vale em todos os aparelhos) ─────────
export async function pullDeliveryConfig(): Promise<DeliveryConfig> {
  try {
    const res = await fetch('/api/delivery-config', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      if (data.config && Array.isArray(data.config.zones) && data.config.zones.length > 0) {
        const merged = { ...DEFAULT_CONFIG, ...data.config }
        if (typeof window !== 'undefined') {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)) } catch {}
        }
        return merged
      }
    }
  } catch {}
  return getDeliveryConfig()
}

export async function pushDeliveryConfig(config: DeliveryConfig): Promise<boolean> {
  try {
    const res = await fetch('/api/delivery-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    })
    const data = await res.json().catch(() => ({}))
    return !!(res.ok && data.ok)
  } catch {
    return false
  }
}
