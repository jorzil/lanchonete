// ==================== FINANCEIRO STORAGE ====================
// Lançamentos manuais de receitas/despesas + agregação automática de
// faturamento (pedidos) e compras de insumos para a DRE.

import { loadOrders } from "@/lib/orders-storage"
import { loadPurchases } from "@/lib/purchases-storage"

export type TxKind = "receita" | "despesa"

// Categorias de despesa (padrão delivery)
export type ExpenseCategory =
  | "insumos" | "pessoal" | "aluguel" | "utilidades"
  | "marketing" | "taxas" | "manutencao" | "outros"

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  insumos: "Insumos / Mercadoria",
  pessoal: "Pessoal / Salários",
  aluguel: "Aluguel",
  utilidades: "Água / Luz / Internet",
  marketing: "Marketing",
  taxas: "Taxas / Impostos",
  manutencao: "Manutenção",
  outros: "Outros",
}

/**
 * Categoria criada pela loja.
 *
 * As oito de fábrica cobrem o básico, mas cada casa tem a sua linha de gasto
 * — "Frota", "Contador", "Reforma". Sem poder criar, tudo isso ia parar em
 * "Outros", que é onde o dinheiro some de vista.
 */
/**
 * Unidades de compra.
 *
 * As mesmas do estoque (un, kg, g, L, ml, pct), mais as que aparecem em nota
 * de fornecedor e em pagamento de serviço. Sem isso, "R$ 900 de carne" não diz
 * se foi caro: 20kg a R$ 45 é uma conversa, 12kg a R$ 75 é outra.
 */
export const UNIDADES = [
  { key: "un", label: "unidade" },
  { key: "kg", label: "quilo" },
  { key: "g", label: "grama" },
  { key: "L", label: "litro" },
  { key: "ml", label: "mililitro" },
  { key: "cx", label: "caixa" },
  { key: "pct", label: "pacote" },
  { key: "fardo", label: "fardo" },
  { key: "dz", label: "dúzia" },
  { key: "saco", label: "saco" },
  { key: "bdj", label: "bandeja" },
  { key: "h", label: "hora" },
  { key: "diaria", label: "diária" },
  { key: "mes", label: "mês" },
] as const

export type Unidade = (typeof UNIDADES)[number]["key"]

export function unidadeLabel(key?: string): string {
  return UNIDADES.find((u) => u.key === key)?.label ?? key ?? ""
}

export interface TxCategory {
  key: string
  label: string
}

/**
 * Subcategoria do lançamento.
 *
 * A categoria diz o TIPO de gasto ("Insumos"); a subcategoria diz QUAL
 * ("Carne — boi"). Sem ela, o mês fecha com "R$ 4.200 em insumos" e não há
 * como saber se a carne subiu ou se foi o molho — que é justamente a pergunta
 * que faz a loja mudar de fornecedor.
 */
export interface Subcategory {
  /** Chave estável. A etiqueta pode ser renomeada sem perder o histórico. */
  key: string
  label: string
  /** A qual categoria pertence — de fábrica ou criada pela loja. */
  category: string
}

/**
 * Subcategorias que já vêm prontas, tiradas do que a loja compra de verdade.
 *
 * São só um ponto de partida: a loja adiciona, renomeia e apaga o que quiser
 * na própria tela de lançamento.
 */
