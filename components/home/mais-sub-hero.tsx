'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const PARTICLES = [
  { l: '12%', t: '70%', s: 8, d: 9, delay: 0, c: 'rgba(255,255,255,0.5)' },
  { l: '24%', t: '88%', s: 5, d: 11, delay: 1.5, c: 'rgba(238,92,19,0.8)' },
  { l: '38%', t: '78%', s: 10, d: 13, delay: 3, c: 'rgba(255,255,255,0.35)' },
  { l: '52%', t: '92%', s: 6, d: 10, delay: 0.8, c: 'rgba(255,255,255,0.45)' },
  { l: '66%', t: '84%', s: 7, d: 12, delay: 2.2, c: 'rgba(238,92,19,0.7)' },
  { l: '78%', t: '74%', s: 5, d: 9.5, delay: 4, c: 'rgba(255,255,255,0.5)' },
  { l: '88%', t: '90%', s: 9, d: 14, delay: 1.2, c: 'rgba(255,255,255,0.3)' },
  { l: '6%', t: '84%', s: 6, d: 11.5, delay: 5, c: 'rgba(238,92,19,0.6)' },
  { l: '45%', t: '96%', s: 4, d: 8.5, delay: 2.8, c: 'rgba(255,255,255,0.6)' },
  { l: '60%', t: '80%', s: 8, d: 13.5, delay: 6, c: 'rgba(255,255,255,0.28)' },
]

