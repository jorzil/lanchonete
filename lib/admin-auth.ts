// ==================== ADMIN AUTH + RBAC (localStorage) ====================
// Autenticação multi-nível baseada em localStorage. Sem NextAuth.

const TOKEN_KEY = "admin_token"
const USER_KEY = "admin_user"

// ---------- Papéis (roles) ----------
export type Role = "admin" | "gerente" | "atendente" | "estoque" | "cozinha"

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  atendente: "Atendente",
  estoque: "Estoque",
  cozinha: "Cozinha",
}

// ---------- Módulos do sistema ----------
export type ModuleKey =
  | "dashboard"
  | "pedidos"
  | "pdv"
  | "produtos"
  | "estoque"
  | "compras"
  | "financeiro"
  | "clientes"
  | "cupons"
  | "relatorios"
  | "configuracoes"
  | "usuarios"
  | "setup"

// Permissões por papel: quais módulos cada papel pode acessar.
export const ROLE_PERMISSIONS: Record<Role, ModuleKey[]> = {
  admin: [
    "dashboard", "pedidos", "pdv", "produtos", "estoque",
    "compras", "financeiro", "clientes", "cupons", "relatorios", "configuracoes", "usuarios", "setup",
  ],
  gerente: [
    "dashboard", "pedidos", "pdv", "produtos", "estoque",
    "compras", "financeiro", "clientes", "cupons", "relatorios",
  ],
  atendente: ["dashboard", "pedidos", "pdv", "clientes"],
  estoque: ["dashboard", "estoque", "compras", "produtos"],
  cozinha: ["dashboard", "pedidos"],
}

export interface AdminUser {
  email: string
  name: string
  role: Role
}

interface StoredAccount extends AdminUser {
  password: string
}

const DEFAULT_ACCOUNTS: StoredAccount[] = [
  { email: "jorzil", password: "@Maissub2026", name: "Administrador", role: "admin" },
]

const ACCOUNTS_KEY = "admin_accounts"

// ---------- Contas criadas pelo admin (localStorage) ----------
export function loadStoredAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as StoredAccount[]) : []
  } catch {
    return []
  }
}

export function saveStoredAccounts(list: StoredAccount[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list)) } catch {}
}

/** Todas as contas: as fixas (seed) + as criadas pelo admin (estas têm prioridade). */
function getAllAccounts(): StoredAccount[] {
  const stored = loadStoredAccounts()
  const byEmail = new Map<string, StoredAccount>()
  for (const a of DEFAULT_ACCOUNTS) byEmail.set(a.email.toLowerCase(), a)
  for (const a of stored) byEmail.set(a.email.toLowerCase(), a)
  return [...byEmail.values()]
}

/** Lista de usuários para a tela de gestão (sem expor senha de quem não é editável). */
export interface ManagedUser extends AdminUser { isDefault: boolean }
export function listManagedUsers(): ManagedUser[] {
  const stored = loadStoredAccounts()
  const storedEmails = new Set(stored.map((a) => a.email.toLowerCase()))
  const defaults = DEFAULT_ACCOUNTS
    .filter((d) => !storedEmails.has(d.email.toLowerCase()))
    .map((d) => ({ email: d.email, name: d.name, role: d.role, isDefault: true }))
  const custom = stored.map((a) => ({ email: a.email, name: a.name, role: a.role, isDefault: false }))
  return [...defaults, ...custom]
}

export interface AccountInput { email: string; name: string; role: Role; password: string }

export function upsertAccount(input: AccountInput): { ok: boolean; error?: string } {
  const email = input.email.trim().toLowerCase()
  if (!email || !input.name.trim() || !input.password) {
    return { ok: false, error: "Preencha nome, usuário e senha." }
  }
  const list = loadStoredAccounts()
  const idx = list.findIndex((a) => a.email.toLowerCase() === email)
  const account: StoredAccount = { email, name: input.name.trim(), role: input.role, password: input.password }
  if (idx >= 0) list[idx] = account
  else list.push(account)
  saveStoredAccounts(list)
  return { ok: true }
}

export function deleteAccount(email: string): void {
  saveStoredAccounts(loadStoredAccounts().filter((a) => a.email.toLowerCase() !== email.toLowerCase()))
}

export function getAccountPassword(email: string): string {
  const found = loadStoredAccounts().find((a) => a.email.toLowerCase() === email.toLowerCase())
  return found?.password ?? ""
}

export interface LoginResult {
  ok: boolean
  error?: string
}

function findAccount(email: string): StoredAccount | undefined {
  return getAllAccounts().find((a) => a.email.toLowerCase() === email)
}

/** Realiza login. Em sucesso grava token + usuário no localStorage. */
export function login(email: string, password: string): LoginResult {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail || !password) {
    return { ok: false, error: "Preencha email e senha." }
  }

  const account = findAccount(normalizedEmail)
  if (!account || account.password !== password) {
    return { ok: false, error: "Email ou senha incorretos." }
  }

  try {
    const token = btoa(`${normalizedEmail}:${Date.now()}`)
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({ email: account.email, name: account.name, role: account.role } satisfies AdminUser),
    )
  } catch {
    return { ok: false, error: "Não foi possível salvar a sessão." }
  }

  return { ok: true }
}

/** Remove a sessão do localStorage. */
export function logout(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    // ignore
  }
}

/** Verifica se há um token válido no localStorage. */
export function isAuthenticated(): boolean {
  try {
    return Boolean(localStorage.getItem(TOKEN_KEY))
  } catch {
    return false
  }
}

/** Retorna o usuário atual logado, ou null. */
export function getCurrentUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AdminUser>
    // Compatibilidade com sessões antigas sem role.
    return {
      email: parsed.email ?? "",
      name: parsed.name ?? "Administrador",
      role: (parsed.role as Role) ?? "admin",
    }
  } catch {
    return null
  }
}

/** Verifica se um papel tem acesso a um módulo. */
export function canAccess(role: Role | undefined, module: ModuleKey): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(module) ?? false
}

/** Lista (somente leitura) das contas seed — usada na tela de login para dicas. */
export function listDemoAccounts(): Array<Pick<AdminUser, "email" | "role">> {
  return DEFAULT_ACCOUNTS.map((a) => ({ email: a.email, role: a.role }))
}
