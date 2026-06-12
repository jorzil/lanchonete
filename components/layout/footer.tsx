import Link from 'next/link'
import { MapPin, Clock, Phone, Instagram, Facebook, Youtube, ArrowUpRight } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-white/6">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">

        <div>
          <span className="text-[17px] font-black text-white tracking-[-0.04em] uppercase block mb-4">
            mais<span className="text-[#EE5C13]">sub</span>
          </span>
          <p className="text-white/35 text-[13px] leading-relaxed mb-6 max-w-[200px]">
            Subs artesanais com ingredientes selecionados. Do seu jeito.
          </p>
          <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#EE5C13]/10 hover:bg-[#EE5C13] border border-[#EE5C13]/20 hover:border-[#EE5C13] text-[#EE5C13] hover:text-white text-[12.5px] font-semibold px-4 py-2 rounded-full transition-all duration-200">
            <Phone size={13} />
            WhatsApp
          </a>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 mb-5">Cardápio</p>
          <ul className="space-y-3">
            {[
              { href: '/cardapio?cat=subs-15cm', label: 'Subs 15cm' },
              { href: '/cardapio?cat=subs-30cm', label: 'Subs 30cm' },
              { href: '/cardapio?cat=combos', label: 'Combos' },
              { href: '/cardapio?cat=bebidas', label: 'Bebidas' },
            ].map(l => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/40 hover:text-white text-[13px] font-medium transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 mb-5">Empresa</p>
          <ul className="space-y-3">
            {[
              { href: '/#sobre', label: 'Nossa História' },
              { href: '/admin', label: 'Área Admin' },
            ].map(l => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/40 hover:text-white text-[13px] font-medium transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 mb-5">Contato</p>
          <ul className="space-y-3.5 mb-7">
            <li className="flex items-start gap-2.5 text-[13px] text-white/40">
              <MapPin size={14} className="text-[#EE5C13] mt-0.5 shrink-0" />
              <span>Rua Exemplo, 123 · Bairro, SP</span>
            </li>
            <li className="flex items-start gap-2.5 text-[13px] text-white/40">
              <Clock size={14} className="text-[#EE5C13] mt-0.5 shrink-0" />
              <span>Seg–Sex 11h–22h · Sáb–Dom 11h–23h</span>
            </li>
            <li className="flex items-center gap-2.5 text-[13px] text-white/40">
              <Phone size={14} className="text-[#EE5C13] shrink-0" />
              <a href="https://wa.me/5511999999999" className="hover:text-white transition-colors">(11) 99999-9999</a>
            </li>
          </ul>
          <div className="flex gap-2">
            {[
              { href: 'https://instagram.com/maissub', Icon: Instagram },
              { href: 'https://facebook.com/maissub', Icon: Facebook },
              { href: 'https://youtube.com/@maissub', Icon: Youtube },
            ].map(({ href, Icon }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#EE5C13] flex items-center justify-center transition-all duration-200 text-white/40 hover:text-white">
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/6">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11.5px] text-white/20">
          <p>© {new Date().getFullYear()} Mais Sub. Todos os direitos reservados.</p>
          <p>São Paulo, SP</p>
        </div>
      </div>
    </footer>
  )
}
