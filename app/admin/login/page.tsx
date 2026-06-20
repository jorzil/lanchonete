"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, Mail, Sandwich } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login, isAuthenticated } from "@/lib/admin-auth"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) router.replace("/admin")
  }, [router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const result = login(email, password)
    if (result.ok) {
      router.replace("/admin")
    } else {
      setError(result.error ?? "Erro ao entrar.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F0F0F] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EE5C13]">
            <Sandwich className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">
            Mais<span className="text-[#EE5C13]">Sub</span> <span className="text-white/30 font-normal">ERP</span>
          </h1>
          <p className="mt-1 text-[13px] text-white/30">Painel administrativo</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#1A1A1A] p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] text-white/50">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@maissub.com.br"
                  className="border-white/[0.08] bg-white/[0.04] pl-10 text-white placeholder:text-white/20 focus-visible:border-white/20 focus-visible:ring-0"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] text-white/50">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="border-white/[0.08] bg-white/[0.04] pl-10 pr-10 text-white placeholder:text-white/20 focus-visible:border-white/20 focus-visible:ring-0"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
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

          <div className="mt-5 space-y-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-xs text-white/25">
            <p className="mb-1 font-semibold text-white/40">Contas demo:</p>
            <p>admin@maissub.com.br · <span className="text-white/40">admin123</span></p>
            <p>gerente@maissub.com.br · <span className="text-white/40">gerente123</span></p>
            <p>atendente · estoque · cozinha + 123</p>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-white/15">
          © {new Date().getFullYear()} Mais Sub · Governador Valadares
        </p>
      </div>
    </div>
  )
}
