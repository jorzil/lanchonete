// ============================================================================
// Clube Mais Sub — fidelidade com três mecânicas que se somam:
//
//   PONTOS  ganhos por real gasto, trocados por recompensas do catálogo.
//   SELOS   um por pedido — o clássico "a cada 10 pedidos, um brinde".
//   NÍVEIS  pelo total gasto; dão vantagem contínua enquanto o cliente estiver
//           no nível (ex: ouro com frete grátis sempre).
//
// Tudo é calculado a partir dos pedidos já existentes: não há saldo gravado
// que possa divergir do histórico. O que se grava é apenas o que foi RESGATADO.
// ============================================================================

import type { Order } from '@/lib/data'
import { normalizePhone, isInternalPhone } from '@/lib/phone'

export type RewardKind = 'desconto_percentual' | 'desconto_fixo' | 'frete_gratis' | 'cookie' | 'adicional'
export type RewardCost = 'pontos' | 'selos'

export interface Reward {
  id: string
  nome: string
  descricao: string
  tipo: RewardKind
  /** % para desconto percentual, R$ para desconto fixo. Ignorado nos brindes. */
  valor: number
  /** Em que moeda custa e quanto. */
  moeda: RewardCost
  custo: number
  ativo: boolean
}

export interface Tier {
  id: string
  nome: string
  /** Total gasto (R$) para alcançar. */
  minimoGasto: number
  cor: string
  /** Vantagem contínua enquanto estiver no nível. */
  freteGratis: boolean
  descontoPercentual: number
}

/** Fatia da roleta. `peso` é relativo: peso 2 sai o dobro de um peso 1. */
export interface WheelSlice {
  id: string
  nome: string
  /** 'nada' é a fatia sem prêmio — precisa existir para a roleta ter graça. */
  tipo: RewardKind | 'nada'
  valor: number
  peso: number
  cor: string
}

export interface WheelConfig {
  ativo: boolean
  /** O que custa um giro. */
  moeda: RewardCost
  custo: number
  fatias: WheelSlice[]
}

export interface LoyaltyConfig {
  ativo: boolean
  nomePrograma: string
  /** Pontos ganhos por real gasto. */
  pontosPorReal: number
  /** Só pedidos concluídos contam — pedido cancelado não vira ponto. */
  statusQueContam: string[]
  recompensas: Reward[]
  niveis: Tier[]
  roleta: WheelConfig
}

export const LOYALTY_DEFAULTS: LoyaltyConfig = {
  ativo: false,
  nomePrograma: 'Clube Mais Sub',
  pontosPorReal: 1,
  statusQueContam: ['entregue'],
  recompensas: [
    { id: 'r-cookie', nome: 'Cookie grátis', descricao: 'Um cookie por nossa conta', tipo: 'cookie', valor: 0, moeda: 'selos', custo: 10, ativo: true },
    { id: 'r-frete', nome: 'Frete grátis', descricao: 'Entrega por nossa conta no próximo pedido', tipo: 'frete_gratis', valor: 0, moeda: 'pontos', custo: 150, ativo: true },
    { id: 'r-adicional', nome: 'Adicional grátis', descricao: 'Escolha um adicional sem custo', tipo: 'adicional', valor: 0, moeda: 'pontos', custo: 100, ativo: true },
    { id: 'r-10off', nome: '10% de desconto', descricao: '10% no próximo pedido', tipo: 'desconto_percentual', valor: 10, moeda: 'pontos', custo: 200, ativo: true },
    { id: 'r-15reais', nome: 'R$ 15 de desconto', descricao: 'R$ 15 no próximo pedido', tipo: 'desconto_fixo', valor: 15, moeda: 'pontos', custo: 400, ativo: true },
  ],
  niveis: [
    { id: 'bronze', nome: 'Bronze', minimoGasto: 0, cor: '#CD7F32', freteGratis: false, descontoPercentual: 0 },
    { id: 'prata', nome: 'Prata', minimoGasto: 300, cor: '#9CA3AF', freteGratis: false, descontoPercentual: 5 },
    { id: 'ouro', nome: 'Ouro', minimoGasto: 800, cor: '#F59E0B', freteGratis: true, descontoPercentual: 10 },
  ],
  roleta: {
    ativo: false,
    moeda: 'selos',
    custo: 3,
    // Pesos pensados para a casa não perder dinheiro: o prêmio caro é raro e
    // "não foi dessa vez" é a fatia mais provável.
    fatias: [
      { id: 'w-5off', nome: '5% OFF', tipo: 'desconto_percentual', valor: 5, peso: 25, cor: '#EE5C13' },
      { id: 'w-nada', nome: 'Quase!', tipo: 'nada', valor: 0, peso: 30, cor: '#334155' },
      { id: 'w-cookie', nome: 'Cookie grátis', tipo: 'cookie', valor: 0, peso: 12, cor: '#F59E0B' },
      { id: 'w-adicional', nome: 'Adicional grátis', tipo: 'adicional', valor: 0, peso: 15, cor: '#10B981' },
      { id: 'w-nada2', nome: 'Quase!', tipo: 'nada', valor: 0, peso: 25, cor: '#1E293B' },
      { id: 'w-frete', nome: 'Frete grátis', tipo: 'frete_gratis', valor: 0, peso: 10, cor: '#3B82F6' },
      { id: 'w-10off', nome: '10% OFF', tipo: 'desconto_percentual', valor: 10, peso: 8, cor: '#8B5CF6' },
      { id: 'w-15reais', nome: 'R$ 15 OFF', tipo: 'desconto_fixo', valor: 15, peso: 3, cor: '#EC4899' },
    ],
  },
}

