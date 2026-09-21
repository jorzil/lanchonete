import { normalizePhone } from '@/lib/phone'

// Coupon management — localStorage persistence with full business rules

export type CouponType = 'percentage' | 'fixed' | 'free_shipping'

/**
 * A quais produtos o cupom se aplica.
 *
 *   todos  — o carrinho inteiro, como sempre foi
 *   apenas — só os produtos escolhidos
 *   exceto — tudo, menos os produtos escolhidos
 *
 * "apenas" serve para promover um item; "exceto" para proteger a margem de um
 * item que não pode receber desconto. São a mesma máquina, invertida.
 */
export type CouponScope = 'todos' | 'apenas' | 'exceto'

export interface CouponDef {
  id: string
  code: string
  name: string
  description: string
  type: CouponType
  discount: number       // % or R$ value (ignored for free_shipping)
  minOrder: number       // minimum cart value to apply
  maxUses: number | null // null = unlimited
  usedCount: number
  validFrom: string      // ISO date string
  validUntil: string | null // null = never expires
  active: boolean
  createdAt: string
  /**
   * Telefone do dono, quando o cupom é pessoal.
   *
   * Cupom de resgate do clube ou prêmio de roleta nasce para UMA pessoa.
   * maxUses:1 não resolve isso: limita a uma utilização, mas por qualquer um —
   * bastava o cliente passar o código no grupo do WhatsApp.
   */
  ownerPhone?: string
  /** Ausente em cupom antigo, e aí vale para tudo — como sempre valeu. */
  scope?: CouponScope
  /** productIds escolhidos. Só importa quando scope é 'apenas' ou 'exceto'. */
  scopeProducts?: string[]
}

/** Item mínimo que o cálculo precisa — serve ao carrinho e ao PDV. */
export interface ItemParaCupom {
  productId: string
  price: number
  quantity: number
}

/**
 * O mínimo para calcular o desconto.
 *
 * O carrinho guarda uma versão enxuta do cupom, não o cadastro inteiro — pedir
 * o CouponDef completo obrigaria a carregar dados que ali não existem.
 */
export interface CupomParaCalculo {
  type: CouponType
  discount: number
  scope?: CouponScope
  scopeProducts?: string[]
}

/** O cupom cobre este produto? */
export function cobreProduto(coupon: CupomParaCalculo, productId: string): boolean {
  const escopo = coupon.scope ?? 'todos'
  if (escopo === 'todos') return true
  const lista = coupon.scopeProducts ?? []
  // Escopo configurado sem nenhum produto não faz sentido: tratar como
  // "todos" evita um cupom que nunca desconta nada e ninguém entende por quê.
  if (lista.length === 0) return true
  return escopo === 'apenas' ? lista.includes(productId) : !lista.includes(productId)
}

/**
 * Quanto do carrinho o cupom alcança.
 *
 * É sobre ESTE valor que o desconto incide — e não sobre o carrinho inteiro.
 * "10% no sub de frango" tem que dar 10% do frango, não 10% do pedido todo.
 */
export function subtotalElegivel(coupon: CupomParaCalculo, itens: ItemParaCupom[]): number {
  return itens
    .filter((i) => cobreProduto(coupon, i.productId))
    .reduce((s, i) => s + i.price * i.quantity, 0)
}

export interface CouponValidationResult {
  valid: boolean
  coupon?: CouponDef
  error?: string
  discountAmount?: number
}

const STORAGE_KEY = 'mais_sub_coupons'

const DEFAULT_COUPONS: CouponDef[] = [
  {
    id: 'coupon-maissub10',
    code: 'MAISSUB10',
    name: '10% de desconto',
    description: '10% OFF em qualquer pedido',
    type: 'percentage',
    discount: 10,
    minOrder: 0,
    maxUses: null,
    usedCount: 0,
    validFrom: '2025-01-01',
    validUntil: null,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coupon-primeirodia',
    code: 'PRIMEIRODIA',
    name: 'R$ 5 de desconto',
    description: 'R$ 5 OFF no primeiro pedido',
    type: 'fixed',
    discount: 5,
    minOrder: 20,
    maxUses: null,
    usedCount: 0,
    validFrom: '2025-01-01',
    validUntil: null,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coupon-bemvindo',
    code: 'BEMVINDO',
    name: '15% de desconto',
    description: '15% OFF de boas-vindas',
    type: 'percentage',
    discount: 15,
    minOrder: 0,
    maxUses: null,
    usedCount: 0,
    validFrom: '2025-01-01',
    validUntil: null,
    active: true,
    createdAt: new Date().toISOString(),
  },
]

export function getCoupons(): CouponDef[] {
  if (typeof window === 'undefined') return DEFAULT_COUPONS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as CouponDef[]
  } catch {}
  // First load: persist defaults
  saveCoupons(DEFAULT_COUPONS)
  return DEFAULT_COUPONS
}

