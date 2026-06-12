'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Star, Zap, Clock, MapPin } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SandwichBuilder } from '@/components/builder/sandwich-builder'
import { useCart } from '@/contexts/cart-context'
import { PRODUCTS, formatCurrency, type Product } from '@/lib/store'
import { toast } from 'sonner'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const, delay },
})

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen bg-[#0A0A0A] flex items-center overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#EE5C13]/6 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[#EE5C13]/4 blur-[100px] rounded-full" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-28 pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: text */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 border border-[#EE5C13]/30 bg-[#EE5C13]/8 rounded-full px-4 py-1.5 mb-8"
            >
              <span className="w-1.5 h-1.5 bg-[#EE5C13] rounded-full animate-pulse" />
              <span className="text-[#EE5C13] text-[11.5px] font-semibold tracking-[0.18em] uppercase">Delivery artesanal · São Paulo</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-[3.4rem] sm:text-[4.5rem] lg:text-[5rem] font-black text-white leading-[1.02] tracking-[-0.045em] mb-6"
            >
              O sub que<br />
              você vai<br />
              <span className="text-[#EE5C13]">pedir todo</span><br />
              dia.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.52 }}
              className="text-white/45 text-[15px] leading-relaxed mb-10 max-w-[380px]"
            >
              Pão assado no dia, ingredientes frescos, montados do seu jeito — entregue em até 30 minutos.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.64 }}
              className="flex flex-col sm:flex-row items-start gap-3 mb-12"
            >
              <Link href="/cardapio">
                <button className="group flex items-center gap-2 bg-[#EE5C13] hover:bg-[#ff6b1a] text-white font-bold px-7 py-4 rounded-full text-[14.5px] transition-all duration-200 shadow-[0_0_40px_rgba(238,92,19,0.4)]">
                  Montar meu sub
                  <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </Link>
              <Link href="/cardapio">
                <button className="flex items-center gap-1.5 border border-white/12 hover:border-white/25 text-white/50 hover:text-white font-medium px-7 py-4 rounded-full text-[14.5px] transition-all duration-200">
                  Ver cardápio
                </button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex items-center gap-6 flex-wrap"
            >
              {[
                { icon: Star, value: '4.9', label: 'avaliação' },
                { icon: Clock, value: '~28min', label: 'entrega' },
                { icon: MapPin, value: 'SP', label: 'capital' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <s.icon size={12} className="text-[#EE5C13]" />
                  <span className="text-white font-semibold text-[14px] tabular-nums">{s.value}</span>
                  <span className="text-white/30 text-[12px]">{s.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/8">
              <Image
                src="https://images.unsplash.com/photo-1553909489-cd47e0907980?w=900&q=90&auto=format&fit=crop"
                alt="Sub artesanal Mais Sub"
                fill priority
                className="object-cover"
                sizes="50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/40 via-transparent to-transparent" />
            </div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="absolute -bottom-6 -left-6 bg-[#141414] border border-white/10 rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#EE5C13]/15 rounded-xl flex items-center justify-center">
                  <Zap size={18} className="text-[#EE5C13]" />
                </div>
                <div>
                  <p className="text-white font-bold text-[14px] leading-none mb-0.5">28 minutos</p>
                  <p className="text-white/40 text-[11px]">tempo médio</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="absolute -top-5 -right-5 bg-[#141414] border border-white/10 rounded-2xl px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={9} className="fill-[#EE5C13] text-[#EE5C13]" />)}
                </div>
                <span className="text-white/50 text-[11px]">+2.000 clientes</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Mobile bg image */}
      <div className="absolute inset-0 lg:hidden -z-10">
        <Image src="https://images.unsplash.com/photo-1553909489-cd47e0907980?w=800&q=70" alt="" fill className="object-cover opacity-10" sizes="100vw" />
      </div>
    </section>
  )
}

// ─── PROMO STRIP ──────────────────────────────────────────────────────────────
function PromoStrip() {
  const items = ['Frete grátis acima de R$50', 'Pão artesanal assado hoje', 'Combo Especial por R$45,90', 'Avaliação 4.9 · +2.000 clientes', '2 Subs 15cm + 2 Refris = R$54,90']
  const rep = [...items, ...items]
  return (
    <div className="bg-[#EE5C13] overflow-hidden py-2.5 select-none">
      <div className="flex gap-14 animate-ticker whitespace-nowrap">
        {rep.map((t, i) => (
          <span key={i} className="text-white text-[11px] font-semibold tracking-[0.12em] uppercase shrink-0">
            {t}<span className="mx-7 opacity-40">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── DARK PRODUCT CARD ────────────────────────────────────────────────────────
function DarkProductCard({ product, onCustomize, onAdd }: {
  product: Product
  onCustomize: (p: Product) => void
  onAdd: (p: Product) => void
}) {
  const isSub = product.category === 'subs-15cm' || product.category === 'subs-30cm'

  return (
    <div className="group flex flex-col bg-[#141414] rounded-2xl overflow-hidden border border-white/6 hover:border-[#EE5C13]/40 hover:shadow-[0_0_40px_rgba(238,92,19,0.1)] transition-all duration-400">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#1a1a1a]">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover card-img" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,300px" />
        ) : (
          <div className="h-full flex items-center justify-center text-5xl">{product.image}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/60 via-transparent to-transparent" />
        {product.badge && (
          <span className="absolute top-3 left-3 bg-[#EE5C13] text-white text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full">
            {product.badge.label.replace(/[^\w\s]/g, '').trim()}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="font-bold text-white text-[14px] leading-snug mb-1">{product.name}</h3>
          <p className="text-white/35 text-[12.5px] leading-relaxed line-clamp-2">{product.description}</p>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-white/6">
          <div>
            <p className="text-[9.5px] text-white/25 font-medium uppercase tracking-wider mb-0.5">a partir de</p>
            <p className="text-[17px] font-bold text-white leading-none tabular-nums">{formatCurrency(product.price)}</p>
          </div>
          <button
            onClick={() => isSub ? onCustomize(product) : onAdd(product)}
            className="flex items-center gap-1.5 bg-white/8 hover:bg-[#EE5C13] border border-white/10 hover:border-[#EE5C13] text-white text-[12px] font-semibold px-4 py-2 rounded-full transition-all duration-200"
          >
            {isSub ? 'Personalizar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── FEATURED SECTION ─────────────────────────────────────────────────────────
function FeaturedSection() {
  const [builderProduct, setBuilderProduct] = useState<Product | undefined>()
  const [builderOpen, setBuilderOpen] = useState(false)
  const { addItem } = useCart()
  const featured = PRODUCTS.filter(p => p.active && (p.category === 'subs-15cm' || p.category === 'subs-30cm')).slice(0, 4)

  return (
    <section className="bg-[#0A0A0A] py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-end justify-between mb-12">
          <motion.div {...fadeUp()}>
            <p className="text-[11px] font-semibold text-[#EE5C13] uppercase tracking-[0.2em] mb-2">Cardápio</p>
            <h2 className="text-[2rem] sm:text-[2.6rem] font-black text-white tracking-[-0.04em] leading-tight">
              Montado do<br />seu jeito.
            </h2>
          </motion.div>
          <motion.div {...fadeUp(0.1)}>
            <Link href="/cardapio" className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-white/30 hover:text-white transition-colors">
              Ver todos <ArrowRight size={13} />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {featured.map((p, i) => (
            <motion.div key={p.id} {...fadeUp(i * 0.08)}>
              <DarkProductCard
                product={p}
                onCustomize={pr => { setBuilderProduct(pr); setBuilderOpen(true) }}
                onAdd={pr => { addItem({ productId: pr.id, name: pr.name, price: pr.price, quantity: 1, image: pr.image }); toast.success(`${pr.name} adicionado!`) }}
              />
            </motion.div>
          ))}
        </div>

        <motion.div {...fadeUp(0.35)} className="text-center mt-10">
          <Link href="/cardapio">
            <button className="inline-flex items-center gap-2 border border-white/12 hover:border-[#EE5C13]/50 text-white/50 hover:text-white text-[13.5px] font-semibold px-8 py-3.5 rounded-full transition-all duration-200">
              Ver subs, combos e bebidas <ArrowRight size={13} />
            </button>
          </Link>
        </motion.div>
      </div>
      <SandwichBuilder product={builderProduct} open={builderOpen} onClose={() => setBuilderOpen(false)} />
    </section>
  )
}

// ─── STATS BAR ────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { value: '500+', label: 'pedidos por dia' },
    { value: '4.9★', label: 'nota média' },
    { value: '28min', label: 'entrega média' },
    { value: '2k+', label: 'clientes felizes' },
  ]
  return (
    <section className="bg-[#EE5C13] py-14">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:divide-x lg:divide-white/20">
          {stats.map((s, i) => (
            <motion.div key={s.label} {...fadeUp(i * 0.07)} className="lg:px-8 first:pl-0 last:pr-0">
              <p className="text-[2.6rem] sm:text-[3.2rem] font-black text-white leading-none tracking-[-0.045em] tabular-nums mb-1.5">
                {s.value}
              </p>
              <p className="text-white/60 text-[13px] font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CRAFT SECTION ────────────────────────────────────────────────────────────
function CraftSection() {
  const points = [
    { title: 'Pão assado diariamente', desc: 'Sem conservantes. Crocante por fora, macio por dentro. Do forno direto ao seu pedido.' },
    { title: 'Carnes sem hormônios', desc: 'Lombo defumado artesanalmente, frango grelhado na hora, carne bovina premium certificada.' },
    { title: 'Ingredientes frescos todo dia', desc: 'Alfaces, tomates, pimentões — repostos toda manhã. O que não é fresco não vai no seu sub.' },
  ]
  return (
    <section className="bg-[#0D0D0D] py-24 lg:py-32" id="sobre">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div {...fadeUp()} className="relative order-2 lg:order-1">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/6">
              <Image
                src="https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=900&q=90&auto=format&fit=crop"
                alt="Preparo artesanal"
                fill className="object-cover" sizes="(max-width:1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/50 to-transparent" />
            </div>
            <div className="absolute -bottom-5 -right-3 sm:right-6 bg-[#141414] border border-white/10 rounded-2xl px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <p className="text-[2rem] font-black text-white leading-none tracking-[-0.04em]">4.9</p>
              <div className="flex gap-0.5 mt-1 mb-0.5">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={11} className="fill-[#EE5C13] text-[#EE5C13]" />)}
              </div>
              <p className="text-white/35 text-[11px]">+2.000 avaliações</p>
            </div>
          </motion.div>

          <div className="order-1 lg:order-2">
            <motion.p {...fadeUp(0.1)} className="text-[11px] font-semibold text-[#EE5C13] uppercase tracking-[0.2em] mb-4">Nosso padrão</motion.p>
            <motion.h2 {...fadeUp(0.17)} className="text-[2.2rem] sm:text-[2.8rem] font-black text-white tracking-[-0.04em] leading-[1.1] mb-6">
              Feito com cuidado.<br />Entregue com rapidez.
            </motion.h2>
            <motion.p {...fadeUp(0.23)} className="text-white/40 text-[15px] leading-relaxed mb-10 max-w-md">
              Cada detalhe importa — do pão ao molho. Não é promessa, é padrão desde o primeiro dia.
            </motion.p>
            <div className="space-y-7">
              {points.map((p, i) => (
                <motion.div key={p.title} {...fadeUp(0.28 + i * 0.08)} className="flex gap-4">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-[#EE5C13]/12 border border-[#EE5C13]/20 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[#EE5C13]" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-[14.5px] mb-1">{p.title}</p>
                    <p className="text-white/35 text-[13.5px] leading-relaxed">{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.div {...fadeUp(0.5)} className="mt-10">
              <Link href="/cardapio">
                <button className="group flex items-center gap-2 bg-[#EE5C13] hover:bg-[#ff6b1a] text-white font-bold px-6 py-3.5 rounded-full text-[13.5px] transition-all duration-200 shadow-[0_0_30px_rgba(238,92,19,0.3)]">
                  Montar meu sub <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── COMBOS SECTION ───────────────────────────────────────────────────────────
function CombosSection() {
  const { addItem } = useCart()
  const combos = PRODUCTS.filter(p => p.active && p.category === 'combos')
  return (
    <section className="bg-[#0A0A0A] py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div {...fadeUp()} className="mb-12">
          <p className="text-[11px] font-semibold text-[#EE5C13] uppercase tracking-[0.2em] mb-2">Promoções</p>
          <h2 className="text-[2rem] sm:text-[2.6rem] font-black text-white tracking-[-0.04em]">Combos do dia.</h2>
        </motion.div>
        <div className="grid sm:grid-cols-3 gap-4">
          {combos.map((combo, i) => (
            <motion.div
              key={combo.id}
              {...fadeUp(i * 0.08)}
              className={`relative rounded-2xl overflow-hidden border border-white/6 hover:border-[#EE5C13]/30 hover:shadow-[0_0_30px_rgba(238,92,19,0.08)] transition-all duration-300 ${i === 0 ? 'sm:col-span-2' : ''}`}
            >
              <div className={`relative overflow-hidden bg-[#141414] ${i === 0 ? 'aspect-[16/7]' : 'aspect-[4/3]'}`}>
                {combo.imageUrl && (
                  <Image src={combo.imageUrl} alt={combo.name} fill className="object-cover card-img" sizes="600px" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 via-[#0A0A0A]/20 to-transparent" />
                {combo.badge && (
                  <span className="absolute top-3 left-3 bg-[#EE5C13] text-white text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full">
                    {combo.badge.label.replace(/[^\w\s]/g, '').trim()}
                  </span>
                )}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-white font-bold text-[17px] leading-tight">{combo.name}</p>
                    <p className="text-white/50 text-[12.5px] mt-0.5 line-clamp-1">{combo.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-white font-black text-[18px] tabular-nums leading-none">{formatCurrency(combo.price)}</p>
                    <button
                      onClick={() => { addItem({ productId: combo.id, name: combo.name, price: combo.price, quantity: 1, image: combo.image }); toast.success(`${combo.name} adicionado!`) }}
                      className="bg-[#EE5C13] hover:bg-[#ff6b1a] text-white text-[12px] font-bold px-4 py-2 rounded-full transition-all duration-200"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
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
  { name: 'Ana Lima', role: 'Cliente frequente', stars: 5, text: 'Melhor sub da cidade, sem exagero. Chegou em 24 minutos, ainda quentinho. A personalização é surreal — dá pra fazer exatamente do jeito que você quer.' },
  { name: 'Carlos Souza', role: 'Todo sábado', stars: 5, text: 'O Frango com Cream Cheese é irresistível. Peço toda semana há 4 meses. Ingredientes sempre frescos, nunca tive uma decepção.' },
  { name: 'Mariana Costa', role: 'Foodie', stars: 5, text: 'Chipotle + Baconese é a combinação. Atendimento rápido, embalagem impecável. Esse é o meu delivery favorito na cidade.' },
]

function Testimonials() {
  return (
    <section className="bg-[#0D0D0D] py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div {...fadeUp()} className="mb-14">
          <p className="text-[11px] font-semibold text-[#EE5C13] uppercase tracking-[0.2em] mb-2">Avaliações</p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <h2 className="text-[2rem] sm:text-[2.6rem] font-black text-white tracking-[-0.04em]">
              O que dizem<br />os clientes.
            </h2>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} className="fill-[#EE5C13] text-[#EE5C13]" />)}
              <span className="text-white/30 text-[13px] ml-1">4.9 · +2.000</span>
            </div>
          </div>
        </motion.div>
        <div className="grid sm:grid-cols-3 gap-4">
          {REVIEWS.map((r, i) => (
            <motion.div
              key={r.name}
              {...fadeUp(i * 0.1)}
              className="bg-[#141414] border border-white/6 hover:border-white/12 rounded-2xl p-6 transition-all duration-300"
            >
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: r.stars }).map((_, i) => <Star key={i} size={12} className="fill-[#EE5C13] text-[#EE5C13]" />)}
              </div>
              <p className="text-white/70 text-[13.5px] leading-relaxed mb-6">&ldquo;{r.text}&rdquo;</p>
              <div className="pt-4 border-t border-white/6">
                <p className="font-bold text-white text-[13.5px]">{r.name}</p>
                <p className="text-white/30 text-[12px] mt-0.5">{r.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CtaSection() {
  return (
    <section className="relative py-28 lg:py-40 overflow-hidden bg-[#0A0A0A]" id="promocoes">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(238,92,19,0.12)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>
      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
        <motion.p {...fadeUp()} className="text-[11px] font-semibold text-[#EE5C13] uppercase tracking-[0.22em] mb-5">
          Pronto para pedir?
        </motion.p>
        <motion.h2 {...fadeUp(0.1)} className="text-[3.2rem] sm:text-[4.5rem] lg:text-[5.5rem] font-black text-white leading-[1.02] tracking-[-0.045em] mb-6">
          Com fome agora?
        </motion.h2>
        <motion.p {...fadeUp(0.18)} className="text-white/35 text-[15px] mb-10 max-w-sm mx-auto">
          Monte seu sub em 2 minutos e receba em casa.
        </motion.p>
        <motion.div {...fadeUp(0.26)} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/cardapio">
            <button className="group flex items-center gap-2 bg-[#EE5C13] hover:bg-[#ff6b1a] text-white font-bold px-8 py-4 rounded-full text-[14.5px] transition-all duration-200 shadow-[0_0_50px_rgba(238,92,19,0.4)]">
              Montar meu sub
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </Link>
          <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
            <button className="flex items-center gap-2 border border-white/15 hover:border-white/30 text-white/50 hover:text-white font-semibold px-7 py-4 rounded-full text-[14.5px] transition-all duration-200">
              💬 WhatsApp
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
        <Hero />
        <PromoStrip />
        <FeaturedSection />
        <StatsBar />
        <CraftSection />
        <CombosSection />
        <Testimonials />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
