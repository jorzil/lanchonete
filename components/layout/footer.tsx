import Link from 'next/link'
import { Phone, MapPin, Clock, Instagram, Facebook, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-[#023E74] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="mb-4">
              <span className="text-3xl font-black tracking-tight">MAIS <span className="text-[#EE5C13]">SUB</span></span>
              <p className="text-white/60 text-xs tracking-widest uppercase mt-1">Monte do seu jeito</p>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              Subs artesanais feitos com ingredientes frescos. Personalize cada detalhe do seu lanche e receba em casa.
            </p>
            <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold text-sm transition-all hover:scale-105">
              <Phone size={16} />
              Pedir pelo WhatsApp
            </a>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Sobre</h3>
            <ul className="space-y-2">
              {[{href:'/#sobre',label:'Nossa História'},{href:'/#promocoes',label:'Promoções'},{href:'/cardapio',label:'Cardápio'},{href:'/#contato',label:'Contato'}].map((item) => (
                <li key={item.href}><Link href={item.href} className="text-white/70 hover:text-[#EE5C13] text-sm transition-colors">{item.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Cardápio</h3>
            <ul className="space-y-2">
              {[{href:'/cardapio?cat=subs-15cm',label:'Subs 15cm'},{href:'/cardapio?cat=subs-30cm',label:'Subs 30cm'},{href:'/cardapio?cat=combos',label:'Combos'},{href:'/cardapio?cat=bebidas',label:'Bebidas'}].map((item) => (
                <li key={item.href}><Link href={item.href} className="text-white/70 hover:text-[#EE5C13] text-sm transition-colors">{item.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Atendimento</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-sm text-white/70">
                <MapPin size={16} className="text-[#EE5C13] mt-0.5 shrink-0" />
                <span>Rua Exemplo, 123 - Bairro, Cidade - SP</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/70">
                <Clock size={16} className="text-[#EE5C13] mt-0.5 shrink-0" />
                <div><p>Seg-Sex: 11h–22h</p><p>Sáb-Dom: 11h–23h</p></div>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/70">
                <Phone size={16} className="text-[#EE5C13] mt-0.5 shrink-0" />
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="hover:text-[#EE5C13] transition-colors">(11) 99999-9999</a>
              </li>
            </ul>
            <h3 className="font-bold text-white mb-3 text-sm uppercase tracking-wider">Redes Sociais</h3>
            <div className="flex items-center gap-3">
              {[{href:'https://instagram.com/maissub',Icon:Instagram,label:'Instagram'},{href:'https://facebook.com/maissub',Icon:Facebook,label:'Facebook'},{href:'https://twitter.com/maissub',Icon:Twitter,label:'Twitter'}].map(({href,Icon,label}) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/10 hover:bg-[#EE5C13] transition-colors" aria-label={label}>
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/50">
          <p>© {new Date().getFullYear()} Mais Sub. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
            <span>|</span>
            <span>Feito com ❤️ em SP</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
