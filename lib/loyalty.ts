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

/**
 * Como o cliente ganha giro. Fica em configuração, e não no código, porque a
 * casa muda de campanha o tempo todo — hoje é a cada 5 pedidos, na semana da
 * promoção vira um por dia.
 */
export type SpinRuleType = 'AFTER_ORDER' | 'AFTER_AMOUNT' | 'DAILY' | 'WEEKLY' | 'MANUAL'

export interface SpinRule {
  tipo: SpinRuleType
  /** Pedidos, reais ou giros por período, conforme o tipo. */
  valor: number
}

export const SPIN_RULE_LABEL: Record<SpinRuleType, string> = {
  AFTER_ORDER: 'A cada N pedidos entregues',
  AFTER_AMOUNT: 'A cada R$ N gastos',
  DAILY: 'N giros por dia',
  WEEKLY: 'N giros por semana',
  MANUAL: 'Só giros dados pelo admin',
}

/** Fatia da roleta. A chance é digitada em % e normalizada na hora do sorteio. */
export interface WheelSlice {
  id: string
  nome: string
  /** 'nada' é a fatia sem prêmio — precisa existir para a roleta ter graça. */
  tipo: RewardKind | 'nada'
  valor: number
  /** Chance desejada, em %. Se a soma não fechar 100, tudo é normalizado. */
  chance: number
  /** Cor própria. Vazio = gerada a partir da posição, para a roleta nunca
   *  repetir a mesma paleta quando o número de fatias muda. */
  cor?: string
  /** Emoji mostrado na fatia e no cupom. */
  icone?: string
  descricao?: string
  /** Quantos ainda podem sair. null/ausente = sem limite. */
  estoque?: number | null
  /** Dias de validade do cupom gerado. Ausente = 30. */
  validadeDias?: number
  /** Fatia desligada continua desenhada, mas nunca é sorteada. */
  ativo?: boolean
}

export interface WheelConfig {
  ativo: boolean
  /**
   * Legado: a cada quantos pedidos o cliente ganha um giro. Continua valendo
   * como valor da regra AFTER_ORDER, para não quebrar quem já configurou.
   */
  pedidosPorGiro: number
  regra: SpinRule
  /** Giros dados a mão pelo admin, por telefone normalizado. */
  girosManuais: Record<string, number>
  fatias: WheelSlice[]
}

/** Roleta vinda do banco pode ser antiga: completa o que faltar. */
export function normalizeWheel(w?: Partial<WheelConfig>): WheelConfig {
  const base = LOYALTY_DEFAULTS.roleta
  const pedidosPorGiro = Math.max(1, w?.pedidosPorGiro ?? base.pedidosPorGiro)
  return {
    ativo: !!w?.ativo,
    pedidosPorGiro,
    regra: w?.regra?.tipo
      ? { tipo: w.regra.tipo, valor: Math.max(1, w.regra.valor || 1) }
      : { tipo: 'AFTER_ORDER', valor: pedidosPorGiro },
    girosManuais: w?.girosManuais && typeof w.girosManuais === 'object' ? w.girosManuais : {},
    fatias: Array.isArray(w?.fatias) && w.fatias.length ? w.fatias : base.fatias,
  }
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
    pedidosPorGiro: 5,
    regra: { tipo: 'AFTER_ORDER', valor: 5 },
    girosManuais: {},
    // Percentuais pensados para a casa não perder: prêmio caro é raro.
    // O prêmio mais valioso ainda tem estoque limitado, para uma sequência de
    // sorte não custar caro demais numa semana.
    fatias: [
      { id: 'w-cookie', nome: 'Cookie grátis', icone: '🍪', tipo: 'cookie', valor: 0, chance: 25, ativo: true },
      { id: 'w-refri', nome: 'Refri grátis', icone: '🥤', tipo: 'adicional', valor: 0, chance: 20, ativo: true },
      { id: 'w-5reais', nome: 'R$ 5 OFF', icone: '🎟️', tipo: 'desconto_fixo', valor: 5, chance: 20, ativo: true },
      { id: 'w-10reais', nome: 'R$ 10 OFF', icone: '🎟️', tipo: 'desconto_fixo', valor: 10, chance: 15, ativo: true },
      { id: 'w-15reais', nome: 'R$ 15 OFF', icone: '🥪', tipo: 'desconto_fixo', valor: 15, chance: 8, ativo: true },
      { id: 'w-10off', nome: '10% OFF', icone: '🔥', tipo: 'desconto_percentual', valor: 10, chance: 7, ativo: true },
      { id: 'w-surpresa', nome: 'Prêmio surpresa', icone: '🎁', tipo: 'adicional', valor: 0, chance: 4, ativo: true },
      { id: 'w-sub15', nome: 'Sub 15cm grátis', icone: '🥪', tipo: 'desconto_fixo', valor: 25, chance: 1, ativo: true, estoque: 20 },
    ],
  },
}

