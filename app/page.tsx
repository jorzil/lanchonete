'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, Star } from 'lucide-react'
import { HeaderClient } from '@/components/layout/header-client'
import { HeroFrame } from '@/components/home/hero-frame'
import { Footer } from '@/components/layout/footer'
import { PRODUCTS } from '@/lib/data'

gsap.registerPlugin(ScrollTrigger)

// ─── DATA ─────────────────────────────────────────────────────────────────────

const CATEGORY_NAV = [
  {
    key: 'subs-15cm',
    label: 'Subs 15cm',
    img: '/15 cm.jpg',
    count: PRODUCTS.filter((p) => p.active && p.category === 'subs-15cm').length,
  },
  {
    key: 'subs-30cm',
    label: 'Subs 30cm',
    img: '/lombo-defumado.jpg',
    count: PRODUCTS.filter((p) => p.active && p.category === 'subs-30cm').length,
  },
  {
    key: 'combos',
    label: 'Combos',
    img: '/bacon-barbecue.jpg',
    count: PRODUCTS.filter((p) => p.active && p.category === 'combos').length,
  },
  {
    key: 'cookies',
    label: 'Cookies',
    img: '/caramelo-salgado.jpg',
    count: PRODUCTS.filter((p) => p.active && p.category === 'cookies').length,
  },
  {
    key: 'bebidas',
    label: 'Bebidas',
    img: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800&q=80&auto=format&fit=crop',
    count: PRODUCTS.filter((p) => p.active && p.category === 'bebidas').length,
  },
]

// ─── MAGNETIC BUTTON ─────────────────────────────────────────────────────────

function MagneticButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const x = e.clientX - (rect.left + rect.width / 2)
    const y = e.clientY - (rect.top + rect.height / 2)
    btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`
  }

  const handleMouseLeave = () => {
    if (!btnRef.current) return
    btnRef.current.style.transition = 'transform 0.5s cubic-bezier(0.23,1,0.32,1)'
    btnRef.current.style.transform = 'translate(0px,0px)'
  }

  const handleMouseEnter = () => {
    if (!btnRef.current) return
    btnRef.current.style.transition = 'transform 0.15s ease'
  }

  return (
    <button
      ref={btnRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// ─── SCENE 1 — IMPACT HERO ────────────────────────────────────────────────────

function SceneHero() {
  const headlineRef = useRef<HTMLDivElement>(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX - window.innerWidth / 2) * 0.03,
        y: (e.clientY - window.innerHeight / 2) * 0.03,
      })
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  useEffect(() => {
    if (!headlineRef.current) return
    const ctx = gsap.context(() => {
      const chars = headlineRef.current!.querySelectorAll('.char')
      gsap.fromTo(
        chars,
        { y: 120, opacity: 0, skewY: 8 },
        {
          y: 0,
          opacity: 1,
          skewY: 0,
          duration: 1.1,
          stagger: 0.04,
          ease: 'power4.out',
          delay: 0.15,
        }
      )
    }, headlineRef)
    return () => ctx.revert()
  }, [])

  const line1 = ['O', ' ', 'S', 'u', 'b']
  const line2 = [
    { ch: 'M', orange: true },
    { ch: 'a', orange: true },
    { ch: 'i', orange: true },
    { ch: 's', orange: true },
  ]
  const line3 = [
    { ch: 'G', orange: false },
    { ch: 'o', orange: false },
    { ch: 's', orange: false },
    { ch: 't', orange: false },
    { ch: 'o', orange: false },
    { ch: 's', orange: false },
    { ch: 'o', orange: false },
    { ch: '.', orange: false },
  ]

  return (
    <section className="relative min-h-screen bg-navy overflow-hidden flex flex-col">
      {/* Subtle grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Glow orb — follows mouse */}
      <div
        aria-hidden
        className="absolute top-[-10%] right-[-8%] w-[650px] h-[650px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle,rgba(238,92,19,0.22) 0%,rgba(238,92,19,0.07) 50%,transparent 72%)',
          transform: `translate(${mouse.x}px,${mouse.y}px)`,
          transition: 'transform 0.12s linear',
          filter: 'blur(30px)',
        }}
      />
      {/* Secondary glow bottom-left */}
      <div
        aria-hidden
        className="absolute bottom-[-20%] left-[-8%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle,rgba(22,58,110,0.9) 0%,transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="relative flex-1 flex items-center max-w-7xl mx-auto px-5 sm:px-8 pt-28 pb-28 w-full">
        {/* Hero product image — right side */}
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-0 sm:right-8 bottom-0 top-16 hidden lg:flex items-center pointer-events-none"
          style={{ transform: `translate(${mouse.x * -0.4}px,${mouse.y * -0.3}px)`, transition: 'transform 0.18s linear' }}
        >
          <div className="relative w-[480px] h-[340px] rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)] border border-white/8">
            <Image
              src="/bacon-barbecue.jpg"
              alt="Sub Mais"
              fill
              className="object-cover"
              sizes="480px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-navy/60" />
          </div>
        </motion.div>

        <div className="w-full max-w-[640px]">
          {/* Eyebrow pill */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="inline-flex items-center gap-2.5 mb-10 bg-brand/10 border border-brand/25 rounded-full px-4 py-1.5"
          >
            <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
            <span className="text-brand text-[11px] font-bold tracking-[0.2em] uppercase">
              Aberto agora · Gov. Valadares
            </span>
          </motion.div>

          {/* Headline */}
          <div ref={headlineRef}>
            <div
              className="font-display font-extrabold leading-[0.88] tracking-[-0.045em]"
              style={{ fontSize: 'clamp(3.8rem,10.5vw,9.5rem)' }}
            >
              {/* Line 1: "O Sub" */}
              <div className="text-white whitespace-nowrap">
                {line1.map((c, i) => (
                  <span key={i} className="char inline-block" style={{ opacity: 0 }}>
                    {c}
                  </span>
                ))}
              </div>
              {/* Line 2: "Mais" in orange */}
              <div className="whitespace-nowrap">
                {line2.map((item, i) => (
                  <span
                    key={i}
                    className="char inline-block text-brand"
                    style={{ opacity: 0 }}
                  >
                    {item.ch}
                  </span>
                ))}
              </div>
              {/* Line 3: "Gostoso." in white */}
              <div className="whitespace-nowrap">
                {line3.map((item, i) => (
                  <span
                    key={i}
                    className="char inline-block text-white"
                    style={{ opacity: 0 }}
                  >
                    {item.ch}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.8 }}
            className="text-white/45 text-[14px] sm:text-[16px] tracking-[0.08em] uppercase font-medium mt-7 mb-10"
          >
            Governador Valadares&nbsp;&nbsp;·&nbsp;&nbsp;Feito na hora&nbsp;&nbsp;·&nbsp;&nbsp;Do seu jeito
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.95 }}
            className="flex flex-wrap gap-3"
          >
            <Link href="/cardapio">
              <MagneticButton className="group inline-flex items-center gap-2.5 bg-brand text-white font-bold px-8 py-4 rounded-full text-[15px] shadow-[0_8px_40px_rgba(238,92,19,0.55)] hover:shadow-[0_12px_55px_rgba(238,92,19,0.7)] transition-shadow">
                Montar meu sub
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </MagneticButton>
            </Link>
            <Link href="/cardapio">
              <MagneticButton className="inline-flex items-center gap-2 bg-transparent text-white font-semibold px-7 py-4 rounded-full text-[15px] border border-white/20 hover:border-white/45 transition-colors">
                Ver cardápio
              </MagneticButton>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Floating badge bottom-right */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2, type: 'spring', stiffness: 180, damping: 18 }}
        className="absolute bottom-10 right-6 sm:right-10 bg-white/7 backdrop-blur-xl border border-white/12 rounded-2xl px-5 py-3.5"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={11} className="fill-brand text-brand" />
            ))}
          </div>
          <span className="text-white font-bold text-[14px] tabular-nums">4.9</span>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none"
        aria-hidden
      >
        <span className="text-white/20 text-[9px] tracking-[0.22em] uppercase font-medium">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-white/20 to-transparent" />
      </motion.div>
    </section>
  )
}

// ─── SCENE 2 — DISCOVERY (CATEGORIES) ────────────────────────────────────────

function SceneCategories() {
  const sectionRef = useRef<HTMLElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cardsRef.current || !sectionRef.current) return
    const ctx = gsap.context(() => {
      const cards = cardsRef.current!.querySelectorAll('.cat-card')
      gsap.fromTo(
        cards,
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 82%',
            toggleActions: 'play none none none',
          },
        }
      )
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="bg-navy-deep py-28 lg:py-40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-16 lg:mb-20"
        >
          <p className="text-brand text-[11px] font-bold tracking-[0.25em] uppercase mb-5">
            Cardápio
          </p>
          <h2
            className="font-display font-extrabold text-white leading-[0.9] tracking-[-0.04em]"
            style={{ fontSize: 'clamp(2.8rem,6.5vw,6rem)' }}
          >
            Escolha seu<br />
            <span className="text-white/25">favorito.</span>
          </h2>
        </motion.div>

        <div
          ref={cardsRef}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5"
        >
          {CATEGORY_NAV.map((cat) => (
            <Link
              key={cat.key}
              href={`/cardapio?cat=${cat.key}`}
              className="group cat-card block opacity-0"
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/8 transition-all duration-500 group-hover:border-brand/60 group-hover:scale-[1.02]">
                <Image
                  src={cat.img}
                  alt={cat.label}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width:1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/35 to-transparent group-hover:from-navy/75 transition-all duration-500" />
                {/* Orange ring on hover */}
                <div className="absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 ring-brand/0 group-hover:ring-brand/70 transition-all duration-300 pointer-events-none" />

                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <p className="text-white font-display font-extrabold text-[1.1rem] sm:text-[1.3rem] leading-tight mb-1">
                    {cat.label}
                  </p>
                  <p className="text-white/40 text-[12px] font-medium tabular-nums">
                    {cat.count} {cat.count === 1 ? 'opção' : 'opções'}
                  </p>
                </div>

                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-brand/0 group-hover:bg-brand transition-all duration-300 flex items-center justify-center">
                  <ArrowRight
                    size={13}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-0"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── SCENE 3 — EXPLORATION (HOW IT WORKS) ────────────────────────────────────

const HOW_STEPS = [
  {
    n: '01',
    title: 'Escolha o pão',
    desc: 'Tradicional ou 4 Queijos — o pão certo para começar tudo com o pé direito.',
  },
  {
    n: '02',
    title: 'Monte seus ingredientes',
    desc: 'Carnes premium, queijos selecionados, saladas frescas e molhos artesanais. Tudo do seu jeito.',
  },
  {
    n: '03',
    title: 'Receba em 30min',
    desc: 'Preparado na hora, embalado com cuidado e entregue quentinho onde você estiver.',
  },
]

function SceneHowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!stepsRef.current || !sectionRef.current) return
    const ctx = gsap.context(() => {
      const steps = stepsRef.current!.querySelectorAll('.how-step')
      steps.forEach((step) => {
        gsap.fromTo(
          step,
          { opacity: 0.15 },
          {
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: step,
              start: 'top 68%',
              end: 'top 30%',
              scrub: true,
            },
          }
        )
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-28 lg:py-40 overflow-hidden"
      style={{ backgroundColor: '#FDF6EC' }}
    >
      {/* Giant background "SUB" text */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      >
        <span
          className="font-display font-extrabold leading-none text-black/[0.04] tracking-[-0.06em]"
          style={{ fontSize: '28vw' }}
        >
          SUB
        </span>
      </div>

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">

          {/* Left — sticky label */}
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:sticky lg:top-32"
          >
            <p className="text-brand text-[11px] font-bold tracking-[0.25em] uppercase mb-5">
              Como funciona
            </p>
            <h2
              className="font-display font-extrabold text-navy leading-[0.91] tracking-[-0.045em] mb-8"
              style={{ fontSize: 'clamp(2.4rem,5vw,5rem)' }}
            >
              Simples<br />como deve ser.
            </h2>
            <p className="text-navy/50 text-[16px] leading-relaxed max-w-[340px]">
              Três passos separam você do sub mais gostoso de Governador Valadares.
            </p>
            <Link href="/cardapio" className="mt-10 inline-block">
              <MagneticButton className="group inline-flex items-center gap-2 bg-navy text-white font-bold px-7 py-3.5 rounded-full text-[14px] hover:bg-navy/90 transition-colors shadow-[0_8px_30px_rgba(11,44,92,0.2)]">
                Montar agora
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </MagneticButton>
            </Link>
          </motion.div>

          {/* Steps */}
          <div ref={stepsRef} className="space-y-0">
            {HOW_STEPS.map((step) => (
              <div
                key={step.n}
                className="how-step flex gap-8 items-start py-12 border-b border-navy/10 last:border-b-0"
                style={{ opacity: 0.15 }}
              >
                <span
                  className="font-display font-extrabold text-brand leading-none shrink-0 tabular-nums"
                  style={{ fontSize: 'clamp(2.5rem,4vw,3.5rem)' }}
                >
                  {step.n}
                </span>
                <div>
                  <h3
                    className="font-display font-extrabold text-navy leading-tight tracking-[-0.025em] mb-3"
                    style={{ fontSize: 'clamp(1.35rem,2.2vw,1.75rem)' }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-navy/50 text-[15px] leading-relaxed max-w-[380px]">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── SCENE 4 — IMMERSION (ABOUT / ATMOSPHERE) ────────────────────────────────

function SceneAbout() {
  const sectionRef = useRef<HTMLElement>(null)
  const imageInnerRef = useRef<HTMLDivElement>(null)
  const stat1Ref = useRef<HTMLDivElement>(null)
  const stat2Ref = useRef<HTMLDivElement>(null)
  const stat3Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return
    const ctx = gsap.context(() => {
      // Parallax image
      if (imageInnerRef.current) {
        gsap.fromTo(
          imageInnerRef.current,
          { y: -60 },
          {
            y: 60,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        )
      }

      // Stats stagger
      const statCards = [stat1Ref.current, stat2Ref.current, stat3Ref.current].filter(Boolean)
      if (statCards.length) {
        gsap.fromTo(
          statCards,
          { opacity: 0, y: 40, scale: 0.88 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.14,
            ease: 'back.out(1.5)',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 58%',
              toggleActions: 'play none none none',
            },
          }
        )
      }
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="bg-navy-deep min-h-screen flex items-center overflow-hidden py-24 lg:py-0"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-24 items-center">

          {/* Left — image with parallax */}
          <div className="relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/8">
              <div
                ref={imageInnerRef}
                className="absolute"
                style={{ inset: '-60px' }}
              >
                <Image
                  src="/italiano-premium.jpg"
                  alt="Mais Sub artesanal"
                  fill
                  className="object-cover"
                  sizes="(max-width:1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/55 via-transparent to-transparent" />
              </div>
            </div>

            {/* Stat cards */}
            <div
              ref={stat1Ref}
              className="absolute -top-5 -right-4 sm:right-4 bg-brand text-white rounded-2xl px-5 py-4 shadow-[0_16px_45px_rgba(238,92,19,0.5)] opacity-0"
            >
              <p className="font-display font-extrabold text-[2rem] leading-none tabular-nums">15min</p>
              <p className="text-white/80 text-[10px] font-bold tracking-[0.14em] uppercase mt-1">Preparo</p>
            </div>

            <div
              ref={stat2Ref}
              className="absolute top-[38%] -left-5 sm:-left-8 bg-white text-navy rounded-2xl px-5 py-4 shadow-[0_16px_50px_rgba(0,0,0,0.2)] opacity-0"
            >
              <p className="font-display font-extrabold text-[2rem] leading-none tabular-nums text-navy">100%</p>
              <p className="text-navy/50 text-[10px] font-bold tracking-[0.14em] uppercase mt-1">Fresco</p>
            </div>

            <div
              ref={stat3Ref}
              className="absolute -bottom-5 right-5 sm:right-8 bg-white/8 backdrop-blur-xl border border-white/15 text-white rounded-2xl px-5 py-4 opacity-0"
            >
              <p className="font-display font-extrabold text-[2rem] leading-none tabular-nums">~28min</p>
              <p className="text-white/55 text-[10px] font-bold tracking-[0.14em] uppercase mt-1">Entrega</p>
            </div>
          </div>

          {/* Right — editorial copy */}
          <motion.div
            initial={{ opacity: 0, x: 35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-brand text-[11px] font-bold tracking-[0.25em] uppercase mb-6">
              Nossa história
            </p>
            <h2
              className="font-display font-extrabold text-white leading-[0.91] tracking-[-0.04em] mb-8"
              style={{ fontSize: 'clamp(2.2rem,4.5vw,4.5rem)' }}
            >
              Mais Sub nasceu<br />
              de uma obsessão:<br />
              <span className="text-brand">o sub perfeito.</span>
            </h2>
            <p className="text-white/52 text-[16px] leading-[1.72] mb-5 max-w-[440px]">
              Cada detalhe importa — o pão assado no ponto certo, as saladas repostas toda manhã, a carne grelhada na hora. Não é entrega. É artesanato.
            </p>
            <p className="text-white/32 text-[15px] leading-[1.72] max-w-[440px]">
              Em Governador Valadares desde o primeiro dia, entregando o mesmo cuidado em cada pedido. Porque você merece o melhor sub da cidade.
            </p>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { title: 'Pão na hora', sub: 'Assado diariamente' },
                { title: 'Ingredientes frescos', sub: 'Sem conservantes' },
                { title: 'Feito por pessoas', sub: 'Com amor de verdade' },
              ].map((item) => (
                <div key={item.title} className="border-l-2 border-brand pl-4">
                  <p className="font-bold text-white text-[14px]">{item.title}</p>
                  <p className="text-white/38 text-[12px] mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── SCENE 5 — CONVERSION (CTA) ──────────────────────────────────────────────

function SceneCTA() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Animated dot grid
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx2d = canvas.getContext('2d')
    if (!ctx2d) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const COLS = 24
    const ROWS = 14
    let frame = 0
    let rafId = 0

    const draw = () => {
      ctx2d.clearRect(0, 0, canvas.width, canvas.height)
      const cellW = canvas.width / COLS
      const cellH = canvas.height / ROWS
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const wave = Math.sin((c + r + frame * 0.04) * 0.52) * 0.5 + 0.5
          const alpha = wave * 0.3 + 0.04
          ctx2d.beginPath()
          ctx2d.arc(c * cellW + cellW / 2, r * cellH + cellH / 2, 2, 0, Math.PI * 2)
          ctx2d.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`
          ctx2d.fill()
        }
      }
      frame++
      rafId = requestAnimationFrame(draw)
    }
    rafId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[85vh] flex items-center justify-center overflow-hidden"
      style={{ background: '#EE5C13' }}
    >
      {/* Dark vignette */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/45 pointer-events-none"
      />

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-white/65 text-[11px] font-bold tracking-[0.28em] uppercase mb-6"
        >
          É hora de pedir
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.85, delay: 0.1 }}
          className="font-display font-extrabold text-white leading-[0.87] tracking-[-0.04em] mb-8"
          style={{ fontSize: 'clamp(3.2rem,10vw,9rem)' }}
        >
          Pronto para<br />pedir?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.28 }}
          className="text-white/72 text-[16px] sm:text-[18px] leading-relaxed mb-12 max-w-[500px] mx-auto"
        >
          Personalize o sub dos seus sonhos e receba em 30 minutos. Feito na hora, do seu jeito.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.42 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* WhatsApp CTA */}
          <a
            href="https://wa.me/5533984619205"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MagneticButton className="group inline-flex items-center gap-3 bg-white text-brand font-bold px-8 py-[18px] rounded-full text-[15px] shadow-[0_12px_40px_rgba(0,0,0,0.25)] hover:shadow-[0_16px_55px_rgba(0,0,0,0.35)] transition-all hover:scale-[1.03] active:scale-[0.98]">
              <svg
                className="w-5 h-5 shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chamar no WhatsApp
            </MagneticButton>
          </a>

          <Link href="/cardapio">
            <MagneticButton className="group inline-flex items-center gap-2 bg-transparent border-2 border-white/45 text-white font-bold px-8 py-[17px] rounded-full text-[15px] hover:bg-white/10 hover:border-white/80 transition-all active:scale-[0.98]">
              Fazer pedido
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </MagneticButton>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <HeaderClient />
      <main>
        {/* Hero original (estático, altura ajustada ao conteúdo) */}
        <HeroFrame />
        <SceneCategories />
        <SceneHowItWorks />
        <SceneAbout />
        <SceneCTA />
      </main>
      <Footer />
    </>
  )
}
