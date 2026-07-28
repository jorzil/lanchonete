'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Props {
  /** Posição atual do entregador */
  lat: number
  lng: number
  /** Destino (endereço do cliente), quando conhecido */
  destLat?: number
  destLng?: number
}

/** Ícone da moto — SVG inline, sem depender de imagens externas. */
const courierIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:40px;height:40px">
      <span style="position:absolute;inset:0;border-radius:9999px;background:#10b98155;animation:courier-ping 1.6s cubic-bezier(0,0,.2,1) infinite"></span>
      <span style="position:absolute;inset:6px;border-radius:9999px;background:#10b981;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:14px">🛵</span>
    </div>
    <style>@keyframes courier-ping{75%,100%{transform:scale(1.9);opacity:0}}</style>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
})

const destIcon = L.divIcon({
  className: '',
  html: `<div style="width:26px;height:26px;border-radius:9999px;background:#EE5C13;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:13px">🏠</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
})

export function CourierMap({ lat, lng, destLat, destLng }: Props) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const lineRef = useRef<L.Polyline | null>(null)
  const animRef = useRef<number | null>(null)

  // Cria o mapa uma única vez
  useEffect(() => {
    if (!elRef.current || mapRef.current) return
    const map = L.map(elRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map)
    markerRef.current = L.marker([lat, lng], { icon: courierIcon }).addTo(map)
    mapRef.current = map
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Destino do cliente
  useEffect(() => {
    const map = mapRef.current
    if (!map || destLat == null || destLng == null) return
    const dest = L.marker([destLat, destLng], { icon: destIcon }).addTo(map)
    return () => { dest.remove() }
  }, [destLat, destLng])

  // Move o marcador suavemente até a nova posição (sem "pulo")
  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return

    const from = marker.getLatLng()
    const to = L.latLng(lat, lng)
    // Primeira posição ou salto muito grande: vai direto
    if (from.distanceTo(to) > 3000) {
      marker.setLatLng(to)
      map.setView(to, map.getZoom())
    } else {
      const start = performance.now()
      const dur = 1200
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / dur)
        // easing suave
        const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
        marker.setLatLng(L.latLng(
          from.lat + (to.lat - from.lat) * e,
          from.lng + (to.lng - from.lng) * e,
        ))
        if (t < 1) animRef.current = requestAnimationFrame(step)
      }
      animRef.current = requestAnimationFrame(step)
    }

    // Linha até o destino + enquadramento dos dois pontos
    if (destLat != null && destLng != null) {
      const pts: L.LatLngExpression[] = [[lat, lng], [destLat, destLng]]
      if (lineRef.current) lineRef.current.setLatLngs(pts)
      else lineRef.current = L.polyline(pts, { color: '#10b981', weight: 3, opacity: 0.6, dashArray: '6 8' }).addTo(map)
      map.fitBounds(L.latLngBounds(pts).pad(0.35), { animate: true })
    } else {
      map.panTo(to, { animate: true, duration: 1 })
    }

    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [lat, lng, destLat, destLng])

  return <div ref={elRef} className="h-72 w-full" />
}

export default CourierMap
