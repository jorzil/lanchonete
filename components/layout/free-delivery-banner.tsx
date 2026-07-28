'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X, Truck } from 'lucide-react'
import { pullDeliveryConfig } from '@/lib/delivery-zones'
import { formatCurrency } from '@/lib/data'
import { useCart } from '@/contexts/cart-context'

/**
 * Barra de aviso no topo do site — só aparece quando o frete grátis está
 * ativo em /admin/entrega. O texto rola continuamente (marquee) e o header
 * é deslocado para baixo via a classe `has-promo-bar` no <body>.
 */
export function FreeDeliveryBanner() {
  const [message, setMessage] = useState<string | null>(null)
  const [closed, setClosed] = useState(false)
  const pathname = usePathname()
  const { isOpen: cartOpen } = useCart()
  // Só nas telas de compra — fora do admin, da área de entregas e do
  // acompanhamento (quem já pediu não precisa da promoção)
  const isInternal =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/entrega') ||
    pathname?.startsWith('/acompanhar')
  // Some também enquanto o carrinho estiver aberto
  const hidden = isInternal || cartOpen

  useEffect(() => {
    if (isInternal) return
    if (sessionStorage.getItem('free_delivery_banner_closed') === '1') {
      setClosed(true)
      return
    }
    pullDeliveryConfig()
      .then((cfg) => {
        if (cfg.freeDelivery) {
          setMessage('Entrega GRÁTIS em todos os pedidos')
        } else if ((cfg.freeDeliveryMinOrder ?? 0) > 0) {
          setMessage(`Entrega GRÁTIS acima de ${formatCurrency(cfg.freeDeliveryMinOrder!)}`)
        }
      })
      .catch(() => {})
  }, [isInternal])

  // Desloca o header enquanto a barra estiver visível
  const visible = !hidden && !!message && !closed
  useEffect(() => {
    document.body.classList.toggle('has-promo-bar', visible)
    return () => document.body.classList.remove('has-promo-bar')
  }, [visible])

  function close() {
    setClosed(true)
    try { sessionStorage.setItem('free_delivery_banner_closed', '1') } catch {}
  }

  if (!visible) return null

  // Repete o texto para a rolagem ficar contínua, sem "buracos"
  const items = Array.from({ length: 6 })

  return (
    <div className="fixed top-0 inset-x-0 z-[60] h-9 overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 shadow-md">
      <div className="promo-marquee flex h-full w-max items-center gap-8 pr-8">
        {items.map((_, i) => (
          <span key={i} className="flex shrink-0 items-center gap-2 text-[13px] font-black uppercase tracking-wider text-white">
            <Truck size={14} className="shrink-0" />
            🎉 {message}
          </span>
        ))}
        {/* Segunda cópia: garante o loop sem emenda */}
        {items.map((_, i) => (
          <span key={`b${i}`} className="flex shrink-0 items-center gap-2 text-[13px] font-black uppercase tracking-wider text-white">
            <Truck size={14} className="shrink-0" />
            🎉 {message}
          </span>
        ))}
      </div>

      <button
        onClick={close}
        aria-label="Fechar aviso"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/15 p-1 text-white/80 transition-colors hover:bg-black/30 hover:text-white"
      >
        <X size={13} />
      </button>

      <style jsx>{`
        .promo-marquee {
          animation: promo-scroll 28s linear infinite;
        }
        @keyframes promo-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .promo-marquee { animation: none; }
        }
      `}</style>
    </div>
  )
}
