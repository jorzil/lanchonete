import Link from 'next/link'
import { Instagram, ArrowUpRight } from 'lucide-react'
import { Logo } from '@/components/brand/logo'

const COLS = [
  {
    label: 'Cardápio',
    links: [
      { href: '/cardapio?cat=subs-15cm', label: 'Subs 15cm' },
      { href: '/cardapio?cat=subs-30cm', label: 'Subs 30cm' },
      { href: '/cardapio?cat=combos', label: 'Combos' },
      { href: '/cardapio?cat=bebidas', label: 'Bebidas' },
    ],
  },
  {
    label: 'Mais Sub',
    links: [
      { href: '/#sobre', label: 'A marca' },
      { href: '/#contato', label: 'Contato' },
      { href: '/admin', label: 'Área restrita' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-[#F2ECDF] border-t border-[#E8E0D0]" id="contato">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10 pt-20 pb-12">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          <div className="col-span-2 lg:col-span-5">
            <Logo height={42} />
            <p className="h-editorial text-[26px] sm:text-[30px] text-[#0E1F3C] mt-6 max-w-[380px] leading-[1.05]">
              Subs feitos com cuidado. Entregues com pressa.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="https://www.instagram.com/maissub.gv/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#0E1F3C] hover:bg-[#1a2e54] text-[#FAF6EE] text-[12.5px] font-medium px-4 py-2.5 rounded-full transition-colors"
              >
                <Instagram size={13} strokeWidth={1.8} />
                @maissub.gv
              </a>
              <a
                href="https://wa.me/5533999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#0E1F3C] hover:text-[#EE5C13] px-2 py-2.5 transition-colors"
              >
                WhatsApp
                <ArrowUpRight size={12} strokeWidth={1.8} />
              </a>
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.label} className="lg:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8B95A8] mb-5">
                {col.label}
              </p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-[#3D4D6A] hover:text-[#0E1F3C] transition-colors link-underline"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8B95A8] mb-5">
              Onde estamos
            </p>
            <ul className="space-y-2 text-[13px] text-[#3D4D6A]">
              <li>Governador Valadares · MG</li>
              <li>Seg–Sex 11h–22h</li>
              <li>Sáb–Dom 11h–23h</li>
              <li className="pt-2">
                <a
                  href="tel:+5533999999999"
                  className="text-[#0E1F3C] font-medium tabular-nums hover:text-[#EE5C13] transition-colors"
                >
                  (33) 99999-9999
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-[#E8E0D0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[12px] text-[#8B95A8]">
          <p>© {new Date().getFullYear()} Mais Sub. Todos os direitos reservados.</p>
          <p>Feito em Governador Valadares</p>
        </div>
      </div>
    </footer>
  )
}