export const DEFAULT_SUBCATEGORIES: Subcategory[] = [
  // Carnes — a maior linha de custo, e a que mais varia de preço
  { key: "carne_boi", label: "Carne — boi", category: "insumos" },
  { key: "carne_frango", label: "Carne — frango", category: "insumos" },
  { key: "carne_porco", label: "Carne — porco", category: "insumos" },
  { key: "carne_bacon", label: "Carne — bacon", category: "insumos" },
  // Molhos
  { key: "molho_barbecue", label: "Molho — barbecue", category: "insumos" },
  { key: "molho_ranch", label: "Molho — ranch", category: "insumos" },
  { key: "molho_maionese", label: "Molho — maionese", category: "insumos" },
  { key: "molho_mostarda_mel", label: "Molho — mostarda com mel", category: "insumos" },
  // Demais insumos
  { key: "pao", label: "Pão", category: "insumos" },
  { key: "queijo", label: "Queijo", category: "insumos" },
  { key: "salada", label: "Salada / hortifrúti", category: "insumos" },
  { key: "bebidas", label: "Bebidas", category: "insumos" },
  { key: "cookies", label: "Cookies", category: "insumos" },
  { key: "embalagens", label: "Embalagens / descartáveis", category: "insumos" },
  { key: "gas", label: "Gás", category: "insumos" },
  // Pessoal — é aqui que o pagamento do motoboy é identificado
  { key: "motoboy", label: "Motoboy / entregador", category: "pessoal" },
  { key: "atendente", label: "Atendente", category: "pessoal" },
  { key: "cozinha", label: "Cozinha", category: "pessoal" },
  { key: "diaria", label: "Diária / freelance", category: "pessoal" },
  { key: "vale", label: "Vale / adiantamento", category: "pessoal" },
  // Utilidades
  { key: "energia", label: "Energia", category: "utilidades" },
  { key: "agua", label: "Água", category: "utilidades" },
  { key: "internet", label: "Internet / telefone", category: "utilidades" },
  // Taxas
  { key: "taxa_ifood", label: "Comissão iFood", category: "taxas" },
  { key: "taxa_cartao", label: "Taxa de cartão", category: "taxas" },
  { key: "imposto", label: "Impostos", category: "taxas" },
  // Marketing
  { key: "anuncio", label: "Anúncios", category: "marketing" },
  { key: "impresso", label: "Material impresso", category: "marketing" },
]

export interface Transaction {
  id: string
  kind: TxKind
  /**
   * Chave da categoria. String, e não uma lista fechada, porque a loja cria
   * as suas — e um lançamento antigo pode apontar para uma já apagada.
   */
  category: string
  /** Chave da subcategoria. Ausente em lançamento antigo — e tudo bem. */
  subcategory?: string
  /**
   * Quanto foi comprado e em que unidade — "20" e "kg".
   *
   * Opcional de propósito: aluguel e internet não têm quantidade, e obrigar a
   * preencher só atrapalharia. Quando existe, dá para calcular o preço por
   * unidade e enxergar o insumo encarecendo.
   */
  quantidade?: number
  unidade?: string
  description: string
  amount: number
  /** Data de competência (YYYY-MM-DD). */
  date: string
  /** Onde entrou/saiu: espécie, conta bancária ou cartão (padrão: dinheiro) */
  account?: "dinheiro" | "banco" | "credito"
  /** Qual cartão, quando a conta é crédito. */
  card?: string
  /**
   * Quando a fatura que cobria esta despesa foi paga (AAAA-MM-DD).
   * Enquanto vazio, a despesa está na fatura em aberto.
   */
  faturaPagaEm?: string
  /**
   * Movimento de dinheiro que NÃO é despesa nova — pagar a fatura do cartão é
   * o caso. Mexe no saldo, mas fica fora da DRE e dos gastos por categoria:
   * a despesa já foi contada quando a compra foi lançada. Sem esta marca, o
   * mês fecharia com o gasto do cartão em dobro.
   */
  transferencia?: boolean
  createdAt: string
}

const TX_KEY = "mais_sub_transactions"
const SUBCAT_KEY = "mais_sub_tx_subcategories"
const TXCAT_KEY = "mais_sub_tx_categories"
const CARD_KEY = "mais_sub_credit_cards"

// ---------- Cartões de crédito ----------

export interface CreditCard {
  key: string
  label: string
  /** Dia do vencimento da fatura, quando a loja quiser registrar. */
  diaVencimento?: number
}

export function loadCards(): CreditCard[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CARD_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CreditCard[]) : []
  } catch {
    return []
  }
}

