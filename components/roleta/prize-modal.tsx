'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Copy, Check, X } from 'lucide-react'
import type { WheelSlice } from '@/lib/loyalty'

/** Data por extenso curta: 30/09/2026. */
function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export interface ResultadoGiro {
  fatia: WheelSlice
  couponCode: string | null
  expiresAt: string | null
}

/**
 * Modal do prêmio. Abre sozinho quando o giro termina, prende o foco enquanto
 * está aberto e fecha no Esc — é ele que o cliente vai fotografar e mandar no
 * WhatsApp, então o código precisa estar grande e fácil de copiar.
 */
export function PrizeModal({ resultado, onFechar }: {
  resultado: ResultadoGiro | null
  onFechar: () => void
}) {
  const [copiado, setCopiado] = useState(false)
  const caixaRef = useRef<HTMLDivElement>(null)
  const ganhou = !!resultado && resultado.fatia.tipo !== 'nada'

  useEffect(() => {
    if (!resultado) return
    setCopiado(false)
    caixaRef.current?.focus()
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar() }
    document.addEventListener('keydown', aoTeclar)
    // Sem rolagem por trás do modal enquanto ele estiver aberto.
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = antes
    }
  }, [resultado, onFechar])

  // Confete sorteado uma vez por prêmio, para não mudar a cada re-render.
  const confete = useMemo(() => {
    if (!ganhou) return []
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      esq: Math.random() * 100,
      dx: `${(Math.random() - 0.5) * 260}px`,
      giro: `${(Math.random() - 0.5) * 1080}deg`,
      dur: `${1.8 + Math.random() * 1.6}s`,
      atraso: `${Math.random() * 0.5}s`,
      cor: ['#EE5C13', '#F59E0B', '#0359A2', '#FFFFFF', '#FDBA74', '#023E74'][i % 6],
      largura: 5 + Math.random() * 6,
      altura: 9 + Math.random() * 9,
      redondo: i % 5 === 0,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado])

  if (!resultado) return null

  async function copiar() {
    if (!resultado?.couponCode) return
    try {
      await navigator.clipboard.writeText(resultado.couponCode)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 3000)
    } catch {}
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onFechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="premio-titulo"
    >
      {ganhou && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
          {confete.map((c) => (
            <span
              key={c.id}
              className="roleta-confete absolute top-0 block"
              style={{
                left: `${c.esq}%`,
                width: c.largura,
                height: c.redondo ? c.largura : c.altura,
                backgroundColor: c.cor,
                borderRadius: c.redondo ? '50%' : 1,
                ['--dx' as string]: c.dx,
                ['--giro' as string]: c.giro,
                ['--dur' as string]: c.dur,
                ['--atraso' as string]: c.atraso,
              }}
            />
          ))}
        </div>
      )}

      <div
        ref={caixaRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="roleta-modal relative my-auto w-full max-w-sm rounded-3xl border border-white/10 bg-[#012B52] p-6 text-center shadow-2xl outline-none"
      >
        <button
          onClick={onFechar}
          aria-label="Fechar"
          className="absolute right-3 top-3 rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>

        {ganhou ? (
          <>
            <p className="text-5xl" aria-hidden>{resultado.fatia.icone ?? '🎉'}</p>
            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.2em] text-brand">Parabéns!</p>
            <h2 id="premio-titulo" className="mt-1 text-3xl font-black leading-tight text-white">
              {resultado.fatia.nome}
            </h2>
            {resultado.fatia.descricao && (
              <p className="mt-1 text-sm text-white/50">{resultado.fatia.descricao}</p>
            )}
            <p className="mt-2 text-sm text-white/50">Seu prêmio já está salvo no Clube do Mais Sub.</p>

            {resultado.couponCode && (
              <>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Cupom</p>
                <p className="mt-1 select-all font-mono text-3xl font-black tracking-wider text-white">
                  {resultado.couponCode}
                </p>
                {resultado.expiresAt && (
                  <p className="mt-1 text-[12px] text-white/40">
                    Válido até {formatarData(resultado.expiresAt)}
                  </p>
                )}

                <button
                  onClick={copiar}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 font-bold text-white transition-colors hover:bg-white/10"
                >
                  {copiado ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  {copiado ? 'Cupom copiado!' : 'Copiar cupom'}
                </button>
                <Link
                  href="/cardapio"
                  className="mt-2 flex w-full items-center justify-center rounded-xl bg-brand py-3.5 font-black uppercase tracking-wide text-white transition-colors hover:bg-brand-hover"
                >
                  Usar agora
                </Link>
              </>
            )}
          </>
        ) : (
          <>
            <p className="text-5xl" aria-hidden>🍀</p>
            <h2 id="premio-titulo" className="mt-3 text-2xl font-black text-white">Não foi dessa vez</h2>
            <p className="mt-1 text-sm text-white/50">
              A sorte é assim. Faça mais um pedido e a gente te devolve outra chance.
            </p>
            <button
              onClick={onFechar}
              className="mt-6 w-full rounded-xl bg-white/10 py-3.5 font-bold text-white transition-colors hover:bg-white/15"
            >
              Continuar no Clube
            </button>
          </>
        )}
      </div>
    </div>
  )
}
