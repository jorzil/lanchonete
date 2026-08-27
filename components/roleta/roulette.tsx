'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Volume2, VolumeX } from 'lucide-react'
import { toast } from 'sonner'
import type { WheelConfig, WheelSlice, LoyaltyBalance } from '@/lib/loyalty'
import { RouletteWheel, type WheelHandle } from './wheel'
import { PrizeModal, type ResultadoGiro } from './prize-modal'
import { criarSons, somLigado, salvarSom, type SonsRoleta } from './sons'

export type EstadoRoleta = 'pronto' | 'sem-giro' | 'girando' | 'desativada'

/** Identificador único do giro, para o servidor reconhecer uma repetição. */
function novaChave(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {}
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * A roleta completa: roda, botão, som e modal do prêmio.
 *
 * Quem decide o prêmio é sempre o servidor — a tela só anima até o índice que
 * ele devolveu. Em `girarLocal` (prévia do painel e demonstração pública) nada
 * é gravado e o resultado sai sem cupom, de propósito.
 */
export function Roulette({ config, saldo, phone, onFim, girarLocal, esgotadas, compacto }: {
  config: WheelConfig
  saldo: LoyaltyBalance
  phone: string
  /** Chamado ao terminar, para a página recarregar o saldo. */
  onFim: () => void
  /** Modo prévia: sorteia aqui, sem servidor, sem gastar giro e sem cupom. */
  girarLocal?: () => number
  esgotadas?: string[]
  /** Esconde o cabeçalho de giros — usado dentro do painel. */
  compacto?: boolean
}) {
  const [girando, setGirando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoGiro | null>(null)
  const [som, setSom] = useState(true)

  const rodaRef = useRef<WheelHandle>(null)
  const sonsRef = useRef<SonsRoleta | null>(null)
  const somRef = useRef(true)
  // Trava contra duplo clique: state não vale aqui porque só muda no próximo
  // render, e dois cliques rápidos acontecem antes disso.
  const emVooRef = useRef(false)

  useEffect(() => { setSom(somLigado()) }, [])
  useEffect(() => { somRef.current = som }, [som])

  const fatias = config.fatias
  const podeGirar = girarLocal ? true : saldo.girosDisponiveis > 0

  /** Bate o ponteiro e toca o tique ao passar por um pino. */
  const aoPassarPino = useCallback(() => {
    if (somRef.current) sonsRef.current?.tique()
    const p = document.getElementById('roleta-ponteiro')
    if (p) { p.classList.remove('roleta-batida'); void p.offsetWidth; p.classList.add('roleta-batida') }
  }, [])

  async function girar() {
    if (emVooRef.current || !podeGirar) return
    emVooRef.current = true
    setGirando(true)
    setResultado(null)
    if (!sonsRef.current) sonsRef.current = criarSons()

    try {
      let indice: number
      let fatia: WheelSlice
      let couponCode: string | null = null
      let expiresAt: string | null = null

      if (girarLocal) {
        indice = girarLocal()
        if (indice < 0) { toast.error('Nenhuma fatia pode sair: confira as chances.'); return }
        fatia = fatias[indice]
      } else {
        const res = await fetch('/api/loyalty/roleta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // A mesma chave numa repetição devolve o mesmo prêmio, sem sortear
          // outro nem cobrar outro giro.
          body: JSON.stringify({ phone, spinKey: novaChave() }),
        })
        const d = await res.json().catch(() => ({}))
        if (!res.ok || !d.ok) {
          toast.error(d.error ?? 'Não foi possível realizar o giro. Tente novamente.')
          return
        }
        indice = d.indice
        fatia = d.fatia ?? fatias[indice]
        couponCode = d.couponCode ?? null
        expiresAt = d.expiresAt ?? null
      }

      await rodaRef.current?.girarAte(indice, aoPassarPino)

      if (somRef.current) {
        if (couponCode || (girarLocal && fatia.tipo !== 'nada')) sonsRef.current?.vitoria()
        else sonsRef.current?.semPremio()
      }
      setResultado({ fatia, couponCode, expiresAt })
      onFim()
    } catch {
      toast.error('Falha de conexão. Tente novamente.')
    } finally {
      emVooRef.current = false
      setGirando(false)
    }
  }

  function alternarSom() {
    setSom((s) => { salvarSom(!s); return !s })
  }

  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-between gap-3">
        {!compacto ? (
          <p className="text-sm text-white/55" aria-live="polite">
            {girando ? (
              <span className="font-bold text-white">Boa sorte! 🍀</span>
            ) : saldo.girosDisponiveis > 0 ? (
              <>
                🔥 Você tem{' '}
                <strong className="text-white">
                  {saldo.girosDisponiveis} giro{saldo.girosDisponiveis > 1 ? 's' : ''}
                </strong>{' '}
                {saldo.girosDisponiveis > 1 ? 'disponíveis' : 'disponível'}
              </>
            ) : (
              <>😢 Você não tem giros no momento</>
            )}
          </p>
        ) : <span />}

        <button
          onClick={alternarSom}
          aria-label={som ? 'Desligar som' : 'Ligar som'}
          aria-pressed={som}
          className="shrink-0 rounded-lg p-2 text-white/35 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {som ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      <RouletteWheel ref={rodaRef} fatias={fatias} esgotadas={esgotadas} girando={girando} />

      <button
        onClick={girar}
        disabled={girando || !podeGirar}
        aria-busy={girando}
        className={`mt-6 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-black uppercase tracking-wide text-white shadow-lg shadow-brand/25 transition-all hover:bg-brand-hover active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 ${
          podeGirar && !girando ? 'roleta-pulso' : ''
        }`}
      >
        {girando ? <Loader2 size={18} className="animate-spin" /> : null}
        {girando ? 'Girando…' : !podeGirar ? 'Sem giros disponíveis' : 'Girar a roleta 🎯'}
      </button>

      {!compacto && (
        <p className="mt-3 text-center text-[12px] text-white/35">
          Cada giro é uma nova chance de ganhar algo especial do Mais Sub. 🍀
        </p>
      )}

      <PrizeModal resultado={resultado} onFechar={() => setResultado(null)} />
    </div>
  )
}
