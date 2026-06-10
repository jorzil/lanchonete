'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, ChevronRight, Truck, Leaf, Palette, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SandwichBuilder } from '@/components/builder/sandwich-builder'
import { useCart } from '@/contexts/cart-context'
import { PRODUCTS, formatCurrency, type Product } from '@/lib/store'
import { toast } from 'sonner'

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-[#023E74] via-[#0359A2] to-[#023E74]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#EE5C13]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#EE5C13]/10 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <Badge className="bg-[#EE5C13] text-white border-0 mb-6 text-sm px-4 py-1 animate-fade-in">
              🔥 Novidade — Sub Carne Suprema chegou!
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 animate-slide-up">
              Monte Seu Sub <span className="text-[#EE5C13]">Do Seu Jeito</span>
            </h1>
            <p className="text-white/80 text-lg sm:text-xl leading-relaxed mb-8 animate-slide-up animation-delay-200">
              Ingredientes frescos selecionados diariamente. Personalize cada detalhe do seu sub e receba em casa com rapidez.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up animation-delay-300">
              <Link href="/cardapio">
                <Button size="lg" className="bg-[#EE5C13] hover:bg-[#d94b0d] text-white font-bold px-8 py-4 rounded-full text-lg transition-all hover:scale-105 animate-pulse-orange w-full sm:w-auto">
                  Fazer Pedido <ChevronRight size={20} className="ml-1" />
                </Button>
              </Link>
              <Link href="/cardapio">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-[#023E74] font-bold px-8 py-4 rounded-full text-lg transition-all hover:scale-105 bg-transparent w-full sm:w-auto">
                  Ver Cardápio
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex items-center gap-8 animate-slide-up animation-delay-400">
              {[{value:'500+',label:'Pedidos/dia'},{value:'4.9⭐',label:'Avaliação'},{value:'30min',label:'Entrega média'}].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                  <div className="text-white/60 text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center animate-slide-in-right animation-delay-200">
            <div className="relative">
              <div className="w-72 h-72 lg:w-96 lg:h-96 bg-white/10 rounded-full flex items-center justify-center animate-float">
                <div className="text-[10rem] lg:text-[13rem] select-none" role="img" aria-label="Sub">🥖</div>
              </div>
              <div className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-xl p-3 animate-fade-in animation-delay-500">
                <div className="text-sm font-bold text-[#023E74]">🥗 Ingredientes</div>
                <div className="text-xs text-gray-500">Sempre frescos</div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-[#EE5C13] rounded-2xl shadow-xl p-3 text-white animate-fade-in animation-delay-600">
                <div className="text-sm font-bold">🚀 Entrega</div>
                <div className="text-xs opacity-80">em ~30 min</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const FEATURES = [
  { icon: <Leaf size={28} />, title: 'Ingredientes Frescos', description: 'Selecionamos os melhores ingredientes diariamente para garantir sabor e qualidade.', color: 'text-green-600', bg: 'bg-green-50' },
  { icon: <Truck size={28} />, title: 'Entrega Rápida', description: 'Seu sub fresquinho entregue na sua porta em até 30 minutos.', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: <Palette size={28} />, title: 'Monte do Seu Jeito', description: 'Escolha tamanho, carne, queijo, saladas, molhos e extras. Total personalização.', color: 'text-[#EE5C13]', bg: 'bg-orange-50' },
  { icon: <CreditCard size={28} />, title: 'Pagamento Facilitado', description: 'PIX, cartão de crédito, débito ou dinheiro. Você escolhe como pagar.', color: 'text-purple-600', bg: 'bg-purple-50' },
]

function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-[#023E74] mb-4">Por que escolher o <span className="text-[#EE5C13]">Mais Sub</span>?</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">Mais do que um lanche — uma experiência gastronômica personalizada.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feat) => (
            <div key={feat.title} className="p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <div className={`w-14 h-14 ${feat.bg} ${feat.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>{feat.icon}</div>
              <h3 className="font-bold text-gray-800 text-lg mb-2">{feat.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const CATEGORIES = [
  { key: 'all', label: 'Todos' },
  { key: 'subs-15cm', label: 'Subs 15cm' },
  { key: 'subs-30cm', label: 'Subs 30cm' },
  { key: 'combos', label: 'Combos' },
  { key: 'bebidas', label: 'Bebidas' },
]

function ProductCard({ product, onCustomize, onAdd }: { product: Product; onCustomize: (p: Product) => void; onAdd: (p: Product) => void }) {
  const isSub = product.category === 'subs-15cm' || product.category === 'subs-30cm'
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
      <div className="h-40 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center text-7xl group-hover:scale-110 transition-transform duration-300">{product.image}</div>
      <div className="p-5">
        <h3 className="font-bold text-gray-800 text-base leading-tight mb-1">{product.name}</h3>
        <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-[#EE5C13] font-black text-xl">{formatCurrency(product.price)}</span>
          <Button size="sm" onClick={() => isSub ? onCustomize(product) : onAdd(product)}
            className="bg-[#EE5C13] hover:bg-[#d94b0d] text-white rounded-full px-4 font-semibold transition-all hover:scale-105">
            {isSub ? 'Personalizar' : 'Adicionar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ProductsSection() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [builderProduct, setBuilderProduct] = useState<Product | undefined>()
  const [builderOpen, setBuilderOpen] = useState(false)
  const { addItem } = useCart()

  const filtered = activeCategory === 'all' ? PRODUCTS.filter((p) => p.active) : PRODUCTS.filter((p) => p.active && p.category === activeCategory)

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-[#023E74] mb-4">Nosso <span className="text-[#EE5C13]">Cardápio</span></h2>
          <p className="text-gray-500 text-lg">Escolha seu favorito e personalize do seu jeito</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {CATEGORIES.map((cat) => (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                activeCategory === cat.key ? 'bg-[#EE5C13] text-white shadow-md scale-105' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#EE5C13] hover:text-[#EE5C13]'
              }`}>{cat.label}</button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product}
              onCustomize={(p) => { setBuilderProduct(p); setBuilderOpen(true) }}
              onAdd={(p) => { addItem({ productId: p.id, name: p.name, price: p.price, quantity: 1, image: p.image }); toast.success(`${p.name} adicionado!`) }}
            />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/cardapio">
            <Button variant="outline" size="lg" className="border-2 border-[#EE5C13] text-[#EE5C13] hover:bg-[#EE5C13] hover:text-white rounded-full px-8 font-semibold transition-all">
              Ver Cardápio Completo <ChevronRight size={18} className="ml-1" />
            </Button>
          </Link>
        </div>
      </div>
      <SandwichBuilder product={builderProduct} open={builderOpen} onClose={() => setBuilderOpen(false)} />
    </section>
  )
}

const TESTIMONIALS = [
  { name: 'Ana Lima', avatar: '👩', rating: 5, text: 'O melhor sub que já comi! A personalização é incrível, dá pra montar exatamente do jeito que você quer. Entrega super rápida também!', date: 'Há 2 dias' },
  { name: 'Carlos Souza', avatar: '👨', rating: 5, text: 'Virei fã! Peço toda semana. O Frango com Cream Cheese é simplesmente perfeito. Ingredientes sempre frescos e o pão é artesanal mesmo.', date: 'Há 5 dias' },
  { name: 'Mariana Costa', avatar: '👩‍🦱', rating: 5, text: 'Atendimento excelente e o lanche chegou quentinho. Amei poder escolher os molhos — Chipotle e Baconese são meus favoritos!', date: 'Há 1 semana' },
]

function TestimonialsSection() {
  return (
    <section className="py-20 bg-white" id="sobre">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-[#023E74] mb-4">O que nossos clientes <span className="text-[#EE5C13]">dizem</span></h2>
          <p className="text-gray-500 text-lg">Mais de 2.000 clientes satisfeitos</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl">{t.avatar}</div>
                <div><p className="font-bold text-gray-800">{t.name}</p><p className="text-gray-400 text-xs">{t.date}</p></div>
              </div>
              <div className="flex gap-0.5 mb-3">{Array.from({length:t.rating}).map((_,i) => <Star key={i} size={16} className="fill-[#EE5C13] text-[#EE5C13]" />)}</div>
              <p className="text-gray-600 text-sm leading-relaxed">{t.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-20 bg-[#EE5C13]" id="promocoes">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="text-6xl mb-6">🥖</div>
        <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">Faça seu pedido agora!</h2>
        <p className="text-white/80 text-lg mb-8">Monte seu sub perfeito e receba em casa. Rápido, gostoso e do seu jeito.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/cardapio">
            <Button size="lg" className="bg-white text-[#EE5C13] hover:bg-gray-100 font-bold px-10 py-4 rounded-full text-lg transition-all hover:scale-105 w-full sm:w-auto">Montar Meu Sub</Button>
          </Link>
          <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/20 font-bold px-10 py-4 rounded-full text-lg transition-all hover:scale-105 bg-transparent w-full sm:w-auto">Pedir pelo WhatsApp</Button>
          </a>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ProductsSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
