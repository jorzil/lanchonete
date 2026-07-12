import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Geocodificação server-side via OpenStreetMap Nominatim.
// Feita no servidor para evitar bloqueios/limites no navegador do cliente.
async function nominatim(params: URLSearchParams): Promise<{ lat: number; lng: number } | null> {
  params.set('format', 'json')
  params.set('limit', '1')
  params.set('countrycodes', 'br')
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'MaisSubApp/1.0 (maissub.com.br)' },
    // Nominatim pede no máx. 1 req/s — o cache reduz chamadas repetidas
    next: { revalidate: 86400 },
  })
  if (!res.ok) return null
  const data = await res.json()
  if (Array.isArray(data) && data.length > 0) {
    const lat = parseFloat(data[0].lat)
    const lng = parseFloat(data[0].lon)
    if (isFinite(lat) && isFinite(lng)) return { lat, lng }
  }
  return null
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const street = sp.get('street') ?? ''
  const city = sp.get('city') ?? ''
  const state = sp.get('state') ?? ''
  const cep = sp.get('cep') ?? ''

  try {
    // 1ª tentativa: busca estruturada (mais precisa)
    if (street && city) {
      const p = new URLSearchParams({ street, city, state })
      const hit = await nominatim(p)
      if (hit) return NextResponse.json(hit)
    }
    // 2ª tentativa: por CEP
    if (cep) {
      const p = new URLSearchParams({ postalcode: cep.replace(/\D/g, '') })
      const hit = await nominatim(p)
      if (hit) return NextResponse.json(hit)
    }
    // 3ª tentativa: texto livre
    const q = [street, city, state].filter(Boolean).join(', ')
    if (q) {
      const hit = await nominatim(new URLSearchParams({ q }))
      if (hit) return NextResponse.json(hit)
    }
  } catch {}
  return NextResponse.json({ error: 'not_found' }, { status: 404 })
}