/**
 * Cor da fatia: a própria, quando definida, ou uma gerada pela posição.
 * As geradas distribuem o matiz por todo o círculo cromático conforme o número
 * de fatias — assim a roleta muda de paleta ao mudar de tamanho, em vez de
 * repetir sempre as mesmas cores. Fatia sem prêmio sai acinzentada, para o
 * cliente distinguir de relance o que vale prêmio.
 */
/**
 * Baralho de cores da roleta, tirado da marca: laranja e azul do Mais Sub,
 * mais tons vizinhos. A ordem alterna família quente e fria, então duas fatias
 * lado a lado nunca se confundem — e o resultado é a roleta do Mais Sub, não
 * um arco-íris genérico.
 */
const PALETA = [
  '#EE5C13', '#023E74', '#F59E0B', '#0359A2',
  '#D9480F', '#01477F', '#FBBF24', '#0B6BC0',
  '#B84508', '#013A6B', '#FCD34D', '#1580DE',
]

export function sliceColor(fatia: WheelSlice, indice: number, total: number): string {
  if (fatia.cor) return fatia.cor
  if (fatia.tipo === 'nada') return indice % 2 === 0 ? '#334155' : '#1E293B'
  // O passo depende do número de fatias, então uma roleta de 8 não usa a mesma
  // sequência de uma de 4 — muda de paleta ao mudar de tamanho.
  const n = Math.max(1, total)
  const passo = n % PALETA.length === 0 ? 1 : Math.max(1, Math.floor(PALETA.length / n))
  return PALETA[(indice * passo + (n % PALETA.length)) % PALETA.length]
}

/**
 * Sorteio ponderado. Recebe o aleatório de fora para poder ser testado com
 * valores fixos — e para deixar explícito que quem sorteia é o servidor.
 *
 * Fatia desligada ou sem estoque fica de fora do sorteio, e o peso dela é
 * redistribuído entre as demais: a roleta continua girando com 8 fatias
 * desenhadas mesmo quando só 6 podem sair.
 */
export function drawSlice(fatias: WheelSlice[], aleatorio: number, bloqueadas?: Set<string>): number {
  const validas = fatias.filter(
    (f) => f.chance > 0 && f.ativo !== false && !bloqueadas?.has(f.id),
  )
  if (validas.length === 0) return -1
  const total = validas.reduce((s, f) => s + f.chance, 0)
  let alvo = Math.min(Math.max(aleatorio, 0), 0.999999) * total
  for (const f of validas) {
    alvo -= f.chance
    if (alvo < 0) return fatias.indexOf(f)
  }
  return fatias.indexOf(validas[validas.length - 1])
}

/** Quantas vezes cada fatia já saiu, a partir do histórico de giros. */
export function sliceUsage(redemptions: Redemption[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const r of redemptions) {
    if (!r.rewardId.startsWith('roleta:')) continue
    const id = r.rewardId.slice('roleta:'.length)
    out[id] = (out[id] ?? 0) + 1
  }
  return out
}

/** Fatias que não podem mais sair: desligadas ou com o estoque no fim. */
export function blockedSlices(fatias: WheelSlice[], redemptions: Redemption[]): Set<string> {
  const usos = sliceUsage(redemptions)
  const fora = new Set<string>()
  for (const f of fatias) {
    if (f.ativo === false) { fora.add(f.id); continue }
    if (typeof f.estoque === 'number' && (usos[f.id] ?? 0) >= f.estoque) fora.add(f.id)
  }
  return fora
}

/** Quanto resta do estoque da fatia. null = sem limite. */
export function sliceStockLeft(f: WheelSlice, usos: Record<string, number>): number | null {
  if (typeof f.estoque !== 'number') return null
  return Math.max(0, f.estoque - (usos[f.id] ?? 0))
}

/**
 * Chance real de cada fatia, em %. O admin digita o percentual desejado; se a
 * soma não fechar 100, normalizamos — assim o número mostrado é o que de fato
 * acontece, e não a intenção.
 */
export function sliceOdds(fatias: WheelSlice[]): Record<string, number> {
  const total = fatias.reduce((s, f) => s + Math.max(0, f.chance), 0)
  const out: Record<string, number> = {}
  for (const f of fatias) out[f.id] = total > 0 ? (Math.max(0, f.chance) / total) * 100 : 0
  return out
}

/** Soma dos percentuais digitados — 100 significa que nada será normalizado. */
export function chanceTotal(fatias: WheelSlice[]): number {
  return fatias.reduce((s, f) => s + Math.max(0, f.chance), 0)
}

/** O cliente tem giro disponível? */
export function canSpin(saldo: LoyaltyBalance, w: WheelConfig): boolean {
  return !!w.ativo && saldo.girosDisponiveis > 0
}

