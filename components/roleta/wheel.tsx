'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react'
import { sliceColor, type WheelSlice } from '@/lib/loyalty'

/** Voltas completas antes de parar na fatia sorteada. */
const VOLTAS = 6
/** Duração do giro, em milissegundos. Longa de propósito: a espera é a graça. */
export const DURACAO = 5200

/** Ponto na circunferência, com 0° apontando para cima. */
function ponto(raio: number, grau: number) {
  const rad = ((grau - 90) * Math.PI) / 180
  return { x: 100 + raio * Math.cos(rad), y: 100 + raio * Math.sin(rad) }
}

/** Caminho SVG de uma fatia (setor circular). */
function fatiaPath(inicio: number, fim: number) {
  const a = ponto(88, inicio)
  const b = ponto(88, fim)
  const grande = fim - inicio > 180 ? 1 : 0
  return `M 100 100 L ${a.x} ${a.y} A 88 88 0 ${grande} 1 ${b.x} ${b.y} Z`
}

export interface WheelHandle {
  /** Gira até a fatia e resolve quando a animação termina. */
  girarAte(indice: number, aoPassarPino: () => void): Promise<void>
}

/**
 * A roda. Só desenha e gira — não sabe de prêmio, saldo nem servidor.
 *
 * Quem roda é a <div> de fora, pela Web Animations API. Transição CSS no
 * <svg> depende de o navegador ver a mudança de valor num quadro em que a
 * transição já estava ligada, e num clique síncrono isso não acontece: a roda
 * salta direto para o resultado. Com .animate() a animação é imperativa e roda
 * sempre, em qualquer navegador que a suporte.
 */