/**
 * O que está salvo neste aparelho, SEM semear os padrões.
 *
 * getCoupons() grava a lista de fábrica quando não acha nada — o que é certo
 * para exibir, mas fatal para sincronizar: foi assim que os três cupons padrão
 * acabaram enviados por cima de uma base inteira.
 */
export function getCouponsRaw(): CouponDef[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const lista = JSON.parse(raw)
      return Array.isArray(lista) ? (lista as CouponDef[]) : []
    }
  } catch {}
  return []
}

// ─── Cópia de segurança local ────────────────────────────────────────────────
// Antes de o servidor sobrescrever a lista deste aparelho, guardamos o que
// havia aqui. Se o servidor vier com menos cupons, esta cópia pode ser o único
// lugar onde os que faltam ainda existem.
const BACKUP_KEY = 'mais_sub_coupons_backup'

export function saveCouponBackup(list: CouponDef[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify({ coupons: list, em: new Date().toISOString() }))
  } catch {}
}

export function loadCouponBackup(): { coupons: CouponDef[]; em: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(BACKUP_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    return Array.isArray(p?.coupons) && p.coupons.length > 0 ? p : null
  } catch {
    return null
  }
}

export function clearCouponBackup(): void {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(BACKUP_KEY) } catch {}
}

export function saveCoupons(coupons: CouponDef[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons))
}

export function addCoupon(data: Omit<CouponDef, 'id' | 'usedCount' | 'createdAt'>): CouponDef {
  const coupons = getCoupons()
  const existing = coupons.find(c => c.code.toUpperCase() === data.code.toUpperCase())
  if (existing) throw new Error(`Código "${data.code}" já existe.`)
  const coupon: CouponDef = {
    ...data,
    id: `coupon-${Date.now()}`,
    code: data.code.toUpperCase(),
    usedCount: 0,
    createdAt: new Date().toISOString(),
  }
  saveCoupons([coupon, ...coupons])
  return coupon
}

export function updateCoupon(id: string, data: Partial<CouponDef>): void {
  const coupons = getCoupons().map(c => c.id === id ? { ...c, ...data } : c)
  saveCoupons(coupons)
}

export function deleteCoupon(id: string): void {
  saveCoupons(getCoupons().filter(c => c.id !== id))
}

export function incrementCouponUsage(code: string): void {
  const coupons = getCoupons().map(c =>
    c.code === code.toUpperCase() ? { ...c, usedCount: c.usedCount + 1 } : c
  )
  saveCoupons(coupons)
}

/**
 * Dono do cupom, aceitando o formato antigo.
 *
 * A roleta já gravava o telefone em `phone` antes de este campo existir; ler
 * os dois evita que prêmios já entregues virem cupons sem dono.
 */
export function donoDoCupom(coupon: CouponDef): string {
  const bruto = coupon.ownerPhone ?? (coupon as { phone?: string }).phone ?? ''
  return bruto ? normalizePhone(bruto) : ''
}

/**
 * O cupom é pessoal e de outra pessoa?
 *
 * Recebe a lista pronta em vez de buscá-la: assim serve tanto ao navegador
 * quanto ao servidor, e a regra vive num lugar só.
 */
export function cupomDeOutroCliente(
  cupons: { code?: string; ownerPhone?: string; phone?: string }[],
  codigo: string,
  telefoneCliente: string,
): boolean {
  const alvo = String(codigo ?? '').toUpperCase().trim()
  if (!alvo) return false
  const cupom = cupons.find((c) => String(c?.code ?? '').toUpperCase().trim() === alvo)
  if (!cupom) return false

  // `phone` é o nome antigo: prêmios de roleta já entregues usam ele.
  const dono = normalizePhone(cupom.ownerPhone ?? cupom.phone ?? '')
  if (!dono) return false
  return normalizePhone(telefoneCliente ?? '') !== dono
}

