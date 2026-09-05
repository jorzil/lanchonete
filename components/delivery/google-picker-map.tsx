'use client'

import { useEffect, useRef, useState } from 'react'
import type { PontoConfirmado } from './address-picker-map'

/**
 * Mapa do Google para o cliente confirmar onde mora.
 *
 * Mesmo comportamento do irmão em Leaflet — pino fixo no centro, o mapa se
 * move embaixo — mas sobre os dados do Google, que conhece os endereços de
 * cidade do interior que o OpenStreetMap não tem.
 *
 * Existe separado, e não como opção do outro, porque os termos do Google
 * proíbem mostrar dados dele num mapa que não seja o Google Maps. Sem a chave,
 * o site usa o Leaflet e nada do Google é chamado.
 */
interface Props {
  lat: number
  lng: number
  onChange: (ponto: PontoConfirmado) => void
  storeLat?: number
  storeLng?: number
  zoom?: number
  recenterKey?: string | number
}

declare global {
  interface Window {
    google?: typeof google
    __maisSubMapsPromise?: Promise<void>
  }
}

/**
 * Carrega o script do Google uma vez por página.
 *
 * A promessa fica no window de propósito: dois mapas na mesma tela (ou um
 * remontado pelo React) não podem baixar a biblioteca duas vezes — o Google
 * reclama no console e o segundo carregamento sobrescreve o primeiro.
 */
function carregarMaps(chave: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.google?.maps) return Promise.resolve()
  if (window.__maisSubMapsPromise) return window.__maisSubMapsPromise

  window.__maisSubMapsPromise = new Promise<void>((resolva, recuse) => {
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(chave)}&language=pt-BR&region=BR&loading=async`
    s.async = true
    s.onload = () => resolva()
    s.onerror = () => recuse(new Error('falha ao carregar o Google Maps'))
    document.head.appendChild(s)
  })
  return window.__maisSubMapsPromise
}

export default function GooglePickerMap({
  lat, lng, onChange, storeLat, storeLng, zoom = 17, recenterKey,
}: Props) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const onChangeRef = useRef(onChange)
  const [erro, setErro] = useState(false)

  // O callback entra por ref para o mapa não ser recriado a cada re-render do
  // checkout — recriar perderia a posição que o cliente já ajustou.
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  useEffect(() => {
    const chave = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
    if (!chave || !elRef.current || mapRef.current) return
    let vivo = true

    carregarMaps(chave)
      .then(() => {
        if (!vivo || !elRef.current || !window.google?.maps) return
        const map = new window.google.maps.Map(elRef.current, {
          center: { lat, lng },
          zoom,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          clickableIcons: false,
          mapTypeControl: false,
          streetViewControl: false,
        })
        mapRef.current = map

        if (typeof storeLat === 'number' && typeof storeLng === 'number') {
          new window.google.maps.Marker({
            position: { lat: storeLat, lng: storeLng },
            map,
            title: 'Mais Sub',
            clickable: false,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: '#EE5C13',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            },
          })
        }

        // O ponto confirmado é sempre o centro, onde o pino está desenhado.
        map.addListener('idle', () => {
          const c = map.getCenter()
          if (c) onChangeRef.current({ lat: c.lat(), lng: c.lng() })
        })
      })
      .catch(() => { if (vivo) setErro(true) })

    return () => { vivo = false; mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reposiciona só quando a chave muda — nunca no meio de um arraste.
  useEffect(() => {
    if (mapRef.current && recenterKey !== undefined) {
      mapRef.current.panTo({ lat, lng })
      mapRef.current.setZoom(zoom)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterKey])

  if (erro) {
    return (
      <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-6 text-center text-[13px] text-amber-200">
        Não foi possível carregar o mapa. Confira o endereço acima — a loja confirma a taxa pelo WhatsApp.
      </p>
    )
  }

  return (
    // data-lenis-prevent: sem isso a rolagem suave do site engole o gesto.
    <div className="relative" data-lenis-prevent>
      <div ref={elRef} className="h-64 w-full overflow-hidden rounded-xl bg-white/5" />

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-full"
        aria-hidden
      >
        <svg width="36" height="46" viewBox="0 0 36 46" className="drop-shadow-[0_3px_5px_rgba(0,0,0,0.4)]">
          <path d="M18 46 C18 46 33 27 33 17 A15 15 0 1 0 3 17 C3 27 18 46 18 46 Z" fill="#EE5C13" stroke="#fff" strokeWidth="2.5" />
          <circle cx="18" cy="17" r="5.5" fill="#fff" />
        </svg>
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-[4] h-1.5 w-3 -translate-x-1/2 rounded-full bg-black/25 blur-[1px]"
        aria-hidden
      />
    </div>
  )
}
