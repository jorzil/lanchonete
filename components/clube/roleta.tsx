'use client'

import { useState } from 'react'
import { Loader2, Copy, Check } from 'lucide-react'
import type { WheelConfig, WheelSlice } from '@/lib/loyalty'
import { toast } from 'sonner'

/** Ponto na circunferência, com 0° apontando para cima. */
function ponto(raio: number, grau: number) {
  const rad = ((grau - 90) * Math.PI) / 180
  return { x: 100 + raio * Math.cos(rad), y: 100 + raio * Math.sin(rad) }
}

/** Caminho SVG de uma fatia (setor circular). */
function fatiaPath(inicio: number, fim: number) {
  const a = ponto(96, inicio)
  const b = ponto(96, fim)
  const grande = fim - inicio > 180 ? 1 : 0
  return `M 100 100 L ${a.x} ${a.y} A 96 96 0 ${grande} 1 ${b.x} ${b.y} Z`
}

export function Roleta({ config, phone, onFim }: {
  config: WheelConfig
  phone: string
  /** Chamado ao terminar, para a página recarregar o saldo. */
  onFim: () => void
}) {
  const [girando, setGirando] = useState(false)
  const [angulo, setAngulo] = useState(0)
  const [resultado, setResultado] = useState<{ fatia: WheelSlice; couponCode: string | null } | null>(null)
  const [copiado, setCopiado] = useState(false)

  const fatias = config.fatias
  const passo = 360 / Math.max(1, fatias.length)

  async function girar() {
    if (girando) return
    setGirando(true)
    setResultado(null)
    try {
      const res = await fetch('/api/loyalty/roleta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.ok) {
        toast.error(d.error ?? 'Não foi possível girar agora.')
        setGirando(false)
        return
      }

      // O servidor já decidiu; aqui só giramos até o centro da fatia sorteada.
      // 5 voltas completas antes, para a animação ter peso.
      const centro = d.indice * passo + passo / 2
      const destino = 360 * 5 + (360 - centro)
      setAngulo((a) => a + destino - (a % 360))

      // Espera a animação terminar antes de revelar o texto
      setTimeout(() => {
        setResultado({ fatia: d.fatia, couponCode: d.couponCode })
        setGirando(false)
        onFim()
        if (d.premio) toast.success(`Você ganhou: ${d.fatia.nome}!`)
      }, 4200)
    } catch {
      toast.error('Falha de conexão.')
      setGirando(false)
    }
  }

  async function copiar(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {}
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-center text-[11px] font-bold uppercase tracking-widest text-brand">
        🎡 Roleta da sorte
      </p>
      <p className="mt-1 text-center text-sm text-white/50">
        Cada giro custa <strong className="text-white">{config.custo} {config.moeda}</strong>
      </p>

      <div className="relative mx-auto mt-5 w-fit">
        {/* Ponteiro fixo no topo */}
        <div
          className="absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2 -translate-y-1"
          style={{ borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: '20px solid #fff' }}
        />
        <svg
          viewBox="0 0 200 200"
          className="h-[260px] w-[260px] drop-shadow-[0_0_30px_rgba(238,92,19,0.25)]"
          style={{
            transform: `rotate(${angulo}deg)`,
            transition: girando ? 'transform 4s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none',
          }}
        >
          {fatias.map((f, i) => {
            const inicio = i * passo
            const meio = inicio + passo / 2
            const texto = ponto(62, meio)
            // Fatias da metade de baixo teriam o texto de cabeça para baixo:
            // gira meia volta a mais para ficarem legíveis.
            const inverte = meio > 90 && meio < 270
            const giroTexto = inverte ? meio + 180 : meio
            return (
              <g key={f.id}>
                <path d={fatiaPath(inicio, inicio + passo)} fill={f.cor} stroke="#0B1F3A" strokeWidth="1" />
                <text
                  x={texto.x} y={texto.y}
                  fill="#fff" fontSize="8" fontWeight="800"
                  textAnchor="middle" dominantBaseline="middle"
                  transform={`rotate(${giroTexto}, ${texto.x}, ${texto.y})`}
                >
                  {f.nome.length > 14 ? `${f.nome.slice(0, 13)}…` : f.nome}
                </text>
              </g>
            )
          })}
          <circle cx="100" cy="100" r="16" fill="#0B1F3A" stroke="#fff" strokeWidth="2" />
        </svg>
      </div>

      <button
        onClick={girar}
        disabled={girando}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 font-black text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {girando ? <Loader2 size={16} className="animate-spin" /> : null}
        {girando ? 'Girando…' : 'Girar a roleta'}
      </button>

      {resultado && (
        <div
          className={`mt-4 rounded-xl border-2 p-4 text-center ${
            resultado.fatia.tipo === 'nada'
              ? 'border-white/15 bg-white/5'
              : 'border-emerald-500/50 bg-emerald-500/10'
          }`}
        >
          {resultado.fatia.tipo === 'nada' ? (
            <>
              <p className="text-lg font-black text-white/70">Quase!</p>
              <p className="text-sm text-white/40">Não foi dessa vez — junte mais e tente de novo.</p>
            </>
          ) : (
            <>
              <p className="text-2xl">🎉</p>
              <p className="mt-1 text-lg font-black text-emerald-400">{resultado.fatia.nome}</p>
              {resultado.couponCode && (
                <button
                  onClick={() => copiar(resultado.couponCode!)}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 font-mono text-sm font-bold text-emerald-300"
                >
                  {copiado ? <Check size={14} /> : <Copy size={14} />}
                  {resultado.couponCode}
                </button>
              )}
              <p className="mt-2 text-[11px] text-white/35">
                Use no campo de cupom do checkout. Vale uma vez, por 30 dias.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
