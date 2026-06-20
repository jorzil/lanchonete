"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Package,
  ClipboardList,
  Boxes,
  Truck,
  Wallet,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Sandwich,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import {
  isAuthenticated,
  logout,
  getCurrentUser,
  canAccess,
  ROLE_LABELS,
  type AdminUser,
  type ModuleKey,
} from "@/lib/admin-auth"

const NAV_ITEMS: { href: string; label: string; icon: typeof LayoutDashboard; module: ModuleKey }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag, module: "pedidos" },
  { href: "/admin/pdv", label: "PDV", icon: ShoppingCart, module: "pdv" },
  { href: "/admin/produtos", label: "Produtos", icon: Package, module: "produtos" },
  { href: "/admin/fichas-tecnicas", label: "Fichas Técnicas", icon: ClipboardList, module: "produtos" },
  { href: "/admin/estoque", label: "Estoque", icon: Boxes, module: "estoque" },
  { href: "/admin/compras", label: "Compras", icon: Truck, module: "compras" },
  { href: "/admin/financeiro", label: "Financeiro", icon: Wallet, module: "financeiro" },
  { href: "/admin/clientes", label: "Clientes", icon: Users, module: "clientes" },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3, module: "relatorios" },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings, module: "configuracoes" },
]

const BREADCRUMBS: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/pedidos": "Pedidos",
  "/admin/pdv": "PDV",
  "/admin/produtos": "Produtos",
  "/admin/fichas-tecnicas": "Fichas Técnicas",
  "/admin/estoque": "Estoque",
  "/admin/compras": "Compras",
  "/admin/financeiro": "Financeiro",
  "/admin/clientes": "Clientes",
  "/admin/relatorios": "Relatórios",
  "/admin/configuracoes": "Configurações",
}

function SidebarContent({
  pathname,
  user,
  onNavigate,
  onLogout,
}: {
  pathname: string
  user: AdminUser | null
  onNavigate?: () => void
  onLogout: () => void
}) {
  const items = NAV_ITEMS.filter((item) => canAccess(user?.role, item.module))
  return (
    <div className="flex h-full flex-col bg-[#0F0F0F]">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EE5C13]">
          <Sandwich className="h-4.5 w-4.5 h-[18px] w-[18px] text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">
            Mais<span className="text-[#EE5C13]">Sub</span>
          </p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/30">ERP</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all",
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-white/40 hover:bg-white/[0.04] hover:text-white/70",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[#EE5C13]" : "")} />
              {item.label}
              {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#EE5C13]" />}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="border-t border-white/[0.06] p-3">
        {user && (
          <div className="mb-2 flex items-center gap-2.5 px-2 py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EE5C13] text-xs font-bold text-white shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-white/80">{user.name}</p>
              <p className="truncate text-[10px] text-white/30">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/60"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [user, setUser] = useState<AdminUser | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isLoginPage = pathname === "/admin/login"

  useEffect(() => {
    if (isLoginPage) {
      setChecked(true)
      return
    }
    if (!isAuthenticated()) {
      router.replace("/admin/login")
      return
    }
    const current = getCurrentUser()
    setUser(current)

    // Bloqueio por papel: se a rota atual não é permitida, manda pro dashboard.
    const matched = NAV_ITEMS.find((i) => i.href === pathname)
    if (matched && current && !canAccess(current.role, matched.module)) {
      router.replace("/admin")
      return
    }
    setChecked(true)
  }, [pathname, isLoginPage, router])

  function handleLogout() {
    logout()
    router.replace("/admin/login")
  }

  // Login page renders standalone (sem layout admin)
  if (isLoginPage) return <>{children}</>

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111111] text-sm text-white/30">
        Carregando...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Sidebar fixa (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-white/[0.06] lg:block">
        <SidebarContent pathname={pathname} user={user} onLogout={handleLogout} />
      </aside>

      {/* Sidebar mobile */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0 border-r border-white/[0.06]">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarContent
            pathname={pathname}
            user={user}
            onNavigate={() => setMobileOpen(false)}
            onLogout={handleLogout}
          />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-60">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#141414]/90 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white/50 hover:text-white hover:bg-white/[0.06]"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-white/25">ERP</span>
              <span className="text-white/15">/</span>
              <span className="font-medium text-white/70">
                {BREADCRUMBS[pathname] ?? "Página"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[13px] font-medium text-white/70">{user?.name ?? "Administrador"}</p>
              <p className="text-[11px] text-white/30">{user ? ROLE_LABELS[user.role] : ""}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EE5C13] text-[12px] font-bold text-white">
              {(user?.name ?? "A").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
