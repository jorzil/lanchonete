'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Each ingredient layer
const LAYERS = [
  {
    id: 'bread-bottom',
    label: 'O Pão',
    sublabel: 'Artesanal, tostado na hora',
    img: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7b?w=900&q=90&auto=format&fit=crop',
    alt: 'Pão artesanal',
    yStart: -280,
    scale: 1,
    zIndex: 1,
    sceneText: 'Tudo começa com o pão certo.',
  },
  {
    id: 'meat',
    label: 'A Proteína',
    sublabel: 'Frango grelhado, carne ou lombo',
    img: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=900&q=90&auto=format&fit=crop',
    alt: 'Proteína grelhada',
    yStart: -320,
    scale: 0.96,
    zIndex: 2,
    sceneText: 'Proteína grelhada na hora.',
  },
  {
    id: 'cheese',
    label: 'O Queijo',
    sublabel: 'Mussarela, cheddar ou cream cheese',
    img: 'https://images.unsplash.com/photo-1618164435735-413d3b066c9a?w=900&q=90&auto=format&fit=crop',
    alt: 'Queijo derretido',
    yStart: -360,
    scale: 0.93,
    zIndex: 3,
    sceneText: 'Queijo que derrete do jeito certo.',
  },
  {
    id: 'salad',
    label: 'As Saladas',
    sublabel: 'Alface, tomate, cebola roxa e mais',
    img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&q=90&auto=format&fit=crop',
    alt: 'Saladas frescas',
    yStart: -400,
    scale: 0.90,
    zIndex: 4,
    sceneText: 'Frescor que faz a diferença.',
  },
  {
    id: 'sauce',
    label: 'Os Molhos',
    sublabel: 'Especial, mostarda, maionese e mais',
    img: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=900&q=90&auto=format&fit=crop',
    alt: 'Molhos especiais',
    yStart: -440,
    scale: 0.87,
    zIndex: 5,
    sceneText: 'O toque final que transforma tudo.',
  },
  {
    id: 'bread-top',
    label: 'Pronto.',
    sublabel: 'Seu sub. Do seu jeito.',
    img: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=900&q=90&auto=format&fit=crop',
    alt: 'Sub completo',
    yStart: -500,
    scale: 0.84,
    zIndex: 6,
    sceneText: 'Montado com cuidado. Entregue com orgulho.',
  },
]

