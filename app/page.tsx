'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Star } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SandwichBuilder } from '@/components/builder/sandwich-builder'
import { useCart } from '@/contexts/cart-context'
import { PRODUCTS, formatCurrency, type Product } from '@/lib/store'
import { toast } from 'sonner'

// ─── MOTION HELPERS ───────────────────────────────────────────────────────────
const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: 'easeOut' as const, delay },
})

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative flex min-h-screen overflow-hidden bg-[#011a33]">
      {/* Left editorial panel */}
      <div className="relative z-10 flex flex-col justify-center w-full lg:w-[54%] px-6 sm:px-10 lg:px-20 xl:px-28 pt-28 pb-20 lg:pb-28">

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex items-center gap-2.5 mb-8"
        >
          <span className="block w-6 h-px bg-[#EE5C13]" />
          <span className="text-[#EE5C13] text-[11px] font-semibold tracking-[0.22em] uppercase">Delivery artesanal · São Paulo</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="text-[3.2rem] sm:text-[4rem] lg:text-[4.5rem] xl:text-[5rem] font-bold text-white leading-[1.04] tracking-[-0.035em] mb-6"
        >
          O sub artesanal<br />
          <span className="text-[#EE5C13]">que você vai</span><br />
          pedir de novo.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.52 }}
          className="text-white/55 text-[15px] sm:text-base leading-relaxed mb-9 max-w-[400px]"
        >
          Pão assado no dia, ingredientes colhidos frescos, montados do seu jeito — em até 30 minutos.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.64 }}
          className="flex flex-col sm:flex-row items-start gap-4 mb-12"
        >
          <Link href="/cardapio">
            <button className="group flex items-center gap-2 bg-[#EE5C13] hover:bg-[#d94b0d] text-white font-semibold px-7 py-3.5 rounded-full text-[14.5px] transition-all duration-200">
              Montar meu sub
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </Link>
          <Link href="/cardapio">
            <button className="flex items-center gap-1.5 text-white/55 hover:text-white/90 font-medium text-[14.5px] py-3.5 transition-colors duration-200">
              Ver cardápio
            </button>
          </Link>
        </motion.div>

        {/* Inline trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex items-center gap-7 flex-wrap"
        >
          {[
            { value: '4.9', label: 'avaliação' },
            { value: '~28min', label: 'entrega' },
            { value: '2.000+', label: 'clientes' },
            { value: 'R$50+', label: 'frete grátis' },
          ].map((s, i) => (
            <div key={i} className="flex items-baseline gap-1.5">
              <span className="text-white font-semibold text-[15px] leading-none tabular-nums">{s.value}</span>
              <span className="text-white/35 text-[12px]">{s.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Scroll line */}
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 0.8, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-10 left-20 xl:left-28 hidden lg:block origin-top"
        >
          <div className="w-px h-16 bg-gradient-to-b from-white/25 to-transparent" />
        </motion.div>
      </div>

      {/* Right food photo — desktop */}
      <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[49%]">
        <Image
          src="https://images.unsplash.com/photo-1553909489-cd47e0907980?w=1200&q=90&auto=format&fit=crop"
          alt="Sub artesanal Mais Sub"
          fill priority
          className="object-cover object-center"
          sizes="49vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#011a33] via-[#011a33]/15 to-transparent" />
      </div>

      {/* Mobile bg */}
      <div className="absolute inset-0 lg:hidden">
        <Image
          src="https://images.unsplash.com/photo-1553909489-cd47e0907980?w=800&q=80&auto=format&fit=crop"
          alt="" fill className="object-cover" sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#011a33]/82" />
      </div>
    </section>
  )
}

