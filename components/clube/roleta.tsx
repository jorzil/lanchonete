'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Copy, Check, Volume2, VolumeX } from 'lucide-react'
import { sliceColor, type WheelConfig, type WheelSlice, type LoyaltyBalance } from '@/lib/loyalty'
import { toast } from 'sonner'

/** Duração do giro, em milissegundos. Longa de propósito: a espera é a graça. */
const DURACAO = 5600
/** Voltas completas antes de parar na fatia sorteada. */
const VOLTAS = 8

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

/**
 * Bipes curtos via WebAudio — sem baixar nenhum arquivo de som.
 * Tudo dentro de try/catch: navegador que bloqueia áudio não pode derrubar o giro.
 */
function criarSom() {
  let ctx: AudioContext | null = null
  function contexto() {
    if (typeof window === 'undefined') return null
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ctx = new AC()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  }
  function nota(hz: number, dur: number, vol: number, tipo: OscillatorType, atraso = 0) {
    try {
      const c = contexto()
      if (!c) return
      const t = c.currentTime + atraso
      const osc = c.createOscillator()
      const gan = c.createGain()
      osc.type = tipo
      osc.frequency.setValueAtTime(hz, t)
      gan.gain.setValueAtTime(0, t)
      gan.gain.linearRampToValueAtTime(vol, t + 0.005)
      gan.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      osc.connect(gan).connect(c.destination)
      osc.start(t)
      osc.stop(t + dur + 0.02)
    } catch {}
  }
  return {
    /** Estalo do ponteiro batendo no pino. */
    tique: () => nota(1250, 0.035, 0.05, 'square'),
    /** Fanfarra curta de vitória. */
    vitoria: () => [0, 0.1, 0.2, 0.34].forEach((a, i) => nota([523, 659, 784, 1047][i], 0.32, 0.08, 'triangle', a)),
    /** Descida melancólica quando não vem prêmio. */
    perdeu: () => [0, 0.13].forEach((a, i) => nota([392, 294][i], 0.28, 0.06, 'sine', a)),
  }
}