/**
 * Sorteio ponderado. Recebe o aleatório de fora para poder ser testado com
 * valores fixos — e para deixar explícito que quem sorteia é o servidor.
 */
export function drawSlice(fatias: WheelSlice[], aleatorio: number): number {
  const validas = fatias.filter((f) => f.peso > 0)
  if (validas.length === 0) return -1
  const total = validas.reduce((s, f) => s + f.peso, 0)
  let alvo = Math.min(Math.max(aleatorio, 0), 0.999999) * total
  for (const f of validas) {
    alvo -= f.peso
    if (alvo < 0) return fatias.indexOf(f)
  }
  return fatias.indexOf(validas[validas.length - 1])
}

/** Chance de cada fatia, em %, para mostrar ao admin. */
export function sliceOdds(fatias: WheelSlice[]): Record<string, number> {
  const total = fatias.reduce((s, f) => s + Math.max(0, f.peso), 0)
  const out: Record<string, number> = {}
  for (const f of fatias) out[f.id] = total > 0 ? (Math.max(0, f.peso) / total) * 100 : 0
  return out
}

/** O cliente pode girar? */
export function canSpin(saldo: LoyaltyBalance, w: WheelConfig): boolean {
  if (!w.ativo || w.custo <= 0) return false
  return w.moeda === 'pontos' ? saldo.pontos >= w.custo : saldo.selos >= w.custo
}

/** Um resgate já feito — é o único estado gravado. */
export interface Redemption {
  id: string
  phone: string
  rewardId: string
  rewardNome: string
  /** Cupom gerado para o cliente usar no checkout. */
  couponCode: string
  moeda: RewardCost
  custo: number
  at: string
  usado?: boolean
}

export interface LoyaltyBalance {
  phone: string
  nome: string
  /** Total ganho na história. */
  pontosGanhos: number
  selosGanhos: number
  /** Já gastos em resgates. */
  pontosGastos: number
  selosGastos: number
  /** Disponível agora. */
  pontos: number
  selos: number
  totalGasto: number
  pedidos: number
  nivel: Tier
  /** Próximo nível e quanto falta em R$; null quando já está no topo. */
  proximoNivel: Tier | null
  faltaParaProximo: number
}

/** Nível atual pelo total gasto. */
export function tierFor(cfg: LoyaltyConfig, totalGasto: number): Tier {
  const ordenados = [...cfg.niveis].sort((a, b) => a.minimoGasto - b.minimoGasto)
  let atual = ordenados[0]
  for (const n of ordenados) if (totalGasto >= n.minimoGasto) atual = n
  return atual
}

