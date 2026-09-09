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
  description: string
  amount: number
  /** Data de competência (YYYY-MM-DD). */
  date: string
  /** Onde entrou/saiu: espécie ou conta bancária (padrão: dinheiro) */
  account?: "dinheiro" | "banco"
  createdAt: string
}

const TX_KEY = "mais_sub_transactions"
const SUBCAT_KEY = "mais_sub_tx_subcategories"
const TXCAT_KEY = "mais_sub_tx_categories"

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

/** Substitui a lista local (usado na hidratação a partir do Supabase). */
export function replaceTransactions(list: Transaction[]): void {
  saveTransactions(Array.isArray(list) ? list : [])
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
export async function pushFinanceRemote(bills: unknown[], transactions: unknown[], customCategories: unknown[] = [], cashBase = 0, bankBase = 0, subcategories: unknown[] = [], txCategories: unknown[] = []): Promise<boolean> {
  try {
    const res = await fetch("/api/finance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bills, transactions, customCategories, cashBase, bankBase, subcategories, txCategories }),
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

  const receitasExtras = txs.filter((t) => t.kind === "receita").reduce((acc, t) => acc + t.amount, 0)

  const despesasPorCategoria: Record<string, number> = {}
  let despesasTotais = 0
  for (const t of txs) {
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
