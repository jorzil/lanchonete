// Server Component — no 'use client'. Hydrates only the interactive islands.
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Star, Clock, Sparkles, Beef, Salad, Flame } from 'lucide-react'
import { HeaderClient } from '@/components/layout/header-client'
import { Footer } from '@/components/layout/footer'
import { FeaturedSection } from '@/components/home/featured-section'
import { CombosSection } from '@/components/home/combos-section'
import { PRODUCTS } from '@/lib/data'
import { MBadge } from '@/components/brand/logo'

// Static data computed once at build time
const CATEGORY_NAV = [
  { key: 'subs-15cm', label: 'Subs 15cm', img: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400&q=80&auto=format&fit=crop', count: PRODUCTS.filter(p => p.active && p.category === 'subs-15cm').length },
  { key: 'subs-30cm', label: 'Subs 30cm', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80&auto=format&fit=crop', count: PRODUCTS.filter(p => p.active && p.category === 'subs-30cm').length },
  { key: 'combos',    label: 'Combos',    img: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&q=80&auto=format&fit=crop', count: PRODUCTS.filter(p => p.active && p.category === 'combos').length },
  { key: 'bebidas',   label: 'Bebidas',   img: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&q=80&auto=format&fit=crop', count: PRODUCTS.filter(p => p.active && p.category === 'bebidas').length },
]

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative bg-navy overflow-hidden">
      <div className="absolute top-0 right-0 w-[700px] h-[500px] bg-brand/10 blur-[160px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-32 pb-16 lg:pt-36 lg:pb-24">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">

          <div className="lg:col-span-6">
            <div className="animate-slide-up inline-flex items-center gap-2 bg-brand/15 border border-brand/30 rounded-full px-3.5 py-1.5 mb-7">
              <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
              <span className="text-brand text-[11.5px] font-bold tracking-[0.16em] uppercase">Aberto agora · Gov. Valadares</span>
            </div>

            <h1 className="animate-slide-up anim-delay-1 font-display font-extrabold text-white text-[56px] sm:text-[72px] lg:text-[88px] leading-[0.95] tracking-[-0.04em] mb-6">
              Monte seu sub<br />
              em <span className="text-brand">2 minutos.</span>
            </h1>

            <p className="animate-slide-up anim-delay-2 text-white/65 text-[16px] sm:text-[17px] leading-[1.55] mb-9 max-w-[480px]">
              Escolha o tamanho, a carne, o queijo, as saladas e os molhos. Você decide cada detalhe — a gente entrega quentinho em até 30 minutos.
            </p>

            <div className="animate-slide-up anim-delay-3 flex flex-col sm:flex-row gap-3 mb-12">
              <Link href="/cardapio">
                <button className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold px-8 py-4 rounded-full text-[15px] transition-colors shadow-[0_8px_30px_rgba(238,92,19,0.45)]">
                  Começar pedido
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <Link href="/cardapio">
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/8 hover:bg-white/15 border border-white/15 text-white font-semibold px-7 py-4 rounded-full text-[14.5px] transition-colors">
                  Ver cardápio
                </button>
              </Link>
            </div>

            <div className="animate-slide-up anim-delay-4 flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[0,1,2,3,4].map(i => <Star key={i} size={11} className="fill-[#EE5C13] text-brand" />)}
                </div>
                <span className="text-white font-semibold text-[13px] tabular-nums">4.9</span>
                <span className="text-white/40 text-[12.5px]">+2.000 avaliações</span>
              </div>
              <div className="h-4 w-px bg-white/15" />
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-brand" />
                <span className="text-white font-semibold text-[13px] tabular-nums">~28min</span>
                <span className="text-white/40 text-[12.5px]">tempo médio</span>
              </div>
            </div>
          </div>

          {/* Hero image — priority for LCP */}
          <div className="animate-fade-in anim-delay-2 lg:col-span-6 relative">
            <div className="relative aspect-[5/6] lg:aspect-[4/5] rounded-[28px] overflow-hidden border border-white/10">
              <Image
                src="https://images.unsplash.com/photo-1553909489-cd47e0907980?w=900&q=85&auto=format&fit=crop"
                alt="Sub artesanal Mais Sub"
                fill priority
                fetchPriority="high"
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-transparent" />
            </div>

            <div className="animate-slide-up anim-delay-5 absolute -top-5 -right-3 sm:-right-6">
              <MBadge size={92} />
            </div>

            <div className="animate-slide-up anim-delay-5 absolute -bottom-5 -left-3 sm:-left-6 bg-white text-navy rounded-2xl px-5 py-4 shadow-[0_16px_50px_rgba(0,0,0,0.3)]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-navy/55 font-bold mb-1">A partir de</p>
              <p className="font-display font-extrabold text-[28px] leading-none tabular-nums tracking-[-0.03em]">R$ 21,90</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category nav */}
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pb-10 lg:pb-0 lg:-mb-14 lg:translate-y-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {CATEGORY_NAV.map((cat, i) => (
            <Link key={cat.key} href={`/cardapio?cat=${cat.key}`} className="group">
              <div
                className="animate-slide-up relative bg-navy-surface hover:bg-[#1B4480] border border-white/10 hover:border-brand/50 rounded-2xl p-5 flex items-center gap-4 transition-colors"
                style={{ animationDelay: `${0.2 + i * 0.07}s` }}
              >
                <div className="relative w-14 h-14 lg:w-16 lg:h-16 shrink-0 rounded-xl overflow-hidden bg-navy-deep">
                  {/* First 2 pills are above-fold on mobile (2-col grid) — prioritize them */}
                  <Image src={cat.img} alt={cat.label} fill className="object-cover"
                    sizes="(max-width:1024px) 56px, 64px"
                    {...(i < 2 ? { priority: true } : { loading: 'lazy' })}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-[14px] lg:text-[15px] leading-tight">{cat.label}</p>
                  <p className="text-white/45 text-[11.5px] mt-0.5 tabular-nums">{cat.count} {cat.count === 1 ? 'opção' : 'opções'}</p>
                </div>
                <ArrowUpRight size={16} className="text-white/30 group-hover:text-brand transition-colors shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: '01', icon: Sparkles, title: 'Escolha o tamanho',   desc: '15cm para um lanche perfeito ou 30cm para quando a fome aperta.' },
    { n: '02', icon: Beef,     title: 'Selecione a carne',   desc: 'Frango grelhado, lombo defumado ou carne suprema premium.' },
    { n: '03', icon: Salad,    title: 'Saladas & molhos',    desc: 'Até 8 saladas frescas e 3 molhos artesanais — totalmente livre.' },
    { n: '04', icon: Flame,    title: 'Finalize com extras', desc: 'Bacon, presunto, peito de peru ou queijo em dobro pra turbinar.' },
  ]
  return (
    <section className="bg-navy-deep py-24 lg:py-32 pt-32 lg:pt-44 border-y border-white/6" id="como-funciona">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.22em] mb-3">Como funciona</p>
            <h2 className="font-display font-extrabold text-white text-[2.2rem] sm:text-[2.8rem] leading-[0.98] tracking-[-0.04em] max-w-[520px]">
              Do seu jeito,<br />em 4 passos simples.
            </h2>
          </div>
          <Link href="/cardapio">
            <button className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold px-6 py-3 rounded-full text-[13.5px] transition-colors shadow-[0_6px_24px_rgba(238,92,19,0.4)]">
              Começar agora <ArrowRight size={14} />
            </button>
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {steps.map((step, i) => (
            <div key={step.n} className="relative bg-navy-surface border border-white/8 rounded-2xl p-6 hover:border-brand/40 transition-colors"
              style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="flex items-center justify-between mb-6">
                <span className="text-brand font-display font-extrabold text-[14px] tabular-nums tracking-wider">{step.n}</span>
                <div className="w-10 h-10 bg-brand/12 rounded-xl flex items-center justify-center">
                  <step.icon size={18} className="text-brand" />
                </div>
              </div>
              <p className="text-white font-bold text-[15px] leading-tight mb-2">{step.title}</p>
              <p className="text-white/50 text-[12.5px] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── PROMO BANNER ─────────────────────────────────────────────────────────────
function PromoBanner() {
  return (
    <section className="bg-brand py-16 lg:py-20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 14px 14px,#0B2C5C 3px,transparent 3.5px),radial-gradient(circle at 42px 42px,#0B2C5C 2.5px,transparent 3px)', backgroundSize: '56px 56px' }} />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <p className="text-white/85 text-[11px] font-bold uppercase tracking-[0.22em] mb-3">Promoção</p>
            <h2 className="font-display font-extrabold text-white text-[2rem] sm:text-[2.6rem] lg:text-[3.2rem] leading-[0.98] tracking-[-0.04em] mb-4">
              Frete grátis<br />acima de R$ 50.
            </h2>
            <p className="text-white/85 text-[15px] max-w-[420px]">Em todo Governador Valadares. Válido todo dia, do almoço ao jantar.</p>
          </div>
          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3">
            <Link href="/cardapio" className="block">
              <button className="w-full inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-surface text-white font-bold px-7 py-4 rounded-full text-[14.5px] transition-colors shadow-[0_8px_24px_rgba(11,44,92,0.35)]">
                Pedir agora <ArrowRight size={15} />
              </button>
            </Link>
            <a href="https://wa.me/5533999999999" target="_blank" rel="noopener noreferrer" className="block">
              <button className="w-full inline-flex items-center justify-center gap-2 bg-white/95 hover:bg-white text-navy font-bold px-7 py-4 rounded-full text-[14.5px] transition-colors">
                Falar no WhatsApp
              </button>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── BRAND ────────────────────────────────────────────────────────────────────
function BrandSection() {
  return (
    <section className="bg-navy-deep py-24 lg:py-32" id="sobre">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/8">
              {/* Not lazy — users scroll here within first 2s; lazy would delay visible content */}
              <Image src="https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=900&q=85&auto=format&fit=crop" alt="Mais Sub artesanal" fill className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/50 to-transparent" />
            </div>
            <div className="absolute -top-4 -left-4 rotate-[-12deg]"><MBadge size={72} /></div>
            <div className="absolute -bottom-5 right-4 sm:right-8 bg-brand text-white rounded-2xl px-5 py-4 shadow-[0_16px_50px_rgba(238,92,19,0.4)]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/85 font-bold mb-1">Avaliação</p>
              <div className="flex items-center gap-2">
                <p className="font-display font-extrabold text-[26px] leading-none tabular-nums tracking-[-0.03em]">4.9</p>
                <div className="flex gap-0.5">{[0,1,2,3,4].map(i => <Star key={i} size={11} className="fill-white text-white" />)}</div>
              </div>
              <p className="text-white/85 text-[11px] mt-1">+2.000 reviews</p>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.22em] mb-4">A marca</p>
            <h2 className="font-display font-extrabold text-white text-[2.2rem] sm:text-[2.8rem] leading-[0.98] tracking-[-0.04em] mb-6">
              Subs feitos<br />com cuidado.
            </h2>
            <p className="text-white/55 text-[15px] leading-relaxed mb-10 max-w-md">
              Em Governador Valadares desde o primeiro pão. Cada sub é montado na hora, com ingredientes selecionados e embalado no nosso papel azul e laranja.
            </p>
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                { t: 'Pão na hora',         d: 'Assado todos os dias na nossa cozinha.' },
                { t: 'Carnes selecionadas', d: 'Lombo defumado, frango grelhado, carne premium.' },
                { t: 'Ingredientes frescos',d: 'Saladas repostas toda manhã.' },
                { t: 'Entrega em ~28 min',  d: 'Quentinho na sua porta em Gov. Valadares.' },
              ].map(p => (
                <div key={p.t} className="border-l border-brand pl-4">
                  <p className="font-bold text-white text-[14px] mb-1">{p.t}</p>
                  <p className="text-white/45 text-[12.5px] leading-relaxed">{p.d}</p>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <Link href="/cardapio">
                <button className="group inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold px-7 py-3.5 rounded-full text-[14px] transition-colors shadow-[0_8px_24px_rgba(238,92,19,0.35)]">
                  Fazer pedido <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── REVIEWS ──────────────────────────────────────────────────────────────────
const REVIEWS = [
  { name: 'Ana Lima',      role: 'Cliente frequente', text: 'Melhor sub da cidade, sem exagero. Chegou em 24 minutos, ainda quentinho. A personalização é surreal.' },
  { name: 'Carlos Souza', role: 'Todo sábado',        text: 'O Frango com Cream Cheese é irresistível. Peço toda semana há 4 meses. Nunca uma decepção.' },
  { name: 'Mariana Costa',role: 'Foodie',             text: 'Chipotle + Baconese é a combinação. Atendimento rápido, embalagem impecável. Meu favorito.' },
]

function Reviews() {
  return (
    <section className="bg-navy py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.22em] mb-3">Avaliações</p>
          <h2 className="font-display font-extrabold text-white text-[2.2rem] sm:text-[2.8rem] leading-[0.98] tracking-[-0.04em] mb-4">+2.000 clientes confirmam.</h2>
          <div className="inline-flex items-center gap-2">
            <div className="flex gap-0.5">{[0,1,2,3,4].map(i => <Star key={i} size={16} className="fill-[#EE5C13] text-brand" />)}</div>
            <span className="text-white font-bold text-[15px] tabular-nums">4.9</span>
            <span className="text-white/45 text-[13.5px]">de média</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {REVIEWS.map(r => (
            <div key={r.name} className="bg-navy-surface border border-white/8 rounded-2xl p-6">
              <div className="flex gap-0.5 mb-5">{[0,1,2,3,4].map(i => <Star key={i} size={12} className="fill-[#EE5C13] text-brand" />)}</div>
              <p className="text-white/85 text-[14px] leading-relaxed mb-6">&ldquo;{r.text}&rdquo;</p>
              <div className="pt-4 border-t border-white/8 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand text-white grid place-items-center text-[12px] font-bold">
                  {r.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-bold text-white text-[13px]">{r.name}</p>
                  <p className="text-white/40 text-[11.5px]">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA FINAL ────────────────────────────────────────────────────────────────
function CtaFinal() {
  return (
    <section className="bg-navy-deep pt-8 pb-24 lg:pb-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="relative overflow-hidden bg-navy border border-brand/25 rounded-[28px] px-8 py-16 sm:px-14 sm:py-20 lg:px-20 lg:py-24">
          <div className="absolute -top-20 -right-16 opacity-[0.07] pointer-events-none"><MBadge size={400} /></div>
          <div className="relative grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <p className="text-[11px] font-bold text-brand uppercase tracking-[0.22em] mb-4">Bora?</p>
              <h2 className="font-display font-extrabold text-white text-[2.4rem] sm:text-[3.2rem] lg:text-[4rem] leading-[0.95] tracking-[-0.045em] mb-5">
                Tá com fome?<br /><span className="text-brand">Monte seu sub.</span>
              </h2>
              <p className="text-white/55 text-[15px] max-w-[440px] leading-relaxed">Em 2 minutos você personaliza tudo. A gente entrega quentinho em até 30 minutos.</p>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-3">
              <Link href="/cardapio" className="block">
                <button className="group w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold px-8 py-4 rounded-full text-[15px] transition-colors shadow-[0_10px_36px_rgba(238,92,19,0.5)]">
                  Começar meu pedido <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <a href="https://wa.me/5533999999999" target="_blank" rel="noopener noreferrer" className="block">
                <button className="w-full inline-flex items-center justify-center gap-2 bg-white/8 hover:bg-white/15 border border-white/15 text-white font-semibold px-8 py-4 rounded-full text-[14.5px] transition-colors">
                  Falar no WhatsApp
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <HeaderClient />
      <main className="bg-navy">
        <Hero />
        <HowItWorks />
        <FeaturedSection />   {/* Client island — needs cart */}
        <PromoBanner />
        <CombosSection />     {/* Client island — needs cart */}
        <BrandSection />
        <Reviews />
        <CtaFinal />
      </main>
      <Footer />
    </>
  )
}
