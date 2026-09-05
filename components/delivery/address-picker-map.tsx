'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/**
 * Mapa para o cliente confirmar ONDE fica a casa dele.
 *
 * Existe porque as bases de CEP não sabem onde ficam boa parte dos endereços
 * de cidades do interior: devolvem o centro do município, e um endereço a 11km
 * acabava cobrado como se fosse ao lado da loja. O cliente sabe onde mora —
 * então é ele quem dá a coordenada.
 *
 * O pino NÃO é um marcador arrastável: é um elemento fixo no centro da tela e
 * quem se move é o mapa embaixo dele. É como o iFood faz, e por um bom motivo:
 * acertar um alvo de 30px com o dedo é difícil, arrastar o mapa inteiro não.
 */
export interface PontoConfirmado { lat: number; lng: number }

interface Props {
  /** Onde o mapa abre. */
  lat: number
  lng: number
  /** Chamado quando o mapa para de se mover, com o ponto sob o pino. */
  onChange: (ponto: PontoConfirmado) => void
  /** Loja, desenhada como referência para o cliente se situar. */
  storeLat?: number
  storeLng?: number
  zoom?: number
  /**
   * Muda para reposicionar o mapa (ex: chegou um CEP novo). Não usamos
   * [lat, lng] como dependência de propósito: isso puxaria o mapa de volta
   * enquanto o cliente ainda está arrastando.
   */
  recenterKey?: string | number
}

const iconeLoja = L.divIcon({
  className: '',
  html: `<div style="width:26px;height:26px;border-radius:9999px;background:#EE5C13;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:13px">🥖</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
})

export default function AddressPickerMap({
  lat, lng, onChange, storeLat, storeLng, zoom = 17, recenterKey,
}: Props) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const onChangeRef = useRef(onChange)

  // O callback entra por ref para o mapa não precisar ser recriado quando o
  // checkout re-renderiza — recriar o mapa a cada tecla digitada seria caro e
  // ainda perderia a posição que o cliente já ajustou.
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  useEffect(() => {
    if (!elRef.current || mapRef.current) return

    const map = L.map(elRef.current, {
      center: [lat, lng],
      zoom,
      zoomControl: true,
      // Atribuição LIGADA: os tiles do OpenStreetMap são gratuitos, mas a
      // política de uso exige o crédito. Sem ele podem cortar o acesso.
      attributionControl: true,
      // A roda do mouse fica com a página: o site usa rolagem suave (Lenis) e
      // as duas brigariam. Quem quiser aproximar usa os botões ou os dedos.
      scrollWheelZoom: false,
    })
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)

    if (typeof storeLat === 'number' && typeof storeLng === 'number') {
      L.marker([storeLat, storeLng], { icon: iconeLoja, interactive: false })
        .addTo(map)
        .bindTooltip('Mais Sub', { permanent: false })
    }

    // O ponto confirmado é sempre o centro do mapa, onde o pino está desenhado.
    const avisar = () => {
      const c = map.getCenter()
      onChangeRef.current({ lat: c.lat, lng: c.lng })
    }
    map.on('moveend', avisar)

    // Container que nasce escondido (dentro de um bloco que só aparece no modo
    // entrega) faz o Leaflet calcular tamanho zero e pintar tudo cinza.
    const t = setTimeout(() => map.invalidateSize(), 200)

    return () => {
      clearTimeout(t)
      map.off('moveend', avisar)
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reposiciona só quando a chave muda — nunca no meio de um arraste.
  useEffect(() => {
    if (mapRef.current && recenterKey !== undefined) {
      mapRef.current.setView([lat, lng], zoom, { animate: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterKey])

  return (
    // data-lenis-prevent: sem isso a rolagem suave do site engole o gesto
    // dentro do mapa e o cliente não consegue arrastar.
    <div className="relative" data-lenis-prevent>
      <div ref={elRef} className="h-64 w-full rounded-xl" />

      {/* O pino. Fica por cima, no centro exato, e não recebe toque — quem
          recebe o gesto é o mapa embaixo. */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-full"
        aria-hidden
      >
        <svg width="36" height="46" viewBox="0 0 36 46" className="drop-shadow-[0_3px_5px_rgba(0,0,0,0.4)]">
          <path d="M18 46 C18 46 33 27 33 17 A15 15 0 1 0 3 17 C3 27 18 46 18 46 Z" fill="#EE5C13" stroke="#fff" strokeWidth="2.5" />
          <circle cx="18" cy="17" r="5.5" fill="#fff" />
        </svg>
      </div>

      {/* Sombrinha sob a ponta do pino, para dar a noção de onde ele "toca" */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-[499] h-1.5 w-3 -translate-x-1/2 rounded-full bg-black/25 blur-[1px]"
        aria-hidden
      />
    </div>
  )
}
