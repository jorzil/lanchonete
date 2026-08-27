'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, ArrowRight } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Roleta } from '@/components/clube/roleta'
import { drawSlice, type WheelConfig, type LoyaltyBalance } from '@/lib/loyalty'

/** Saldo de mentira para o modo demonstração, onde ninguém gasta giro. */
const SALDO_DEMO = {
  phone: '', nome: '', pontos: 0, selos: 0, pedidos: 0, totalGasto: 0,
  girosDisponiveis: 0, girosGanhos: 0, girosUsados: 0, pedidosParaProximoGiro: 0,
  nivel: { id: 'demo', nome: 'Demo', minimoGasto: 0, cor: '#EE5C13', freteGratis: false, descontoPercentual: 0 },
  proximoNivel: null, faltaParaProximo: 0,
} as unknown as LoyaltyBalance

export default function RoletaPage() {
  const [carregando, setCarregando] = useState(true)
  const [roleta, setRoleta] = useState<WheelConfig | null>(null)
  const [ativo, setAtivo] = useState(false)
  const [nomePrograma, setNomePrograma] = useState('Clube Mais Sub')

  // Consulta do cliente, para girar valendo
  const [phone, setPhone] = useState('')
  const [consultando, setConsultando] = useState(false)
  const [erro, setErro] = useState('')
  const [saldo, setSaldo] = useState<LoyaltyBalance | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/loyalty/publico', { cache: 'no-store' })
        const d = await res.json().catch(() => ({}))
        if (d?.ok) {
          setRoleta(d.roleta ?? null)
          setAtivo(!!d.ativo && !!d.roleta?.ativo)
          if (d.nomePrograma) setNomePrograma(d.nomePrograma)
        }
      } catch {}
      setCarregando(false)
    })()
    // Se veio da tela de acompanhamento com o telefone, já consulta.
    const tel = new URLSearchParams(window.location.search).get('tel')
    if (tel) { setPhone(tel); consultar(tel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function consultar(tel = phone) {
    const digitos = tel.replace(/\D/g, '')
    if (digitos.length < 10) { setErro('Digite o telefone com DDD.'); return }
    setConsultando(true); setErro('')
    try {
      const res = await fetch(`/api/loyalty/saldo?phone=${encodeURIComponent(tel)}`, { cache: 'no-store' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.ok) { setErro(d.error ?? 'Não foi possível consultar agora.'); setSaldo(null) }
      else { setSaldo(d.saldo); if (d.config?.roleta) setRoleta(d.config.roleta) }
    } catch {
      setErro('Falha de conexão. Tente novamente.')
    } finally {
      setConsultando(false)
    }
  }

  const demo = !saldo

  return (
    <><Header />
      <main className="pt-16 min-h-screen bg-navy">
        <div className="mx-auto max-w-2xl space-y-6 px-5 py-10 sm:px-8">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">{nomePrograma}</p>
            <h1 className="mt-1 text-4xl font-black text-white">Roleta da sorte</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
              {roleta
                ? `A cada ${roleta.pedidosPorGiro} pedidos você ganha um giro. Desconto, frete grátis, cookie, adicional — tudo pode sair.`
                : 'Gire e concorra a descontos, frete grátis, cookies e adicionais.'}
            </p>
          </div>

          {carregando ? (
            <div className="flex items-center justify-center gap-2 py-20 text-white/40">
              <Loader2 size={18} className="animate-spin" /> Carregando a roleta…
            </div>
          ) : !roleta ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
              A roleta não está disponível no momento.
            </div>
          ) : (
            <>
              {/* Quem já consultou gira valendo; quem não, conhece a roleta girando de mentirinha */}
              {demo && (
                <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-center text-[13px] text-amber-200">
                  <strong className="font-black">Modo demonstração.</strong> Gire à vontade para
                  conhecer — aqui não vale prêmio. Informe seu WhatsApp abaixo para girar valendo.
                </div>
              )}

              {!ativo && (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-[13px] text-white/50">
                  A roleta ainda não está valendo. Em breve!
                </div>
              )}

              <Roleta
                // Remonta ao trocar de modo, para a roda voltar ao início
                key={demo ? 'demo' : saldo!.phone}
                config={roleta}
                saldo={demo ? SALDO_DEMO : saldo!}
                phone={demo ? '' : saldo!.phone}
                girarLocal={demo ? () => drawSlice(roleta.fatias, Math.random()) : undefined}
                ocultarCabecalho={demo}
                onFim={() => { if (!demo) consultar(saldo!.phone) }}
              />

              {/* Consulta */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-white/40">
                  {demo ? 'Girar valendo — seu WhatsApp' : 'Trocar de número'}
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
                    disabled={consultando}
                    className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
                  >
                    {consultando ? <Loader2 size={16} className="animate-spin" /> : null}
                    Ver meus giros
                  </button>
                </div>
                {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}
                <p className="mt-2 text-[11px] text-white/30">
                  Use o mesmo número dos seus pedidos. Só pedidos entregues contam.
                </p>
              </div>

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