// ─── PROMO STRIP ──────────────────────────────────────────────────────────────
function PromoStrip() {
  const items = [
    'Frete grátis acima de R$50',
    'Pão artesanal assado hoje',
    'Combo Especial por R$45,90',
    'Avaliação 4.9 · +2.000 clientes',
    '2 Subs 15cm + 2 Refris = R$54,90',
  ]
  const rep = [...items, ...items]

  return (
    <div className="bg-[#EE5C13] overflow-hidden py-2.5 select-none">
      <div className="flex gap-14 animate-ticker whitespace-nowrap">
        {rep.map((t, i) => (
          <span key={i} className="text-white text-[11px] font-semibold tracking-[0.12em] uppercase shrink-0">
            {t}
            <span className="mx-7 opacity-40">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── FEATURED PRODUCTS ────────────────────────────────────────────────────────
function ProductCard({ product, onCustomize, onAdd }: {
  product: Product
  onCustomize: (p: Product) => void
  onAdd: (p: Product) => void
}) {
  const isSub = product.category === 'subs-15cm' || product.category === 'subs-30cm'

  return (
    <div className="group flex flex-col bg-white rounded-xl overflow-hidden border border-[#E4E4E7] hover:border-[#D1D5DB] hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] transition-all duration-300">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F4F4F5]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover card-img"
            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,300px"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-6xl">{product.image}</div>
        )}
        {product.badge && (
          <span className="absolute top-3 left-3 bg-[#0A0A0A]/80 backdrop-blur-sm text-white text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full">
            {product.badge.label}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="font-semibold text-[#0A0A0A] text-[14.5px] leading-snug mb-1">{product.name}</h3>
          <p className="text-[#9CA3AF] text-[12.5px] leading-relaxed line-clamp-2">{product.description}</p>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F4F4F5]">
          <div>
            <p className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-wider mb-0.5">a partir de</p>
            <p className="text-[18px] font-bold text-[#0A0A0A] leading-none tabular-nums">{formatCurrency(product.price)}</p>
          </div>
          <button
            onClick={() => isSub ? onCustomize(product) : onAdd(product)}
            className="flex items-center gap-1.5 bg-[#0A0A0A] hover:bg-[#EE5C13] text-white text-[12.5px] font-semibold px-4 py-2 rounded-full transition-all duration-200"
          >
            {isSub ? 'Personalizar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FeaturedSection() {
  const [builderProduct, setBuilderProduct] = useState<Product | undefined>()
  const [builderOpen, setBuilderOpen] = useState(false)
  const { addItem } = useCart()

  const featured = PRODUCTS.filter(p => p.active && (p.category === 'subs-15cm' || p.category === 'subs-30cm')).slice(0, 4)

  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">

        <div className="flex items-end justify-between mb-12">
          <motion.div {...reveal()}>
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.18em] mb-2">Cardápio</p>
            <h2 className="text-[2rem] sm:text-[2.5rem] font-bold text-[#0A0A0A] tracking-[-0.03em] leading-tight">
              Montado do seu jeito.
            </h2>
          </motion.div>
          <motion.div {...reveal(0.1)}>
            <Link href="/cardapio" className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] hover:text-[#0A0A0A] transition-colors">
              Ver cardápio completo
              <ArrowRight size={13} />
            </Link>
          </motion.div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map((p, i) => (
            <motion.div key={p.id} {...reveal(i * 0.07)}>
              <ProductCard
                product={p}
                onCustomize={pr => { setBuilderProduct(pr); setBuilderOpen(true) }}
                onAdd={pr => { addItem({ productId: pr.id, name: pr.name, price: pr.price, quantity: 1, image: pr.image }); toast.success(`${pr.name} adicionado!`) }}
              />
            </motion.div>
          ))}
        </div>

        <motion.div {...reveal(0.3)} className="text-center mt-10">
          <Link href="/cardapio">
            <button className="inline-flex items-center gap-2 border border-[#E4E4E7] hover:border-[#0A0A0A] text-[#0A0A0A] text-[13.5px] font-semibold px-7 py-3 rounded-full transition-all duration-200">
              Ver todos os subs, combos e bebidas
              <ArrowRight size={13} />
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
    { value: '4.9', label: 'nota média (2k+ reviews)' },
    { value: '28min', label: 'tempo médio de entrega' },
    { value: '3×', label: 'premiado melhor delivery' },
  ]

  return (
    <section className="bg-[#011a33] py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:divide-x lg:divide-white/8">
          {stats.map((s, i) => (
            <motion.div key={s.label} {...reveal(i * 0.08)} className="lg:px-8 first:pl-0 last:pr-0">
              <p className="text-[2.5rem] sm:text-[3rem] font-bold text-white leading-none tracking-[-0.04em] tabular-nums mb-2">
                {s.value}
              </p>
              <p className="text-white/40 text-[13px] leading-snug">{s.label}</p>
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
    { title: 'Pão assado diariamente', desc: 'Sem conservantes. Crocante por fora, macio por dentro. Vai do forno direto para o seu pedido.' },
    { title: 'Carnes sem hormônios', desc: 'Lombo defumado artesanalmente, frango grelhado na hora, carne bovina premium certificada.' },
    { title: 'Ingredientes frescos todo dia', desc: 'Alfaces, tomates, pimentões — repostos toda manhã. O que não é fresco não vai no seu sub.' },
  ]

  return (
    <section className="bg-[#FAFAFA] py-24 lg:py-32" id="sobre">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Photo */}
          <motion.div {...reveal()} className="relative">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=900&q=90&auto=format&fit=crop"
                alt="Preparo artesanal"
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 50vw"
              />
            </div>
            {/* Floating stat card */}
            <div className="absolute -bottom-5 -right-4 sm:right-6 bg-white border border-[#E4E4E7] rounded-xl px-5 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
              <p className="text-[2rem] font-bold text-[#0A0A0A] leading-none tracking-[-0.04em]">4.9</p>
              <div className="flex gap-0.5 mt-1 mb-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={11} className="fill-[#EE5C13] text-[#EE5C13]" />
                ))}
              </div>
              <p className="text-[#9CA3AF] text-[11px]">+2.000 avaliações</p>
            </div>
          </motion.div>

          {/* Text */}
          <div>
            <motion.p {...reveal(0.1)} className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.18em] mb-4">
              Nosso padrão
            </motion.p>
            <motion.h2 {...reveal(0.17)} className="text-[2rem] sm:text-[2.6rem] font-bold text-[#0A0A0A] tracking-[-0.03em] leading-[1.12] mb-6">
              Feito com cuidado.<br />Entregue com rapidez.
            </motion.h2>
            <motion.p {...reveal(0.23)} className="text-[#6B7280] text-[15px] leading-relaxed mb-10 max-w-md">
              Cada detalhe importa — do pão ao molho, do preparo à embalagem. Não é promessa, é padrão desde o primeiro dia.
            </motion.p>

            <div className="space-y-7">
              {points.map((p, i) => (
                <motion.div key={p.title} {...reveal(0.28 + i * 0.08)} className="flex gap-4">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-[#EE5C13]/12 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[#EE5C13]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0A0A0A] text-[14.5px] mb-1">{p.title}</p>
                    <p className="text-[#9CA3AF] text-[13.5px] leading-relaxed">{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div {...reveal(0.5)} className="mt-10">
              <Link href="/cardapio">
                <button className="group flex items-center gap-2 border border-[#E4E4E7] hover:border-[#0A0A0A] text-[#0A0A0A] text-[13.5px] font-semibold px-6 py-3 rounded-full transition-all duration-200">
                  Montar meu sub
                  <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── COMBOS ───────────────────────────────────────────────────────────────────
function CombosSection() {
  const { addItem } = useCart()
  const combos = PRODUCTS.filter(p => p.active && p.category === 'combos')

  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div {...reveal()} className="mb-12">
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.18em] mb-2">Promoções</p>
          <h2 className="text-[2rem] sm:text-[2.5rem] font-bold text-[#0A0A0A] tracking-[-0.03em]">Combos do dia.</h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4">
          {combos.map((combo, i) => (
            <motion.div
              key={combo.id}
              {...reveal(i * 0.08)}
              className={`relative rounded-xl overflow-hidden border border-[#E4E4E7] hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] transition-all duration-300 ${i === 0 ? 'sm:col-span-2' : ''}`}
            >
              <div className={`relative overflow-hidden bg-[#F4F4F5] ${i === 0 ? 'aspect-[16/7]' : 'aspect-[4/3]'}`}>
                {combo.imageUrl && (
                  <Image src={combo.imageUrl} alt={combo.name} fill className="object-cover card-img" sizes="600px" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/70 via-transparent to-transparent" />
                {combo.badge && (
                  <span className="absolute top-3 left-3 bg-[#EE5C13] text-white text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full">
                    {combo.badge.label}
                  </span>
                )}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-white font-bold text-lg leading-tight">{combo.name}</p>
                    <p className="text-white/65 text-[12.5px] mt-0.5 line-clamp-1">{combo.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-white font-bold text-[17px] tabular-nums leading-none">{formatCurrency(combo.price)}</p>
                    <button
                      onClick={() => { addItem({ productId: combo.id, name: combo.name, price: combo.price, quantity: 1, image: combo.image }); toast.success(`${combo.name} adicionado!`) }}
                      className="bg-white hover:bg-[#EE5C13] text-[#0A0A0A] hover:text-white text-[12px] font-semibold px-4 py-2 rounded-full transition-all duration-200"
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
    <section className="bg-[#FAFAFA] py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div {...reveal()} className="mb-14">
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.18em] mb-2">Avaliações</p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <h2 className="text-[2rem] sm:text-[2.5rem] font-bold text-[#0A0A0A] tracking-[-0.03em]">
              O que dizem os clientes.
            </h2>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className="fill-[#EE5C13] text-[#EE5C13]" />
              ))}
              <span className="text-[#6B7280] text-[13px] ml-1">4.9 · +2.000 avaliações</span>
            </div>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4">
          {REVIEWS.map((r, i) => (
            <motion.div
              key={r.name}
              {...reveal(i * 0.1)}
              className="bg-white border border-[#E4E4E7] rounded-xl p-6 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300"
            >
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <Star key={i} size={13} className="fill-[#EE5C13] text-[#EE5C13]" />
                ))}
              </div>
              <p className="text-[#0A0A0A] text-[14px] leading-relaxed mb-6">&ldquo;{r.text}&rdquo;</p>
              <div className="pt-5 border-t border-[#F4F4F5]">
                <p className="font-semibold text-[#0A0A0A] text-[13.5px]">{r.name}</p>
                <p className="text-[#9CA3AF] text-[12px] mt-0.5">{r.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FINAL CTA ────────────────────────────────────────────────────────────────
function CtaSection() {
  return (
    <section className="relative py-28 lg:py-36 overflow-hidden bg-[#011a33]" id="promocoes">
      <div className="absolute inset-0 opacity-20">
        <Image
          src="https://images.unsplash.com/photo-1509722747041-616f39b57569?w=1920&q=60&auto=format&fit=crop"
          alt="" fill className="object-cover" sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-[#011a33]/60" />

      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
        <motion.p {...reveal()} className="text-[11px] font-semibold text-[#EE5C13] uppercase tracking-[0.22em] mb-5">
          Pronto para pedir?
        </motion.p>
        <motion.h2 {...reveal(0.1)} className="text-[3rem] sm:text-[4rem] lg:text-[5rem] font-bold text-white leading-[1.04] tracking-[-0.035em] mb-6">
          Com fome agora?
        </motion.h2>
        <motion.p {...reveal(0.18)} className="text-white/50 text-[15px] mb-10 max-w-sm mx-auto">
          Monte seu sub em 2 minutos e receba em casa.
        </motion.p>
        <motion.div {...reveal(0.26)} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/cardapio">
            <button className="group flex items-center gap-2 bg-[#EE5C13] hover:bg-[#d94b0d] text-white font-semibold px-8 py-3.5 rounded-full text-[14.5px] transition-all duration-200">
              Montar meu sub
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </Link>
          <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
            <button className="flex items-center gap-2 border border-white/25 hover:border-white/50 text-white/70 hover:text-white font-medium px-7 py-3.5 rounded-full text-[14.5px] transition-all duration-200">
              Pedir pelo WhatsApp
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