export function saveCards(list: CreditCard[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(CARD_KEY, JSON.stringify(list)) } catch { /* ignore */ }
}

export function addCard(label: string): CreditCard {
  const lista = loadCards()
  const base = chaveDe(label)
  const jaTem = lista.find((c) => chaveDe(c.label) === base)
  if (jaTem) return jaTem
  let key = `card_${base}`
  let n = 2
  while (lista.some((c) => c.key === key)) key = `card_${base}_${n++}`
  const novo: CreditCard = { key, label: label.trim() }
  saveCards([...lista, novo])
  return novo
}

export function deleteCard(key: string): void {
  saveCards(loadCards().filter((c) => c.key !== key))
}

export function replaceCards(list: CreditCard[]): void {
  if (Array.isArray(list)) saveCards(list)
}

export function cardLabel(key: string | undefined, lista?: CreditCard[]): string {
  if (!key) return "Cartão"
  return (lista ?? loadCards()).find((c) => c.key === key)?.label ?? key
}

/**
 * Fatura em aberto de cada cartão: despesas no crédito ainda não cobertas por
 * um pagamento de fatura.
 */
export function faturasEmAberto(txs?: Transaction[]): Record<string, number> {
  const lista = txs ?? loadTransactions()
  const out: Record<string, number> = {}
  for (const t of lista) {
    if (t.kind !== "despesa" || t.account !== "credito" || t.transferencia) continue
    if (t.faturaPagaEm) continue
    const k = t.card ?? "__sem_cartao__"
    out[k] = (out[k] ?? 0) + t.amount
  }
  return out
}

// ---------- Categorias criadas pela loja ----------

export function loadTxCategories(): TxCategory[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(TXCAT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as TxCategory[]) : []
  } catch {
    return []
  }
}

export function saveTxCategories(list: TxCategory[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(TXCAT_KEY, JSON.stringify(list)) } catch { /* ignore */ }
}

/** Cria uma categoria. Nome repetido devolve a existente, sem duplicar. */
export function addTxCategory(label: string): TxCategory {
  const lista = loadTxCategories()
  const base = chaveDe(label)
  const jaTem = lista.find((c) => chaveDe(c.label) === base)
  if (jaTem) return jaTem
  // Prefixo para nunca colidir com as de fábrica (insumos, pessoal, ...).
  let key = `cat_${base}`
  let n = 2
  while (lista.some((c) => c.key === key)) key = `cat_${base}_${n++}`

  const nova: TxCategory = { key, label: label.trim() }
  saveTxCategories([...lista, nova])
  return nova
}

export function deleteTxCategory(key: string): void {
  saveTxCategories(loadTxCategories().filter((c) => c.key !== key))
  // As subcategorias que dependiam dela perdem o pai e ficariam invisíveis
  // para sempre — melhor levá-las junto.
  saveSubcategories(loadSubcategories().filter((s) => s.category !== key))
}

export function replaceTxCategories(list: TxCategory[]): void {
  if (Array.isArray(list)) saveTxCategories(list)
}

/**
 * Todas as categorias de despesa, de fábrica e criadas, na ordem de exibição.
 *
 * Recebe as listas por parâmetro para poder rodar no servidor e em teste, onde
 * não existe localStorage.
 */
export function expenseCategoryOptions(custom?: TxCategory[]): { key: string; label: string }[] {
  const criadas = custom ?? loadTxCategories()
  return [
    ...Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => ({ key, label })),
    ...criadas.map((c) => ({ key: c.key, label: c.label })),
  ]
}

/** Etiqueta da categoria. Chave órfã devolve a própria chave, não vazio. */
export function expenseCategoryLabel(key: string, custom?: TxCategory[]): string {
  const daFabrica = EXPENSE_CATEGORY_LABELS[key as ExpenseCategory]
  if (daFabrica) return daFabrica
  return (custom ?? loadTxCategories()).find((c) => c.key === key)?.label ?? key
}