export function validateCoupon(
  code: string,
  orderTotal: number,
  /** WhatsApp de quem está tentando usar. Necessário para cupom pessoal. */
  phoneCliente?: string,
): CouponValidationResult {
  const coupons = getCoupons()
  const coupon = coupons.find(c => c.code === code.toUpperCase().trim())

  if (!coupon) return { valid: false, error: 'Cupom não encontrado.' }
  if (!coupon.active) return { valid: false, error: 'Este cupom não está ativo.' }

  // Cupom pessoal só vale para o dono.
  const dono = donoDoCupom(coupon)
  if (dono) {
    const tentando = normalizePhone(phoneCliente ?? '')
    if (!tentando) {
      // Vale para o carrinho também, onde não há campo de telefone: a frase
      // diz onde resolver em vez de pedir algo que não existe na tela.
      return {
        valid: false,
        error: 'Este cupom é pessoal. Use-o ao finalizar o pedido, com o WhatsApp do dono.',
      }
    }
    if (tentando !== dono) {
      return { valid: false, error: 'Este cupom pertence a outro cliente.' }
    }
  }

  if (coupon.minOrder > 0 && orderTotal < coupon.minOrder) {
    return { valid: false, error: `Pedido mínimo de ${formatR$(coupon.minOrder)} para usar este cupom.` }
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: 'Este cupom atingiu o limite de uso.' }
  }
  if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
    return { valid: false, error: 'Este cupom está expirado.' }
  }
  if (new Date(coupon.validFrom) > new Date()) {
    return { valid: false, error: 'Este cupom ainda não está válido.' }
  }

  const discountAmount = calcCouponDiscount(coupon, orderTotal)
  return { valid: true, coupon, discountAmount }
}

/**
 * Valida o cupom com os dados mais recentes do servidor (Supabase).
 * Evita que um cupom inativado/expirado no admin continue valendo em
 * aparelhos com a lista antiga no localStorage.
 */
export async function validateCouponFresh(
  code: string,
  orderTotal: number,
  phoneCliente?: string,
): Promise<CouponValidationResult> {
  await pullCoupons() // atualiza o localStorage; se falhar, valida com o que há local
  return validateCoupon(code, orderTotal, phoneCliente)
}

/**
 * Desconto do cupom.
 *
 * Passando os itens, o desconto incide só sobre a parte que o cupom alcança.
 * Sem eles, vale o subtotal inteiro — é o caminho dos cupons sem escopo e das
 * telas que ainda não têm a lista em mãos.
 */
export function calcCouponDiscount(coupon: CupomParaCalculo, subtotal: number, itens?: ItemParaCupom[]): number {
  const base = itens ? subtotalElegivel(coupon, itens) : subtotal
  if (base <= 0) return 0
  if (coupon.type === 'percentage') return base * (coupon.discount / 100)
  // O desconto fixo não pode passar do que ele alcança: R$ 20 num item de
  // R$ 15 viraria dinheiro de volta.
  if (coupon.type === 'fixed') return Math.min(coupon.discount, base)
  if (coupon.type === 'free_shipping') return 0 // handled separately
  return 0
}

function formatR$(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── Sincronização com o Supabase (cross-device) ──────────────────────────────
// Puxa os cupons do banco para o localStorage. Retorna true se trouxe dados.
export async function pullCoupons(): Promise<boolean> {
  try {
    const res = await fetch('/api/coupons', { cache: 'no-store' })
    if (!res.ok) return false
    const data = await res.json()

    if (Array.isArray(data.coupons)) {
      const local = getCouponsRaw()
      // O servidor está trazendo MENOS do que existe aqui. Isso é sinal de
      // perda, não de sincronização: guarda o que há neste aparelho antes de
      // sobrescrever, para dar como recuperar.
      if (local.length > data.coupons.length) saveCouponBackup(local)
      saveCoupons(data.coupons as CouponDef[])
      return true
    }

    // Semeia SÓ quando o servidor confirma que a linha não existe.
    //
    // Antes, qualquer resposta sem lista — falha momentânea, JSON ilegível —
    // fazia este navegador enviar a lista local por cima do banco. Num
    // navegador recém-aberto essa lista são os três cupons de fábrica, e foi
    // assim que uma base inteira de cupons foi substituída por eles.
    if (data.existe === false) await pushCoupons()
    return false
  } catch {
    return false
  }
}

// Envia os cupons locais para o banco.
/**
 * Envia os cupons locais ao banco.
 *
 * `force` é para quando o admin apaga de propósito: sem ele, o servidor recusa
 * um envio que reduziria drasticamente a lista.
 */
export async function pushCoupons(force = false): Promise<boolean> {
  try {
    const res = await fetch(`/api/coupons${force ? '?force=1' : ''}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coupons: getCouponsRaw() }),
    })
    const data = await res.json().catch(() => ({}))
    return res.ok && data.ok
  } catch {
    return false
  }
}

/** Cupons guardados no servidor antes da última gravação. */
export async function fetchCouponBackupRemote(): Promise<CouponDef[] | null> {
  try {
    const res = await fetch('/api/coupons', { cache: 'no-store' })
    if (!res.ok) return null
    const d = await res.json()
    return Array.isArray(d?.anterior?.coupons) ? (d.anterior.coupons as CouponDef[]) : null
  } catch {
    return null
  }
}

/** Restaura uma lista, gravando local e no servidor. */
export async function restaurarCupons(lista: CouponDef[]): Promise<boolean> {
  saveCoupons(lista)
  clearCouponBackup()
  return pushCoupons(true)
}
