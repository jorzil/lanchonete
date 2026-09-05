/**
 * Google Maps Platform — geocodificação, sugestões de endereço e rota real.
 *
 * Existe porque o OpenStreetMap não conhece boa parte dos endereços de cidades
 * do interior: devolvia o centro do município e o frete saía errado. O Google
 * conhece.
 *
 * Tudo aqui roda NO SERVIDOR, com a chave que nunca chega ao navegador. Sem a
 * chave configurada, cada função devolve null e o sistema segue no caminho
 * antigo — nada quebra, só fica menos preciso.
 */

const CHAVE = process.env.GOOGLE_MAPS_API_KEY ?? ''

export const googleDisponivel = CHAVE.length > 0

/** Tempo máximo de espera. O checkout não pode travar por causa de um mapa. */
const TEMPO_LIMITE = 7000

async function pedir(url: string, opcoes?: RequestInit): Promise<unknown | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TEMPO_LIMITE)
  try {
    const res = await fetch(url, { ...opcoes, signal: ctrl.signal })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

// ─── Geocodificação ──────────────────────────────────────────────────────────

export interface GoogleGeo {
  lat: number
  lng: number
  /** Endereço formatado como o Google entendeu — bom para o cliente conferir. */
  endereco: string
  /**
   * Quão fundo o Google chegou:
   *   ROOFTOP            = o telhado da casa
   *   RANGE_INTERPOLATED = interpolado entre dois números da rua
   *   GEOMETRIC_CENTER   = centro de uma rua ou polígono
   *   APPROXIMATE        = aproximado (bairro, cidade)
   */
  precisao: string
  /** true quando dá para cobrar por distância a partir daqui. */
  confiavel: boolean
}

const PRECISAO_BOA = new Set(['ROOFTOP', 'RANGE_INTERPOLATED', 'GEOMETRIC_CENTER'])

/**
 * Endereço em texto → coordenada.
 *
 * `region` e `components` prendem a busca ao Brasil e à cidade certa: sem
 * isso, "Rua 7 de Setembro" acha uma em cada capital do país.
 */
export async function geocodificar(
  endereco: string,
  cidade?: string,
  uf?: string,
): Promise<GoogleGeo | null> {
  if (!googleDisponivel || !endereco.trim()) return null

  const p = new URLSearchParams({ address: endereco, key: CHAVE, region: 'br', language: 'pt-BR' })
  const componentes = ['country:BR']
  if (cidade) componentes.push(`locality:${cidade}`)
  if (uf) componentes.push(`administrative_area:${uf}`)
  p.set('components', componentes.join('|'))

  const d = await pedir(`https://maps.googleapis.com/maps/api/geocode/json?${p.toString()}`) as
    { status?: string; results?: Array<{ geometry?: { location?: { lat?: number; lng?: number }; location_type?: string }; formatted_address?: string }> } | null

  if (!d || d.status !== 'OK' || !d.results?.length) return null
  const r = d.results[0]
  const lat = r.geometry?.location?.lat
  const lng = r.geometry?.location?.lng
  if (typeof lat !== 'number' || typeof lng !== 'number') return null

  const precisao = r.geometry?.location_type ?? 'APPROXIMATE'
  return {
    lat, lng,
    endereco: r.formatted_address ?? endereco,
    precisao,
    confiavel: PRECISAO_BOA.has(precisao),
  }
}

// ─── Sugestões de endereço (o "digite e escolha" do iFood) ───────────────────

export interface Sugestao {
  id: string
  /** Linha principal: a rua com o número. */
  principal: string
  /** Linha secundária: bairro, cidade. */
  secundaria: string
}

/**
 * Sugere endereços enquanto o cliente digita.
 *
 * A busca é enviesada para perto da loja (`origem` + raio), então o que
 * aparece primeiro são endereços da própria cidade, e não homônimos de São
 * Paulo. `sessionToken` agrupa as teclas digitadas numa busca só — é assim
 * que o Google cobra por busca em vez de por tecla.
 */
export async function sugerirEnderecos(
  texto: string,
  origem: { lat: number; lng: number },
  sessionToken: string,
  raioMetros = 30000,
): Promise<Sugestao[]> {
  if (!googleDisponivel || texto.trim().length < 3) return []

  const d = await pedir('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': CHAVE },
    body: JSON.stringify({
      input: texto,
      languageCode: 'pt-BR',
      regionCode: 'BR',
      sessionToken,
      includedRegionCodes: ['br'],
      locationBias: {
        circle: { center: { latitude: origem.lat, longitude: origem.lng }, radius: raioMetros },
      },
    }),
  }) as { suggestions?: Array<{ placePrediction?: { placeId?: string; structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } } } }> } | null

  if (!d?.suggestions) return []
  return d.suggestions
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => !!p?.placeId)
    .map((p) => ({
      id: p.placeId as string,
      principal: p.structuredFormat?.mainText?.text ?? '',
      secundaria: p.structuredFormat?.secondaryText?.text ?? '',
    }))
}