export function Roleta({ config, saldo, phone, onFim, girarLocal, ocultarCabecalho }: {
  config: WheelConfig
  saldo: LoyaltyBalance
  phone: string
  /** Chamado ao terminar, para a página recarregar o saldo. */
  onFim: () => void
  /**
   * Modo teste (painel): sorteia aqui mesmo, sem chamar o servidor, sem gastar
   * giro e sem gerar cupom. Recebe o índice sorteado — usando a MESMA função de
   * sorteio do servidor, para o teste refletir a realidade.
   */
  girarLocal?: () => number
  ocultarCabecalho?: boolean
}) {
  const [girando, setGirando] = useState(false)
  const [angulo, setAngulo] = useState(0)
  const [resultado, setResultado] = useState<{ fatia: WheelSlice; couponCode: string | null } | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [mudo, setMudo] = useState(false)

  const rodaRef = useRef<SVGSVGElement>(null)
  const ponteiroRef = useRef<HTMLDivElement>(null)
  const somRef = useRef<ReturnType<typeof criarSom> | null>(null)
  const mudoRef = useRef(false)

  const fatias = config.fatias
  const passo = 360 / Math.max(1, fatias.length)
  const ganhou = !!resultado && resultado.fatia.tipo !== 'nada'

  // Preferência de som guardada por navegador. Falha em aba anônima — sem problema.
  useEffect(() => {
    try { setMudo(localStorage.getItem('roleta-mudo') === '1') } catch {}
  }, [])
  useEffect(() => { mudoRef.current = mudo }, [mudo])

  function alternarSom() {
    setMudo((m) => {
      const novo = !m
      try { localStorage.setItem('roleta-mudo', novo ? '1' : '0') } catch {}
      return novo
    })
  }

  /**
   * Enquanto a roda gira, lê o ângulo real do CSS a cada quadro. Quando muda a
   * fatia que está sob o ponteiro, bate o ponteiro e toca o tique — assim o som
   * acompanha a desaceleração sozinho, sem precisar prever o tempo de cada volta.
   */
  function acompanharPinos() {
    const roda = rodaRef.current
    if (!roda) return
    let anterior = -1
    let vivo = true
    const parar = setTimeout(() => { vivo = false }, DURACAO + 250)

    const quadro = () => {
      if (!vivo) { clearTimeout(parar); return }
      try {
        const m = new DOMMatrixReadOnly(getComputedStyle(roda).transform)
        const grau = ((Math.atan2(m.b, m.a) * 180) / Math.PI + 360) % 360
        // O ponteiro fica no topo: a fatia sob ele é a oposta ao giro.
        const atual = Math.floor(((360 - grau) % 360) / passo)
        if (atual !== anterior) {
          if (anterior !== -1) {
            if (!mudoRef.current) somRef.current?.tique()
            const p = ponteiroRef.current
            if (p) { p.classList.remove('roleta-batida'); void p.offsetWidth; p.classList.add('roleta-batida') }
          }
          anterior = atual
        }
      } catch {}
      requestAnimationFrame(quadro)
    }
    requestAnimationFrame(quadro)
  }

  /**
   * Anima até o centro da fatia e revela o resultado.
   *
   * O ângulo só entra dois quadros depois de ligar a transição. Se os dois
   * forem para a mesma pintura — que é o que acontece no modo teste, onde não
   * há espera de rede no meio — o navegador não vê mudança de valor com
   * transição já ativa, e a roda salta direto para o fim sem girar.
   */
  function animarAte(indice: number, aoRevelar: () => void) {
    const centro = indice * passo + passo / 2
    const destino = 360 * VOLTAS + (360 - centro)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAngulo((a) => a + destino - (a % 360))
        acompanharPinos()
        setTimeout(() => { setGirando(false); aoRevelar() }, DURACAO)
      })
    })
  }

  async function girar() {
    if (girando) return
    if (!somRef.current) somRef.current = criarSom()
    setGirando(true)
    setResultado(null)

    // Modo teste: sorteia local, sem tocar no servidor.
    if (girarLocal) {
      const i = girarLocal()
      if (i < 0) { toast.error('Roleta sem fatias com chance maior que zero.'); setGirando(false); return }
      animarAte(i, () => {
        setResultado({ fatia: fatias[i], couponCode: null })
        if (!mudoRef.current) (fatias[i].tipo === 'nada' ? somRef.current?.perdeu() : somRef.current?.vitoria())
        onFim()
      })
      return
    }

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
      animarAte(d.indice, () => {
        setResultado({ fatia: d.fatia, couponCode: d.couponCode })
        if (!mudoRef.current) (d.premio ? somRef.current?.vitoria() : somRef.current?.perdeu())
        onFim()
        if (d.premio) toast.success(`Você ganhou: ${d.fatia.nome}!`)
      })
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

  // Confete: sorteado uma vez por prêmio, para não mudar a cada re-render.
  const confete = useMemo(() => {
    if (!ganhou) return []
    return Array.from({ length: 44 }, (_, i) => ({
      id: i,
      esq: Math.random() * 100,
      dx: `${(Math.random() - 0.5) * 220}px`,
      giro: `${(Math.random() - 0.5) * 1080}deg`,
      dur: `${1.6 + Math.random() * 1.4}s`,
      atraso: `${Math.random() * 0.45}s`,
      cor: ['#EE5C13', '#FFD166', '#06D6A0', '#5B8DEF', '#EF476F', '#fff'][i % 6],
      largura: 5 + Math.random() * 5,
      altura: 8 + Math.random() * 8,
      redondo: i % 4 === 0,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado])

  const podeGirar = girarLocal ? true : saldo.girosDisponiveis > 0

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 ${girando ? 'roleta-girando' : ''}`}>
      {/* Reflexo passeando pelo cartão */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="roleta-brilho absolute -inset-y-10 left-0 w-24 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Confete */}
      {ganhou && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-full">
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

      {/* Botão de som, discreto no canto */}
      <button
        onClick={alternarSom}
        aria-label={mudo ? 'Ligar som' : 'Desligar som'}
        className="absolute right-3 top-3 z-10 rounded-lg p-2 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
      >
        {mudo ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </button>

      {!ocultarCabecalho && (
        <>
          <p className="text-center text-[11px] font-bold uppercase tracking-widest text-brand">
            🎡 Roleta da sorte
          </p>
          <p className="mt-1 text-center text-sm text-white/50">
            {saldo.girosDisponiveis > 0 ? (
              <>
                Você tem{' '}
                <strong className="text-white">
                  {saldo.girosDisponiveis} giro{saldo.girosDisponiveis > 1 ? 's' : ''}
                </strong>{' '}
                {saldo.girosDisponiveis > 1 ? 'disponíveis' : 'disponível'}
              </>
            ) : (
              <>
                Faltam <strong className="text-white">{saldo.pedidosParaProximoGiro} pedido
                {saldo.pedidosParaProximoGiro > 1 ? 's' : ''}</strong> para ganhar um giro
              </>
            )}
          </p>
          <p className="mt-0.5 text-center text-[11px] text-white/30">
            A cada {config.pedidosPorGiro} pedidos você ganha um giro
          </p>
        </>
      )}

      <div className="relative mx-auto mt-6 w-fit">
        {/* Halo pulsante atrás da roda */}
        <div className="roleta-halo pointer-events-none absolute inset-0 rounded-full bg-brand/25 blur-2xl" />

        {/* Ponteiro fixo no topo, com pivô na ponta de cima para dar a batida */}
        <div
          ref={ponteiroRef}
          className="absolute left-1/2 top-[-6px] z-10 origin-top"
          style={{ transform: 'translate(-50%, 0)' }}
        >
          <svg width="30" height="40" viewBox="0 0 30 40">
            <path d="M15 40 L3 8 A12 12 0 0 1 27 8 Z" fill="#fff" />
            <circle cx="15" cy="10" r="7" fill="#EE5C13" />
            <circle cx="15" cy="10" r="2.6" fill="#fff" />
          </svg>
        </div>

        <svg
          ref={rodaRef}
          viewBox="0 0 200 200"
          className="relative h-[290px] w-[290px] drop-shadow-[0_0_38px_rgba(238,92,19,0.35)]"
          style={{
            transform: `rotate(${angulo}deg)`,
            // Arranca rápido e passa quase metade do tempo desacelerando no fim.
            transition: girando ? `transform ${DURACAO}ms cubic-bezier(0.11, 0.72, 0.09, 1)` : 'none',
          }}
        >
          <defs>
            {/* Verniz: claro em cima, escuro embaixo, dando volume à roda */}
            <linearGradient id="roleta-verniz" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.28" />
              <stop offset="45%" stopColor="#fff" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.3" />
            </linearGradient>
            {/* Sombra interna junto à borda, para a roda não parecer chapada */}
            <radialGradient id="roleta-fundo">
              <stop offset="70%" stopColor="#000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.42" />
            </radialGradient>
            <radialGradient id="roleta-eixo">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="55%" stopColor="#F3F4F6" />
              <stop offset="100%" stopColor="#9CA3AF" />
            </radialGradient>
          </defs>

          {/* Aro externo */}
          <circle cx="100" cy="100" r="97" fill="#0B1F3A" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />

          {fatias.map((f, i) => {
            const inicio = i * passo
            const meio = inicio + passo / 2
            const texto = ponto(58, meio)
            // Fatias da metade de baixo teriam o texto de cabeça para baixo:
            // gira meia volta a mais para ficarem legíveis.
            const inverte = meio > 90 && meio < 270
            const giroTexto = inverte ? meio + 180 : meio
            return (
              <g key={f.id}>
                <path d={fatiaPath(inicio, inicio + passo)} fill={sliceColor(f, i, fatias.length)} stroke="#0B1F3A" strokeWidth="0.8" />
                <text
                  x={texto.x} y={texto.y}
                  fill="#fff" fontSize={fatias.length > 10 ? 6 : fatias.length > 7 ? 7 : 8} fontWeight="800"
                  textAnchor="middle" dominantBaseline="middle"
                  style={{ paintOrder: 'stroke', textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}
                  transform={`rotate(${giroTexto}, ${texto.x}, ${texto.y})`}
                >
                  {f.nome.length > 14 ? `${f.nome.slice(0, 13)}…` : f.nome}
                </text>
              </g>
            )
          })}

          {/* Verniz e sombra por cima de todas as fatias */}
          <circle cx="100" cy="100" r="88" fill="url(#roleta-fundo)" pointerEvents="none" />
          <circle cx="100" cy="100" r="88" fill="url(#roleta-verniz)" pointerEvents="none" />

          {/* Lâmpadas da borda, piscando em revezamento */}
          {fatias.map((f, i) => {
            const p = ponto(92.5, i * passo + passo / 2)
            return (
              <circle
                key={`led-${f.id}`}
                className="roleta-led"
                cx={p.x} cy={p.y} r="3.2"
                fill="#FFE7B0"
                style={{ animationDelay: `${(i % 2) * 0.5}s` }}
              />
            )
          })}
          {/* Pinos nas divisórias — é neles que o ponteiro bate */}
          {fatias.map((f, i) => {
            const p = ponto(85, i * passo)
            return <circle key={`pino-${f.id}`} cx={p.x} cy={p.y} r="1.5" fill="rgba(255,255,255,0.55)" />
          })}

          {/* Eixo central */}
          <circle cx="100" cy="100" r="17" fill="url(#roleta-eixo)" />
          <circle cx="100" cy="100" r="17" fill="none" stroke="#0B1F3A" strokeWidth="2.5" />
          <circle cx="100" cy="100" r="5" fill="#EE5C13" />
        </svg>
      </div>

      <button
        onClick={girar}
        disabled={girando || !podeGirar}
        className={`relative mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 font-black uppercase tracking-wide text-white transition-all hover:bg-brand-hover active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 ${
          podeGirar && !girando && !resultado ? 'roleta-pulso' : ''
        }`}
      >
        {girando ? <Loader2 size={16} className="animate-spin" /> : null}
        {girando ? 'Girando…' : !podeGirar ? 'Sem giros disponíveis' : resultado ? 'Girar de novo' : 'Girar a roleta'}
      </button>

      {resultado && (
        <div
          className={`roleta-premio relative z-10 mt-4 rounded-xl border-2 p-4 text-center ${
            resultado.fatia.tipo === 'nada'
              ? 'border-white/15 bg-white/5'
              : 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_40px_-8px_rgba(16,185,129,0.55)]'
          }`}
        >
          {resultado.fatia.tipo === 'nada' ? (
            <>
              <p className="text-lg font-black text-white/70">Quase!</p>
              <p className="text-sm text-white/40">Não foi dessa vez — junte mais e tente de novo.</p>
            </>
          ) : (
            <>
              <p className="text-3xl">🎉</p>
              <p className="mt-1 text-xl font-black text-emerald-400">{resultado.fatia.nome}</p>
              {resultado.couponCode && (
                <button
                  onClick={() => copiar(resultado.couponCode!)}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 font-mono text-sm font-bold text-emerald-300 transition-colors hover:bg-emerald-500/20"
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