function nextTier(cfg: LoyaltyConfig, totalGasto: number): Tier | null {
  const acima = [...cfg.niveis]
    .sort((a, b) => a.minimoGasto - b.minimoGasto)
    .filter((n) => n.minimoGasto > totalGasto)
  return acima[0] ?? null
}

/**
 * Saldo do cliente a partir dos pedidos e dos resgates.
 * Só entram pedidos com status que o admin escolheu (por padrão, entregues):
 * um pedido cancelado não pode virar ponto.
 */
export function computeBalance(
  cfg: LoyaltyConfig,
  phone: string,
  orders: Order[],
  redemptions: Redemption[],
): LoyaltyBalance {
  const chave = normalizePhone(phone)
  const meus = orders.filter(
    (o) => normalizePhone(o.customer.phone) === chave && cfg.statusQueContam.includes(o.status),
  )

  const totalGasto = meus.reduce((s, o) => s + o.total, 0)
  const pontosGanhos = Math.floor(totalGasto * cfg.pontosPorReal)
  const selosGanhos = meus.length

  const meusResgates = redemptions.filter((r) => normalizePhone(r.phone) === chave)
  const pontosGastos = meusResgates.filter((r) => r.moeda === 'pontos').reduce((s, r) => s + r.custo, 0)
  const selosGastos = meusResgates.filter((r) => r.moeda === 'selos').reduce((s, r) => s + r.custo, 0)

  const nivel = tierFor(cfg, totalGasto)
  const proximo = nextTier(cfg, totalGasto)

  return {
    phone: chave,
    nome: meus[meus.length - 1]?.customer.name ?? '',
    pontosGanhos,
    selosGanhos,
    pontosGastos,
    selosGastos,
    pontos: Math.max(0, pontosGanhos - pontosGastos),
    selos: Math.max(0, selosGanhos - selosGastos),
    totalGasto,
    pedidos: meus.length,
    nivel,
    proximoNivel: proximo,
    faltaParaProximo: proximo ? Math.max(0, proximo.minimoGasto - totalGasto) : 0,
  }
}

/** O cliente pode resgatar esta recompensa agora? */
export function canRedeem(saldo: LoyaltyBalance, r: Reward): boolean {
  if (!r.ativo) return false
  return r.moeda === 'pontos' ? saldo.pontos >= r.custo : saldo.selos >= r.custo
}

/** Quanto falta para poder resgatar (na moeda da recompensa). */
export function missingFor(saldo: LoyaltyBalance, r: Reward): number {
  const tem = r.moeda === 'pontos' ? saldo.pontos : saldo.selos
  return Math.max(0, r.custo - tem)
}

/** Código do cupom do resgate: legível e ligado ao cliente. */
export function redemptionCode(phone: string, rewardId: string): string {
  const tel = normalizePhone(phone).slice(-4)
  const semente = `${rewardId}${Date.now().toString(36)}`.replace(/[^a-z0-9]/gi, '').toUpperCase()
  return `CLUBE${tel}${semente.slice(-4)}`
}

/** Clientes elegíveis ao clube (exclui PDV e pedidos sem telefone real). */
export function eligiblePhones(orders: Order[]): string[] {
  const set = new Set<string>()
  for (const o of orders) {
    if (isInternalPhone(o.customer.phone)) continue
    const k = normalizePhone(o.customer.phone)
    if (k) set.add(k)
  }
  return [...set]
}

// ─── Acesso ao servidor ──────────────────────────────────────────────────────
export async function fetchLoyaltyConfig(): Promise<LoyaltyConfig> {
  try {
    const res = await fetch('/api/loyalty', { cache: 'no-store' })
    if (res.ok) {
      const d = await res.json()
      return { ...LOYALTY_DEFAULTS, ...(d.config ?? {}) }
    }
  } catch {}
  return LOYALTY_DEFAULTS
}

export async function patchLoyaltyConfig(config: Partial<LoyaltyConfig>): Promise<boolean> {
  try {
    const res = await fetch('/api/loyalty', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    })
    const d = await res.json().catch(() => ({}))
    return res.ok && !!d.ok
  } catch {
    return false
  }
}