// ---------- Subcategorias ----------

/**
 * Lista de subcategorias em uso.
 *
 * Na primeira vez devolve as padrão. Depois que a loja salva alguma coisa,
 * vale o que ela salvou — inclusive se ela apagou várias das padrão.
 */
export function loadSubcategories(): Subcategory[] {
  if (typeof window === "undefined") return DEFAULT_SUBCATEGORIES
  try {
    const raw = localStorage.getItem(SUBCAT_KEY)
    if (!raw) return DEFAULT_SUBCATEGORIES
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Subcategory[]) : DEFAULT_SUBCATEGORIES
  } catch {
    return DEFAULT_SUBCATEGORIES
  }
}

export function saveSubcategories(list: Subcategory[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(SUBCAT_KEY, JSON.stringify(list)) } catch { /* ignore */ }
}

/** Chave a partir da etiqueta, sem acento e sem espaço. */
function chaveDe(label: string): string {
  return label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
}

/**
 * Cria uma subcategoria. Se já existir uma com o mesmo nome na mesma
 * categoria, devolve a existente em vez de duplicar.
 */
export function addSubcategory(label: string, category: string): Subcategory {
  const lista = loadSubcategories()
  const base = chaveDe(label)
  const jaTem = lista.find((s) => s.category === category && chaveDe(s.label) === base)
  if (jaTem) return jaTem

  // Duas categorias podem ter subcategoria de mesmo nome (ex.: "Extra"), então
  // a chave carrega a categoria para não colidirem.
  let key = `${category}_${base}`
  let n = 2
  while (lista.some((s) => s.key === key)) key = `${category}_${base}_${n++}`

  const nova: Subcategory = { key, label: label.trim(), category }
  saveSubcategories([...lista, nova])
  return nova
}

export function deleteSubcategory(key: string): void {
  saveSubcategories(loadSubcategories().filter((s) => s.key !== key))
}

/** Substitui a lista local (usado na hidratação a partir do Supabase). */
export function replaceSubcategories(list: Subcategory[]): void {
  if (Array.isArray(list) && list.length > 0) saveSubcategories(list)
}

/** Etiqueta da subcategoria. Chave órfã devolve a própria chave, não vazio. */
export function subcategoryLabel(key: string | undefined, lista?: Subcategory[]): string {
  if (!key) return ""
  const achada = (lista ?? loadSubcategories()).find((s) => s.key === key)
  return achada?.label ?? key
}

export function loadTransactions(): Transaction[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(TX_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Transaction[]) : []
  } catch {
    return []
  }
}