export interface EnderecoEscolhido {
  lat: number
  lng: number
  logradouro: string
  numero: string
  bairro: string
  cidade: string
  uf: string
  cep: string
  enderecoCompleto: string
}

/** Detalhe do endereço que o cliente escolheu na lista. */
export async function detalharEndereco(
  placeId: string,
  sessionToken: string,
): Promise<EnderecoEscolhido | null> {
  if (!googleDisponivel || !placeId) return null

  const p = new URLSearchParams({ languageCode: 'pt-BR', sessionToken })
  const d = await pedir(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?${p}`, {
    headers: {
      'X-Goog-Api-Key': CHAVE,
      'X-Goog-FieldMask': 'location,formattedAddress,addressComponents',
    },
  }) as {
    location?: { latitude?: number; longitude?: number }
    formattedAddress?: string
    addressComponents?: Array<{ longText?: string; shortText?: string; types?: string[] }>
  } | null

  const lat = d?.location?.latitude
  const lng = d?.location?.longitude
  if (typeof lat !== 'number' || typeof lng !== 'number') return null

  const pegar = (tipo: string, curto = false) => {
    const c = d?.addressComponents?.find((x) => x.types?.includes(tipo))
    return (curto ? c?.shortText : c?.longText) ?? ''
  }

  return {
    lat, lng,
    logradouro: pegar('route'),
    numero: pegar('street_number'),
    // No Brasil o bairro vem em sublocality_level_1; alguns lugares só têm sublocality.
    bairro: pegar('sublocality_level_1') || pegar('sublocality') || pegar('neighborhood'),
    cidade: pegar('administrative_area_level_2') || pegar('locality'),
    uf: pegar('administrative_area_level_1', true),
    cep: pegar('postal_code'),
    enderecoCompleto: d?.formattedAddress ?? '',
  }
}

// ─── Distância real de rota ──────────────────────────────────────────────────

/**
 * Quilômetros que o entregador realmente percorre, pelas ruas.
 *
 * Substitui o "fator de rota" — aquele 1,35 que era uma média chutada sobre a
 * linha reta. Aqui a conta considera mão única, rio e contorno de quarteirão.
 * Devolve null quando o Google não responde, e aí o fator volta a valer.
 */
export async function distanciaDeRotaKm(
  de: { lat: number; lng: number },
  para: { lat: number; lng: number },
): Promise<number | null> {
  if (!googleDisponivel) return null

  const d = await pedir('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': CHAVE,
      'X-Goog-FieldMask': 'routes.distanceMeters',
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: de.lat, longitude: de.lng } } },
      destination: { location: { latLng: { latitude: para.lat, longitude: para.lng } } },
      travelMode: 'TWO_WHEELER',
      routingPreference: 'TRAFFIC_UNAWARE',
      languageCode: 'pt-BR',
      units: 'METRIC',
    }),
  }) as { routes?: Array<{ distanceMeters?: number }> } | null

  const metros = d?.routes?.[0]?.distanceMeters
  if (typeof metros !== 'number' || metros <= 0) return null
  return metros / 1000
}
