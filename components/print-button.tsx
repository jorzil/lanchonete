'use client'

import * as React from 'react'
import { useReactToPrint } from 'react-to-print'
import { Printer } from 'lucide-react'

interface PrintButtonProps {
  contentRef: React.RefObject<HTMLDivElement | null>
}

export function PrintButton({ contentRef }: PrintButtonProps) {
  const handlePrint = useReactToPrint({
    content: () => contentRef.current as any,
    documentTitle: 'Pedido',
  })

  return (
    <button
      onClick={() => handlePrint()}
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
      title="Imprimir Pedido"
    >
      <Printer className="h-4 w-4" />
      <span className="sr-only">Imprimir</span>
    </button>
  )
}