'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Star, Clock, Zap, MessageCircle, ArrowRight, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SandwichBuilder } from '@/components/builder/sandwich-builder'
import { useCart } from '@/contexts/cart-context'
import { PRODUCTS, formatCurrency, type Product } from '@/lib/store'
import { toast } from 'sonner'

// ─── HERO ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#011a33]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-[#EE5C13]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#0359A2]/30 rounded-full blur-[100px]" />
        <div className="absolute top-0 left-1/3 w-[300px] h-[300px] bg-[#EE5C13]/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-0 lg:min-h-screen lg:flex lg:items-center">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">
          {/* Left */}
          <div className="text-white order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 bg-[#EE5C13]/20 border border-[#EE5C13]/40 text-[#EE5C13] text-sm font-semibold px-4 py-2 rounded-full mb-6 animate-fade-in">
              <Flame size={14} className="fill-[#EE5C13]" />
              Novo • Carne Suprema chegou
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6 animate-slide-up">
              O Sub Mais<br />
              <span className="text-[#EE5C13]">Gostoso</span><br />
              Da Cidade
            </h1>

            <p className="text-white/70 text-lg sm:text-xl leading-relaxed mb-8 animate-slide-up animation-delay-200 max-w-lg">
              Ingredientes frescos selecionados diariamente. Monte do seu jeito e receba em casa — rápido, quente e perfeito.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10 animate-slide-up animation-delay-300">
              <Link href="/cardapio">
                <Button size="lg" className="bg-[#EE5C13] hover:bg-[#d94b0d] text-white font-black px-10 py-6 rounded-2xl text-lg transition-all hover:scale-105 hover:shadow-2xl hover:shadow-[#EE5C13]/30 w-full sm:w-auto">
                  Montar Meu Sub
                  <ChevronRight size={22} className="ml-2" />
                </Button>
              </Link>
              <Link href="/cardapio">
                <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white font-semibold px-8 py-6 rounded-2xl text-lg transition-all bg-transparent w-full sm:w-auto">
                  Ver Cardápio
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 animate-fade-in animation-delay-400">
              {[
                { icon: <Star size={16} className="fill-yellow-400 text-yellow-400" />, text: '4.9 avaliação' },
                { icon: <Clock size={16} className="text-[#EE5C13]" />, text: 'Entrega em 30min' },
                { icon: <Zap size={16} className="text-green-400" />, text: 'Frete grátis +R$50' },
              ].map((b) => (
                <div key={b.text} className="flex items-center gap-2 text-white/80 text-sm font-medium">
                  {b.icon} {b.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="order-1 lg:order-2 flex items-center justify-center">
            <div className="relative">
              <div className="w-64 h-64 sm:w-80 sm:h-80 lg:w-[420px] lg:h-[420px] rounded-full bg-gradient-to-br from-[#EE5C13]/30 via-[#EE5C13]/10 to-transparent border border-[#EE5C13]/20 flex items-center justify-center animate-float">
                <div className="text-[9rem] sm:text-[11rem] lg:text-[14rem] select-none drop-shadow-2xl" role="img" aria-label="Sub">🥖</div>
              </div>
              <div className="absolute -top-4 -left-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 text-white text-sm font-semibold shadow-xl animate-fade-in animation-delay-500">
                🥬 Ingredientes frescos
              </div>
              <div className="absolute -bottom-4 -right-4 bg-[#EE5C13] rounded-2xl px-4 py-3 text-white text-sm font-bold shadow-xl animate-fade-in animation-delay-600">
                ⚡ Pronto em 30min
              </div>
              <div className="absolute top-1/2 -right-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-3 py-2 text-white text-xs font-semibold shadow-lg hidden lg:block">
                🔥 +500 hoje
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" className="w-full">
          <path d="M0 80 L0 40 Q360 0 720 40 Q1080 80 1440 40 L1440 80 Z" fill="#f9fafb" />
        </svg>
      </div>
    </section>
  )
}

// ─── CATEGORY STRIP ───────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'all', label: '🍽️ Todos' },
  { key: 'subs-15cm', label: '🥖 Subs 15cm' },
  { key: 'subs-30cm', label: '🥖 Subs 30cm' },
  { key: 'combos', label: '🎁 Combos' },
  { key: 'bebidas', label: '🥤 Bebidas' },
]

function CategoryStrip({ active, onChange }: { active: string; onChange: (k: string) => void }) {
  return (
    <div className="bg-[#011a33] py-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => onChange(cat.key)}
              className={`shrink-0 px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:scale-105 ${
                active === cat.key
                  ? 'bg-[#EE5C13] text-white shadow-lg shadow-[#EE5C13]/30'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────

const PRODUCT_TAGS: Record<string, { label: string; color: string }> = {
  'sub-15-frango': { label: '🔥 Mais Pedido', color: 'bg-red-500' },
  'sub-30-frango': { label: '🔥 Mais Pedido', color: 'bg-red-500' },
  'sub-15-lombo': { label: '⭐ Destaque', color: 'bg-amber-500' },
  'sub-30-carne': { label: '🆕 Novo', color: 'bg-[#EE5C13]' },
  'combo-duplo': { label: '💥 Oferta', color: 'bg-[#0359A2]' },
}

const CARD_GRADIENTS: Record<string, string> = {
  'subs-15cm': 'from-amber-400 via-orange-400 to-orange-500',
  'subs-30cm': 'from-orange-500 via-red-400 to-red-500',
  'combos': 'from-blue-500 via-[#0359A2] to-[#023E74]',
  'bebidas': 'from-cyan-400 via-sky-400 to-blue-500',
}

function ProductCard({ product, onCustomize, onAdd }: {
  product: Product
  onCustomize: (p: Product) => void
  onAdd: (p: Product) => void
}) {
  const isSub = product.category === 'subs-15cm' || product.category === 'subs-30cm'
  const tag = PRODUCT_TAGS[product.id]
  const gradient = CARD_GRADIENTS[product.category] || 'from-orange-400 to-orange-600'

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group flex flex-col">
      <div className={`relative h-48 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
        {tag && (
          <span className={`absolute top-3 left-3 ${tag.color} text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-lg`}>
            {tag.label}
          </span>
        )}
        <div className="text-8xl group-hover:scale-110 transition-transform duration-500 drop-shadow-lg select-none">
          {product.image}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-black text-gray-900 text-base leading-tight mb-1">{product.name}</h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-medium">A partir de</p>
            <p className="text-2xl font-black text-[#EE5C13] leading-none">{formatCurrency(product.price)}</p>
          </div>
          <Button
            onClick={() => isSub ? onCustomize(product) : onAdd(product)}
            className={`rounded-2xl px-5 py-2 font-bold transition-all hover:scale-105 text-sm ${
              isSub
                ? 'bg-[#EE5C13] hover:bg-[#d94b0d] text-white'
                : 'bg-[#023E74] hover:bg-[#0359A2] text-white'
            }`}
          >
            {isSub ? '🥖 Personalizar' : '+ Adicionar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── FEATURED ─────────────────────────────────────────────────────────────────

function FeaturedSection() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [builderProduct, setBuilderProduct] = useState<Product | undefined>()
  const [builderOpen, setBuilderOpen] = useState(false)
  const { addItem } = useCart()

  const filtered = activeCategory === 'all'
    ? PRODUCTS.filter((p) => p.active)
    : PRODUCTS.filter((p) => p.active && p.category === activeCategory)

  return (
    <section className="bg-gray-50">
      <CategoryStrip active={activeCategory} onChange={setActiveCategory} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#011a33]">
              Mais Pedidos Hoje <span className="text-[#EE5C13]">🔥</span>
            </h2>
            <p className="text-gray-500 mt-1">Escolha e monte do seu jeito</p>
          </div>
          <Link href="/cardapio" className="hidden sm:flex items-center gap-1 text-[#EE5C13] font-semibold text-sm hover:underline">
            Ver tudo <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.slice(0, 8).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onCustomize={(p) => { setBuilderProduct(p); setBuilderOpen(true) }}
              onAdd={(p) => { addItem({ productId: p.id, name: p.name, price: p.price, quantity: 1, image: p.image }); toast.success(`${p.name} adicionado!`) }}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/cardapio">
            <Button size="lg" className="bg-[#023E74] hover:bg-[#0359A2] text-white font-bold px-10 py-6 rounded-2xl text-base transition-all hover:scale-105">
              Ver Cardápio Completo <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      <SandwichBuilder product={builderProduct} open={builderOpen} onClose={() => setBuilderOpen(false)} />
    </section>
  )
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    { n: '01', icon: '📱', title: 'Escolha no Cardápio', desc: 'Navegue entre subs, combos e bebidas. Encontre seu favorito.' },
    { n: '02', icon: '🎨', title: 'Monte do Seu Jeito', desc: 'Tamanho, carne, queijo, saladas, molhos e extras — você decide tudo.' },
    { n: '03', icon: '🚀', title: 'Receba em Casa', desc: 'Pague pelo PIX, cartão ou dinheiro e receba fresquinho em até 30 minutos.' },
  ]

  return (
    <section className="bg-[#011a33] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Como <span className="text-[#EE5C13]">Funciona</span>
          </h2>
          <p className="text-white/60 text-lg">Três passos simples para o sub perfeito</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.n} className="text-center group">
              <div className="w-28 h-28 mx-auto rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center mb-6 group-hover:border-[#EE5C13]/40 group-hover:bg-white/10 transition-all">
                <span className="text-4xl mb-1">{step.icon}</span>
                <span className="text-[#EE5C13] font-black text-xs tracking-widest">{step.n}</span>
              </div>
              <h3 className="text-white font-bold text-xl mb-3">{step.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
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
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#EE5C13] via-[#d94b0d] to-[#c43d09] p-8 md:p-12">
          <div className="absolute inset-0 opacity-10 flex items-center justify-end pr-8 pointer-events-none select-none">
            <span className="text-[16rem] leading-none">🥖</span>
          </div>
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
                ⏰ Oferta por tempo limitado
              </div>
              <h2 className="text-4xl sm:text-5xl font-black mb-3 leading-tight">Combo Especial<br />do Dia</h2>
              <p className="text-white/80 text-lg mb-6">Sub 30cm + Refrigerante + Molho Especial.<br />Do jeito que você gosta.</p>
              <div className="flex items-baseline gap-3 mb-8">
                <span className="text-white/50 line-through text-2xl">R$52,90</span>
                <span className="text-5xl font-black">R$45,90</span>
              </div>
              <Link href="/cardapio">
                <Button size="lg" className="bg-white text-[#EE5C13] hover:bg-gray-100 font-black px-8 py-5 rounded-2xl text-base transition-all hover:scale-105">
                  Pedir Agora <ChevronRight size={20} className="ml-1" />
                </Button>
              </Link>
            </div>
            <div className="hidden md:flex items-center justify-center gap-4">
              {['🥖', '🥤', '🎁'].map((emoji, i) => (
                <div key={i} className={`bg-white/20 backdrop-blur rounded-3xl p-6 text-6xl ${i === 1 ? 'scale-110' : ''} hover:scale-110 transition-transform`}>
                  {emoji}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────

const REVIEWS = [
  { name: 'Ana Lima', role: 'Cliente VIP', avatar: '👩', rating: 5, text: 'Melhor sub que já comi! Chegou em 25 minutos, ainda quentinho. A personalização é incrível.' },
  { name: 'Carlos Souza', role: 'Fã de carteirinha', avatar: '👨', rating: 5, text: 'Peço toda semana. O Frango com Cream Cheese é perfeito. Ingredientes sempre frescos.' },
  { name: 'Mariana Costa', role: 'Foodie', avatar: '👩‍🦱', rating: 5, text: 'Atendimento excelente! Amei poder escolher os molhos — Chipotle + Baconese é a combinação perfeita.' },
  { name: 'Pedro Alves', role: 'Cliente frequente', avatar: '👨‍🦲', rating: 5, text: 'Rápido, gostoso e com ótimo custo-benefício. O combo duplo vale cada centavo!' },
]

function TestimonialsSection() {
  return (
    <section className="py-20 bg-[#011a33] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            O que nossos clientes <span className="text-[#EE5C13]">dizem</span>
          </h2>
          <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
            <Star size={16} className="fill-yellow-400 text-yellow-400" />
            <span>4.9 de 5 — baseado em +2.000 avaliações</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {REVIEWS.map((r) => (
            <div key={r.name} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 hover:border-white/20 transition-all">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-5">"{r.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#EE5C13]/20 flex items-center justify-center text-xl">{r.avatar}</div>
                <div>
                  <p className="font-bold text-white text-sm">{r.name}</p>
                  <p className="text-white/40 text-xs">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── WHATSAPP BANNER ──────────────────────────────────────────────────────────

function WhatsAppBanner() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-[#023E74] to-[#0359A2] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-white text-center md:text-left">
            <div className="text-5xl mb-4">💬</div>
            <h2 className="text-3xl sm:text-4xl font-black mb-3">Peça pelo WhatsApp</h2>
            <p className="text-white/70 text-lg max-w-md">
              Prefere pedir direto? Fale com a gente e receba atendimento personalizado.
            </p>
          </div>
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-black px-10 py-5 rounded-2xl text-lg transition-all hover:scale-105 shadow-xl shadow-green-500/30 shrink-0"
          >
            <MessageCircle size={24} />
            Abrir WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="py-24 bg-[#EE5C13] relative overflow-hidden" id="promocoes">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-black/10 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="text-7xl mb-6 animate-float">🥖</div>
        <h2 className="text-4xl sm:text-6xl font-black text-white mb-4">Fome agora?</h2>
        <p className="text-white/80 text-xl mb-10">Monte seu sub perfeito em menos de 2 minutos.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/cardapio">
            <Button size="lg" className="bg-white text-[#EE5C13] hover:bg-gray-50 font-black px-12 py-6 rounded-2xl text-xl transition-all hover:scale-105 shadow-2xl w-full sm:w-auto">
              Montar Meu Sub 🥖
            </Button>
          </Link>
          <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline" className="border-2 border-white/60 text-white hover:bg-white/10 hover:border-white font-bold px-10 py-6 rounded-2xl text-lg bg-transparent w-full sm:w-auto">
              WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <FeaturedSection />
        <HowItWorksSection />
        <PromoBanner />
        <TestimonialsSection />
        <WhatsAppBanner />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
