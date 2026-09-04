import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Consulta de CEP feita no servidor, encadeando provedores.
 *
 * Antes o navegador do cliente chamava o ViaCEP direto. Quando aquela chamada
 * falha — rede do celular, bloqueio, provedor fora do ar — o endereço não é
 * encontrado e o pedido inteiro fica sem taxa correta. Aqui:
 *
 *   - a chamada sai do servidor, então não depende da rede do cliente;
 *   - se um provedor falha, o próximo tenta;
 *   - os dois primeiros já devolvem LATITUDE E LONGITUDE do CEP, que é bem
 *     mais confiável que geocodificar o nome da rua no OpenStreetMap — que é
 *     onde a conta de distância vinha errando em bairro afastado.
 */

export interface CepInfo {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
  lat: number | null
  lng: number | null
  /** Qual provedor respondeu — aparece no simulador do painel. */
  fonte: string
  /** 'cep' = coordenada do próprio CEP. 'rua' = geocodificada. null = sem coordenada. */
  origemCoordenada: 'cep' | 'rua' | null
}

const TEMPO_LIMITE = 6000

async function buscar(url: string, opcoes?: RequestInit) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TEMPO_LIMITE)
  try {
    const res = await fetch(url, {
      ...opcoes,
      signal: ctrl.signal,
      headers: { 'User-Agent': 'MaisSubApp/1.0 (maissub.com.br)', ...(opcoes?.headers ?? {}) },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN
  return isFinite(n) ? n : null
}

/** BrasilAPI v2 — endereço e, na maioria dos CEPs, a coordenada. */
async function brasilApi(cep: string): Promise<CepInfo | null> {
  const d = await buscar(`https://brasilapi.com.br/api/cep/v2/${cep}`)
  if (!d || !d.city) return null
  const lat = num(d.location?.coordinates?.latitude)
  const lng = num(d.location?.coordinates?.longitude)
  return {
    cep, logradouro: d.street ?? '', bairro: d.neighborhood ?? '',
    cidade: d.city, uf: d.state ?? '',
    lat, lng, fonte: 'BrasilAPI', origemCoordenada: lat && lng ? 'cep' : null,
  }
}

/** AwesomeAPI — também traz coordenada, e cobre CEPs que a BrasilAPI não tem. */
async function awesomeApi(cep: string): Promise<CepInfo | null> {
  const d = await buscar(`https://cep.awesomeapi.com.br/json/${cep}`)
  if (!d || !d.city || d.status === 404) return null
  const lat = num(d.lat)
  const lng = num(d.lng)
  return {
    cep, logradouro: d.address ?? '', bairro: d.district ?? '',
    cidade: d.city, uf: d.state ?? '',
    lat, lng, fonte: 'AwesomeAPI', origemCoordenada: lat && lng ? 'cep' : null,
  }
}

/** ViaCEP — o mais conhecido, mas só endereço, sem coordenada. */
async function viaCep(cep: string): Promise<CepInfo | null> {
  const d = await buscar(`https://viacep.com.br/ws/${cep}/json/`)
  if (!d || d.erro || !d.localidade) return null
  return {
    cep, logradouro: d.logradouro ?? '', bairro: d.bairro ?? '',
    cidade: d.localidade, uf: d.uf ?? '',
    lat: null, lng: null, fonte: 'ViaCEP', origemCoordenada: null,
  }
}

/** Último recurso: geocodifica a rua. Só serve se o CEP tiver logradouro. */
async function coordenadaPelaRua(info: CepInfo, origem: string): Promise<CepInfo> {
  if (!info.logradouro) return info
  try {
    const url = new URL('/api/geocode', origem)
    url.searchParams.set('street', `${info.logradouro}, ${info.bairro}`)
    url.searchParams.set('city', info.cidade)
    url.searchParams.set('state', info.uf)
    const res = await fetch(url.toString())
    if (!res.ok) return info
    const d = await res.json()
    // Ponto aproximado é o centro do bairro ou da cidade: não serve para
    // cobrar por distância, cobraria de quem mora longe o preço do centro.
    if (d.precisao !== 'exata') return info
    const lat = num(d.lat), lng = num(d.lng)
    if (lat === null || lng === null) return info
    return { ...info, lat, lng, origemCoordenada: 'rua', fonte: `${info.fonte} + mapa` }
  } catch {
    return info
  }
}

export async function GET(req: NextRequest) {
  const cep = (req.nextUrl.searchParams.get('cep') ?? '').replace(/\D/g, '')
  if (cep.length !== 8) {
    return NextResponse.json({ error: 'CEP inválido' }, { status: 400 })
  }

  // Em ordem: quem dá coordenada primeiro, quem só dá endereço depois.
  let info: CepInfo | null = null
  for (const provedor of [brasilApi, awesomeApi, viaCep]) {
    info = await provedor(cep)
    if (info) break
  }
  if (!info) {
    return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 })
  }

  if (info.lat === null) info = await coordenadaPelaRua(info, req.nextUrl.origin)

  return NextResponse.json(info)
}
