import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Achou a rua/o número, ou só o bairro/a cidade? */
export type Precisao = 'exata' | 'aproximada'

/**
 * Tipos que o Nominatim devolve quando NÃO achou o endereço e caiu no centro
 * de uma área maior. Aceitar isso como se fosse o endereço faz o cliente do
 * bairro afastado ser cobrado como se morasse no centro.
 */
const TIPOS_VAGOS = new Set([
  'city', 'town', 'village', 'municipality', 'county', 'state', 'region',
  'administrative', 'postcode', 'suburb', 'neighbourhood', 'quarter',
  'city_district', 'district', 'political', 'boundary',
])

interface Achado { lat: number; lng: number; precisao: Precisao; tipo: string }

async function nominatim(params: URLSearchParams): Promise<Achado | null> {
  params.set('format', 'json')
  params.set('limit', '1')
  params.set('countrycodes', 'br')
  params.set('addressdetails', '1')
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'MaisSubApp/1.0 (maissub.com.br)' },
    // Nominatim pede no máx. 1 req/s — o cache reduz chamadas repetidas
    next: { revalidate: 86400 },
  })
  if (!res.ok) return null
  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) return null

  const lat = parseFloat(data[0].lat)
  const lng = parseFloat(data[0].lon)
  if (!isFinite(lat) || !isFinite(lng)) return null

  const tipo = String(data[0].addresstype ?? data[0].type ?? '')
  return { lat, lng, tipo, precisao: TIPOS_VAGOS.has(tipo) ? 'aproximada' : 'exata' }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const street = sp.get('street') ?? ''
  const city = sp.get('city') ?? ''
  const state = sp.get('state') ?? ''
  const cep = sp.get('cep') ?? ''

  // Sem rua não há o que localizar de verdade: qualquer busca só devolveria o
  // centro da cidade. Melhor dizer que não achou do que devolver um ponto que
  // parece bom e não é.
  const temRua = street.replace(/[\s,]/g, '').length > 0

  try {
    // 1ª tentativa: busca estruturada (mais precisa)
    if (temRua && city) {
      const hit = await nominatim(new URLSearchParams({ street, city, state }))
      if (hit?.precisao === 'exata') return NextResponse.json(hit)
    }
    // 2ª tentativa: por CEP. No Brasil o Nominatim raramente tem o CEP na
    // ponta, então o que volta costuma ser a área toda — vai como aproximada.
    if (cep) {
      const hit = await nominatim(new URLSearchParams({ postalcode: cep.replace(/\D/g, '') }))
      if (hit) return NextResponse.json({ ...hit, precisao: 'aproximada' as Precisao })
    }
    // 3ª tentativa: texto livre, só se houver rua.
    if (temRua) {
      const q = [street, city, state].filter(Boolean).join(', ')
      const hit = await nominatim(new URLSearchParams({ q }))
      if (hit) return NextResponse.json(hit)
    }
  } catch {}

  return NextResponse.json({ error: 'not_found' }, { status: 404 })
}