export function MaisSubHero() {
  const rootRef = useRef<HTMLDivElement>(null)

  // Parallax suave seguindo o mouse (elementos com data-depth)
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    let raf = 0
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = root.getBoundingClientRect()
        const cx = (e.clientX - r.left) / r.width - 0.5
        const cy = (e.clientY - r.top) / r.height - 0.5
        root.querySelectorAll<HTMLElement>('[data-depth]').forEach((el) => {
          const depth = Number(el.dataset.depth) || 0
          el.style.transform = `translate(${-cx * depth}px, ${-cy * depth}px)`
        })
      })
    }
    root.addEventListener('mousemove', onMove)
    return () => { root.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf) }
  }, [])

  return (
    <section
      ref={rootRef}
      className="ms-hero relative w-full overflow-hidden"
      style={{
        minHeight: '100svh',
        fontFamily: "var(--font-manrope), 'Manrope', sans-serif",
        background: 'radial-gradient(120% 120% at 78% 18%, #0359A8 0%, #023E74 52%, #012247 100%)',
      }}
    >
      {/* Fundo: blobs */}
      <div data-depth="14" className="pointer-events-none absolute" style={{ top: '-12%', left: '-8%', width: '46vw', height: '46vw', zIndex: 0 }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', filter: 'blur(20px)', animation: 'ms-drift-a 14s ease-in-out infinite', background: 'radial-gradient(closest-side, rgba(238,92,19,0.42), rgba(238,92,19,0) 70%)' }} />
      </div>
      <div data-depth="20" className="pointer-events-none absolute" style={{ bottom: '-18%', right: '-6%', width: '42vw', height: '42vw', zIndex: 0 }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', filter: 'blur(20px)', animation: 'ms-drift-b 16s ease-in-out infinite', background: 'radial-gradient(closest-side, rgba(3,89,168,0.55), rgba(3,89,168,0) 70%)' }} />
      </div>
      {/* grid */}
      <div className="pointer-events-none absolute inset-0" style={{ zIndex: 0, opacity: 0.06, backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '64px 64px', WebkitMaskImage: 'radial-gradient(120% 90% at 50% 30%, #000 40%, transparent 80%)', maskImage: 'radial-gradient(120% 90% at 50% 30%, #000 40%, transparent 80%)' }} />
      {/* partículas */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 1 }}>
        {PARTICLES.map((p, i) => (
          <span key={i} style={{ position: 'absolute', left: p.l, top: p.t, width: p.s, height: p.s, borderRadius: '50%', background: p.c, animation: `ms-particle ${p.d}s linear infinite`, animationDelay: `${p.delay}s` }} />
        ))}
      </div>

      {/* Conteúdo */}
      <div
        className="ms-inner relative z-[4] mx-auto grid items-center"
        style={{ maxWidth: 1240, minHeight: '100svh', gridTemplateColumns: '1.08fr 0.92fr', gap: 48, padding: '120px clamp(20px,5vw,64px) 70px' }}
      >
        {/* Esquerda */}
        <div className="ms-left flex flex-col items-start">
          <div className="ms-reveal inline-flex items-center gap-2.5 text-[14px] font-bold" style={{ color: '#cfe0f5', animationDelay: '0.05s' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#2ecc71', boxShadow: '0 0 0 5px rgba(46,204,113,0.25)' }} />
            Aberto agora · Gov. Valadares
          </div>
          <h1 style={{ margin: '22px 0 0', fontFamily: "var(--font-poppins), 'Poppins', sans-serif", fontWeight: 900, fontSize: 'clamp(40px,5.6vw,84px)', lineHeight: 0.96, letterSpacing: '-0.02em', color: '#fff' }}>
            <span className="ms-reveal" style={{ display: 'block', animationDelay: '0.12s' }}>Mais recheio.</span>
            <span className="ms-reveal" style={{ display: 'block', animationDelay: '0.22s' }}>Mais sabor.</span>
            <span className="ms-reveal" style={{ display: 'block', color: '#EE5C13', animationDelay: '0.32s' }}>Mais Sub.</span>
          </h1>

          <p className="ms-reveal" style={{ margin: '24px 0 0', maxWidth: 480, fontSize: 'clamp(16px,1.5vw,20px)', fontWeight: 500, lineHeight: 1.55, color: '#cfe0f5', animationDelay: '0.42s' }}>
            Subs artesanais, montados na hora com ingredientes fresquinhos e muito recheio. Peça agora e receba quentinho na sua porta.
          </p>

          <div className="ms-ctas ms-reveal flex flex-wrap gap-4" style={{ marginTop: 34, animationDelay: '0.52s' }}>
            <Link href="/cardapio" className="ms-cta-primary relative inline-flex items-center gap-3 overflow-hidden text-white" style={{ background: '#EE5C13', fontFamily: "var(--font-poppins), 'Poppins', sans-serif", fontWeight: 800, fontSize: 18, padding: '19px 38px', borderRadius: 16, boxShadow: '0 14px 36px rgba(238,92,19,0.45)' }}>
              Pedir Agora
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
              <span style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)', animation: 'ms-shine 4.5s ease-in-out infinite', animationDelay: '1.6s' }} />
            </Link>
            <Link href="/cardapio" className="ms-cta-secondary inline-flex items-center gap-2.5 text-white" style={{ background: 'rgba(255,255,255,0.06)', fontFamily: "var(--font-poppins), 'Poppins', sans-serif", fontWeight: 700, fontSize: 18, padding: '18px 32px', borderRadius: 16, border: '1.5px solid rgba(255,255,255,0.5)', backdropFilter: 'blur(6px)' }}>
              Ver Cardápio
            </Link>
          </div>

          <div className="ms-reveal flex flex-wrap gap-2.5" style={{ marginTop: 30, animationDelay: '0.62s' }}>
            {['⚡ Entrega rápida', '🥬 Ingredientes frescos', '🔥 Feito na hora'].map((b) => (
              <span key={b} style={{ fontSize: 13.5, fontWeight: 700, color: '#eaf2fc', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 16px', borderRadius: 999 }}>{b}</span>
            ))}
          </div>
        </div>

        {/* Direita */}
        <div className="ms-right relative hidden lg:flex items-center justify-center" style={{ minHeight: 'clamp(320px,42vw,520px)' }}>
          {/* glow pulsante */}
          <div className="absolute" style={{ width: '115%', height: '115%', zIndex: 0, filter: 'blur(10px)', background: 'radial-gradient(closest-side, rgba(238,92,19,0.55), rgba(238,92,19,0) 70%)', animation: 'ms-glow 5s ease-in-out infinite' }} />
          {/* aneis */}
          <div data-depth="22" className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center">
            <div style={{ position: 'absolute', width: '104%', height: '104%', maxWidth: 560, maxHeight: 560, borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.22)', animation: 'ms-spin 26s linear infinite' }} />
            <div style={{ position: 'absolute', width: '84%', height: '84%', maxWidth: 460, maxHeight: 460, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.16)', animation: 'ms-spin-rev 22s linear infinite' }} />
          </div>
          {/* foto */}
          <div data-depth="40" className="ms-reveal-pop relative z-[2]" style={{ width: 'clamp(260px,34vw,440px)', height: 'clamp(260px,34vw,440px)' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '10px solid rgba(255,255,255,0.95)', boxShadow: '0 40px 80px rgba(0,0,0,0.45)', animation: 'ms-float 7s ease-in-out infinite' }}>
              <Image src="/hero-sub.png" alt="Sub artesanal Mais Sub com bacon, carne, queijo e barbecue" width={460} height={460} className="h-full w-full object-cover" priority />
            </div>
          </div>
          {/* chips */}
          <Chip depth={60} style={{ top: '6%', right: '8%' }} color="#e23b2e" label="Bacon crocante" anim="ms-float-s 5s ease-in-out infinite" delay="0s" />
          <Chip depth={52} style={{ bottom: '14%', left: '2%' }} color="#3aa655" label="Sempre fresco" anim="ms-float-s 6.2s ease-in-out infinite" delay="1s" />
          <Chip depth={46} style={{ bottom: '4%', right: '14%' }} color="#f2b705" label="Queijo derretido" anim="ms-float-s 5.6s ease-in-out infinite" delay="0.5s" />
          {/* selo */}
          <div data-depth="30" className="ms-reveal-pop absolute z-[4]" style={{ top: '2%', left: '6%', animationDelay: '0.5s' }}>
            <div style={{ width: 'clamp(78px,9vw,108px)', height: 'clamp(78px,9vw,108px)', borderRadius: '50%', background: '#EE5C13', color: '#fff', border: '4px solid #fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: "var(--font-poppins), 'Poppins', sans-serif", fontWeight: 800, lineHeight: 1.05, fontSize: 'clamp(11px,1.1vw,14px)', boxShadow: '0 14px 30px rgba(0,0,0,0.3)' }}>
              <span>Feito</span><span>na hora</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes ms-rise { from { opacity:0; transform:translateY(34px) } to { opacity:1; transform:translateY(0) } }
        @keyframes ms-pop { from { opacity:0; transform:scale(0.86) } to { opacity:1; transform:scale(1) } }
        @keyframes ms-float { 0%,100% { transform:translateY(-10px) } 50% { transform:translateY(10px) } }
        @keyframes ms-float-s { 0%,100% { transform:translateY(-7px) rotate(-3deg) } 50% { transform:translateY(9px) rotate(3deg) } }
        @keyframes ms-spin { to { transform:rotate(360deg) } }
        @keyframes ms-spin-rev { to { transform:rotate(-360deg) } }
        @keyframes ms-glow { 0%,100% { opacity:0.7; transform:scale(1) } 50% { opacity:1; transform:scale(1.08) } }
        @keyframes ms-drift-a { 0%,100% { transform:translate(0,0) scale(1) } 50% { transform:translate(40px,-30px) scale(1.12) } }
        @keyframes ms-drift-b { 0%,100% { transform:translate(0,0) scale(1) } 50% { transform:translate(-36px,28px) scale(1.1) } }
        @keyframes ms-particle { 0% { transform:translateY(0) scale(1); opacity:0 } 12% { opacity:0.9 } 88% { opacity:0.9 } 100% { transform:translateY(-150px) scale(0.4); opacity:0 } }
        @keyframes ms-shine { 0% { transform:translateX(-180%) skewX(-20deg) } 60%,100% { transform:translateX(320%) skewX(-20deg) } }
        .ms-hero .ms-reveal { opacity:0; animation: ms-rise .8s cubic-bezier(.2,.7,.2,1) both; }
        .ms-hero .ms-reveal-pop { opacity:0; animation: ms-pop .9s cubic-bezier(.2,.7,.2,1) both; }
        .ms-cta-primary { transition: transform .25s cubic-bezier(.2,.7,.2,1), box-shadow .25s ease; }
        .ms-cta-primary:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 20px 44px rgba(238,92,19,0.55); }
        .ms-cta-secondary { transition: transform .25s ease, background .25s ease, border-color .25s ease; }
        .ms-cta-secondary:hover { transform: translateY(-2px); background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.8); }
        @media (max-width: 1023px) {
          .ms-hero .ms-inner { grid-template-columns: 1fr !important; text-align:center; gap:30px !important; padding-top:96px !important; min-height:auto !important; }
          .ms-hero { min-height:auto !important; }
          .ms-hero .ms-left { align-items:center !important; }
          .ms-hero .ms-ctas { justify-content:center !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ms-hero *, .ms-hero *::before { animation: none !important; }
          .ms-hero .ms-reveal, .ms-hero .ms-reveal-pop { opacity:1 !important; }
        }
      `}</style>
    </section>
  )
}

function Chip({ depth, style, color, label, anim, delay }: { depth: number; style: React.CSSProperties; color: string; label: string; anim: string; delay: string }) {
  return (
    <div data-depth={depth} className={`ms-chip pointer-events-none absolute z-[3]`} style={style}>
      <div className="flex items-center gap-2.5" style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 999, padding: '9px 16px 9px 9px', boxShadow: '0 14px 30px rgba(0,0,0,0.28)', animation: anim, animationDelay: delay }}>
        <span style={{ width: 30, height: 30, borderRadius: '50%', background: color, display: 'inline-block' }} />
        <span style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: '#111' }}>{label}</span>
      </div>
    </div>
  )
}
