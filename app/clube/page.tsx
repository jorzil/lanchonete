'use client'

import { useState, useEffect } from 'react'
import { Loader2, Gift, Star, Truck, Cookie, Plus, Check, Copy } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { formatCurrency } from '@/lib/data'
import { formatPhone } from '@/lib/phone'
import { canRedeem, missingFor, type LoyaltyConfig, type LoyaltyBalance, type Reward, type Redemption } from '@/lib/loyalty'
import { Roleta } from '@/components/clube/roleta'
import { toast } from 'sonner'

const ICONE: Record<Reward['tipo'], typeof Gift> = {
  desconto_percentual: Star,
  desconto_fixo: Star,
  frete_gratis: Truck,
  cookie: Cookie,
  adicional: Plus,
}

export default function ClubePage() {
  const [phone, setPhone] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [cfg, setCfg] = useState<LoyaltyConfig | null>(null)
  const [saldo, setSaldo] = useState<LoyaltyBalance | null>(null)
  const [resgates, setResgates] = useState<Redemption[]>([])
  const [resgatando, setResgatando] = useState<string | null>(null)
  const [copiado, setCopiado] = useState('')

  // Aceita /clube?tel=... para já consultar — é assim que o cliente chega da
  // tela de acompanhamento, sem precisar digitar o número de novo.
  useEffect(() => {
    const tel = new URLSearchParams(window.location.search).get('tel')
    if (tel) { setPhone(tel); consultar(tel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function consultar(tel = phone) {
    const digits = tel.replace(/\D/g, '')
    if (digits.length < 10) { setErro('Digite o telefone com DDD.'); return }
    setCarregando(true); setErro('')
    try {
      const res = await fetch(`/api/loyalty/saldo?phone=${encodeURIComponent(tel)}`, { cache: 'no-store' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.ok) {
        setErro(d.error ?? 'Não foi possível consultar agora.')
        setSaldo(null)
      } else {
        setCfg(d.config); setSaldo(d.saldo); setResgates(d.resgates ?? [])
      }
    } catch {
      setErro('Falha de conexão. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  async function resgatar(r: Reward) {
    if (!saldo) return
    setResgatando(r.id)
    try {
      const res = await fetch('/api/loyalty/resgatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: saldo.phone, rewardId: r.id }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.ok) toast.error(d.error ?? 'Não foi possível resgatar.')
      else {
        toast.success(`${r.nome} resgatado! Use o cupom ${d.resgate.couponCode} no checkout.`)
        await consultar(saldo.phone)
      }
    } catch {
      toast.error('Falha de conexão.')
    } finally {
      setResgatando(null)
    }
  }

  async function copiar(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopiado(code)
      setTimeout(() => setCopiado(''), 2500)
    } catch {}
  }

  return (
    <><Header />
      <main className="pt-16 min-h-screen bg-navy">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 space-y-6">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">Fidelidade</p>
            <h1 className="mt-1 text-3xl font-black text-white">{cfg?.nomePrograma ?? 'Clube Mais Sub'}</h1>
            <p className="mt-2 text-sm text-white/50">
              Cada pedido rende pontos e selos. Troque por descontos, frete grátis, cookies e adicionais.
            </p>
          </div>

          {/* Consulta */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-white/40">
              Seu WhatsApp
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && consultar()}
                placeholder="(33) 99999-9999"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-brand"
              />
              <button
                onClick={() => consultar()}
                disabled={carregando}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
              >
                {carregando ? <Loader2 size={16} className="animate-spin" /> : null}
                Ver meus pontos
              </button>
            </div>
            {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}
          </div>

          {saldo && cfg && (
            <>
              {/* Cabeçalho do cliente */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-white">{saldo.nome || 'Cliente'}</p>
                    <p className="text-sm text-white/40">{formatPhone(saldo.phone)}</p>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-black"
                    style={{ backgroundColor: `${saldo.nivel.cor}22`, color: saldo.nivel.cor, border: `1px solid ${saldo.nivel.cor}66` }}
                  >
                    Nível {saldo.nivel.nome}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { rotulo: 'Pontos', valor: String(saldo.pontos) },
                    { rotulo: 'Selos', valor: String(saldo.selos) },
                    { rotulo: 'Pedidos', valor: String(saldo.pedidos) },
                    { rotulo: 'Total', valor: formatCurrency(saldo.totalGasto) },
                  ].map((m) => (
                    <div key={m.rotulo} className="rounded-xl bg-white/5 p-3 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-white/35">{m.rotulo}</p>
                      <p className="text-xl font-black text-white">{m.valor}</p>
                    </div>
                  ))}
                </div>

                {saldo.proximoNivel && (
                  <div className="mt-4">
                    <div className="flex justify-between text-[12px] text-white/50">
                      <span>Faltam {formatCurrency(saldo.faltaParaProximo)} para o nível {saldo.proximoNivel.nome}</span>
                      <span>{formatCurrency(saldo.totalGasto)} / {formatCurrency(saldo.proximoNivel.minimoGasto)}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-brand transition-all"
                        style={{ width: `${Math.min(100, (saldo.totalGasto / saldo.proximoNivel.minimoGasto) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {(saldo.nivel.freteGratis || saldo.nivel.descontoPercentual > 0) && (
                  <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-300">
                    Vantagem do nível {saldo.nivel.nome}:{' '}
                    {[saldo.nivel.freteGratis ? 'frete grátis' : null,
                      saldo.nivel.descontoPercentual > 0 ? `${saldo.nivel.descontoPercentual}% de desconto` : null]
                      .filter(Boolean).join(' e ')} — peça no balcão ao fazer o pedido.
                  </p>
                )}
              </div>

              {/* Roleta */}
              {cfg.roleta?.ativo && (
                <Roleta config={cfg.roleta} saldo={saldo} phone={saldo.phone} onFim={() => consultar(saldo.phone)} />
              )}

              {/* Recompensas */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">Recompensas</p>
                {cfg.recompensas.filter((r) => r.ativo).map((r) => {
                  const pode = canRedeem(saldo, r)
                  const falta = missingFor(saldo, r)
                  const Icone = ICONE[r.tipo] ?? Gift
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center gap-3 rounded-2xl border p-4 ${
                        pode ? 'border-brand/40 bg-brand/5' : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <Icone size={20} className={pode ? 'text-brand shrink-0' : 'text-white/30 shrink-0'} />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white">{r.nome}</p>
                        <p className="text-[12px] text-white/40">{r.descricao}</p>
                        <p className="mt-0.5 text-[12px] font-bold text-brand">
                          {r.custo} {r.moeda}
                          {!pode && <span className="ml-2 font-medium text-white/35">faltam {falta}</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => resgatar(r)}
                        disabled={!pode || resgatando === r.id}
                        className="shrink-0 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:bg-white/10 disabled:text-white/30"
                      >
                        {resgatando === r.id ? <Loader2 size={14} className="animate-spin" /> : 'Resgatar'}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Cupons já resgatados */}
              {resgates.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">Seus cupons</p>
                  {resgates.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white">{r.rewardNome}</p>
                        <p className="text-[11px] text-white/35">
                          {new Date(r.at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <button
                        onClick={() => copiar(r.couponCode)}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 font-mono text-[12px] font-bold text-brand"
                      >
                        {copiado === r.couponCode ? <Check size={13} /> : <Copy size={13} />}
                        {r.couponCode}
                      </button>
                    </div>
                  ))}
                  <p className="text-[11px] text-white/30">
                    Use o código no campo de cupom do checkout. Cada cupom vale uma vez, por 30 dias.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