export function saveTransactions(list: Transaction[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(TX_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

export function addTransaction(data: Omit<Transaction, "id" | "createdAt">): Transaction {
  const tx: Transaction = {
    ...data,
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  }
  const list = loadTransactions()
  list.unshift(tx)
  saveTransactions(list)
  return tx
}

export function deleteTransaction(id: string): void {
  saveTransactions(loadTransactions().filter((t) => t.id !== id))
}

/**
 * Altera um lançamento já feito, preservando id e data de criação.
 *
 * Sem isto, corrigir um valor digitado errado obrigava a apagar e lançar de
 * novo — e quem apaga no meio do mês costuma esquecer de relançar.
 */
export function updateTransaction(
  id: string,
  dados: Omit<Transaction, "id" | "createdAt">,
): Transaction | null {
  const list = loadTransactions()
  const i = list.findIndex((t) => t.id === id)
  if (i < 0) return null
  const atualizado: Transaction = { ...dados, id, createdAt: list[i].createdAt }
  list[i] = atualizado
  saveTransactions(list)
  return atualizado
}

/** Substitui a lista local (usado na hidratação a partir do Supabase). */
export function replaceTransactions(list: Transaction[]): void {
  saveTransactions(Array.isArray(list) ? list : [])
}

/**
 * Preço por unidade do lançamento. null quando não dá para calcular.
 *
 * Fica aqui, e não na tela, porque a mesma conta é usada na lista, no
 * detalhamento por subcategoria e na comparação entre meses.
 */
export function precoUnitario(t: Transaction): number | null {
  if (!t.quantidade || t.quantidade <= 0 || !t.unidade) return null
  return t.amount / t.quantidade
}

/**
 * Preço médio por unidade de um conjunto de lançamentos.
 *
 * Média PONDERADA: soma os valores e divide pela soma das quantidades. A média
 * simples dos preços daria peso igual a uma compra de 1kg e a uma de 50kg, e o
 * número não representaria o que a loja pagou.
 *
 * Só agrupa lançamentos da MESMA unidade — misturar kg com unidade produziria
 * um número sem significado.
 */
/**
 * Unidades pequenas demais para servirem de referência de preço.
 *
 * Manteiga de R$ 16,98 com 500 g dá R$ 0,03396 por grama — um número que, em
 * reais, arredonda para R$ 0,03 e não serve para comparar fornecedor nenhum.
 * Convertido, vira R$ 33,96/kg, que é como o preço é falado e cobrado.
 */
const ESCALA_PRECO: Record<string, { para: string; fator: number }> = {
  g: { para: "kg", fator: 1000 },
  ml: { para: "L", fator: 1000 },
}

/**
 * Preço unitário já na unidade em que ele se lê.
 *
 * `exato` diz se o valor cabe inteiro nas casas decimais mostradas — a tela
 * usa isso para marcar com "≈" o que foi arredondado, em vez de apresentar
 * uma conta redonda que não fecha.
 */
export function precoUnitarioExibicao(
  t: Transaction,
): { preco: number; unidade: string; casas: number; exato: boolean } | null {
  const base = precoUnitario(t)
  if (base === null || !t.unidade) return null
  return escalarPreco(base, t.unidade)
}

export function escalarPreco(
  preco: number,
  unidade: string,
): { preco: number; unidade: string; casas: number; exato: boolean } {
  const escala = ESCALA_PRECO[unidade]
  const valor = escala ? preco * escala.fator : preco
  const nome = escala ? escala.para : unidade

  /**
   * Casas decimais: as mínimas que representam o valor sem arredondar.
   *
   * Duas casas bastam para quase tudo, mas item barato vendido em grande
   * quantidade (guardanapo a R$ 0,0075) viraria "R$ 0,01" — ou pior, "R$ 0,00".
   * O teto de 4 existe para a tela não virar uma fileira de dígitos; acima
   * disso a tela avisa que o número está arredondado.
   */
  let casas = 2
  while (casas < 4 && Math.abs(valor - Number(valor.toFixed(casas))) > 1e-9) casas++
  const exato = Math.abs(valor - Number(valor.toFixed(casas))) <= 1e-9

  return { preco: valor, unidade: nome, casas, exato }
}

/** Formata o preço unitário com as casas que ele precisa, nem mais nem menos. */
export function formatPrecoUnitario(preco: number, casas: number): string {
  return preco.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })
}

export function precoMedio(txs: Transaction[]): { preco: number; unidade: string; quantidade: number } | null {
  const comQuantidade = txs.filter((t) => t.quantidade && t.quantidade > 0 && t.unidade)
  if (comQuantidade.length === 0) return null

  const unidades = new Set(comQuantidade.map((t) => t.unidade as string))
  if (unidades.size !== 1) return null

  const quantidade = comQuantidade.reduce((a, t) => a + (t.quantidade as number), 0)
  const valor = comQuantidade.reduce((a, t) => a + t.amount, 0)
  if (quantidade <= 0) return null
  return { preco: valor / quantidade, unidade: [...unidades][0], quantidade }
}

// ---------- Sincronização com Supabase ----------
export async function fetchTransactionsRemote(): Promise<Transaction[] | null> {
  try {
    const res = await fetch("/api/finance", { cache: "no-store" })
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data.transactions) ? (data.transactions as Transaction[]) : []
  } catch {
    return null
  }
}