/** Dia do calendário, em fuso de Brasília, no formato AAAA-MM-DD. */
function diaBR(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

/** Segunda-feira da semana daquela data — chave para a regra semanal. */
function semanaBR(iso: string): string {
  const d = new Date(new Date(iso).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return d.toISOString().slice(0, 10)
}

export interface SpinStatus {
  ganhos: number
  usados: number
  disponiveis: number
  /** Frase pronta para a tela explicando como conseguir o próximo giro. */
  comoGanhar: string
}

/**
 * Quantos giros o cliente tem, conforme a regra configurada.
 *
 * Nas regras por período (dia/semana) só contam os giros já usados naquele
 * período; nas de acúmulo, o total da história menos o que já gastou. Giros
 * dados pelo admin somam por cima, sempre.
 */
export function computeSpins(
  w: WheelConfig,
  chave: string,
  pedidos: number,
  totalGasto: number,
  girosDoCliente: Redemption[],
): SpinStatus {
  const regra = w.regra ?? { tipo: 'AFTER_ORDER' as SpinRuleType, valor: w.pedidosPorGiro }
  const valor = Math.max(1, regra.valor || 1)
  const manuais = Math.max(0, w.girosManuais?.[chave] ?? 0)
  const usadosTotal = girosDoCliente.length

  const agora = new Date().toISOString()
  let ganhos = 0
  let usados = usadosTotal
  let comoGanhar = ''

  switch (regra.tipo) {
    case 'AFTER_AMOUNT':
      ganhos = Math.floor(totalGasto / valor)
      comoGanhar = `A cada R$ ${valor} gastos você ganha um giro`
      break
    case 'DAILY':
      ganhos = pedidos > 0 ? valor : 0
      usados = girosDoCliente.filter((r) => diaBR(r.at) === diaBR(agora)).length
      comoGanhar = valor === 1 ? 'Você tem um giro por dia' : `Você tem ${valor} giros por dia`
      break
    case 'WEEKLY':
      ganhos = pedidos > 0 ? valor : 0
      usados = girosDoCliente.filter((r) => semanaBR(r.at) === semanaBR(agora)).length
      comoGanhar = valor === 1 ? 'Você tem um giro por semana' : `Você tem ${valor} giros por semana`
      break
    case 'MANUAL':
      ganhos = 0
      comoGanhar = 'Os giros são liberados pela loja'
      break
    default:
      ganhos = Math.floor(pedidos / valor)
      comoGanhar = `A cada ${valor} pedidos entregues você ganha um giro`
  }

  // Os giros dados a mão entram por fora e são consumidos junto com os demais.
  return {
    ganhos: ganhos + manuais,
    usados,
    disponiveis: Math.max(0, ganhos + manuais - usados),
    comoGanhar,
  }
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
  /** Quando o cupom perde a validade. */
  expiresAt?: string
  status?: 'disponivel' | 'usado' | 'expirado' | 'cancelado'
  /** Chave da requisição que gerou o giro — impede prêmio em duplicidade. */
  spinKey?: string
  icone?: string
}

/** Status de um cupom agora, levando a validade em conta. */
export function redemptionStatus(r: Redemption): 'disponivel' | 'usado' | 'expirado' | 'cancelado' {
  if (r.status === 'usado' || r.usado) return 'usado'
  if (r.status === 'cancelado') return 'cancelado'
  if (r.expiresAt && new Date(r.expiresAt).getTime() < Date.now()) return 'expirado'
  return 'disponivel'
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
  /** Giros da roleta ganhos, usados e restantes, conforme a regra vigente. */
  girosGanhos: number
  girosUsados: number
  girosDisponiveis: number
  /** Pedidos que faltam para liberar o próximo giro (regra por pedidos). */
  pedidosParaProximoGiro: number
  /** Frase explicando como se ganha giro na regra atual. */
  comoGanharGiro: string
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

  // Giros: quem manda é a regra configurada, não o código.
  const roleta = normalizeWheel(cfg.roleta)
  const girosDoCliente = meusResgates.filter((r) => r.rewardId.startsWith('roleta:'))
  const giros = computeSpins(roleta, chave, meus.length, totalGasto, girosDoCliente)
  const porGiro = Math.max(1, roleta.regra.tipo === 'AFTER_ORDER' ? roleta.regra.valor : roleta.pedidosPorGiro)
  const restoPedidos = meus.length % porGiro

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
    girosGanhos: giros.ganhos,
    girosUsados: giros.usados,
    girosDisponiveis: giros.disponiveis,
    pedidosParaProximoGiro: porGiro - restoPedidos,
    comoGanharGiro: giros.comoGanhar,
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

/**
 * Código curto do prêmio da roleta, no formato MS-XXXXX.
 *
 * Sem as letras I, O e as vogais: evita confundir I com 1 e O com 0 quando o
 * cliente lê o código pelo WhatsApp, e evita formar palavra sem querer. Quem
 * garante que não repete é a verificação contra os cupons já gravados.
 */
export function prizeCode(existentes: Set<string> = new Set()): string {
  const alfabeto = '23456789BCDFGHJKLMNPQRSTVWXZ'
  for (let tentativa = 0; tentativa < 40; tentativa++) {
    let corpo = ''
    for (let i = 0; i < 5; i++) corpo += alfabeto[Math.floor(Math.random() * alfabeto.length)]
    const code = `MS-${corpo}`
    if (!existentes.has(code)) return code
  }
  // Improvável a ponto de nunca acontecer; ainda assim, nada de devolver repetido.
  return `MS-${Date.now().toString(36).toUpperCase().slice(-5)}`
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
