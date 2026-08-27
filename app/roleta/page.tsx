'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Loader2, ArrowRight, Gift, Flame } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Roulette } from '@/components/roleta/roulette'
import { SpinHistory } from '@/components/roleta/spin-history'
import { drawSlice, type WheelConfig, type LoyaltyBalance, type Redemption } from '@/lib/loyalty'

/** Saldo de mentira para o modo demonstração, onde ninguém gasta giro. */
const SALDO_DEMO = {
  phone: '', nome: '', pontos: 0, selos: 0, pedidos: 0, totalGasto: 0,
  girosDisponiveis: 0, girosGanhos: 0, girosUsados: 0, pedidosParaProximoGiro: 0,
  comoGanharGiro: '',
  nivel: { id: 'demo', nome: 'Demo', minimoGasto: 0, cor: '#EE5C13', freteGratis: false, descontoPercentual: 0 },
  proximoNivel: null, faltaParaProximo: 0,
} as unknown as LoyaltyBalance

interface Stats { ganharamNaSemana: number; premiosDisponiveis: number; premiosIlimitados: number }

export default function RoletaPage() {
  const [carregando, setCarregando] = useState(true)
  const [roleta, setRoleta] = useState<WheelConfig | null>(null)
  const [ativa, setAtiva] = useState(false)
  const [esgotadas, setEsgotadas] = useState<string[]>([])
  const [stats, setStats] = useState<Stats | null>(null)

  const [phone, setPhone] = useState('')
  const [consultando, setConsultando] = useState(false)
  const [erro, setErro] = useState('')
  const [saldo, setSaldo] = useState<LoyaltyBalance | null>(null)
  const [resgates, setResgates] = useState<Redemption[]>([])

  const consultar = useCallback(async (tel: string) => {
    const digitos = tel.replace(/\D/g, '')
    if (digitos.length < 10) { setErro('Digite o telefone com DDD.'); return }
    setConsultando(true); setErro('')
    try {
      const res = await fetch(`/api/loyalty/saldo?phone=${encodeURIComponent(tel)}`, { cache: 'no-store' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.ok) { setErro(d.error ?? 'Não foi possível consultar agora.'); setSaldo(null) }
      else {
        setSaldo(d.saldo)
        setResgates(d.resgates ?? [])
        if (d.config?.roleta) setRoleta(d.config.roleta)
      }
    } catch {
      setErro('Falha de conexão. Tente novamente.')
    } finally {
      setConsultando(false)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/loyalty/publico', { cache: 'no-store' })
        const d = await res.json().catch(() => ({}))
        if (d?.ok) {
          setRoleta(d.roleta ?? null)
          setAtiva(!!d.ativo && !!d.roleta?.ativo)
          setEsgotadas(d.esgotadas ?? [])
          setStats(d.stats ?? null)
        }
      } catch {}
      setCarregando(false)
    })()
    // Vindo da tela de acompanhamento, o telefone já vem na URL.
    const tel = new URLSearchParams(window.location.search).get('tel')
    if (tel) { setPhone(tel); consultar(tel) }
  }, [consultar])

  const demo = !saldo

  return (
    <><Header />
      <main className="min-h-screen bg-navy pt-16">
        <div className="mx-auto w-full max-w-2xl space-y-7 px-4 py-9 sm:px-8 sm:py-12">

          {/* Hierarquia: clube → chamada → roleta → giros → botão */}
          <header className="text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand">
              Clube do Mais Sub
            </p>
            <h1 className="mt-2 text-[clamp(2rem,9vw,3.25rem)] font-black leading-[0.95] tracking-tight text-white">
              Gire. Ganhe.<br />Aproveite.
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-white/50">
              Quem faz parte do Clube do Mais Sub sempre tem uma chance a mais de ganhar.
            </p>
          </header>

          {carregando ? (
            <Esqueleto />
          ) : !roleta ? (
            <Aviso>A roleta não está disponível no momento.</Aviso>
          ) : (
            <>
              {!ativa && !demo && (
                <Aviso>Essa promoção está temporariamente encerrada.</Aviso>
              )}

              {/* Painel do cliente */}
              {saldo ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 text-center">
                  <p className="text-lg font-black text-white">
                    Olá, {saldo.nome || 'cliente'} 👋
                  </p>
                  {saldo.girosDisponiveis > 0 ? (
                    <p className="mt-1 text-sm text-white/55">
                      Você tem{' '}
                      <strong className="text-brand">
                        {saldo.girosDisponiveis} giro{saldo.girosDisponiveis > 1 ? 's' : ''}
                      </strong>{' '}
                      {saldo.girosDisponiveis > 1 ? 'disponíveis' : 'disponível'}.
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-white/55">
                      Você já usou seus giros. {saldo.comoGanharGiro}.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-center text-[13px] leading-relaxed text-amber-200">
                  <strong className="font-black">Modo demonstração.</strong> Gire à vontade para
                  conhecer — aqui não vale prêmio. Informe seu WhatsApp abaixo para girar valendo.
                </div>
              )}

              <Roulette
                // Remonta ao trocar de modo, para a roda voltar ao início
                key={demo ? 'demo' : saldo!.phone}
                config={roleta}
                saldo={demo ? SALDO_DEMO : saldo!}
                phone={demo ? '' : saldo!.phone}
                esgotadas={esgotadas}
                girarLocal={demo ? () => drawSlice(roleta.fatias, Math.random()) : undefined}
                onFim={() => { if (!demo) consultar(saldo!.phone) }}
              />

              {/* Prova social, vinda do servidor */}
              {stats && (stats.ganharamNaSemana > 0 || stats.premiosDisponiveis > 0) && (
                <div className="flex flex-wrap justify-center gap-2 text-[12px]">
                  {stats.ganharamNaSemana > 0 && (
                    <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/55">
                      <Flame size={13} className="text-brand" />
                      {stats.ganharamNaSemana} {stats.ganharamNaSemana === 1 ? 'pessoa ganhou' : 'pessoas já ganharam'} prêmios esta semana
                    </span>
                  )}
                  {stats.premiosDisponiveis > 0 && (
                    <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/55">
                      <Gift size={13} className="text-brand" />
                      {stats.premiosDisponiveis} prêmios limitados disponíveis
                    </span>
                  )}
                </div>
              )}

              {/* Consulta */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <label htmlFor="tel-roleta" className="text-[11px] font-bold uppercase tracking-widest text-white/40">
                  {demo ? 'Girar valendo — seu WhatsApp' : 'Trocar de número'}
                </label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    id="tel-roleta"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && consultar(phone)}
                    placeholder="(33) 99999-9999"
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-brand"
                  />
                  <button
                    onClick={() => consultar(phone)}
                    disabled={consultando}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-brand px-6 font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
                  >
                    {consultando ? <Loader2 size={16} className="animate-spin" /> : null}
                    Ver meus giros
                  </button>
                </div>
                {erro && <p className="mt-2 text-sm text-red-400" role="alert">{erro}</p>}
                <p className="mt-2 text-[11px] text-white/30">
                  Use o mesmo número dos seus pedidos. Só pedidos entregues contam.
                </p>
              </div>

              <SpinHistory resgates={resgates} />

              <Link
                href="/clube"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                Ver meus pontos, selos e recompensas <ArrowRight size={15} />
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-[13px] text-white/50">
      {children}
    </div>
  )
}

/** Esqueleto com a forma da roleta, para a tela não pular quando ela chega. */
function Esqueleto() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando a roleta">
      <div className="h-14 animate-pulse rounded-2xl bg-white/5" />
      <div className="mx-auto aspect-square w-full max-w-[min(88vw,420px)] animate-pulse rounded-full bg-white/5" />
      <div className="h-14 animate-pulse rounded-2xl bg-white/5" />
    </div>
  )
}
