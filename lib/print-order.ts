import type { Order } from '@/lib/data'
import { formatCurrency, MENU, PRODUCTS } from '@/lib/data'

// Produto por id → para listar os ingredientes (descrição) dos subs prontos
const PRODUCT_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]))

// Mapas chave → nome legível para o cupom
const BREAD_NAMES = new Map(MENU.breads.map((b) => [b.key, b.name]))
const MEAT_NAMES = new Map(MENU.meats.map((m) => [m.key, m.name]))
const CHEESE_NAMES = new Map(MENU.cheeses.map((c) => [c.key, c.name]))
const SALAD_NAMES = new Map(MENU.salads.map((s) => [s.key, s.name]))
const SAUCE_NAMES = new Map(MENU.sauces.map((s) => [s.key, s.name]))
const EXTRA_NAMES = new Map(MENU.extras.map((e) => [e.key, e.name]))

export interface PrintJob {
  id: string
  orderId: string
  orderNumber: string
  status: 'pending' | 'printed' | 'failed'
  createdAt: string
  printedAt?: string
  copies: number
}

const PRINT_QUEUE_KEY = 'mais_sub_print_queue'
const PRINT_SETTINGS_KEY = 'mais_sub_print_settings'

export interface PrintSettings {
  autoPrintOnNew: boolean
  autoPrintOnAccept: boolean
  copies: number
  header: string
  footer: string
  printerName: string
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  autoPrintOnNew: false,
  autoPrintOnAccept: true,
  copies: 1,
  header: 'MAIS SUB\nLanchos e Subs Artesanais\nTel: (33) 98461-9205',
  footer: 'Obrigado pela preferência!\nwww.maissub.com.br',
  printerName: '',
}

export function getPrintSettings(): PrintSettings {
  if (typeof window === 'undefined') return DEFAULT_PRINT_SETTINGS
  try {
    const raw = localStorage.getItem(PRINT_SETTINGS_KEY)
    if (raw) return { ...DEFAULT_PRINT_SETTINGS, ...JSON.parse(raw) }
  } catch {}
  return DEFAULT_PRINT_SETTINGS
}

export function savePrintSettings(s: Partial<PrintSettings>): PrintSettings {
  const current = getPrintSettings()
  const next = { ...current, ...s }
  localStorage.setItem(PRINT_SETTINGS_KEY, JSON.stringify(next))
  return next
}

