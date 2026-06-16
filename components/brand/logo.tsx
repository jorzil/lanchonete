import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Primary Mais Sub logo.
 * Reads the file from /public/logo.png (commit your real file there).
 * Use `variant="dark"` for placement on light backgrounds (default),
 * `variant="light"` if you have a white version at /public/logo-light.png.
 */
export function Logo({
  variant = 'dark',
  className,
  width = 120,
  height = 48,
  priority = false,
}: {
  variant?: 'dark' | 'light'
  className?: string
  width?: number
  height?: number
  priority?: boolean
}) {
  // Defaults to /logo.svg (placeholder). When you commit /logo.png, swap the
  // extensions below — that's the only change needed.
  const src = variant === 'light' ? '/logo-light.svg' : '/logo.svg'
  return (
    <Image
      src={src}
      alt="Mais Sub"
      width={width}
      height={height}
      priority={priority}
      className={cn('object-contain w-auto', className)}
      style={{ height: `${height}px` }}
    />
  )
}
