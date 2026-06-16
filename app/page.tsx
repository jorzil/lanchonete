'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Star, Clock, MapPin, Sparkles, Beef, Salad, Flame } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SandwichBuilder } from '@/components/builder/sandwich-builder'
import { useCart } from '@/contexts/cart-context'
import { PRODUCTS, formatCurrency, type Product } from '@/lib/store'
import { MaisSubWordmark, MBadge } from '@/components/brand/logo'
import { toast } from 'sonner'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const, delay },
})

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative bg-[#0B2C5C] overflow-hidden">
      {/* Subtle glow only */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[700px] h-[500px] bg-[#EE5C13]/10 blur-[160px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-32 pb-16 lg:pt-36 lg:pb-24">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">

          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-[#EE5C13]/15 border border-[#EE5C13]/30 rounded-full px-3.5 py-1.5 mb-7"
            >
              <span className="w-1.5 h-1.5 bg-[#EE5C13] rounded-full animate-pulse" />
              <span className="text-[#EE5C13] text-[11.5px] font-bold tracking-[0.16em] uppercase">Aberto agora · Gov. Valadares</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-extrabold text-white text-[56px] sm:text-[72px] lg:text-[88px] leading-[0.95] tracking-[-0.04em] mb-6"
            >
              Monte seu sub<br />
              em <span className="text-[#EE5C13]">2 minutos.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.32 }}
              className="text-white/65 text-[16px] sm:text-[17px] leading-[1.55] mb-9 max-w-[480px]"
            >
              Escolha o tamanho, a carne, o queijo, as saladas e os molhos. Você decide cada detalhe — a gente entrega quentinho em até 30 minutos.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-3 mb-12"
            >
              <Link href="/cardapio" className="block">
                <button className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#EE5C13] hover:bg-[#FF6B1A] text-white font-bold px-8 py-4 rounded-full text-[15px] transition-all shadow-[0_8px_30px_rgba(238,92,19,0.45)]">
                  Começar pedido
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <Link href="/cardapio" className="block">
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/8 hover:bg-white/15 border border-white/15 text-white font-semibold px-7 py-4 rounded-full text-[14.5px] transition-colors">
                  Ver cardápio
                </button>
              </Link>
            </motion.div>

            {/* Trust signals - inline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex items-center gap-6 flex-wrap"
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={11} className="fill-[#EE5C13] text-[#EE5C13]" />)}
                </div>
                <span className="text-white font-semibold text-[13px] tabular-nums">4.9</span>
                <span className="text-white/40 text-[12.5px]">+2.000 avaliações</span>
              </div>
              <div className="h-4 w-px bg-white/15" />
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-[#EE5C13]" />
                <span className="text-white font-semibold text-[13px] tabular-nums">~28min</span>
                <span className="text-white/40 text-[12.5px]">tempo médio</span>
              </div>
            </motion.div>
          </div>

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 relative"
          >
            <div className="relative aspect-[5/6] lg:aspect-[4/5] rounded-[28px] overflow-hidden border border-white/10">
              <Image
                src="https://images.unsplash.com/photo-1553909489-cd47e0907980?w=1200&q=92&auto=format&fit=crop"
                alt="Sub artesanal Mais Sub"
                fill priority
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B2C5C]/40 via-transparent to-transparent" />
            </div>

            {/* M sticker accent */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: -12 }}
              transition={{ duration: 0.6, delay: 0.85 }}
              className="absolute -top-5 -right-3 sm:-right-6"
            >
              <MBadge size={92} />
            </motion.div>

            {/* Price tag */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.95 }}
              className="absolute -bottom-5 -left-3 sm:-left-6 bg-white text-[#0B2C5C] rounded-2xl px-5 py-4 shadow-[0_16px_50px_rgba(0,0,0,0.3)]"
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#0B2C5C]/55 font-bold mb-1">A partir de</p>
              <p className="font-display font-extrabold text-[28px] leading-none tabular-nums tracking-[-0.03em]">R$ 21,90</p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Categories nav — Subway-style strip directly below hero */}
      <CategoryNav />
    </section>
  )
}

