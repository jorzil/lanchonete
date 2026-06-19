// ==================== ADMIN AUTH (localStorage) ====================
// Autenticação simples baseada em localStorage. Sem NextAuth.

const TOKEN_KEY = "admin_token"
const USER_KEY = "admin_user"

const DEFAULT_CREDENTIALS = {
  email: "admin@maissub.com.br",
  password: "admin123",
  name: "Administrador",
}

export interface AdminUser {
  email: string
  name: string
}

export interface LoginResult {
  ok: boolean
  error?: string
}

/** Realiza login. Em sucesso grava token + usuário no localStorage. */
export function login(email: string, password: string): LoginResult {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail || !password) {
    return { ok: false, error: "Preencha email e senha." }
  }

  if (
    normalizedEmail !== DEFAULT_CREDENTIALS.email ||
    password !== DEFAULT_CREDENTIALS.password
  ) {
    return { ok: false, error: "Email ou senha incorretos." }
  }

  try {
    const token = btoa(`${normalizedEmail}:${Date.now()}`)
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({ email: normalizedEmail, name: DEFAULT_CREDENTIALS.name }),
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
    return JSON.parse(raw) as AdminUser
  } catch {
    return null
  }
}
