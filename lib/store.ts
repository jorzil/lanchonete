// Re-export everything from the pure data module so existing imports keep working.
export * from '@/lib/data'

// ─── CLIENT-ONLY HOOKS ────────────────────────────────────────────────────────
// These require React and must only be used in Client Components.
import { useState, useEffect } from 'react'
import type { Order } from '@/lib/data'
import { MENU, formatCurrency } from '@/lib/data'

export function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    try { const stored = localStorage.getItem(key); return stored ? (JSON.parse(stored) as T) : defaultValue } catch { return defaultValue }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)) } catch { /* ignore */ }
  }, [key, state])
  return [state, setState]
}

export function generateWhatsAppMessage(order: Order): string {
  const lines: string[] = [
    '🥖 *NOVO PEDIDO - MAIS SUB*',
    `📋 Pedido: ${order.orderNumber}`,
    '',
    '*ITENS DO PEDIDO:*',
  ]
  order.items.forEach((item, i) => {
    lines.push(`\n${i + 1}. *${item.name}* x${item.quantity}`)
    if (item.customization) {
      const c = item.customization
      lines.push(`   📏 Tamanho: ${c.size}`)
      if (c.bread)         { const b = MENU.breads.find((x) => x.key === c.bread); lines.push(`   🍞 Pão: ${b?.name || c.bread}`) }
      if (c.meat)          { const m = MENU.meats.find((x) => x.key === c.meat);   lines.push(`   🥩 Carne: ${m?.name || c.meat}`) }
      if (c.cheeses.length) { const n = c.cheeses.map((k) => MENU.cheeses.find((x) => x.key === k)?.name || k).join(', '); lines.push(`   🧀 Queijo: ${n}${c.cheeses.length > 1 ? ' (em dobro)' : ''}`) }
      if (c.salads.length)  lines.push(`   🥗 Saladas: ${c.salads.map((k) => MENU.salads.find((x) => x.key === k)?.name || k).join(', ')}`)
      if (c.sauces.length)  lines.push(`   🥫 Molhos: ${c.sauces.map((k) => MENU.sauces.find((x) => x.key === k)?.name || k).join(', ')}`)
      const ex = Object.entries(c.extras).filter(([, q]) => q > 0)
      if (ex.length) lines.push(`   ➕ Extras: ${ex.map(([k, q]) => `${MENU.extras.find((x) => x.key === k)?.name || k} x${q}`).join(', ')}`)
    }
    lines.push(`   💰 ${formatCurrency(item.price * item.quantity)}`)
  })
  lines.push('', `Subtotal: ${formatCurrency(order.subtotal)}`)
  if (order.discount > 0) lines.push(`Desconto: -${formatCurrency(order.discount)}`)
  lines.push(`Taxa de entrega: ${order.deliveryFee === 0 ? 'Grátis' : formatCurrency(order.deliveryFee)}`)
  lines.push(`*TOTAL: ${formatCurrency(order.total)}*`, '')
  lines.push(`👤 Nome: ${order.customer.name}`, `📱 Telefone: ${order.customer.phone}`)
  if (order.orderType === 'entrega' && order.address) {
    lines.push(`📍 ${order.address.street}, ${order.address.number}${order.address.complement ? ` - ${order.address.complement}` : ''}`)
    lines.push(`   ${order.address.neighborhood} - ${order.address.city}/${order.address.state}`)
  } else {
    lines.push('🏠 *RETIRADA NO LOCAL*')
  }
  return lines.join('\n')
}