export function getPrintQueue(): PrintJob[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PRINT_QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function savePrintQueue(queue: PrintJob[]) {
  localStorage.setItem(PRINT_QUEUE_KEY, JSON.stringify(queue))
}

export function addToPrintQueue(order: Order, copies = 1): PrintJob {
  const job: PrintJob = {
    id: `print-${Date.now()}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: 'pending',
    createdAt: new Date().toISOString(),
    copies,
  }
  const queue = getPrintQueue()
  queue.unshift(job)
  savePrintQueue(queue.slice(0, 100))
  return job
}

export function updatePrintJob(id: string, update: Partial<PrintJob>) {
  const queue = getPrintQueue().map(j => j.id === id ? { ...j, ...update } : j)
  savePrintQueue(queue)
}

export function generateReceiptHTML(order: Order, settings: PrintSettings): string {
  const headerLines = settings.header.split('\n')
  const footerLines = settings.footer.split('\n')

  const paymentMap: Record<string, string> = {
    pix: 'PIX',
    dinheiro: 'Dinheiro',
    'cartao-credito': 'Cartao de Credito',
    'cartao-debito': 'Cartao de Debito',
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('pt-BR')
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const isDelivery = order.orderType === 'entrega'

  const itemsHTML = order.items.map(item => {
    const opts: string[] = []
    // Subs prontos: lista os ingredientes que vêm de fábrica (descrição do produto)
    const prod = PRODUCT_BY_ID.get(item.productId)
    if (prod && (prod.category === 'subs-15cm' || prod.category === 'subs-30cm') && prod.description) {
      opts.push(`Ingredientes: ${prod.description}`)
    }
    if (item.customization) {
      const c = item.customization
      if (c.bread) opts.push(`Pao: ${BREAD_NAMES.get(c.bread) ?? c.bread}`)
      if (c.meat) opts.push(`Carne: ${MEAT_NAMES.get(c.meat) ?? c.meat}`)
      if (c.cheeses?.length) opts.push(`Queijos: ${c.cheeses.map((k) => CHEESE_NAMES.get(k) ?? k).join(', ')}`)
      if (c.salads?.length) {
        const salads = c.salads.filter((s) => s !== 'salada-completa')
        if (c.salads.includes('salada-completa')) opts.push('Saladas: Salada Completa')
        else if (salads.length) opts.push(`Saladas: ${salads.map((k) => SALAD_NAMES.get(k) ?? k).join(', ')}`)
      }
      if (c.sauces?.length) opts.push(`Molhos: ${c.sauces.map((k) => SAUCE_NAMES.get(k) ?? k).join(', ')}`)
      const extras = Object.entries(c.extras ?? {}).filter(([, q]) => q > 0)
      if (extras.length) opts.push(`Adicionais: ${extras.map(([k, q]) => `${EXTRA_NAMES.get(k) ?? k} x${q}`).join(', ')}`)
      if (c.notes) opts.push(`Obs: ${c.notes}`)
    } else if (item.notes) {
      // Itens sem customizacao estruturada (ex: combos) trazem detalhes em notes
      opts.push(item.notes)
    }
    return `
      <div class="item">
        <div class="item-row">
          <span class="item-qty">${item.quantity}x</span>
          <span class="item-name">${item.name}</span>
          <span class="item-price">${formatCurrency(item.price * item.quantity)}</span>
        </div>
        ${opts.map(o => `<div class="item-opt">  - ${o}</div>`).join('')}
      </div>`
  }).join('')

  const addressHTML = isDelivery && order.address ? `
    <div class="section">
      <div class="section-title">*** ENTREGA ***</div>
      <div class="row-line"><span>End.:</span><span>${order.address.street}, ${order.address.number}</span></div>
      ${order.address.complement ? `<div class="row-line"><span>Comp.:</span><span>${order.address.complement}</span></div>` : ''}
      <div class="row-line"><span>Bairro:</span><span>${order.address.neighborhood}</span></div>
      <div class="row-line"><span>Cidade:</span><span>${order.address.city} - ${order.address.state}</span></div>
      ${order.address.cep ? `<div class="row-line"><span>CEP:</span><span>${order.address.cep}</span></div>` : ''}
    </div>` : `
    <div class="section">
      <div class="section-title">*** RETIRADA NO BALCAO ***</div>
      <div class="row-line" style="justify-content:center; font-size:13px; margin-top:3px">R. 7 de Setembro, 2480</div>
      <div class="row-line" style="justify-content:center; font-size:13px">Centro - Gov. Valadares/MG</div>
      <div class="row-line" style="justify-content:center; font-size:13px">CEP: 35010-170</div>
    </div>`

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-weight: bold; }
  body { font-family: 'Courier New', monospace; font-size: 15px; width: 80mm; max-width: 80mm; padding: 3mm 4mm; color: #000; }
  .center { text-align: center; }
  .store-name { font-size: 22px; letter-spacing: 1px; }
  .store-sub { font-size: 13px; }
  .divider-solid { border-top: 2px solid #000; margin: 6px 0; }
  .divider { border-top: 1px dashed #000; margin: 6px 0; }
  .section { margin: 4px 0; }
  .section-title { text-align: center; font-size: 15px; letter-spacing: 1px; margin: 5px 0; }
  .order-num { font-size: 26px; text-align: center; letter-spacing: 2px; margin: 4px 0; }
  .order-type-badge { font-size: 16px; text-align: center; padding: 3px 0; border: 2px solid #000; margin: 3px 8mm; }
  .row-line { display: flex; justify-content: space-between; gap: 4px; font-size: 14px; margin: 2px 0; }
  .row-line span:first-child { white-space: nowrap; }
  .row-line span:last-child { text-align: right; }
  .item { margin: 5px 0; }
  .item-row { display: flex; gap: 3px; font-size: 15px; }
  .item-qty { min-width: 24px; }
  .item-name { flex: 1; }
  .item-price { white-space: nowrap; }
  .item-opt { font-size: 13px; padding-left: 24px; }
  .total-row { display: flex; justify-content: space-between; font-size: 14px; margin: 2px 0; }
  .total-grand { display: flex; justify-content: space-between; font-size: 18px; margin: 4px 0; }
  .payment-box { border: 2px solid #000; padding: 4px 5px; margin: 4px 0; font-size: 15px; text-align: center; }
  .footer-line { font-size: 12px; }
  @media print {
    body { margin: 0; }
    @page { margin: 0; size: 80mm auto; }
  }
</style>
</head>
<body>

  <div class="center">
    ${headerLines.map((l, i) => `<div class="${i === 0 ? 'store-name' : 'store-sub'}">${l}</div>`).join('')}
  </div>

  <div class="divider-solid"></div>

  <div class="order-num">#${order.orderNumber}</div>
  <div class="order-type-badge">${isDelivery ? 'DELIVERY' : 'RETIRADA'}</div>
  <div class="center" style="font-size:10px; margin-top:2px">${dateStr} as ${timeStr}</div>

  <div class="divider-solid"></div>

  <div class="section">
    <div class="section-title">--- CLIENTE ---</div>
    <div class="row-line"><span>Nome:</span><span>${order.customer.name}</span></div>
    <div class="row-line"><span>Tel.:</span><span>${order.customer.phone}</span></div>
  </div>

  <div class="divider"></div>

  ${addressHTML}

  <div class="divider-solid"></div>

  <div class="section">
    <div class="section-title">--- ITENS ---</div>
    ${itemsHTML}
  </div>

  <div class="divider-solid"></div>

  <div class="section">
    <div class="total-row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
    ${isDelivery ? `<div class="total-row"><span>Taxa de entrega</span><span>${formatCurrency(order.deliveryFee)}</span></div>` : ''}
    ${order.discount > 0 ? `<div class="total-row"><span>Desconto${order.coupon ? ` (${order.coupon.code})` : ''}</span><span>- ${formatCurrency(order.discount)}</span></div>` : ''}
    <div class="divider"></div>
    <div class="total-grand"><span>TOTAL</span><span>${formatCurrency(order.total)}</span></div>
  </div>

  <div class="divider"></div>

  <div class="payment-box">PAGAMENTO: ${paymentMap[order.paymentMethod] ?? order.paymentMethod.toUpperCase()}</div>

  ${order.notes ? `
  <div class="divider"></div>
  <div class="section">
    <div class="section-title">--- OBSERVACOES ---</div>
    <div style="font-size:11px">${order.notes}</div>
  </div>` : ''}

  <div class="divider-solid"></div>
  <div class="center" style="margin-top:4px">
    ${footerLines.map(l => `<div class="footer-line">${l}</div>`).join('')}
  </div>
  <div style="margin-top:6px"></div>

</body>
</html>`
}

export function printOrder(order: Order): PrintJob {
  const settings = getPrintSettings()
  const job = addToPrintQueue(order, settings.copies)

  try {
    const html = generateReceiptHTML(order, settings)
    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) throw new Error('Popup bloqueado')

    win.document.write(html)
    win.document.close()
    win.focus()

    setTimeout(() => {
      win.print()
      win.close()
      updatePrintJob(job.id, { status: 'printed', printedAt: new Date().toISOString() })
    }, 300)
  } catch {
    updatePrintJob(job.id, { status: 'failed' })
  }

  return job
}
