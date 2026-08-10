'use client'

// ============================================================================
// Promoções por horário — ex: "Almoço Mais Sub", subs selecionados a preço
// especial das 12:00 às 15:30, de segunda a sexta.
//
// O preço promocional é aplicado como `promoPrice` no produto. Assim toda a
// vitrine já existente (card do cardápio, modal do pão, carrinho) mostra o
// "de/por" e cobra o valor certo sem nenhuma mudança — effectivePrice() já
// sabe lidar com isso.
// ============================================================================

import type { Product } from '@/lib/data'

export interface Promotion {
  id: string
  name: string
  enabled: boolean
  /** Produtos incluídos. O preço aplicado depende do tamanho de cada um. */
  productIds: string[]
  /** Preço promocional dos subs de 15cm. */
  price15: number
  /** Preço promocional dos subs de 30cm. */
  price30: number
  /** Janela diária, "HH:MM". */
  start: string
  end: string
  /** Dias da semana em que vale (0 = domingo … 6 = sábado). */
  days: number[]
}

export const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/** "12:00" → "12h" · "15:30" → "15h30" */
export function formatHour(hhmm: string): string {
  const [h, m] = hhmm.split(':')
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`
}

/** A promoção está valendo neste instante? */
export function isPromotionActive(p: Promotion, now: Date = new Date()): boolean {
  if (!p.enabled) return false
  if (p.productIds.length === 0) return false

  const start = toMinutes(p.start)
  const end = toMinutes(p.end)
  const minutes = now.getHours() * 60 + now.getMinutes()
  const day = now.getDay()

  // Janela que vira a meia-noite (ex: 22:00 → 02:00): o trecho depois da
  // virada pertence ao dia anterior, senão a promoção "pularia" um dia.
  if (end <= start) {
    if (minutes >= start) return p.days.includes(day)
    if (minutes < end) return p.days.includes((day + 6) % 7)
    return false
  }
  return p.days.includes(day) && minutes >= start && minutes < end
}

/** Quanto falta para começar hoje, em minutos. null se não começa mais hoje. */
export function minutesUntilStart(p: Promotion, now: Date = new Date()): number | null {
  if (!p.days.includes(now.getDay())) return null
  const diff = toMinutes(p.start) - (now.getHours() * 60 + now.getMinutes())
  return diff > 0 ? diff : null
}

/** Preço promocional para um produto, ou null se a promoção não o cobre. */
export function promoPriceFor(p: Promotion, product: Product): number | null {
  if (!p.productIds.includes(product.id)) return null
  if (product.category === 'subs-30cm') return p.price30 > 0 ? p.price30 : null
  if (product.category === 'subs-15cm') return p.price15 > 0 ? p.price15 : null
  return null
}

/**
 * Aplica as promoções ativas sobre a lista de produtos.
 * Só reduz preço: uma promoção configurada acima do preço normal é ignorada,
 * para nunca encarecer o produto por engano de digitação.
 */
export function applyPromotions(
  products: Product[],
  promotions: Promotion[],
  now: Date = new Date(),
): Product[] {
  const ativas = promotions.filter((p) => isPromotionActive(p, now))
  if (ativas.length === 0) return products

  return products.map((prod) => {
    let melhor: number | null = null
    for (const promo of ativas) {
      const preco = promoPriceFor(promo, prod)
      if (preco != null && preco < prod.price && (melhor == null || preco < melhor)) melhor = preco
    }
    if (melhor == null) return prod
    // Mantém o menor entre a promoção e um promoPrice já existente
    const atual = prod.promoPrice != null && prod.promoPrice > 0 ? prod.promoPrice : Infinity
    return { ...prod, promoPrice: Math.min(melhor, atual) }
  })
}

/** As promoções ativas agora (para o aviso na vitrine). */
export function activePromotions(promotions: Promotion[], now: Date = new Date()): Promotion[] {
  return promotions.filter((p) => isPromotionActive(p, now))
}

export async function fetchPromotions(): Promise<Promotion[]> {
  try {
    const res = await fetch('/api/promotions', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      return Array.isArray(data.promotions) ? data.promotions : []
    }
  } catch {}
  return []
}

export async function patchPromotions(promotions: Promotion[]): Promise<boolean> {
  try {
    const res = await fetch('/api/promotions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promotions }),
    })
    const data = await res.json().catch(() => ({}))
    return res.ok && !!data.ok
  } catch {
    return false
  }
}
