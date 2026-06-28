"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login, isAuthenticated } from "@/lib/admin-auth"
import { pullAdminUsers } from "@/lib/admin-users-sync"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) router.replace("/admin")
    // Puxa as contas criadas pelo admin para permitir login em qualquer aparelho
    pullAdminUsers()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    // Garante que as contas do banco estão carregadas antes de validar
    await pullAdminUsers()
    const result = login(email, password)
    if (result.ok) {
      router.replace("/admin")
    } else {
      setError(result.error ?? "Erro ao entrar.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo height={64} />
          <p className="mt-3 text-[13px] text-gray-400">Painel administrativo · ERP</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] text-gray-600">Usuário</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="text"
                  placeholder="Usuário"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] text-gray-600">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="mt-1 w-full bg-[#EE5C13] font-semibold text-white hover:bg-[#FF6B1A] disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

        </div>

        <p className="mt-6 text-center text-[11px] text-gray-300">
          © {new Date().getFullYear()} Mais Sub · Governador Valadares
        </p>
      </div>
    </div>
  )
}
