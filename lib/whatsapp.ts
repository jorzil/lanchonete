import type { CartItem, Order } from '@/lib/store'
import { MENU, formatCurrency } from '@/lib/store'

export const WHATSAPP_NUMBER = '5511999999999'

export function generateOrderMessage(order: Order): string {
  const lines: string[] = []
  lines.push('🥖 *NOVO PEDIDO - MAIS SUB*')
  lines.push(`📋 Pedido: *${order.orderNumber}*`)
  lines.push(`📅 Data: ${new Date(order.createdAt).toLocaleString('pt-BR')}`)
  lines.push('')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('*🛒 ITENS DO PEDIDO:*')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━')
  order.items.forEach((item, index) => {
    lines.push(`\n*${index + 1}. ${item.name}* (x${item.quantity})`)
    if (item.customization) {
      const c = item.customization
      lines.push(`   🥖 Tamanho: ${c.size}`)
      if (c.meat) { const meat = MENU.meats.find((m) => m.key === c.meat); lines.push(`   🥩 Carne: ${meat?.name || c.meat}`) }
      if (c.cheeses && c.cheeses.length > 0) {
        const cheeseNames = c.cheeses.map((ck) => MENU.cheeses.find((ch) => ch.key === ck)?.name || ck).join(', ')
        lines.push(`   🧀 Queijo: ${cheeseNames}${c.cheeses.length > 1 ? ' (em dobro)' : ''}`)
      }
      if (c.salads && c.salads.length > 0) { lines.push(`   🥗 Saladas: ${c.salads.map((s) => MENU.salads.find((sl) => sl.key === s)?.name || s).join(', ')}`) } else { lines.push('   🥗 Saladas: Sem salada') }
      if (c.sauces && c.sauces.length > 0) { lines.push(`   🥫 Molhos: ${c.sauces.map((s) => MENU.sauces.find((sc) => sc.key === s)?.name || s).join(', ')}`) } else { lines.push('   🥫 Molhos: Sem molho') }
      const extras = Object.entries(c.extras || {}).filter(([, qty]) => qty > 0)
      if (extras.length > 0) lines.push(`   ➕ Extras: ${extras.map(([key, qty]) => { const extra = MENU.extras.find((e) => e.key === key); const price = c.size === '15cm' ? extra?.price15cm : extra?.price30cm; return `${extra?.name || key} x${qty} (+${formatCurrency((price || 0) * qty)})` }).join(', ')}`)
    }
    lines.push(`   💰 Valor: ${formatCurrency(item.price * item.quantity)}`)
  })
  lines.push('')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('*💰 RESUMO FINANCEIRO:*')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push(`Subtotal: ${formatCurrency(order.subtotal)}`)
  if (order.discount > 0) lines.push(`Desconto: -${formatCurrency(order.discount)}`)
  lines.push(`Taxa de entrega: ${order.deliveryFee === 0 ? '✅ Grátis (Retirada)' : formatCurrency(order.deliveryFee)}`)
  lines.push(`\n*TOTAL: ${formatCurrency(order.total)}*`)
  lines.push('')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('*👤 DADOS DO CLIENTE:*')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push(`Nome: ${order.customer.name}`)
  lines.push(`📱 WhatsApp: ${order.customer.phone}`)
  if (order.orderType === 'entrega' && order.address) {
    lines.push('')
    lines.push('*📍 ENDEREÇO DE ENTREGA:*')
    lines.push(`Rua: ${order.address.street}, ${order.address.number}`)
    if (order.address.complement) lines.push(`Complemento: ${order.address.complement}`)
    lines.push(`Bairro: ${order.address.neighborhood}`)
    lines.push(`Cidade: ${order.address.city} - ${order.address.state}`)
    lines.push(`CEP: ${order.address.cep}`)
  } else {
    lines.push('')
    lines.push('🏠 *Modalidade: RETIRADA NO LOCAL*')
  }
  lines.push('')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━')
  const payMap: Record<string, string> = { pix: '💸 PIX', 'cartao-credito': '💳 Cartão de Crédito', 'cartao-debito': '💳 Cartão de Débito', dinheiro: '💵 Dinheiro' }
  lines.push(`*💳 FORMA DE PAGAMENTO:*\n${payMap[order.paymentMethod] || order.paymentMethod}`)
  if (order.notes) { lines.push(''); lines.push('*📝 OBSERVAÇÕES:*'); lines.push(order.notes) }
  lines.push('')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('_Pedido realizado pelo site MaisSub.com.br_')
  return lines.join('\n')
}

export function openWhatsApp(message: string): void {
  const encoded = encodeURIComponent(message)
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank', 'noopener,noreferrer')
}

export function formatCartForWhatsApp(items: CartItem[], total: number, address?: { street: string; number: string; neighborhood: string; city: string; state: string }): string {
  const lines: string[] = []
  lines.push('🥖 *PEDIDO - MAIS SUB*')
  lines.push('')
  lines.push('*ITENS:*')
  items.forEach((item) => {
    lines.push(`• ${item.name} x${item.quantity} — ${formatCurrency(item.price * item.quantity)}`)
    if (item.customization) {
      const c = item.customization
      lines.push(`  Tamanho: ${c.size}`)
      if (c.meat) { const meat = MENU.meats.find((m) => m.key === c.meat); lines.push(`  🥩 ${meat?.name || c.meat}`) }
      if (c.cheeses && c.cheeses.length > 0) {
        const cheeseNames = c.cheeses.map((ck) => MENU.cheeses.find((ch) => ch.key === ck)?.name || ck).join(', ')
        lines.push(`  🧀 ${cheeseNames}${c.cheeses.length > 1 ? ' (em dobro)' : ''}`)
      }
    }
  })
  lines.push('')
  lines.push(`*TOTAL: ${formatCurrency(total)}*`)
  if (address) { lines.push(''); lines.push('*ENDEREÇO:*'); lines.push(`📍 ${address.street}, ${address.number} - ${address.neighborhood}`); lines.push(`   ${address.city}/${address.state}`) }
  return lines.join('\n')
}
