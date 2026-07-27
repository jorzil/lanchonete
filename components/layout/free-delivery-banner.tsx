'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X, Truck } from 'lucide-react'
import { pullDeliveryConfig } from '@/lib/delivery-zones'
import { formatCurrency } from '@/lib/data'

/**
 * Aviso de frete grátis — só aparece quando a promoção está ativa em
 * /admin/entrega. Etiqueta vertical na lateral (desktop) e faixa no
 * rodapé (celular). O cliente pode fechar; volta na próxima visita.
 */
export function FreeDeliveryBanner() {
  const [message, setMessage] = useState<string | null>(null)
  const [closed, setClosed] = useState(false)
  const pathname = usePathname()
  // Só no site público — nunca no painel administrativo
  const hidden = pathname?.startsWith('/admin') || pathname?.startsWith('/entrega')

  useEffect(() => {
    if (hidden) return
    if (sessionStorage.getItem('free_delivery_banner_closed') === '1') {
      setClosed(true)
      return
    }
    pullDeliveryConfig()
      .then((cfg) => {
        if (cfg.freeDelivery) {
          setMessage('Entrega grátis em todos os pedidos!')
        } else if ((cfg.freeDeliveryMinOrder ?? 0) > 0) {
          setMessage(`Entrega grátis acima de ${formatCurrency(cfg.freeDeliveryMinOrder!)}`)
        }
      })
      .catch(() => {})
  }, [hidden])

  function close() {
    setClosed(true)
    try { sessionStorage.setItem('free_delivery_banner_closed', '1') } catch {}
  }

  if (hidden || !message || closed) return null

  return (
    <>
      {/* Desktop: etiqueta vertical fixa na lateral esquerda */}
      <div className="hidden lg:flex fixed left-0 top-1/2 -translate-y-1/2 z-40 items-stretch animate-slide-up">
        <div className="flex items-center gap-2 rounded-r-2xl bg-gradient-to-b from-emerald-500 to-emerald-600 py-5 pl-2 pr-1.5 shadow-lg shadow-emerald-900/20">
          <span
            className="text-[13px] font-black uppercase tracking-wider text-white"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            🎉 {message}
          </span>
          <button
            onClick={close}
            aria-label="Fechar aviso"
            className="self-start text-white/60 transition-colors hover:text-white"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Mobile: faixa fixa no rodapé */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40">
        <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 shadow-lg">
          <Truck size={15} className="shrink-0 text-white" />
          <p className="flex-1 text-[13px] font-bold text-white leading-tight">🎉 {message}</p>
          <button onClick={close} aria-label="Fechar aviso" className="shrink-0 text-white/70 hover:text-white">
            <X size={15} />
          </button>
        </div>
      </div>
    </>
  )
}