export function SubAssembly() {
  const sectionRef = useRef<HTMLElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  const textRefs = useRef<(HTMLDivElement | null)[]>([])
  const ctaRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const totalScenes = LAYERS.length + 1 // +1 for CTA
      const scrollHeight = window.innerHeight * (totalScenes + 0.5)

      // Set initial states — all ingredient layers above screen
      layerRefs.current.forEach((el, i) => {
        if (!el) return
        gsap.set(el, {
          y: LAYERS[i].yStart,
          opacity: 0,
          scale: 0.9,
          filter: 'blur(8px)',
        })
      })

      // Hide all scene texts
      textRefs.current.forEach((el) => {
        if (el) gsap.set(el, { opacity: 0, y: 20 })
      })

      if (ctaRef.current) gsap.set(ctaRef.current, { opacity: 0, y: 30 })

      // Master timeline pinned to the section
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: `+=${scrollHeight}`,
          scrub: 1.2,
          pin: stickyRef.current,
          anticipatePin: 1,
        },
      })

      // Each ingredient drops in sequentially
      LAYERS.forEach((layer, i) => {
        const el = layerRefs.current[i]
        const textEl = textRefs.current[i]
        const prevText = i > 0 ? textRefs.current[i - 1] : null
        const segmentDuration = 1 / (totalScenes + 1)
        const start = i * segmentDuration

        // Fade out previous text
        if (prevText) {
          tl.to(prevText, { opacity: 0, y: -15, duration: segmentDuration * 0.3 }, start)
        } else {
          // Fade out title
          tl.to(titleRef.current, { opacity: 0, y: -20, duration: segmentDuration * 0.3 }, start)
        }

        // Drop ingredient into place
        tl.to(
          el,
          {
            y: i * -6, // slight overlap stacking
            opacity: 1,
            scale: LAYERS[i].scale,
            filter: 'blur(0px)',
            duration: segmentDuration * 0.7,
            ease: 'power3.out',
          },
          start + segmentDuration * 0.2,
        )

        // Glow pulse on drop
        tl.to(
          glowRef.current,
          {
            opacity: 0.6,
            scale: 1.15,
            duration: segmentDuration * 0.2,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1,
          },
          start + segmentDuration * 0.25,
        )

        // Show scene text
        tl.to(
          textEl,
          { opacity: 1, y: 0, duration: segmentDuration * 0.4, ease: 'power2.out' },
          start + segmentDuration * 0.5,
        )
      })

      // Final CTA
      const ctaStart = LAYERS.length * (1 / (totalScenes + 1))
      tl.to(textRefs.current[LAYERS.length - 1], { opacity: 0, y: -15, duration: 0.15 }, ctaStart)
      tl.to(ctaRef.current, { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(1.4)' }, ctaStart + 0.1)

      // Subtle idle float on the whole stack after all assembled
      // (handled via CSS animation on the wrapper)
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#060d1a]"
      style={{ height: `${(LAYERS.length + 2.5) * 100}vh` }}
    >
      {/* Sticky viewport */}
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center"
      >
        {/* Background atmosphere */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Radial dark vignette */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, rgba(6,13,26,0.85) 100%)',
            }}
          />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(238,92,19,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(238,92,19,0.5) 1px,transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* Glow behind sandwich */}
        <div
          ref={glowRef}
          className="absolute pointer-events-none"
          style={{
            width: 560,
            height: 340,
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse,rgba(238,92,19,0.18) 0%,rgba(238,92,19,0.06) 55%,transparent 75%)',
            filter: 'blur(40px)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.3,
          }}
        />

        {/* Section title (fades out as scroll begins) */}
        <div
          ref={titleRef}
          className="absolute top-16 sm:top-20 left-0 right-0 text-center pointer-events-none z-20"
        >
          <p className="text-[10px] sm:text-[11px] font-bold text-brand uppercase tracking-[0.25em] mb-3">
            Monte o seu
          </p>
          <h2
            className="font-display font-extrabold text-white leading-[0.9] tracking-[-0.04em]"
            style={{ fontSize: 'clamp(2.4rem,6vw,5.5rem)' }}
          >
            Seu Sub.<br />
            <span className="text-brand">Do seu jeito.</span>
          </h2>
          <p className="text-white/35 mt-4 text-[14px] sm:text-[15px]">Role para montar</p>
          {/* Scroll cue */}
          <div className="mt-6 flex justify-center">
            <div className="w-px h-10 bg-gradient-to-b from-white/0 via-white/40 to-white/0 animate-pulse" />
          </div>
        </div>

        {/* Sandwich stack — centered */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: '100%', maxWidth: 640, height: 320 }}
        >
          {LAYERS.map((layer, i) => (
            <div
              key={layer.id}
              ref={(el) => { layerRefs.current[i] = el }}
              className="absolute inset-0"
              style={{
                zIndex: layer.zIndex,
                perspective: 1000,
              }}
            >
              <div
                className="w-full h-full rounded-2xl overflow-hidden"
                style={{
                  boxShadow:
                    i === 0
                      ? '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)'
                      : '0 20px 60px rgba(0,0,0,0.5)',
                }}
              >
                <Image
                  src={layer.img}
                  alt={layer.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width:640px) 90vw, 640px"
                  loading="lazy"
                />
                {/* Cinematic overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(6,13,26,0.1) 0%, transparent 30%, transparent 70%, rgba(6,13,26,0.3) 100%)',
                  }}
                />
                {/* Ingredient label badge */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div>
                    <p className="text-white font-bold text-[15px] sm:text-[17px] leading-tight drop-shadow-lg">
                      {layer.label}
                    </p>
                    <p className="text-white/60 text-[11px] sm:text-[12px] mt-0.5 drop-shadow">
                      {layer.sublabel}
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-brand/90 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                    {i + 1}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scene text — bottom center */}
        <div className="absolute bottom-16 sm:bottom-20 left-0 right-0 px-5 z-30">
          {LAYERS.map((layer, i) => (
            <div
              key={layer.id}
              ref={(el) => { textRefs.current[i] = el }}
              className="absolute inset-x-0 text-center pointer-events-none"
            >
              <p
                className="font-display font-extrabold text-white/90 mx-auto"
                style={{ fontSize: 'clamp(1.3rem,3.5vw,2.8rem)', letterSpacing: '-0.02em' }}
              >
                {layer.sceneText}
              </p>
            </div>
          ))}

          {/* CTA after all ingredients */}
          <div
            ref={ctaRef}
            className="absolute inset-x-0 text-center pointer-events-auto"
          >
            <p
              className="font-display font-extrabold text-white mx-auto mb-6"
              style={{ fontSize: 'clamp(1.4rem,3.8vw,3rem)', letterSpacing: '-0.03em' }}
            >
              Agora é a sua vez.
            </p>
            <Link href="/cardapio">
              <button className="group relative inline-flex items-center gap-3 bg-brand hover:bg-[#ff6b1a] text-white font-bold px-8 sm:px-10 py-4 sm:py-5 rounded-full text-[15px] sm:text-[16px] transition-all duration-300 shadow-[0_0_40px_rgba(238,92,19,0.5)] hover:shadow-[0_0_60px_rgba(238,92,19,0.7)] hover:scale-105">
                <span>Monte Seu Sub</span>
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-1">
                  →
                </span>
              </button>
            </Link>
          </div>
        </div>

        {/* Layer indicator dots — right side */}
        <div className="absolute right-5 sm:right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30">
          {LAYERS.map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/20 transition-all duration-300"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
