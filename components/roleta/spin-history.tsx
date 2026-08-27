'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { redemptionStatus, type Redemption } from '@/lib/loyalty'

const ROTULO = {
  disponivel: { texto: 'Disponível', cor: 'text-emerald-400', bolinha: 'bg-emerald-400' },
  usado: { texto: 'Utilizado', cor: 'text-white/40', bolinha: 'bg-white/30' },
  expirado: { texto: 'Expirado', cor: 'text-red-400', bolinha: 'bg-red-400' },
  cancelado: { texto: 'Cancelado', cor: 'text-white/40', bolinha: 'bg-white/30' },
} as const

/** Um prêmio ganho, com cupom, validade e situação. */
export function PrizeCard({ premio }: { premio: Redemption }) {
  const [copiado, setCopiado] = useState(false)
  const status = redemptionStatus(premio)
  const r = ROTULO[status]
  const usavel = status === 'disponivel' && !!premio.couponCode

  async function copiar() {
    if (!premio.couponCode) return
    try {
      await navigator.clipboard.writeText(premio.couponCode)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {}
  }

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.04] p-4 ${usavel ? '' : 'opacity-60'}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>{premio.icone ?? '🎁'}</span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">{premio.rewardNome}</p>
          <p className="text-[12px] text-white/35">
            {new Date(premio.at).toLocaleDateString('pt-BR')}
            {premio.expiresAt && ` · vale até ${new Date(premio.expiresAt).toLocaleDateString('pt-BR')}`}
          </p>
          <p className={`mt-1 flex items-center gap-1.5 text-[12px] font-bold ${r.cor}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${r.bolinha}`} aria-hidden />
            {r.texto}
          </p>
        </div>
        {premio.couponCode && (
          <button
            onClick={copiar}
            disabled={!usavel}
            aria-label={`Copiar cupom ${premio.couponCode}`}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 font-mono text-[12px] font-bold text-brand transition-colors hover:bg-brand/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copiado ? <Check size={13} /> : <Copy size={13} />}
            {premio.couponCode}
          </button>
        )}
      </div>
    </div>
  )
}

/** Lista "Meus prêmios" — só o que veio da roleta. */
export function SpinHistory({ resgates }: { resgates: Redemption[] }) {
  const daRoleta = resgates.filter((r) => r.rewardId.startsWith('roleta:') && r.couponCode)
  if (daRoleta.length === 0) return null

  return (
    <section className="space-y-2">
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-white/40">Meus prêmios</h2>
      {daRoleta.map((r) => <PrizeCard key={r.id} premio={r} />)}
      <p className="text-[11px] text-white/30">
        Use o código no campo de cupom do checkout. Cada cupom vale uma vez.
      </p>
    </section>
  )
}
