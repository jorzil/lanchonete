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

// Permissões por papel: quais módulos cada papel pode acessar.
export const ROLE_PERMISSIONS: Record<Role, ModuleKey[]> = {
  admin: [
    "dashboard", "pedidos", "pdv", "produtos", "estoque",
    "compras", "financeiro", "clientes", "cupons", "relatorios", "configuracoes",
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

// Contas padrão (seed). Em produção viriam de um backend.
const DEFAULT_ACCOUNTS: StoredAccount[] = [
  { email: "admin@maissub.com.br", password: "admin123", name: "Administrador", role: "admin" },
  { email: "gerente@maissub.com.br", password: "gerente123", name: "Gerente", role: "gerente" },
  { email: "atendente@maissub.com.br", password: "atendente123", name: "Atendente", role: "atendente" },
  { email: "estoque@maissub.com.br", password: "estoque123", name: "Estoque", role: "estoque" },
  { email: "cozinha@maissub.com.br", password: "cozinha123", name: "Cozinha", role: "cozinha" },
]

export interface LoginResult {
  ok: boolean
  error?: string
}

function findAccount(email: string): StoredAccount | undefined {
  return DEFAULT_ACCOUNTS.find((a) => a.email === email)
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