// ─── CATEGORY NAV (Subway-style) ─────────────────────────────────────────────
function CategoryNav() {
  const cats = [
    { key: 'subs-15cm', label: 'Subs 15cm', img: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400&q=85', count: PRODUCTS.filter(p => p.active && p.category === 'subs-15cm').length },
    { key: 'subs-30cm', label: 'Subs 30cm', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=85', count: PRODUCTS.filter(p => p.active && p.category === 'subs-30cm').length },
    { key: 'combos',    label: 'Combos',    img: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&q=85', count: PRODUCTS.filter(p => p.active && p.category === 'combos').length },
    { key: 'bebidas',   label: 'Bebidas',   img: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&q=85', count: PRODUCTS.filter(p => p.active && p.category === 'bebidas').length },
  ]
  return (
    <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pb-10 lg:pb-0 lg:-mb-14 lg:translate-y-14">
      <motion.div {...fadeUp(0.1)} className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {cats.map((cat, i) => (
          <Link key={cat.key} href={`/cardapio?cat=${cat.key}`} className="group">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-[#163A6E] hover:bg-[#1B4480] border border-white/10 hover:border-[#EE5C13]/50 rounded-2xl p-5 flex items-center gap-4 transition-all"
            >
              <div className="relative w-14 h-14 lg:w-16 lg:h-16 shrink-0 rounded-xl overflow-hidden bg-[#0A2452]">
                <Image src={cat.img} alt={cat.label} fill className="object-cover" sizes="64px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-[14px] lg:text-[15px] leading-tight">{cat.label}</p>
                <p className="text-white/45 text-[11.5px] mt-0.5 tabular-nums">{cat.count} {cat.count === 1 ? 'opção' : 'opções'}</p>
              </div>
              <ArrowUpRight size={16} className="text-white/30 group-hover:text-[#EE5C13] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0" />
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </div>
  )
}

// ─── HOW IT WORKS (Subway signature) ──────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: '01', icon: Sparkles, title: 'Escolha o tamanho', desc: '15cm para um lanche perfeito ou 30cm para quando a fome aperta.' },
    { n: '02', icon: Beef,     title: 'Selecione a carne', desc: 'Frango grelhado, lombo defumado ou carne suprema premium.' },
    { n: '03', icon: Salad,    title: 'Saladas & molhos',  desc: 'Até 8 saladas frescas e 3 molhos artesanais — totalmente livre.' },
    { n: '04', icon: Flame,    title: 'Finalize com extras', desc: 'Bacon, presunto, peito de peru ou queijo em dobro pra turbinar.' },
  ]
  return (
    <section className="bg-[#0A2452] py-24 lg:py-32 pt-32 lg:pt-44 border-y border-white/6" id="como-funciona">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div {...fadeUp()} className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-[11px] font-bold text-[#EE5C13] uppercase tracking-[0.22em] mb-3">Como funciona</p>
            <h2 className="font-display font-extrabold text-white text-[2.2rem] sm:text-[2.8rem] leading-[0.98] tracking-[-0.04em] max-w-[520px]">
              Do seu jeito,<br />em 4 passos simples.
            </h2>
          </div>
          <Link href="/cardapio">
            <button className="inline-flex items-center gap-2 bg-[#EE5C13] hover:bg-[#FF6B1A] text-white font-bold px-6 py-3 rounded-full text-[13.5px] transition-colors shadow-[0_6px_24px_rgba(238,92,19,0.4)]">
              Começar agora
              <ArrowRight size={14} />
            </button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              {...fadeUp(i * 0.08)}
              className="relative bg-[#163A6E] border border-white/8 rounded-2xl p-6 hover:border-[#EE5C13]/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-[#EE5C13] font-display font-extrabold text-[14px] tabular-nums tracking-wider">{step.n}</span>
                <div className="w-10 h-10 bg-[#EE5C13]/12 rounded-xl flex items-center justify-center">
                  <step.icon size={18} className="text-[#EE5C13]" />
                </div>
              </div>
              <p className="text-white font-bold text-[15px] leading-tight mb-2">{step.title}</p>
              <p className="text-white/50 text-[12.5px] leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ product, onCustomize, onAdd }: {
  product: Product; onCustomize: (p: Product) => void; onAdd: (p: Product) => void
}) {
  const isSub = product.category === 'subs-15cm' || product.category === 'subs-30cm'
  return (
    <div className="group flex flex-col bg-[#163A6E] rounded-2xl overflow-hidden border border-white/8 hover:border-[#EE5C13]/45 hover:shadow-[0_12px_40px_rgba(238,92,19,0.12)] transition-all duration-400">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#0A2452]">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover card-img" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,300px" />
        ) : (
          <div className="h-full flex items-center justify-center text-5xl">{product.image}</div>
        )}
        {product.badge && (
          <span className="absolute top-3 left-3 bg-[#EE5C13] text-white text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full">
            {product.badge.label.replace(/[^\w\s]/g, '').trim()}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-white text-[14.5px] leading-snug mb-1">{product.name}</h3>
        <p className="text-white/45 text-[12.5px] leading-relaxed line-clamp-2 flex-1">{product.description}</p>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/8">
          <div>
            <p className="text-[9.5px] text-white/30 font-medium uppercase tracking-wider mb-0.5">a partir de</p>
            <p className="text-[17px] font-bold text-white leading-none tabular-nums">{formatCurrency(product.price)}</p>
          </div>
          <button
            onClick={() => isSub ? onCustomize(product) : onAdd(product)}
            className="flex items-center gap-1 bg-[#EE5C13] hover:bg-[#FF6B1A] text-white text-[12px] font-bold px-4 py-2 rounded-full transition-all"
          >
            {isSub ? 'Montar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── FEATURED ─────────────────────────────────────────────────────────────────
function FeaturedSection() {
  const [builderProduct, setBuilderProduct] = useState<Product | undefined>()
  const [builderOpen, setBuilderOpen] = useState(false)
  const { addItem } = useCart()
  const featured = PRODUCTS.filter(p => p.active && (p.category === 'subs-15cm' || p.category === 'subs-30cm')).slice(0, 4)

  return (
    <section className="bg-[#0B2C5C] py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div {...fadeUp()} className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5 mb-12">
          <div>
            <p className="text-[11px] font-bold text-[#EE5C13] uppercase tracking-[0.22em] mb-3">Mais pedidos</p>
            <h2 className="font-display font-extrabold text-white text-[2.2rem] sm:text-[2.8rem] leading-[0.98] tracking-[-0.04em]">
              Os subs queridos<br />pela galera.
            </h2>
          </div>
          <Link href="/cardapio" className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-white/55 hover:text-white transition-colors">
            Ver cardápio completo <ArrowRight size={13} />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map((p, i) => (
            <motion.div key={p.id} {...fadeUp(i * 0.07)}>
              <ProductCard
                product={p}
                onCustomize={pr => { setBuilderProduct(pr); setBuilderOpen(true) }}
                onAdd={pr => { addItem({ productId: pr.id, name: pr.name, price: pr.price, quantity: 1, image: pr.image }); toast.success(`${pr.name} adicionado!`) }}
              />
            </motion.div>
          ))}
        </div>
      </div>
      <SandwichBuilder product={builderProduct} open={builderOpen} onClose={() => setBuilderOpen(false)} />
    </section>
  )
}

// ─── PROMO BANNER ─────────────────────────────────────────────────────────────
function PromoBanner() {
  return (
    <section className="bg-[#EE5C13] py-16 lg:py-20 relative overflow-hidden">
      {/* Pattern from packaging */}
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 14px 14px, #0B2C5C 3px, transparent 3.5px), radial-gradient(circle at 42px 42px, #0B2C5C 2.5px, transparent 3px)',
          backgroundSize: '56px 56px',
        }}
      />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div {...fadeUp()} className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <p className="text-white/85 text-[11px] font-bold uppercase tracking-[0.22em] mb-3">Promoção</p>
            <h2 className="font-display font-extrabold text-white text-[2rem] sm:text-[2.6rem] lg:text-[3.2rem] leading-[0.98] tracking-[-0.04em] mb-4">
              Frete grátis<br />
              acima de R$ 50.
            </h2>
            <p className="text-white/85 text-[15px] max-w-[420px]">
              Em todo Governador Valadares. Válido todo dia, do almoço ao jantar.
            </p>
          </div>
          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3">
            <Link href="/cardapio" className="block">
              <button className="w-full inline-flex items-center justify-center gap-2 bg-[#0B2C5C] hover:bg-[#163A6E] text-white font-bold px-7 py-4 rounded-full text-[14.5px] transition-colors shadow-[0_8px_24px_rgba(11,44,92,0.35)]">
                Pedir agora
                <ArrowRight size={15} />
              </button>
            </Link>
            <a href="https://wa.me/5533999999999" target="_blank" rel="noopener noreferrer" className="block">
              <button className="w-full inline-flex items-center justify-center gap-2 bg-white/95 hover:bg-white text-[#0B2C5C] font-bold px-7 py-4 rounded-full text-[14.5px] transition-colors">
                Falar no WhatsApp
              </button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── COMBOS ───────────────────────────────────────────────────────────────────
function CombosSection() {
  const { addItem } = useCart()
  const combos = PRODUCTS.filter(p => p.active && p.category === 'combos')
  return (
    <section className="bg-[#0B2C5C] py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div {...fadeUp()} className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5 mb-12">
          <div>
            <p className="text-[11px] font-bold text-[#EE5C13] uppercase tracking-[0.22em] mb-3">Combos</p>
            <h2 className="font-display font-extrabold text-white text-[2.2rem] sm:text-[2.8rem] leading-[0.98] tracking-[-0.04em]">
              Mais sabor<br />pelo mesmo preço.
            </h2>
          </div>
          <Link href="/cardapio?cat=combos" className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-white/55 hover:text-white transition-colors">
            Ver todos <ArrowRight size={13} />
          </Link>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4">
          {combos.map((combo, i) => (
            <motion.article
              key={combo.id}
              {...fadeUp(i * 0.08)}
              className={`relative rounded-2xl overflow-hidden border border-white/8 hover:border-[#EE5C13]/40 hover:shadow-[0_12px_40px_rgba(238,92,19,0.12)] transition-all duration-300 ${i === 0 ? 'sm:col-span-2' : ''}`}
            >
              <div className={`relative overflow-hidden bg-[#163A6E] ${i === 0 ? 'aspect-[16/8]' : 'aspect-[4/3]'}`}>
                {combo.imageUrl && (
                  <Image src={combo.imageUrl} alt={combo.name} fill className="object-cover card-img" sizes="600px" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B2C5C]/85 via-[#0B2C5C]/25 to-transparent" />
                {combo.badge && (
                  <span className="absolute top-3 left-3 bg-[#EE5C13] text-white text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full">
                    {combo.badge.label.replace(/[^\w\s]/g, '').trim()}
                  </span>
                )}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-[18px] leading-tight">{combo.name}</p>
                    <p className="text-white/65 text-[12.5px] mt-1 line-clamp-1">{combo.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-white font-display font-extrabold text-[22px] tabular-nums leading-none tracking-[-0.03em]">{formatCurrency(combo.price)}</p>
                    <button
                      onClick={() => { addItem({ productId: combo.id, name: combo.name, price: combo.price, quantity: 1, image: combo.image }); toast.success(`${combo.name} adicionado!`) }}
                      className="bg-[#EE5C13] hover:bg-[#FF6B1A] text-white text-[12px] font-bold px-4 py-2 rounded-full transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── BRAND ────────────────────────────────────────────────────────────────────
function BrandSection() {
  return (
    <section className="bg-[#0A2452] py-24 lg:py-32" id="sobre">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div {...fadeUp()} className="relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/8">
              <Image
                src="https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=900&q=90&auto=format&fit=crop"
                alt="Mais Sub artesanal"
                fill className="object-cover" sizes="(max-width:1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A2452]/50 to-transparent" />
            </div>
            <div className="absolute -top-4 -left-4 rotate-[-12deg]">
              <MBadge size={72} />
            </div>
            <div className="absolute -bottom-5 right-4 sm:right-8 bg-[#EE5C13] text-white rounded-2xl px-5 py-4 shadow-[0_16px_50px_rgba(238,92,19,0.4)]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/85 font-bold mb-1">Avaliação</p>
              <div className="flex items-center gap-2">
                <p className="font-display font-extrabold text-[26px] leading-none tabular-nums tracking-[-0.03em]">4.9</p>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={11} className="fill-white text-white" />)}
                </div>
              </div>
              <p className="text-white/85 text-[11px] mt-1">+2.000 reviews</p>
            </div>
          </motion.div>

          <div>
            <motion.p {...fadeUp(0.05)} className="text-[11px] font-bold text-[#EE5C13] uppercase tracking-[0.22em] mb-4">A marca</motion.p>
            <motion.h2 {...fadeUp(0.12)} className="font-display font-extrabold text-white text-[2.2rem] sm:text-[2.8rem] leading-[0.98] tracking-[-0.04em] mb-6">
              Subs feitos<br />com cuidado.
            </motion.h2>
            <motion.p {...fadeUp(0.18)} className="text-white/55 text-[15px] leading-relaxed mb-10 max-w-md">
              Em Governador Valadares desde o primeiro pão. Cada sub é montado na hora, com ingredientes selecionados e embalado no nosso papel azul e laranja.
            </motion.p>
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                { t: 'Pão na hora', d: 'Assado todos os dias na nossa cozinha.' },
                { t: 'Carnes selecionadas', d: 'Lombo defumado, frango grelhado, carne premium.' },
                { t: 'Ingredientes frescos', d: 'Saladas repostas toda manhã.' },
                { t: 'Entrega em ~28 min', d: 'Quentinho na sua porta em Gov. Valadares.' },
              ].map((p, i) => (
                <motion.div key={p.t} {...fadeUp(0.24 + i * 0.06)} className="border-l border-[#EE5C13] pl-4">
                  <p className="font-bold text-white text-[14px] mb-1">{p.t}</p>
                  <p className="text-white/45 text-[12.5px] leading-relaxed">{p.d}</p>
                </motion.div>
              ))}
            </div>
            <motion.div {...fadeUp(0.5)} className="mt-10">
              <Link href="/cardapio">
                <button className="group inline-flex items-center gap-2 bg-[#EE5C13] hover:bg-[#FF6B1A] text-white font-bold px-7 py-3.5 rounded-full text-[14px] transition-all shadow-[0_8px_24px_rgba(238,92,19,0.35)]">
                  Fazer pedido <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── REVIEWS ──────────────────────────────────────────────────────────────────
const REVIEWS = [
  { name: 'Ana Lima', role: 'Cliente frequente', text: 'Melhor sub da cidade, sem exagero. Chegou em 24 minutos, ainda quentinho. A personalização é surreal.' },
  { name: 'Carlos Souza', role: 'Todo sábado', text: 'O Frango com Cream Cheese é irresistível. Peço toda semana há 4 meses. Nunca uma decepção.' },
  { name: 'Mariana Costa', role: 'Foodie', text: 'Chipotle + Baconese é a combinação. Atendimento rápido, embalagem impecável. Meu favorito.' },
]

function Reviews() {
  return (
    <section className="bg-[#0B2C5C] py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div {...fadeUp()} className="text-center mb-14">
          <p className="text-[11px] font-bold text-[#EE5C13] uppercase tracking-[0.22em] mb-3">Avaliações</p>
          <h2 className="font-display font-extrabold text-white text-[2.2rem] sm:text-[2.8rem] leading-[0.98] tracking-[-0.04em] mb-4">
            +2.000 clientes confirmam.
          </h2>
          <div className="inline-flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} className="fill-[#EE5C13] text-[#EE5C13]" />)}
            </div>
            <span className="text-white font-bold text-[15px] tabular-nums">4.9</span>
            <span className="text-white/45 text-[13.5px]">de média</span>
          </div>
        </motion.div>
        <div className="grid sm:grid-cols-3 gap-4">
          {REVIEWS.map((r, i) => (
            <motion.div key={r.name} {...fadeUp(i * 0.1)} className="bg-[#163A6E] border border-white/8 rounded-2xl p-6">
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className="fill-[#EE5C13] text-[#EE5C13]" />)}
              </div>
              <p className="text-white/85 text-[14px] leading-relaxed mb-6">&ldquo;{r.text}&rdquo;</p>
              <div className="pt-4 border-t border-white/8 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#EE5C13] text-white grid place-items-center text-[12px] font-bold">
                  {r.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-bold text-white text-[13px]">{r.name}</p>
                  <p className="text-white/40 text-[11.5px]">{r.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA FINAL ────────────────────────────────────────────────────────────────
function CtaFinal() {
  return (
    <section className="bg-[#0A2452] pt-8 pb-24 lg:pb-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          {...fadeUp()}
          className="relative overflow-hidden bg-[#0B2C5C] border border-[#EE5C13]/25 rounded-[28px] px-8 py-16 sm:px-14 sm:py-20 lg:px-20 lg:py-24"
        >
          <div className="absolute -top-20 -right-16 opacity-[0.07] pointer-events-none">
            <MBadge size={400} />
          </div>
          <div className="relative grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <p className="text-[11px] font-bold text-[#EE5C13] uppercase tracking-[0.22em] mb-4">Bora?</p>
              <h2 className="font-display font-extrabold text-white text-[2.4rem] sm:text-[3.2rem] lg:text-[4rem] leading-[0.95] tracking-[-0.045em] mb-5">
                Tá com fome?<br />
                <span className="text-[#EE5C13]">Monte seu sub.</span>
              </h2>
              <p className="text-white/55 text-[15px] max-w-[440px] leading-relaxed">
                Em 2 minutos você personaliza tudo. A gente entrega quentinho em até 30 minutos.
              </p>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-3">
              <Link href="/cardapio" className="block">
                <button className="group w-full inline-flex items-center justify-center gap-2 bg-[#EE5C13] hover:bg-[#FF6B1A] text-white font-bold px-8 py-4 rounded-full text-[15px] transition-all shadow-[0_10px_36px_rgba(238,92,19,0.5)]">
                  Começar meu pedido
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <a href="https://wa.me/5533999999999" target="_blank" rel="noopener noreferrer" className="block">
                <button className="w-full inline-flex items-center justify-center gap-2 bg-white/8 hover:bg-white/15 border border-white/15 text-white font-semibold px-8 py-4 rounded-full text-[14.5px] transition-colors">
                  Falar no WhatsApp
                </button>
              </a>
            </div>
          </div>
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
      <main className="bg-[#0B2C5C]">
        <Hero />
        <HowItWorks />
        <FeaturedSection />
        <PromoBanner />
        <CombosSection />
        <BrandSection />
        <Reviews />
        <CtaFinal />
      </main>
      <Footer />
    </>
  )
}
