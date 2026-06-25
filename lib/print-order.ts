import type { Order } from '@/lib/data'
import { formatCurrency } from '@/lib/data'

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

  const itemsHTML = order.items.map(item => {
    const opts: string[] = []
    if (item.customization) {
      const c = item.customization
      if (c.bread) opts.push(`Pão: ${c.bread}`)
      if (c.meat) opts.push(`Carne: ${c.meat}`)
      if (c.cheeses?.length) opts.push(`Queijos: ${c.cheeses.join(', ')}`)
      if (c.salads?.length) opts.push(`Saladas: ${c.salads.join(', ')}`)
      if (c.sauces?.length) opts.push(`Molhos: ${c.sauces.join(', ')}`)
      const extras = Object.entries(c.extras ?? {}).filter(([, q]) => q > 0)
      if (extras.length) opts.push(`Extras: ${extras.map(([k, q]) => `${k}x${q}`).join(', ')}`)
    }
    return `
      <div class="item">
        <div class="item-line">
          <span>${item.quantity}x ${item.name}</span>
          <span>${formatCurrency(item.price * item.quantity)}</span>
        </div>
        ${opts.map(o => `<div class="item-opt">+ ${o}</div>`).join('')}
      </div>`
  }).join('')

  const addressHTML = order.address ? `
    <div class="section">
      <div class="label">ENDEREÇO DE ENTREGA</div>
      <div>${order.address.street}, ${order.address.number}</div>
      ${order.address.complement ? `<div>${order.address.complement}</div>` : ''}
      <div>${order.address.neighborhood}</div>
      <div>${order.address.city} - ${order.address.state}</div>
      ${order.address.cep ? `<div>CEP: ${order.address.cep}</div>` : ''}
    </div>` : `
    <div class="section">
      <div class="label">RETIRADA NO BALCÃO</div>
    </div>`

  const paymentMap: Record<string, string> = {
    pix: 'PIX',
    dinheiro: 'Dinheiro',
    'cartao-credito': 'Cartão de Crédito',
    'cartao-debito': 'Cartão de Débito',
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('pt-BR')
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-weight: bold; }
  body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; max-width: 80mm; padding: 4mm; color: #000; font-weight: bold; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .big { font-size: 16px; font-weight: bold; }
  .divider { border-top: 1px dashed #000; margin: 6px 0; }
  .section { margin: 6px 0; }
  .label { font-weight: bold; font-size: 10px; margin-bottom: 2px; }
  .item { margin: 4px 0; }
  .item-line { display: flex; justify-content: space-between; font-weight: bold; }
  .item-opt { font-size: 10px; padding-left: 12px; color: #333; }
  .total-line { display: flex; justify-content: space-between; }
  .total-line.grand { font-size: 14px; font-weight: bold; }
  @media print {
    body { margin: 0; }
    @page { margin: 0; size: 80mm auto; }
  }
</style>
</head>
<body>
  <div class="center">
    ${headerLines.map((l, i) => `<div class="${i === 0 ? 'big' : ''}">${l}</div>`).join('')}
  </div>

  <div class="divider"></div>

  <div class="section">
    <div class="center bold">PEDIDO #${order.orderNumber}</div>
    <div class="center" style="font-size:10px">${dateStr} às ${timeStr}</div>
  </div>

  <div class="divider"></div>

  <div class="section">
    <div class="label">CLIENTE</div>
    <div>${order.customer.name}</div>
    <div>${order.customer.phone}</div>
  </div>

  ${addressHTML}

  <div class="divider"></div>

  <div class="section">
    <div class="label">ITENS DO PEDIDO</div>
    ${itemsHTML}
  </div>

  <div class="divider"></div>

  <div class="section">
    <div class="total-line"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
    ${order.deliveryFee > 0 ? `<div class="total-line"><span>Entrega</span><span>${formatCurrency(order.deliveryFee)}</span></div>` : ''}
    ${order.discount > 0 ? `<div class="total-line"><span>Desconto</span><span>-${formatCurrency(order.discount)}</span></div>` : ''}
    <div class="divider"></div>
    <div class="total-line grand"><span>TOTAL</span><span>${formatCurrency(order.total)}</span></div>
  </div>

  <div class="divider"></div>

  <div class="section">
    <div class="label">PAGAMENTO</div>
    <div>${paymentMap[order.paymentMethod] ?? order.paymentMethod}</div>
  </div>

  ${order.notes ? `
  <div class="divider"></div>
  <div class="section">
    <div class="label">OBSERVAÇÕES</div>
    <div>${order.notes}</div>
  </div>` : ''}

  <div class="divider"></div>
  <div class="center" style="margin-top:4px">
    ${footerLines.map(l => `<div>${l}</div>`).join('')}
  </div>
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
