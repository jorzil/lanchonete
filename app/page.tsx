'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowRight, Star } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SandwichBuilder } from '@/components/builder/sandwich-builder'
import { useCart } from '@/contexts/cart-context'
import { PRODUCTS, formatCurrency, type Product } from '@/lib/store'
import { toast } from 'sonner'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const, delay },
})

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[#8B95A8]">
    <span className="w-5 h-px bg-[#0E1F3C]/30" />
    {children}
  </div>
)

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative pt-[120px] pb-24 lg:pb-32 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-end">

          <div className="lg:col-span-7">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Eyebrow>Mais Sub · Governador Valadares</Eyebrow>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="h-editorial mt-7 text-[#0E1F3C] text-[64px] sm:text-[88px] lg:text-[112px]"
            >
              O sub que você<br />
              <span className="italic font-normal text-[#EE5C13]">vai voltar</span> a pedir.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 text-[16px] leading-[1.55] text-[#3D4D6A] max-w-[480px]"
            >
              Pão assado na hora, ingredientes selecionados todos os dias e o seu sub montado do jeito que você quer.
              Embalado no nosso papel azul e laranja — entregue em até 30 minutos.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.42 }}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <Link href="/cardapio">
                <button className="group inline-flex items-center gap-2 bg-[#0E1F3C] hover:bg-[#1a2e54] text-[#FAF6EE] text-[14px] font-medium pl-6 pr-5 py-3.5 rounded-full transition-colors">
                  Montar meu sub
                  <ArrowUpRight size={15} strokeWidth={1.8} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </Link>
              <Link href="/cardapio">
                <button className="inline-flex items-center gap-2 text-[14px] font-medium text-[#0E1F3C] hover:text-[#EE5C13] px-3 py-3.5 transition-colors link-underline">
                  Ver cardápio
                </button>
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-[4/5] rounded-[20px] overflow-hidden bg-[#F2ECDF]">
              <Image
                src="https://images.unsplash.com/photo-1539252554935-80c3cc6772c2?w=900&q=92&auto=format&fit=crop"
                alt="Sub artesanal Mais Sub"
                fill priority
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 40vw"
              />
            </div>

            {/* Caption card */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="absolute -bottom-6 -left-6 sm:-left-10 bg-[#FAF6EE] border border-[#E8E0D0] rounded-2xl px-5 py-4 shadow-[0_20px_60px_rgba(14,31,60,0.08)] max-w-[260px]"
            >
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={11} className="fill-[#EE5C13] text-[#EE5C13]" />
                ))}
                <span className="text-[11px] text-[#8B95A8] ml-1.5 tabular-nums">4.9 · +2.000</span>
              </div>
              <p className="text-[13px] text-[#3D4D6A] leading-snug">
                &ldquo;Chegou em 24 minutos, ainda quentinho. Surreal.&rdquo;
              </p>
              <p className="text-[11px] text-[#8B95A8] mt-2">Ana, cliente frequente</p>
            </motion.div>
          </motion.div>
        </div>

        {/* Stat strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-24 pt-10 border-t border-[#E8E0D0] grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-10"
        >
          {[
            { value: '4.9', label: 'Avaliação média', sub: 'Mais de 2.000 reviews' },
            { value: '~28', label: 'Minutos', sub: 'Tempo médio de entrega' },
            { value: '500+', label: 'Pedidos / dia', sub: 'Em Governador Valadares' },
            { value: '12', label: 'Combinações', sub: 'Saladas, molhos e extras' },
          ].map((s) => (
            <div key={s.label} className="border-l border-[#E8E0D0] pl-5">
              <p className="h-editorial text-[#0E1F3C] text-[44px] tabular-nums">{s.value}</p>
              <p className="text-[13px] font-medium text-[#0E1F3C] mt-2">{s.label}</p>
              <p className="text-[12px] text-[#8B95A8] mt-1">{s.sub}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── PROMO TICKER ─────────────────────────────────────────────────────────────
function PromoStrip() {
  const items = [
    'Frete grátis acima de R$50',
    'Pão artesanal assado hoje',
    'Combo Especial R$45,90',
    'Avaliação 4.9 · +2.000 clientes',
    '2 Subs 15cm + 2 Refris por R$54,90',
  ]
  const rep = [...items, ...items, ...items]
  return (
    <div className="bg-[#0E1F3C] py-3 overflow-hidden select-none">
      <div className="flex gap-12 animate-ticker whitespace-nowrap">
        {rep.map((t, i) => (
          <span key={i} className="text-[#FAF6EE]/85 text-[11.5px] font-medium tracking-[0.12em] uppercase shrink-0 flex items-center gap-12">
            {t}
            <span className="text-[#EE5C13]">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── EDITORIAL PRODUCT CARD ───────────────────────────────────────────────────
function ProductCard({ product, onCustomize, onAdd }: {
  product: Product; onCustomize: (p: Product) => void; onAdd: (p: Product) => void
}) {
  const isSub = product.category === 'subs-15cm' || product.category === 'subs-30cm'
  return (
    <div className="group flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[14px] bg-[#F2ECDF] mb-5">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover card-img" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,300px" />
        ) : (
          <div className="h-full flex items-center justify-center text-5xl">{product.image}</div>
        )}
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-medium text-[#0E1F3C] leading-snug">{product.name}</h3>
          <p className="text-[12.5px] text-[#8B95A8] leading-relaxed mt-1 line-clamp-2">{product.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[14px] font-medium text-[#0E1F3C] tabular-nums">{formatCurrency(product.price)}</p>
        </div>
      </div>
      <button
        onClick={() => isSub ? onCustomize(product) : onAdd(product)}
        className="mt-4 self-start inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#0E1F3C] hover:text-[#EE5C13] transition-colors link-underline"
      >
        {isSub ? 'Personalizar' : 'Adicionar'}
        <ArrowUpRight size={12} strokeWidth={1.8} />
      </button>
    </div>
  )
}

function FeaturedSection() {
  const [builderProduct, setBuilderProduct] = useState<Product | undefined>()
  const [builderOpen, setBuilderOpen] = useState(false)
  const { addItem } = useCart()
  const featured = PRODUCTS.filter(p => p.active && (p.category === 'subs-15cm' || p.category === 'subs-30cm')).slice(0, 4)

  return (
    <section className="py-28 lg:py-36">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10">
        <div className="flex items-end justify-between gap-8 mb-16">
          <motion.div {...fadeUp()}>
            <Eyebrow>Cardápio</Eyebrow>
            <h2 className="h-editorial mt-5 text-[#0E1F3C] text-[44px] sm:text-[64px] max-w-[600px]">
              Subs montados<br />
              <span className="italic text-[#EE5C13]">do seu jeito.</span>
            </h2>
          </motion.div>
          <motion.div {...fadeUp(0.1)}>
            <Link href="/cardapio" className="hidden sm:inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#0E1F3C] hover:text-[#EE5C13] transition-colors link-underline">
              Ver tudo
              <ArrowRight size={13} strokeWidth={1.8} />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {featured.map((p, i) => (
            <motion.div key={p.id} {...fadeUp(i * 0.06)}>
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

// ─── BRAND MANIFESTO ──────────────────────────────────────────────────────────
function ManifestoSection() {
  return (
    <section className="bg-[#0E1F3C] text-[#FAF6EE] py-28 lg:py-40" id="sobre">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-20">
          <div className="lg:col-span-4">
            <Eyebrow>
              <span className="text-[#FAF6EE]/55">A marca</span>
            </Eyebrow>
            <p className="text-[13px] text-[#FAF6EE]/55 mt-12 max-w-[260px] leading-relaxed">
              A Mais Sub nasceu em Governador Valadares com um propósito claro: fazer o sub mais gostoso da cidade.
              Cada detalhe importa, do pão ao papel de embalagem.
            </p>
          </div>
          <div className="lg:col-span-8">
            <motion.h2
              {...fadeUp()}
              className="h-editorial text-[44px] sm:text-[64px] lg:text-[80px] leading-[0.98]"
            >
              Mais que sub.<br />
              <span className="italic text-[#EE5C13]">Um ritual.</span>
            </motion.h2>
            <motion.div {...fadeUp(0.1)} className="mt-14 grid sm:grid-cols-3 gap-10 lg:gap-14">
              {[
                { n: '01', t: 'Pão na hora', d: 'Assado todos os dias na nossa cozinha. Sem conservantes, sem atalhos.' },
                { n: '02', t: 'Ingredientes frescos', d: 'Repostos toda manhã. O que não está no ponto, não vai no seu sub.' },
                { n: '03', t: 'Do seu jeito', d: '3 carnes, 8 saladas, 6 molhos e 4 extras. Combinação infinita.' },
              ].map((p) => (
                <div key={p.n}>
                  <p className="text-[11px] font-medium tabular-nums text-[#EE5C13] mb-3 tracking-wider">{p.n}</p>
                  <p className="text-[16px] font-medium text-[#FAF6EE] mb-2">{p.t}</p>
                  <p className="text-[13.5px] text-[#FAF6EE]/55 leading-relaxed">{p.d}</p>
                </div>
              ))}
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
    <section className="bg-[#F2ECDF] py-28 lg:py-36">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10">
        <motion.div {...fadeUp()} className="mb-14 max-w-[640px]">
          <Eyebrow>Promoções</Eyebrow>
          <h2 className="h-editorial mt-5 text-[#0E1F3C] text-[44px] sm:text-[64px]">
            Combos da<br />
            <span className="italic text-[#EE5C13]">casa.</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-5">
          {combos.map((combo, i) => (
            <motion.article
              key={combo.id}
              {...fadeUp(i * 0.07)}
              className={`group relative overflow-hidden rounded-[18px] bg-[#FAF6EE] border border-[#E8E0D0] ${
                i === 0 ? 'lg:col-span-7' : 'lg:col-span-5'
              }`}
            >
              <div className={`relative ${i === 0 ? 'aspect-[16/10]' : 'aspect-[4/3]'} bg-[#F2ECDF] overflow-hidden`}>
                {combo.imageUrl && (
                  <Image src={combo.imageUrl} alt={combo.name} fill className="object-cover card-img" sizes="(max-width:1024px) 100vw, 50vw" />
                )}
                {combo.badge && (
                  <span className="absolute top-4 left-4 bg-[#FAF6EE] text-[#0E1F3C] text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full">
                    {combo.badge.label.replace(/[^\w\s]/g, '').trim()}
                  </span>
                )}
              </div>
              <div className="p-6 sm:p-8 flex items-end justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <h3 className="h-editorial text-[#0E1F3C] text-[24px] sm:text-[28px]">{combo.name}</h3>
                  <p className="text-[13px] text-[#3D4D6A] mt-2 leading-relaxed line-clamp-2 max-w-[420px]">{combo.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#8B95A8] mb-1">A partir de</p>
                  <p className="h-editorial text-[#0E1F3C] text-[30px] tabular-nums">{formatCurrency(combo.price)}</p>
                  <button
                    onClick={() => { addItem({ productId: combo.id, name: combo.name, price: combo.price, quantity: 1, image: combo.image }); toast.success(`${combo.name} adicionado!`) }}
                    className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#0E1F3C] hover:text-[#EE5C13] transition-colors link-underline"
                  >
                    Adicionar
                    <ArrowUpRight size={12} strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
const REVIEWS = [
  { name: 'Ana Lima', role: 'Cliente frequente', text: 'Melhor sub da cidade, sem exagero. Chegou em 24 minutos, ainda quentinho. A personalização é surreal.' },
  { name: 'Carlos Souza', role: 'Todo sábado', text: 'O Frango com Cream Cheese é irresistível. Peço toda semana há 4 meses. Ingredientes sempre frescos.' },
  { name: 'Mariana Costa', role: 'Foodie', text: 'Chipotle + Baconese é a combinação. Atendimento rápido, embalagem impecável. Meu delivery favorito.' },
]

function Testimonials() {
  return (
    <section className="py-28 lg:py-36">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10">
        <motion.div {...fadeUp()} className="mb-16 max-w-[640px]">
          <Eyebrow>O que dizem</Eyebrow>
          <h2 className="h-editorial mt-5 text-[#0E1F3C] text-[44px] sm:text-[64px]">
            4.9 estrelas em<br />
            <span className="italic text-[#EE5C13]">+2.000 avaliações.</span>
          </h2>
        </motion.div>
        <div className="grid lg:grid-cols-3 gap-x-10 gap-y-12">
          {REVIEWS.map((r, i) => (
            <motion.figure key={r.name} {...fadeUp(i * 0.08)} className="border-t border-[#E8E0D0] pt-8">
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className="fill-[#EE5C13] text-[#EE5C13]" />)}
              </div>
              <blockquote className="h-editorial text-[22px] text-[#0E1F3C] leading-[1.25]">&ldquo;{r.text}&rdquo;</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0E1F3C] text-[#FAF6EE] grid place-items-center text-[12px] font-medium">
                  {r.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#0E1F3C]">{r.name}</p>
                  <p className="text-[12px] text-[#8B95A8]">{r.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FINAL CTA ────────────────────────────────────────────────────────────────
function CtaSection() {
  return (
    <section className="pt-12 pb-28">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10">
        <motion.div
          {...fadeUp()}
          className="relative overflow-hidden rounded-[24px] bg-[#0E1F3C] text-[#FAF6EE] px-8 py-20 sm:px-14 sm:py-24 lg:px-20 lg:py-28"
        >
          <div className="grid lg:grid-cols-2 gap-10 items-end">
            <div>
              <Eyebrow>
                <span className="text-[#FAF6EE]/55">Bora pedir?</span>
              </Eyebrow>
              <h2 className="h-editorial mt-5 text-[44px] sm:text-[64px] lg:text-[88px]">
                Com fome<br />
                <span className="italic text-[#EE5C13]">agora?</span>
              </h2>
            </div>
            <div className="lg:pb-3">
              <p className="text-[15px] text-[#FAF6EE]/65 max-w-[420px] leading-[1.55] mb-8">
                Monte seu sub em 2 minutos. A gente entrega quentinho na sua porta, em até 30 minutos.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/cardapio">
                  <button className="group inline-flex items-center gap-2 bg-[#EE5C13] hover:bg-[#9C3D0E] text-white text-[14px] font-medium pl-6 pr-5 py-3.5 rounded-full transition-colors">
                    Montar meu sub
                    <ArrowUpRight size={15} strokeWidth={1.8} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </Link>
                <a href="https://wa.me/5533999999999" target="_blank" rel="noopener noreferrer">
                  <button className="inline-flex items-center gap-2 border border-[#FAF6EE]/20 hover:border-[#FAF6EE]/45 text-[#FAF6EE]/85 hover:text-[#FAF6EE] text-[14px] font-medium px-5 py-3.5 rounded-full transition-colors">
                    WhatsApp
                  </button>
                </a>
              </div>
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
      <main className="bg-[#FAF6EE]">
        <Hero />
        <PromoStrip />
        <FeaturedSection />
        <ManifestoSection />
        <CombosSection />
        <Testimonials />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
