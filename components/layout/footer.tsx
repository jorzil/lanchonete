import Link from 'next/link'
import { MapPin, Clock, Phone, Instagram } from 'lucide-react'
import { MaisSubMark, MBadge } from '@/components/brand/logo'

export function Footer() {
  return (
    <footer className="relative bg-navy-deep border-t border-white/8 overflow-hidden">
      {/* Decorative big M */}
      <div className="absolute -right-12 -top-12 opacity-[0.04] pointer-events-none">
        <MBadge size={320} />
      </div>

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">

        <div>
          <div className="flex items-center gap-2 mb-4">
            <MBadge size={32} />
            <MaisSubMark className="text-[18px]" />
          </div>
          <p className="text-white/40 text-[13px] leading-relaxed mb-6 max-w-[220px]">
            Subs artesanais com ingredientes selecionados. Do seu jeito.
          </p>
          <a href="https://wa.me/5533984619205" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-brand/12 hover:bg-brand border border-brand/30 hover:border-brand text-brand hover:text-white text-[12.5px] font-semibold px-4 py-2 rounded-full transition-all duration-200">
            <Phone size={13} />
            WhatsApp
          </a>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25 mb-5">Cardápio</p>
          <ul className="space-y-3">
            {[
              { href: '/cardapio?cat=subs-15cm', label: 'Subs 15cm' },
              { href: '/cardapio?cat=subs-30cm', label: 'Subs 30cm' },
              { href: '/cardapio?cat=combos', label: 'Combos' },
              { href: '/cardapio?cat=bebidas', label: 'Bebidas' },
            ].map(l => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/45 hover:text-white text-[13px] font-medium transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25 mb-5">Empresa</p>
          <ul className="space-y-3">
            <li>
              <Link href="/#sobre" className="text-white/45 hover:text-white text-[13px] font-medium transition-colors">
                Nossa História
              </Link>
            </li>
            <li>
              <a href="https://www.instagram.com/maissub.gv/" target="_blank" rel="noopener noreferrer" className="text-white/45 hover:text-white text-[13px] font-medium transition-colors">
                @maissub.gv
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25 mb-5">Contato</p>
          <ul className="space-y-3.5 mb-7">
            <li className="flex items-start gap-2.5 text-[13px] text-white/45">
              <MapPin size={14} className="text-brand mt-0.5 shrink-0" />
              <span>Governador Valadares · MG</span>
            </li>
            <li className="flex items-start gap-2.5 text-[13px] text-white/45">
              <Clock size={14} className="text-brand mt-0.5 shrink-0" />
              <span>Seg–Sex 11h–22h · Sáb–Dom 11h–23h</span>
            </li>
            <li className="flex items-center gap-2.5 text-[13px] text-white/45">
              <Phone size={14} className="text-brand shrink-0" />
              <a href="https://wa.me/5533984619205" className="hover:text-white transition-colors">(33) 98461-9205</a>
            </li>
          </ul>
          <div className="flex gap-2">
            <a href="https://www.instagram.com/maissub.gv/" target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-white/6 hover:bg-brand flex items-center justify-center transition-all duration-200 text-white/55 hover:text-white">
              <Instagram size={15} />
            </a>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/8">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11.5px] text-white/30">
          <p>© {new Date().getFullYear()} Mais Sub. Todos os direitos reservados.</p>
          <p>Governador Valadares · MG</p>
        </div>
      </div>
    </footer>
  )
}
