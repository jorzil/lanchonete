import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cardápio — Mais Sub',
  description: 'Veja nosso cardápio completo de subs artesanais. Monte seu sub personalizado.',
}

export default function CardapioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
