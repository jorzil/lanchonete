'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, Clock, Zap, MessageCircle, ArrowRight, ChevronRight, MapPin, Shield, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SandwichBuilder } from '@/components/builder/sandwich-builder'
import { FadingVideo } from '@/components/ui/fading-video'
import { BlurText } from '@/components/ui/blur-text'
import { useCart } from '@/contexts/cart-context'
import { PRODUCTS, formatCurrency, type Product } from '@/lib/store'
import { toast } from 'sonner'

const ease = [0.16, 1, 0.3, 1] as const
const fadeUp = (delay = 0) => ({
  initial: { filter: 'blur(10px)', opacity: 0, y: 20 },
  animate: { filter: 'blur(0px)', opacity: 1, y: 0 },
  transition: { duration: 0.8, ease, delay },
})

// ─── HERO ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-end overflow-hidden bg-[#011a33]">
      {/* Static BG fallback */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1553909489-cd47e0907980?w=1920&q=90&auto=format&fit=crop"
          alt=""
          fill priority
          className="object-cover object-center scale-105"
          sizes="100vw"
        />
      </div>
      {/* Fading video overlay */}
      <FadingVideo
        src="https://videos.pexels.com/video-files/3209280/3209280-hd_1920_1080_30fps.mp4"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Atmospheric overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#011a33] via-[#011a33]/65 to-[#011a33]/10 z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#011a33]/90 via-[#011a33]/30 to-transparent z-10" />

      {/* Floating glass info cards — top right */}
      <div className="absolute top-28 right-6 sm:right-12 lg:right-20 hidden md:flex flex-col gap-3 z-20">
        {[
          { icon: '⭐', title: '4.9 / 5.0', sub: '2.000+ avaliações', delay: 0.7, orange: false },
          { icon: '🚀', title: '~28 minutos', sub: 'Tempo médio de entrega', delay: 0.85, orange: false },
          { icon: '🎁', title: 'Frete Grátis', sub: 'Pedidos acima de R$50', delay: 1.0, orange: true },
        ].map((c) => (
          <motion.div
            key={c.title}
            {...fadeUp(c.delay)}
            className={`${c.orange ? 'liquid-glass-orange' : 'liquid-glass'} rounded-2xl px-4 py-3 flex items-center gap-3 w-52`}
          >
            <div className={`w-9 h-9 rounded-xl ${c.orange ? 'bg-white/20' : 'bg-white/10'} flex items-center justify-center text-xl`}>
              {c.icon}
            </div>
            <div>
              <p className="text-white font-black text-sm leading-none">{c.title}</p>
              <p className="text-white/55 text-[11px] mt-0.5">{c.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-40">
        <div className="max-w-2xl">
          {/* Badge */}
          <motion.div {...fadeUp(0.4)} className="inline-flex items-center gap-2 liquid-glass-orange text-white text-xs font-black tracking-widest uppercase px-4 py-2 rounded-full mb-6 shadow-lg shadow-[#EE5C13]/30">
            🔥 Novo • Carne Suprema chegou
          </motion.div>

          {/* BlurText headline */}
          <BlurText
            text="O Sub Mais Gostoso Da Cidade"
            className="text-5xl sm:text-6xl lg:text-[5.5rem] font-black text-white leading-[1.02] tracking-tight mb-6"
          />

          {/* Subheading */}
          <motion.p {...fadeUp(0.8)} className="text-white/70 text-lg sm:text-xl leading-relaxed mb-10 max-w-lg">
            Ingredientes frescos, pão artesanal, personalização total — pronto em até 30 minutos na sua porta.
          </motion.p>

          {/* CTAs */}
          <motion.div {...fadeUp(1.1)} className="flex flex-col sm:flex-row gap-4 mb-14">
            <Link href="/cardapio">
              <button className="flex items-center justify-center gap-2 bg-[#EE5C13] hover:bg-[#d94b0d] text-white font-black px-10 py-4 rounded-2xl text-lg transition-all hover:scale-105 hover:shadow-2xl hover:shadow-[#EE5C13]/40 w-full sm:w-auto shadow-xl shadow-[#EE5C13]/30">
                Montar Meu Sub
                <ChevronRight size={22} />
              </button>
            </Link>
            <Link href="/cardapio">
              <button className="flex items-center justify-center gap-2 liquid-glass-strong text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-all hover:scale-105 w-full sm:w-auto">
                Ver Cardápio
                <ArrowRight size={18} />
              </button>
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div {...fadeUp(1.3)} className="flex flex-wrap items-center gap-3">
            {[
              { icon: <Star size={14} className="fill-yellow-400 text-yellow-400" />, text: '4.9 • 2.000+ avaliações' },
              { icon: <Clock size={14} className="text-[#EE5C13]" />, text: 'Entrega em ~30 min' },
              { icon: <Zap size={14} className="text-green-400" />, text: 'Frete grátis +R$50' },
            ].map((b) => (
              <div key={b.text} className="liquid-glass flex items-center gap-2 text-white/85 text-sm font-medium px-4 py-2 rounded-full">
                {b.icon} {b.text}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Partners row */}
      <motion.div {...fadeUp(1.4)} className="absolute bottom-8 left-0 right-0 z-20 flex flex-col items-center gap-3 pointer-events-none">
        <div className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white/70">
          Parceiros em qualidade de ingredientes
        </div>
        <div className="flex items-center gap-8 sm:gap-12 text-white/40 text-lg sm:text-2xl font-black tracking-tight italic">
          {['Forno d\'Ouro', 'FreshFarm', 'QueijoPlus', 'BioCarnes', 'FrigoTop'].map(p => (
            <span key={p} className="hidden sm:block">{p}</span>
          ))}
          <span className="sm:hidden text-sm">Ingredientes selecionados</span>
        </div>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-gray-50 to-transparent z-20" />
    </section>
  )
}

// ─── PROMO TICKER ─────────────────────────────────────────────────────────────
function PromoTicker() {
  const items = [
    '🔥 FRETE GRÁTIS acima de R$50',
    '🥖 Novidade: Carne Suprema com Requeijão',
    '⚡ Combo Especial por R$45,90',
    '🎁 2 Subs 15cm + 2 Refris = R$54,90',
    '🏆 Melhor sub da cidade — avaliação 4.9 ⭐',
  ]
  const repeated = [...items, ...items]

  return (
    <div className="bg-[#EE5C13] overflow-hidden py-2.5">
      <div className="flex gap-12 animate-ticker whitespace-nowrap">
        {repeated.map((item, i) => (
          <span key={i} className="text-white text-xs font-black tracking-wider uppercase shrink-0">
            {item}
            <span className="mx-6 opacity-50">•</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── CATEGORY TABS ────────────────────────────────────────────────────────────
const CATS = [
  { key: 'all',      label: 'Todos' },
  { key: 'subs-15cm', label: 'Subs 15cm' },
  { key: 'subs-30cm', label: 'Subs 30cm' },
  { key: 'combos',   label: 'Combos' },
  { key: 'bebidas',  label: 'Bebidas' },
]

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ product, onCustomize, onAdd }: {
  product: Product
  onCustomize: (p: Product) => void
  onAdd: (p: Product) => void
}) {
  const isSub = product.category === 'subs-15cm' || product.category === 'subs-30cm'

  return (
    <div className="group bg-white rounded-[1.25rem] overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.07)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.14)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col border border-gray-100/80">
      <div className="relative h-52 overflow-hidden bg-gray-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100 text-7xl">
            {product.image}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        {product.badge && (
          <span className={`absolute top-3 left-3 ${product.badge.color} text-white text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full shadow-lg`}>
            {product.badge.label}
          </span>
        )}
        <span className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-[9px] font-bold px-2.5 py-1 rounded-full">
          {CATS.find(c => c.key === product.category)?.label}
        </span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-black text-gray-900 text-[1rem] leading-snug mb-1.5">{product.name}</h3>
        <p className="text-gray-400 text-[13px] leading-relaxed mb-5 flex-1 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between gap-3 pt-3.5 border-t border-gray-100">
          <div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider leading-none mb-1">a partir de</p>
            <p className="text-[1.6rem] font-black text-[#EE5C13] leading-none tabular-nums">{formatCurrency(product.price)}</p>
          </div>
          <Button
            onClick={() => isSub ? onCustomize(product) : onAdd(product)}
            className={`rounded-xl h-11 px-5 font-bold text-sm transition-all hover:scale-105 shadow-sm ${
              isSub
                ? 'bg-[#EE5C13] hover:bg-[#d94b0d] text-white hover:shadow-[#EE5C13]/30 hover:shadow-lg'
                : 'bg-[#023E74] hover:bg-[#0359A2] text-white'
            }`}
          >
            {isSub ? 'Personalizar' : '+ Adicionar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── FEATURED ─────────────────────────────────────────────────────────────────
function FeaturedSection() {
  const [active, setActive] = useState('all')
  const [builderProduct, setBuilderProduct] = useState<Product | undefined>()
  const [builderOpen, setBuilderOpen] = useState(false)
  const { addItem } = useCart()

  const filtered = (active === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === active)).filter(p => p.active)

  return (
    <section className="bg-gray-50 pt-2 pb-20">
      <div className="bg-white border-b border-gray-100 sticky top-[64px] z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-3">
            {CATS.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActive(cat.key)}
                className={`shrink-0 px-5 py-2 rounded-full font-semibold text-[13px] transition-all ${
                  active === cat.key
                    ? 'bg-[#EE5C13] text-white shadow-md shadow-[#EE5C13]/25'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[#EE5C13] font-bold text-sm uppercase tracking-widest mb-1">Cardápio</p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#011a33] leading-tight">
              {active === 'all' ? 'Mais Pedidos Hoje 🔥' : CATS.find(c => c.key === active)?.label}
            </h2>
          </div>
          <Link href="/cardapio" className="hidden sm:flex items-center gap-1.5 text-[#EE5C13] font-semibold text-sm hover:underline">
            Ver tudo <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.slice(0, 8).map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onCustomize={p => { setBuilderProduct(p); setBuilderOpen(true) }}
              onAdd={p => { addItem({ productId: p.id, name: p.name, price: p.price, quantity: 1, image: p.image }); toast.success(`${p.name} adicionado!`) }}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/cardapio">
            <Button size="lg" variant="outline" className="border-2 border-[#023E74] text-[#023E74] hover:bg-[#023E74] hover:text-white font-bold px-10 py-5 rounded-2xl text-base transition-all hover:scale-105">
              Ver Cardápio Completo <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      <SandwichBuilder product={builderProduct} open={builderOpen} onClose={() => setBuilderOpen(false)} />
    </section>
  )
}

// ─── DIFERENCIAIS (cinematic capabilities section) ────────────────────────────
function DiferenciaisSection() {
  const cards = [
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
          <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
        </svg>
      ),
      tags: ['Pão Artesanal', 'Assado na Hora', 'Sem Conservantes', 'Crocante'],
      title: 'Pão Artesanal',
      body: 'Nosso pão é assado diariamente no próprio estabelecimento — crocante por fora, macio por dentro, sem conservantes.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
          <path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-8-15.03-8-15.03 0h15.03zM1.02 17h15v2h-15z"/>
        </svg>
      ),
      tags: ['Carne Premium', 'Lombo Defumado', 'Frango Grelhado', 'Sem Hormônios'],
      title: 'Carnes Selecionadas',
      body: 'Lombo defumado artesanalmente, frango marinado, carne bovina premium — fornecedores auditados semanalmente.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
        </svg>
      ),
      tags: ['6 Molhos', '8 Saladas', '4 Extras', 'Combo Sob Medida'],
      title: 'Personalização Total',
      body: 'Tamanho, carne, queijo, saladas, até 3 molhos e extras — cada sub é montado do jeito que você imaginar.',
    },
  ]

  return (
    <section className="relative min-h-screen bg-[#000] overflow-hidden">
      {/* Video background */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=1920&q=90&auto=format&fit=crop"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>
      <FadingVideo
        src="https://videos.pexels.com/video-files/4253925/4253925-hd_1920_1080_25fps.mp4"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* No overlay — contrast via glass cards */}

      <div className="relative z-10 px-4 sm:px-8 md:px-16 lg:px-20 pt-24 pb-16 flex flex-col min-h-screen">
        {/* Header */}
        <div className="mb-auto">
          <motion.p
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, ease }}
            className="text-sm font-medium text-white/80 mb-6 tracking-widest uppercase"
          >
            // Por que o Mais Sub?
          </motion.p>
          <BlurText
            text="Qualidade sem compromisso"
            className="font-black text-white text-5xl md:text-6xl lg:text-[5.5rem] leading-[0.95] tracking-tight"
          />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ filter: 'blur(10px)', opacity: 0, y: 40 }}
              whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease, delay: i * 0.15 }}
              className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-4">
                <div className="liquid-glass w-11 h-11 rounded-[0.75rem] flex items-center justify-center shrink-0">
                  {card.icon}
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[65%]">
                  {card.tags.map(tag => (
                    <span key={tag} className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Bottom */}
              <div className="mt-6">
                <h3 className="font-black text-white text-3xl md:text-4xl leading-none tracking-tight mb-3">
                  {card.title}
                </h3>
                <p className="text-sm text-white/85 leading-snug max-w-[32ch]">
                  {card.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── STATS ────────────────────────────────────────────────────────────────────
function StatsSection() {
  const stats = [
    { value: '500+', label: 'Pedidos por dia', icon: '📦' },
    { value: '4.9★', label: 'Avaliação média', icon: '⭐' },
    { value: '~28min', label: 'Tempo médio', icon: '⚡' },
    { value: '2.000+', label: 'Clientes felizes', icon: '😄' },
  ]
  return (
    <section className="bg-[#011a33] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-4xl sm:text-5xl font-black text-white mb-1 tabular-nums">{s.value}</div>
              <div className="text-white/50 text-sm font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── PROMO BANNER ─────────────────────────────────────────────────────────────
function PromoBanner() {
  return (
    <section className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#EE5C13] via-[#d94b0d] to-[#c43d09] shadow-2xl shadow-orange-900/30">
          <div className="absolute inset-0 opacity-20">
            <Image
              src="https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=1200&q=80&auto=format&fit=crop"
              alt=""
              fill className="object-cover" sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#EE5C13] via-[#EE5C13]/90 to-transparent" />
          <div className="relative grid md:grid-cols-2 gap-8 items-center p-8 md:p-12 lg:p-16">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-black tracking-widest uppercase mb-5">
                ⏰ Oferta por tempo limitado
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-3 leading-tight">
                Combo<br />Especial do Dia
              </h2>
              <p className="text-white/80 text-lg mb-7">Sub 30cm + Refrigerante + Molho Especial da casa.</p>
              <div className="flex items-baseline gap-4 mb-8">
                <span className="text-white/50 line-through text-xl font-semibold">R$52,90</span>
                <span className="text-5xl sm:text-6xl font-black leading-none">R$45,90</span>
              </div>
              <Link href="/cardapio">
                <Button size="lg" className="bg-white text-[#EE5C13] hover:bg-gray-50 font-black px-10 py-5 rounded-2xl text-base transition-all hover:scale-105 shadow-xl shadow-black/20">
                  Pedir Agora <ChevronRight size={20} className="ml-1" />
                </Button>
              </Link>
            </div>
            <div className="hidden md:flex items-center justify-center gap-4">
              {[
                'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=300&q=80&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&q=80&auto=format&fit=crop',
              ].map((src, i) => (
                <div key={i} className={`relative rounded-2xl overflow-hidden shadow-2xl ${i === 0 ? 'w-48 h-48 rotate-[-6deg]' : 'w-36 h-36 rotate-[4deg] -ml-6 mt-8'}`}>
                  <Image src={src} alt="" fill className="object-cover" sizes="200px" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    { n: '01', icon: <MapPin size={28} className="text-[#EE5C13]" />, title: 'Escolha no Cardápio', desc: 'Navegue pelos subs, combos e bebidas. Filtros por categoria deixam tudo fácil.' },
    { n: '02', icon: <Award size={28} className="text-[#EE5C13]" />, title: 'Monte do Seu Jeito', desc: 'Tamanho, carne, queijo, saladas, até 3 molhos e extras — você manda.' },
    { n: '03', icon: <Zap size={28} className="text-[#EE5C13]" />, title: 'Receba em Casa', desc: 'PIX, cartão ou dinheiro. Seu sub fresquinho chega em ~30 minutos.' },
  ]
  return (
    <section className="bg-white py-24" id="como-funciona">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-[#EE5C13] font-black text-sm uppercase tracking-widest mb-3">Simples assim</p>
          <h2 className="text-4xl sm:text-5xl font-black text-[#011a33]">Como <span className="text-[#EE5C13]">Funciona</span></h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, idx) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease, delay: idx * 0.15 }}
              className="relative"
            >
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-[#EE5C13]/40 to-transparent z-0 -translate-x-1/2" />
              )}
              <div className="relative z-10">
                <div className="w-24 h-24 rounded-3xl bg-orange-50 border-2 border-orange-100 flex flex-col items-center justify-center mb-6">
                  {step.icon}
                  <span className="text-[#EE5C13] font-black text-xs tracking-widest mt-1">{step.n}</span>
                </div>
                <h3 className="text-xl font-black text-[#011a33] mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
const REVIEWS = [
  { name: 'Ana Lima', role: 'Cliente VIP', avatar: 'AL', color: 'bg-pink-500', rating: 5, text: 'Melhor sub da cidade! Chegou em 25 minutos ainda quentinho. A personalização é incrível.' },
  { name: 'Carlos Souza', role: 'Fã de carteirinha', avatar: 'CS', color: 'bg-blue-500', rating: 5, text: 'Peço toda semana. O Frango com Cream Cheese é perfeito. Ingredientes sempre frescos e o pão é artesanal mesmo.' },
  { name: 'Mariana Costa', role: 'Foodie', avatar: 'MC', color: 'bg-purple-500', rating: 5, text: 'Atendimento excelente e entrega pontual. Amei poder escolher os molhos — Chipotle + Baconese é a combinação perfeita!' },
  { name: 'Pedro Alves', role: 'Cliente frequente', avatar: 'PA', color: 'bg-green-500', rating: 5, text: 'Custo-benefício imbatível. O combo duplo é excelente para a família inteira. Com certeza virei cliente fiel!' },
]

function TestimonialsSection() {
  return (
    <section className="bg-[#011a33] py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-[#EE5C13] font-black text-sm uppercase tracking-widest mb-3">Depoimentos</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-3">
            O que nossos clientes <span className="text-[#EE5C13]">dizem</span>
          </h2>
          <div className="flex items-center justify-center gap-2 text-white/50 text-sm mt-2">
            {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}
            <span className="ml-1">4.9 baseado em +2.000 avaliações</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {REVIEWS.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease, delay: i * 0.1 }}
              className="bg-white/5 border border-white/8 rounded-2xl p-6 hover:bg-white/8 hover:border-white/15 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={13} className="fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-white/70 text-[13px] leading-relaxed mb-5 min-h-[72px]">&ldquo;{r.text}&rdquo;</p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/8">
                <div className={`w-9 h-9 rounded-full ${r.color} flex items-center justify-center text-white font-black text-xs shrink-0`}>{r.avatar}</div>
                <div>
                  <p className="font-bold text-white text-sm leading-none">{r.name}</p>
                  <p className="text-white/40 text-xs mt-0.5">{r.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── TRUST BANNER ─────────────────────────────────────────────────────────────
function TrustSection() {
  const items = [
    { icon: <Shield size={22} className="text-[#EE5C13]" />, title: 'Ingredientes certificados', desc: 'Fornecedores selecionados e auditados regularmente' },
    { icon: <Award size={22} className="text-[#EE5C13]" />, title: 'Premiado 3x consecutivos', desc: 'Melhor delivery de subs da região em 2022, 2023 e 2024' },
    { icon: <Clock size={22} className="text-[#EE5C13]" />, title: 'Garantia de frescor', desc: 'Ingredientes trocados diariamente até às 10h da manhã' },
    { icon: <Zap size={22} className="text-[#EE5C13]" />, title: 'Entrega expressa', desc: 'Sacolinha lacrada e rastreamento em tempo real' },
  ]
  return (
    <section className="bg-white py-16 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map(item => (
            <div key={item.title} className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">{item.icon}</div>
              <div>
                <p className="font-bold text-gray-900 text-sm leading-snug mb-0.5">{item.title}</p>
                <p className="text-gray-400 text-[12px] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── WHATSAPP CTA ─────────────────────────────────────────────────────────────
function WhatsAppCTA() {
  return (
    <section className="bg-gray-50 py-16" id="contato">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-[1.5rem] bg-gradient-to-br from-[#023E74] to-[#0359A2] overflow-hidden relative shadow-2xl shadow-blue-900/30">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 hidden lg:block">
            <Image
              src="https://images.unsplash.com/photo-1553909489-cd47e0907980?w=600&q=60&auto=format&fit=crop"
              alt="" fill className="object-cover" sizes="300px"
            />
          </div>
          <div className="relative p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white text-center md:text-left">
              <h2 className="text-3xl sm:text-4xl font-black mb-3">Prefere pedir pelo WhatsApp?</h2>
              <p className="text-white/70 text-lg max-w-md">
                Fale com a gente, tire dúvidas e receba atendimento personalizado.
              </p>
            </div>
            <a
              href="https://wa.me/5511999999999"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-black px-10 py-5 rounded-2xl text-lg transition-all hover:scale-105 shadow-xl shadow-green-500/30 shrink-0"
            >
              <MessageCircle size={22} />
              Abrir WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── CTA FINAL ────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="relative py-28 overflow-hidden" id="promocoes">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1509722747041-616f39b57569?w=1920&q=80&auto=format&fit=crop"
          alt="" fill className="object-cover object-center" sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#EE5C13]/90" />
      </div>
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <BlurText
          text="Fome agora?"
          className="text-5xl sm:text-7xl font-black text-white mb-4 leading-tight"
        />
        <motion.p
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, ease, delay: 0.3 }}
          className="text-white/80 text-xl mb-10"
        >
          Monte seu sub perfeito em menos de 2 minutos.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, ease, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/cardapio">
            <Button size="lg" className="bg-white text-[#EE5C13] hover:bg-gray-50 font-black px-14 py-6 rounded-2xl text-xl transition-all hover:scale-105 shadow-2xl shadow-black/20 w-full sm:w-auto">
              Montar Meu Sub 🥖
            </Button>
          </Link>
          <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
            <button className="flex items-center justify-center gap-2 liquid-glass-strong text-white font-bold px-10 py-4 rounded-2xl text-lg transition-all hover:scale-105 w-full sm:w-auto">
              WhatsApp
            </button>
          </a>
        </motion.div>
      </div>
    </section>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <PromoTicker />
        <FeaturedSection />
        <DiferenciaisSection />
        <StatsSection />
        <PromoBanner />
        <HowItWorksSection />
        <TrustSection />
        <TestimonialsSection />
        <WhatsAppCTA />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