export const RouletteWheel = forwardRef<WheelHandle, {
  fatias: WheelSlice[]
  /** Fatias que não podem mais sair — desenhadas apagadas. */
  esgotadas?: string[]
  girando?: boolean
}>(function RouletteWheel({ fatias, esgotadas = [], girando = false }, ref) {
  const rodaRef = useRef<HTMLDivElement>(null)
  const anguloRef = useRef(0)
  const passo = 360 / Math.max(1, fatias.length)
  const fora = new Set(esgotadas)

  useImperativeHandle(ref, () => ({
    girarAte(indice, aoPassarPino) {
      const el = rodaRef.current
      const centro = indice * passo + passo / 2
      const de = anguloRef.current
      // Sempre para com o centro da fatia sob o ponteiro, que fica no topo.
      const para = de + 360 * VOLTAS + (((360 - centro) - (de % 360)) % 360)
      anguloRef.current = para

      const suave = typeof window !== 'undefined'
        && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

      // Sem animação disponível (ou pedida): posiciona e devolve na hora.
      if (!el || !el.animate || !suave) {
        if (el) el.style.transform = `rotate(${para}deg)`
        return new Promise<void>((r) => setTimeout(r, suave ? 400 : 0))
      }

      const anim = el.animate(
        [{ transform: `rotate(${de}deg)` }, { transform: `rotate(${para}deg)` }],
        { duration: DURACAO, easing: 'cubic-bezier(0.12, 0.66, 0.09, 1)', fill: 'forwards' },
      )

      // Enquanto gira, avisa a cada troca de fatia sob o ponteiro. Lê o ângulo
      // que está valendo, então o ritmo acompanha a desaceleração sozinho.
      let anterior = -1
      let vivo = true
      const quadro = () => {
        if (!vivo) return
        try {
          const m = new DOMMatrixReadOnly(getComputedStyle(el).transform)
          const grau = ((Math.atan2(m.b, m.a) * 180) / Math.PI + 360) % 360
          const atual = Math.floor(((360 - grau) % 360) / passo)
          if (atual !== anterior) {
            if (anterior !== -1) aoPassarPino()
            anterior = atual
          }
        } catch {}
        requestAnimationFrame(quadro)
      }
      requestAnimationFrame(quadro)

      return anim.finished
        .catch(() => {})
        .then(() => {
          vivo = false
          el.style.transform = `rotate(${para}deg)`
          try { anim.cancel() } catch {}
        })
    },
  }))

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(88vw,420px)]">
      {/* Brilho suave por trás, para a roda descolar do fundo */}
      <div className="pointer-events-none absolute inset-4 rounded-full bg-brand/20 blur-3xl" aria-hidden />

      {/* Ponteiro, fixo no topo */}
      <RoulettePointer girando={girando} />

      <div ref={rodaRef} className="h-full w-full will-change-transform">
        <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label="Roleta de prêmios">
          <defs>
            {/* Volume: luz em cima, sombra embaixo */}
            <linearGradient id="rlt-verniz" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#fff" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
            </linearGradient>
            <radialGradient id="rlt-vinheta">
              <stop offset="72%" stopColor="#000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.3" />
            </radialGradient>
            <radialGradient id="rlt-eixo">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="60%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </radialGradient>
          </defs>

          {/* Aro */}
          <circle cx="100" cy="100" r="97" fill="#023E74" />
          <circle cx="100" cy="100" r="97" fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth="1.5" />

          {fatias.map((f, i) => {
            const inicio = i * passo
            const meio = inicio + passo / 2
            const apagada = fora.has(f.id)
            // Ícone mais para fora, texto mais para dentro: os dois cabem sem
            // se encavalar mesmo com 12 fatias.
            const pIcone = ponto(72, meio)
            const pTexto = ponto(52, meio)
            // Metade de baixo teria o texto de cabeça para baixo.
            const inverte = meio > 90 && meio < 270
            const giro = inverte ? meio + 180 : meio
            const tamanho = fatias.length > 10 ? 6.5 : fatias.length > 7 ? 7.5 : 8.5
            return (
              <g key={f.id} opacity={apagada ? 0.34 : 1}>
                <path
                  d={fatiaPath(inicio, inicio + passo)}
                  fill={sliceColor(f, i, fatias.length)}
                  stroke="#023E74"
                  strokeWidth="0.9"
                />
                {f.icone && (
                  <text
                    x={pIcone.x} y={pIcone.y}
                    fontSize={fatias.length > 10 ? 9 : 11}
                    textAnchor="middle" dominantBaseline="central"
                    transform={`rotate(${giro}, ${pIcone.x}, ${pIcone.y})`}
                  >
                    {f.icone}
                  </text>
                )}
                <text
                  x={pTexto.x} y={pTexto.y}
                  fill="#fff" fontSize={tamanho} fontWeight="800"
                  textAnchor="middle" dominantBaseline="central"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                  transform={`rotate(${giro}, ${pTexto.x}, ${pTexto.y})`}
                >
                  {f.nome.length > 15 ? `${f.nome.slice(0, 14)}…` : f.nome}
                </text>
              </g>
            )
          })}

          <circle cx="100" cy="100" r="88" fill="url(#rlt-vinheta)" pointerEvents="none" />
          <circle cx="100" cy="100" r="88" fill="url(#rlt-verniz)" pointerEvents="none" />

          {/* Pinos nas divisórias — é neles que o ponteiro bate */}
          {fatias.map((f, i) => {
            const p = ponto(92, i * passo)
            return <circle key={`p-${f.id}`} cx={p.x} cy={p.y} r="2" fill="#fff" fillOpacity="0.75" />
          })}

          {/* Eixo */}
          <circle cx="100" cy="100" r="18" fill="url(#rlt-eixo)" />
          <circle cx="100" cy="100" r="18" fill="none" stroke="#023E74" strokeWidth="2.5" />
          <circle cx="100" cy="100" r="6" fill="#EE5C13" />
        </svg>
      </div>
    </div>
  )
})

/** Seta que aponta o prêmio vencedor, no topo da roda. */
export function RoulettePointer({ girando }: { girando?: boolean }) {
  return (
    <div
      id="roleta-ponteiro"
      className={`absolute left-1/2 top-[-10px] z-10 w-[34px] origin-top -translate-x-1/2 drop-shadow-[0_3px_6px_rgba(0,0,0,0.35)] ${
        girando ? '' : 'roleta-ponteiro-parado'
      }`}
      aria-hidden
    >
      <svg viewBox="0 0 30 44" className="w-full">
        <path d="M15 44 L3 12 A12 12 0 0 1 27 12 Z" fill="#fff" />
        <circle cx="15" cy="13" r="7.5" fill="#EE5C13" />
        <circle cx="15" cy="13" r="2.8" fill="#fff" />
      </svg>
    </div>
  )
}
