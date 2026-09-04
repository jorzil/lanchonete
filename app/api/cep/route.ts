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
  /**
   * O que cada provedor respondeu de coordenada. Aparece no simulador do
   * painel: é aqui que se enxerga um provedor devolvendo o centro da cidade
   * em vez do CEP, que é o defeito que faz endereço longe sair barato.
   */
  coordenadas?: { fonte: string; lat: number; lng: number }[]
  /** Provedores discordaram muito: a coordenada não é confiável. */
  divergencia?: { km: number; motivo: string }
  /** Provedores flagrados devolvendo o centro do município. */
  centroide?: { fontes: string[]; motivo: string }
}

/** Distância em linha reta entre dois pontos, em km. */
function distanciaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(h))
}

/**
 * Quanto os provedores podem discordar antes de a coordenada virar suspeita.
 *
 * Dentro de uma cidade, dois cadastros do mesmo CEP não deveriam ficar a mais
 * de um quilômetro e meio um do outro. Quando ficam, quase sempre é um deles
 * devolvendo o centro do município — e aí é melhor não cobrar por distância.
 */
const DIVERGENCIA_MAXIMA_KM = 1.5

/**
 * Abaixo disso, dois CEPs diferentes estão no MESMO ponto — o que não existe
 * na vida real. Quando um provedor devolve o mesmo ponto para o CEP do cliente
 * e para o da loja, ele não está dando a posição do CEP: está dando o centro
 * do município, e cobrar distância a partir dali faz endereço de 11km sair
 * pela faixa mais barata.
 */
const MESMO_PONTO_KM = 0.15

/**
 * Raio em torno do centro do município dentro do qual a coordenada de um CEP
 * é considerada suspeita.
 *
 * Comparar o CEP do cliente com o da loja não basta: se a loja fica perto do
 * centro e tem coordenada boa, os dois pontos ficam a algumas centenas de
 * metros e o teste não acusa. Comparar com o centro do município em si acusa,
 * porque é exatamente ali que o provedor deposita todo CEP que não conhece.
 */
const RAIO_CENTRO_KM = 0.4

/** Centro do município, para o teste acima. Vem do nosso /api/geocode. */
async function centroDaCidade(cidade: string, uf: string, origem: string) {
  if (!cidade) return null
  try {
    const url = new URL('/api/geocode', origem)
    url.searchParams.set('cidade', '1')
    url.searchParams.set('city', cidade)
    url.searchParams.set('state', uf)
    const res = await fetch(url.toString())
    if (!res.ok) return null
    const d = await res.json()
    const lat = num(d.lat), lng = num(d.lng)
    return lat !== null && lng !== null ? { lat, lng } : null
  } catch {
    return null
  }
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
  // CEP da loja, para flagrar provedor que devolve o centro do município.
  const ref = (req.nextUrl.searchParams.get('ref') ?? '').replace(/\D/g, '')
  if (cep.length !== 8) {
    return NextResponse.json({ error: 'CEP inválido' }, { status: 400 })
  }

  // Os dois que dão coordenada vão juntos, para poderem ser comparados. O CEP
  // da loja vai na mesma leva: é o gabarito do teste de centro de cidade.
  const usarRef = ref.length === 8 && ref !== cep
  const [b, a, refB, refA] = await Promise.all([
    brasilApi(cep), awesomeApi(cep),
    usarRef ? brasilApi(ref) : Promise.resolve(null),
    usarRef ? awesomeApi(ref) : Promise.resolve(null),
  ])
  let info: CepInfo | null = b ?? a ?? (await viaCep(cep))
  if (!info) {
    return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 })
  }

  // Endereço: fica o mais completo, venha de quem vier.
  if (b && a) {
    info = {
      ...info,
      logradouro: b.logradouro || a.logradouro,
      bairro: b.bairro || a.bairro,
    }
  }

  const todas = [b, a]
    .filter((x): x is CepInfo => !!x && x.lat !== null && x.lng !== null)
    .map((x) => ({ fonte: x.fonte, lat: x.lat as number, lng: x.lng as number }))

  // Provedor que devolve o MESMO ponto para dois CEPs diferentes está dando o
  // centro do município. A coordenada dele não serve para medir distância.
  const referencias = new Map<string, { lat: number; lng: number }>()
  for (const r of [refB, refA]) {
    if (r && r.lat !== null && r.lng !== null) referencias.set(r.fonte, { lat: r.lat, lng: r.lng })
  }
  // Segundo teste, e o que de fato pega o caso comum: a coordenada caiu em
  // cima do centro do município.
  const centro = todas.length > 0
    ? await centroDaCidade(info.cidade, info.uf, req.nextUrl.origin)
    : null

  const suspeitas: string[] = []
  const coordenadas = todas.filter((c) => {
    const daLoja = referencias.get(c.fonte)
    if (daLoja && distanciaKm(c, daLoja) < MESMO_PONTO_KM) {
      suspeitas.push(`${c.fonte} (mesmo ponto do CEP da loja)`)
      return false
    }
    if (centro && distanciaKm(c, centro) < RAIO_CENTRO_KM) {
      suspeitas.push(`${c.fonte} (em cima do centro da cidade)`)
      return false
    }
    return true
  })

  if (coordenadas.length === 0 && suspeitas.length > 0) {
    return NextResponse.json({
      ...info, lat: null, lng: null, origemCoordenada: null, coordenadas: todas,
      centroide: {
        fontes: suspeitas,
        motivo: `${suspeitas.join(' e ')} — não é a posição do endereço, e cobrar distância a partir dali faria um CEP distante sair pela faixa mais barata`,
      },
    })
  }

  if (coordenadas.length === 2) {
    const afastamento = distanciaKm(coordenadas[0], coordenadas[1])
    if (afastamento > DIVERGENCIA_MAXIMA_KM) {
      // Um dos dois está errado e não há como saber qual. Cobrar por distância
      // aqui é apostar — melhor cair na taxa do bairro ou na de indefinição.
      return NextResponse.json({
        ...info, lat: null, lng: null, origemCoordenada: null, coordenadas,
        divergencia: {
          km: Math.round(afastamento * 10) / 10,
          motivo: `${coordenadas[0].fonte} e ${coordenadas[1].fonte} apontam lugares a ${afastamento.toFixed(1)}km um do outro`,
        },
      })
    }
    // Concordaram: fica a média, mais estável que qualquer uma das duas.
    info = {
      ...info,
      lat: (coordenadas[0].lat + coordenadas[1].lat) / 2,
      lng: (coordenadas[0].lng + coordenadas[1].lng) / 2,
      origemCoordenada: 'cep',
      fonte: `${coordenadas[0].fonte} + ${coordenadas[1].fonte}`,
    }
  } else if (coordenadas.length === 1) {
    info = { ...info, lat: coordenadas[0].lat, lng: coordenadas[0].lng, origemCoordenada: 'cep', fonte: coordenadas[0].fonte }
  }

  if (info.lat === null) info = await coordenadaPelaRua(info, req.nextUrl.origin)

  return NextResponse.json({
    ...info,
    coordenadas: todas,
    ...(suspeitas.length > 0 ? {
      centroide: {
        fontes: suspeitas,
        motivo: `${suspeitas.join(' e ')} — descartado; a coordenada usada veio dos demais`,
      },
    } : {}),
  })
}
