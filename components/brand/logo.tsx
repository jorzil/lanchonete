import { cn } from '@/lib/utils'

/**
 * Mais Sub "m" sticker badge — starburst shape with the letter M
 * Used as decorative element throughout the site.
 */
export function MBadge({ size = 64, className }: { size?: number; className?: string }) {
  const points = 16
  const outer = 50
  const inner = 42
  const path = Array.from({ length: points * 2 }).map((_, i) => {
    const r = i % 2 === 0 ? outer : inner
    const a = (Math.PI * i) / points - Math.PI / 2
    const x = 50 + r * Math.cos(a)
    const y = 50 + r * Math.sin(a)
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ') + ' Z'

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={cn('sticker', className)}>
      <path d={path} fill="#EE5C13" />
      <path
        d={path}
        fill="white"
        transform="translate(50 50) scale(0.78) translate(-50 -50)"
        transformOrigin="center"
      />
      <text
        x="50" y="64"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontWeight="800"
        fontSize="38"
        fill="#EE5C13"
        letterSpacing="-2"
      >m</text>
    </svg>
  )
}

/**
 * "mais sub" wordmark — stylized graffiti-inspired text.
 * Uses CSS text-shadow as a faux outline to mimic the original hand-drawn logo.
 */
export function MaisSubWordmark({
  size = 'md',
  className,
}: { size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero'; className?: string }) {
  const sizes = {
    sm: 'text-[18px]',
    md: 'text-[28px]',
    lg: 'text-[44px]',
    xl: 'text-[72px]',
    hero: 'text-[96px] sm:text-[128px] lg:text-[160px]',
  } as const

  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-[0.06em] font-display font-extrabold uppercase tracking-[-0.06em] leading-none select-none',
        sizes[size],
        className
      )}
      style={{ fontStretch: 'condensed' }}
    >
      <span
        className="text-white -rotate-[3deg] inline-block"
        style={{
          WebkitTextStroke: '0.04em #0B2C5C',
          textShadow: '0.04em 0.04em 0 #0B2C5C',
        }}
      >
        mais
      </span>
      <span
        className="text-[#EE5C13] rotate-[2deg] inline-block"
        style={{
          WebkitTextStroke: '0.04em #0B2C5C',
          textShadow: '0.05em 0.05em 0 #0B2C5C',
        }}
      >
        SUB
      </span>
    </span>
  )
}

/**
 * Compact horizontal wordmark for navbar / footer.
 * Cleaner, less graffiti — just "mais SUB" in display font.
 */
export function MaisSubMark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-baseline font-display font-extrabold uppercase tracking-[-0.04em] leading-none', className)}>
      <span className="text-white">mais</span>
      <span className="text-[#EE5C13]">SUB</span>
    </span>
  )
}
