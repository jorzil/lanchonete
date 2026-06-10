import Link from 'next/link'
import { MapPin, Clock, Phone, Instagram, Facebook, Youtube } from 'lucide-react'

const LINKS = {
  menu: [
    { href: '/cardapio?cat=subs-15cm', label: 'Subs 15cm' },
    { href: '/cardapio?cat=subs-30cm', label: 'Subs 30cm' },
    { href: '/cardapio?cat=combos',    label: 'Combos'    },
    { href: '/cardapio?cat=bebidas',   label: 'Bebidas'   },
  ],
  company: [
    { href: '/#sobre',     label: 'Nossa História' },
    { href: '/#promocoes', label: 'Promoções'      },
    { href: '/admin',      label: 'Área Admin'     },
  ],
}

export function Footer() {
  return (
    <footer className="bg-[#011a33] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🥖</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-black text-white">MAIS</span>
              <span className="text-2xl font-black text-[#EE5C13]">SUB</span>
            </div>
          </div>
          <p className="text-white/50 text-sm leading-relaxed mb-6">
            Subs artesanais com ingredientes selecionados. Personalize do seu jeito e receba em casa.
          </p>
          <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-full text-sm transition-all hover:scale-105">
            <Phone size={15} />
            Pedir pelo WhatsApp
          </a>
        </div>

        {/* Cardápio */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-white/40 mb-4">Cardápio</p>
          <ul className="space-y-2.5">
            {LINKS.menu.map(l => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/60 hover:text-[#EE5C13] text-sm transition-colors font-medium">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Empresa */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-white/40 mb-4">Empresa</p>
          <ul className="space-y-2.5">
            {LINKS.company.map(l => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/60 hover:text-[#EE5C13] text-sm transition-colors font-medium">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contato */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-white/40 mb-4">Contato</p>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3 text-sm text-white/60">
              <MapPin size={15} className="text-[#EE5C13] mt-0.5 shrink-0" />
              <span>Rua Exemplo, 123<br />Bairro, Cidade — SP</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-white/60">
              <Clock size={15} className="text-[#EE5C13] mt-0.5 shrink-0" />
              <span>Seg–Sex 11h–22h<br />Sáb–Dom 11h–23h</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-white/60">
              <Phone size={15} className="text-[#EE5C13] shrink-0" />
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="hover:text-[#EE5C13] transition-colors">
                (11) 99999-9999
              </a>
            </li>
          </ul>
          <div className="flex items-center gap-2">
            {[
              { href: 'https://instagram.com/maissub', Icon: Instagram, label: 'Instagram' },
              { href: 'https://facebook.com/maissub',  Icon: Facebook,  label: 'Facebook'  },
              { href: 'https://youtube.com/@maissub',  Icon: Youtube,   label: 'YouTube'   },
            ].map(({ href, Icon, label }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                className="w-9 h-9 rounded-full bg-white/8 hover:bg-[#EE5C13] flex items-center justify-center transition-all hover:scale-110">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <p>© {new Date().getFullYear()} Mais Sub. Todos os direitos reservados.</p>
          <p>Feito com ❤️ em São Paulo, SP</p>
        </div>
      </div>
    </footer>
  )
}