/** Envia contas + lançamentos + categorias ao Supabase (chamado após cada mutação). */
export async function pushFinanceRemote(bills: unknown[], transactions: unknown[], customCategories: unknown[] = [], cashBase = 0, bankBase = 0, subcategories: unknown[] = [], txCategories: unknown[] = [], cards: unknown[] = []): Promise<boolean> {
  try {
    const res = await fetch("/api/finance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bills, transactions, customCategories, cashBase, bankBase, subcategories, txCategories, cards }),
    })
    const data = await res.json().catch(() => ({}))
    return !!(res.ok && data.ok)
  } catch {
    return false
  }
}

// ---------- Datas no fuso local ----------
// "YYYY-MM-DD" interpretado pelo JS como meia-noite UTC vira o dia ANTERIOR
// no Brasil (UTC-3). Estes helpers evitam esse desvio.

/** Data de hoje como "YYYY-MM-DD" no fuso local (não UTC). */
export function todayLocalISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Interpreta "YYYY-MM-DD" no fuso local (meio-dia, imune à virada de dia). */
export function parseLocalDay(s: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T12:00:00`) : new Date(s)
}

// ---------- DRE ----------
function inMonth(iso: string, month: number, year: number): boolean {
  const d = parseLocalDay(iso)
  return d.getMonth() === month && d.getFullYear() === year
}

export interface DRE {
  faturamento: number // receita bruta (pedidos não cancelados)
  receitasExtras: number // receitas manuais
  receitaTotal: number
  cmv: number // custo de mercadoria (compras de insumos no período)
  despesasPorCategoria: Record<string, number>
  despesasTotais: number // despesas manuais (todas as categorias)
  lucroBruto: number // receita - cmv
  resultadoLiquido: number // receita - cmv - despesas (exceto insumos já no cmv)
  margemLiquida: number // %
}

/**
 * Calcula a DRE de um mês/ano.
 * - Faturamento: soma dos pedidos (status != cancelado) no período.
 * - CMV: compras de insumos registradas no módulo Compras no período.
 * - Despesas: lançamentos manuais de despesa.
 * - Receitas extras: lançamentos manuais de receita.
 */
export function calcDRE(month: number, year: number): DRE {
  const orders = loadOrders().filter((o) => o.status !== "cancelado" && inMonth(o.createdAt, month, year))
  const faturamento = orders.reduce((acc, o) => acc + o.total, 0)

  const purchases = loadPurchases().filter((p) => inMonth(p.createdAt, month, year))
  const cmv = purchases.reduce((acc, p) => acc + p.total, 0)

  const txs = loadTransactions().filter((t) => {
    const d = parseLocalDay(t.date)
    return d.getMonth() === month && d.getFullYear() === year
  })

  // Transferência não é receita nem despesa: é dinheiro mudando de lugar.
  // Pagar a fatura do cartão entra aqui — a despesa já foi contada na compra.
  const movimentos = txs.filter((t) => !t.transferencia)

  const receitasExtras = movimentos.filter((t) => t.kind === "receita").reduce((acc, t) => acc + t.amount, 0)

  const despesasPorCategoria: Record<string, number> = {}
  let despesasTotais = 0
  for (const t of movimentos) {
    if (t.kind !== "despesa") continue
    despesasPorCategoria[t.category] = (despesasPorCategoria[t.category] ?? 0) + t.amount
    despesasTotais += t.amount
  }

  const receitaTotal = faturamento + receitasExtras
  const lucroBruto = receitaTotal - cmv
  const resultadoLiquido = lucroBruto - despesasTotais
  const margemLiquida = receitaTotal > 0 ? (resultadoLiquido / receitaTotal) * 100 : 0

  return {
    faturamento, receitasExtras, receitaTotal, cmv,
    despesasPorCategoria, despesasTotais,
    lucroBruto, resultadoLiquido, margemLiquida,
  }
}
