import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  height?: number
}

export function Logo({ className, height = 48 }: LogoProps) {
  return (
    <Image
      src="/logo.svg"
      alt="Mais Sub"
      width={Math.round(height * 1.7)}
      height={height}
      className={cn('object-contain', className)}
      priority
    />
  )
}

/** Compact version for navbar */
export function LogoNavbar({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.svg"
      alt="Mais Sub"
      width={80}
      height={47}
      className={cn('object-contain', className)}
      priority
    />
  )
}

/** Large version for hero/home */
export function LogoHero({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.svg"
      alt="Mais Sub"
      width={300}
      height={176}
      className={cn('object-contain drop-shadow-2xl', className)}
      priority
    />
  )
}

// Legacy — kept so other imports don't break
export function MaisSubMark({ className }: { className?: string }) {
  return <LogoNavbar className={className} />
}

export function MaisSubWordmark({ size = 'md', className }: { size?: string; className?: string }) {
  const heights: Record<string, number> = { sm: 32, md: 48, lg: 72, xl: 100, hero: 160 }
  return <Logo className={className} height={heights[size] ?? 48} />
}

export function MBadge({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.svg"
      alt="Mais Sub"
      width={size}
      height={Math.round(size * 0.6)}
      className={cn('object-contain', className)}
    />
  )
}
