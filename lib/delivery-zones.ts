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
}

const DEFAULT_CONFIG: DeliveryConfig = {
  storeAddress: 'Governador Valadares, MG',
  storeLat: -18.8543,
  storeLng: -41.9497,
  zones: [
    { label: 'Até 3km',   maxKm: 3,  fee: 5  },
    { label: 'Até 6km',   maxKm: 6,  fee: 8  },
    { label: 'Até 10km',  maxKm: 10, fee: 12 },
    { label: 'Até 15km',  maxKm: 15, fee: 18 },
  ],
  outsideAreaMessage: 'Fora da área de entrega (máx. 15km)',
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
  distanceKm: number
  zone: DeliveryZone | null
  outsideArea: boolean
}

export function calcDeliveryFee(customerLat: number, customerLng: number): FeeResult {
  const config = getDeliveryConfig()
  const distanceKm = haversineKm(config.storeLat, config.storeLng, customerLat, customerLng)
  const sorted = [...config.zones].sort((a, b) => a.maxKm - b.maxKm)
  const zone = sorted.find(z => distanceKm <= z.maxKm) ?? null
  return {
    fee: zone?.fee ?? 0,
    distanceKm: Math.round(distanceKm * 10) / 10,
    zone,
    outsideArea: !zone,
  }
}

// Geocode an address string using OpenStreetMap Nominatim (free, no key)
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(address)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=br`,
      { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'MaisSubApp/1.0' } }
    )
    const data = await res.json()
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {}
  return null
}
