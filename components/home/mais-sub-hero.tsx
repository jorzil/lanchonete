'use client'

import Link from 'next/link'
import Image from 'next/image'

export function MaisSubHero() {
  return (
    <section
      className="ms-hero relative w-full overflow-hidden"
      style={{
        minHeight: '100svh',
        fontFamily: "'Manrope', var(--font-sans, sans-serif)",
        background: 'radial-gradient(120% 120% at 78% 18%, #0359A8 0%, #023E74 52%, #012247 100%)',
      }}
    >
      {/* Fundo: blobs */}
      <div className="pointer-events-none absolute" style={{ top: '-12%', left: '-8%', width: '46vw', height: '46vw', zIndex: 0 }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', filter: 'blur(20px)', animation: 'ms-drift-a 14s ease-in-out infinite', background: 'radial-gradient(closest-side, rgba(238,92,19,0.42), rgba(238,92,19,0) 70%)' }} />
      </div>
      <div className="pointer-events-none absolute" style={{ bottom: '-18%', right: '-6%', width: '42vw', height: '42vw', zIndex: 0 }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', filter: 'blur(20px)', animation: 'ms-drift-b 16s ease-in-out infinite', background: 'radial-gradient(closest-side, rgba(3,89,168,0.55), rgba(3,89,168,0) 70%)' }} />
      </div>
      {/* grid */}
      <div className="pointer-events-none absolute inset-0" style={{ zIndex: 0, opacity: 0.06, backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '64px 64px', WebkitMaskImage: 'radial-gradient(120% 90% at 50% 30%, #000 40%, transparent 80%)', maskImage: 'radial-gradient(120% 90% at 50% 30%, #000 40%, transparent 80%)' }} />

      {/* Conteúdo */}
      <div
        className="relative z-[4] mx-auto grid items-center"
        style={{ maxWidth: 1240, minHeight: '100svh', gridTemplateColumns: '1.08fr 0.92fr', gap: 48, padding: '120px clamp(20px,5vw,64px) 70px' }}
      >
        {/* Esquerda */}
        <div className="ms-left flex flex-col items-start">
          <div className="inline-flex items-center gap-2.5 text-[14px] font-bold" style={{ color: '#cfe0f5' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#2ecc71', boxShadow: '0 0 0 5px rgba(46,204,113,0.25)' }} />
            Aberto agora · Gov. Valadares
          </div>
          <h1 style={{ margin: '22px 0 0', fontFamily: "'Poppins', var(--font-sans, sans-serif)", fontWeight: 900, fontSize: 'clamp(40px,5.6vw,84px)', lineHeight: 0.96, letterSpacing: '-0.02em', color: '#fff' }}>
            <span style={{ display: 'block' }}>Mais recheio.</span>
            <span style={{ display: 'block' }}>Mais sabor.</span>
            <span style={{ display: 'block', color: '#EE5C13' }}>Mais Sub.</span>
          </h1>

          <p style={{ margin: '24px 0 0', maxWidth: 480, fontSize: 'clamp(16px,1.5vw,20px)', fontWeight: 500, lineHeight: 1.55, color: '#cfe0f5' }}>
            Subs artesanais, montados na hora com ingredientes fresquinhos e muito recheio. Peça agora e receba quentinho na sua porta.
          </p>

          <div className="flex flex-wrap gap-4" style={{ marginTop: 34 }}>
            <Link href="/cardapio" className="ms-cta-primary relative inline-flex items-center gap-3 overflow-hidden text-white" style={{ background: '#EE5C13', fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, padding: '19px 38px', borderRadius: 16, boxShadow: '0 14px 36px rgba(238,92,19,0.45)' }}>
              Pedir Agora
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
              <span style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)', animation: 'ms-shine 4.5s ease-in-out infinite', animationDelay: '1.6s' }} />
            </Link>
            <Link href="/cardapio" className="ms-cta-secondary inline-flex items-center gap-2.5 text-white" style={{ background: 'rgba(255,255,255,0.06)', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 18, padding: '18px 32px', borderRadius: 16, border: '1.5px solid rgba(255,255,255,0.5)', backdropFilter: 'blur(6px)' }}>
              Ver Cardápio
            </Link>
          </div>

          <div className="flex flex-wrap gap-2.5" style={{ marginTop: 30 }}>
            {['⚡ Entrega rápida', '🥬 Ingredientes frescos', '🔥 Feito na hora'].map((b) => (
              <span key={b} style={{ fontSize: 13.5, fontWeight: 700, color: '#eaf2fc', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 16px', borderRadius: 999 }}>{b}</span>
            ))}
          </div>
        </div>

        {/* Direita */}
        <div className="ms-right relative hidden lg:flex items-center justify-center" style={{ minHeight: 'clamp(320px,42vw,520px)' }}>
          <div className="absolute" style={{ width: '115%', height: '115%', zIndex: 0, filter: 'blur(10px)', background: 'radial-gradient(closest-side, rgba(238,92,19,0.55), rgba(238,92,19,0) 70%)' }} />
          {/* aneis */}
          <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center">
            <div style={{ position: 'absolute', width: '104%', height: '104%', maxWidth: 560, maxHeight: 560, borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.22)', animation: 'ms-spin 26s linear infinite' }} />
            <div style={{ position: 'absolute', width: '84%', height: '84%', maxWidth: 460, maxHeight: 460, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.16)', animation: 'ms-spin-rev 22s linear infinite' }} />
          </div>
          {/* foto */}
          <div className="relative z-[2]" style={{ width: 'clamp(260px,34vw,440px)', height: 'clamp(260px,34vw,440px)' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '10px solid rgba(255,255,255,0.95)', boxShadow: '0 40px 80px rgba(0,0,0,0.45)', animation: 'ms-float 6s ease-in-out infinite' }}>
              <Image src="/hero-sub.png" alt="Sub artesanal Mais Sub com bacon, carne, queijo e barbecue" width={460} height={460} className="h-full w-full object-cover" priority />
            </div>
          </div>
          {/* chips */}
          <Chip className="ms-chip-tr" style={{ top: '6%', right: '8%' }} color="#e23b2e" label="Bacon crocante" delay="0s" />
          <Chip className="ms-chip-bl" style={{ bottom: '14%', left: '2%' }} color="#3aa655" label="Sempre fresco" delay="1s" />
          <Chip className="ms-chip-br" style={{ bottom: '4%', right: '14%' }} color="#f2b705" label="Queijo derretido" delay="0.5s" />
          {/* selo */}
          <div className="absolute z-[4]" style={{ top: '2%', left: '6%' }}>
            <div style={{ width: 'clamp(78px,9vw,108px)', height: 'clamp(78px,9vw,108px)', borderRadius: '50%', background: '#EE5C13', color: '#fff', border: '4px solid #fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: "'Poppins', sans-serif", fontWeight: 800, lineHeight: 1.05, fontSize: 'clamp(11px,1.1vw,14px)', boxShadow: '0 14px 30px rgba(0,0,0,0.3)' }}>
              <span>Feito</span><span>na hora</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes ms-drift-a { 0%,100% { transform: translate(0,0) } 50% { transform: translate(30px,20px) } }
        @keyframes ms-drift-b { 0%,100% { transform: translate(0,0) } 50% { transform: translate(-26px,-18px) } }
        @keyframes ms-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-12px) } }
        @keyframes ms-float-s { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        @keyframes ms-spin { to { transform: rotate(360deg) } }
        @keyframes ms-spin-rev { to { transform: rotate(-360deg) } }
        @keyframes ms-shine { 0% { transform: translateX(-120%) } 60%,100% { transform: translateX(320%) } }
        @media (max-width: 1023px) {
          .ms-hero .grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

function Chip({ className, style, color, label, delay }: { className?: string; style: React.CSSProperties; color: string; label: string; delay: string }) {
  return (
    <div className={`pointer-events-none absolute z-[3] ${className ?? ''}`} style={style}>
      <div className="flex items-center gap-2.5" style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 999, padding: '9px 16px 9px 9px', boxShadow: '0 14px 30px rgba(0,0,0,0.28)', animation: 'ms-float-s 5.4s ease-in-out infinite', animationDelay: delay }}>
        <span style={{ width: 30, height: 30, borderRadius: '50%', background: color, display: 'inline-block' }} />
        <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: '#111' }}>{label}</span>
      </div>
    </div>
  )
}
