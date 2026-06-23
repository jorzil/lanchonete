'use client'
import dynamic from 'next/dynamic'

const SmoothScrollInner = dynamic(
  () => import('./smooth-scroll').then((m) => m.SmoothScroll),
  { ssr: false }
)

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  return <SmoothScrollInner>{children}</SmoothScrollInner>
}
