'use client'

import { useEffect, useState, useCallback } from 'react'
import { Store, Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getStoreStatus,
  setManualOverride,
  getNextEvent,
  computeIsOpen,
  type StoreStatus,
} from '@/lib/store-status'

export function StoreStatusWidget() {
  const [status, setStatus] = useState<StoreStatus | null>(null)

  const refresh = useCallback(() => {
    setStatus(getStoreStatus())
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [refresh])

  if (!status) return null

  const isOpen = computeIsOpen(status)
  const nextEvent = getNextEvent(status.schedule)

  function toggle() {
    const next = setManualOverride(isOpen ? false : true)
    setStatus(next)
  }

  function clearOverride() {
    const next = setManualOverride(null)
    setStatus(next)
  }

  return (
    <div className={cn(
      'flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium border transition-all cursor-pointer select-none',
      isOpen
        ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
        : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
    )}>
      <span className={cn(
        'h-2 w-2 rounded-full shrink-0',
        isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'
      )} />

      <button onClick={toggle} className="flex items-center gap-1">
        <Store className="h-3 w-3" />
        <span>{isOpen ? 'Loja Aberta' : 'Loja Fechada'}</span>
      </button>

      {nextEvent && (
        <span className="hidden sm:flex items-center gap-0.5 text-[10px] opacity-70">
          <ChevronRight className="h-3 w-3" />
          <Clock className="h-2.5 w-2.5" />
          {nextEvent.type === 'close' ? 'Fecha' : 'Abre'} {nextEvent.day} às {nextEvent.time}
        </span>
      )}

      {status.manualOverride !== null && (
        <button
          onClick={(e) => { e.stopPropagation(); clearOverride() }}
          className="ml-1 text-[9px] opacity-60 underline hover:opacity-100"
          title="Voltar ao horário automático"
        >
          auto
        </button>
      )}
    </div>
  )
}
