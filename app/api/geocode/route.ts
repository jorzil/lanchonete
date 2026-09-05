import { NextRequest, NextResponse } from 'next/server'
import { geocodificar, googleDisponivel } from '@/lib/google-maps'

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
  const numero = (sp.get('number') ?? '').trim()
  const city = sp.get('city') ?? ''
  const state = sp.get('state') ?? ''
  const cep = sp.get('cep') ?? ''

  // Sem rua não há o que localizar de verdade: qualquer busca só devolveria o
  // centro da cidade. Melhor dizer que não achou do que devolver um ponto que
  // parece bom e não é.
  const temRua = street.replace(/[\s,]/g, '').length > 0

  // Modo "só a cidade": pedido de propósito por quem PRECISA do centro do
  // município — é o gabarito usado para flagrar provedor de CEP que devolve
  // o centro da cidade no lugar da posição do endereço.
  if (sp.get('cidade') === '1' && city) {
    try {
      const hit = await nominatim(new URLSearchParams({ q: [city, state, 'Brasil'].filter(Boolean).join(', ') }))
      if (hit) return NextResponse.json({ ...hit, precisao: 'aproximada' as Precisao })
    } catch {}
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // O Nominatim espera o número JUNTO da rua, no mesmo campo. Com o número a
  // busca cai na casa; sem ele, no meio da rua.
  const ruaComNumero = numero ? `${numero} ${street}` : street

  // Com a chave do Google, ele vem primeiro: conhece o endereço brasileiro
  // muito melhor que o OpenStreetMap, que é onde a conta vinha errando.
  if (googleDisponivel && temRua) {
    const g = await geocodificar(
      [ruaComNumero, city, state].filter(Boolean).join(', '), city, state,
    )
    if (g) {
      return NextResponse.json({
        lat: g.lat, lng: g.lng,
        tipo: g.precisao,
        precisao: g.confiavel ? ('exata' as Precisao) : ('aproximada' as Precisao),
        endereco: g.endereco,
        fonte: 'Google',
      })
    }
  }

  try {
    // 1ª tentativa: rua com número — a mais precisa que existe.
    if (temRua && city && numero) {
      const hit = await nominatim(new URLSearchParams({ street: ruaComNumero, city, state }))
      if (hit?.precisao === 'exata') return NextResponse.json(hit)
    }
    // 2ª tentativa: a rua, sem número.
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
      const q = [ruaComNumero, city, state].filter(Boolean).join(', ')
      const hit = await nominatim(new URLSearchParams({ q }))
      if (hit) return NextResponse.json(hit)
    }
  } catch {}

  return NextResponse.json({ error: 'not_found' }, { status: 404 })
}
