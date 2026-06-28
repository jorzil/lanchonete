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
  Tag,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Activity,
  Sandwich,
  Calculator,
  Users as UsersIcon,
  Plug,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { StoreStatusWidget } from "@/components/admin/StoreStatusWidget"
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
  { href: "/admin/disponibilidade", label: "Disponibilidade", icon: Sandwich, module: "produtos" },
  { href: "/admin/fichas-tecnicas", label: "Fichas Técnicas", icon: ClipboardList, module: "produtos" },
  { href: "/admin/precificacao", label: "Precificação", icon: Calculator, module: "produtos" },
  { href: "/admin/estoque", label: "Estoque", icon: Boxes, module: "estoque" },
  { href: "/admin/compras", label: "Compras", icon: Truck, module: "compras" },
  { href: "/admin/financeiro", label: "Financeiro", icon: Wallet, module: "financeiro" },
  { href: "/admin/clientes", label: "Clientes", icon: Users, module: "clientes" },
  { href: "/admin/cupons", label: "Cupons", icon: Tag, module: "cupons" },
  { href: "/admin/entrega", label: "Entrega", icon: Truck, module: "configuracoes" },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3, module: "relatorios" },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings, module: "configuracoes" },
  { href: "/admin/integracoes/ifood", label: "Integração iFood", icon: Plug, module: "configuracoes" },
  { href: "/admin/usuarios", label: "Usuários", icon: UsersIcon, module: "usuarios" },
  { href: "/admin/setup", label: "Diagnóstico", icon: Activity, module: "setup" },
]

const BREADCRUMBS: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/pedidos": "Pedidos",
  "/admin/pdv": "PDV",
  "/admin/produtos": "Produtos",
  "/admin/disponibilidade": "Disponibilidade",
  "/admin/fichas-tecnicas": "Fichas Técnicas",
  "/admin/precificacao": "Precificação",
  "/admin/estoque": "Estoque",
  "/admin/compras": "Compras",
  "/admin/financeiro": "Financeiro",
  "/admin/clientes": "Clientes",
  "/admin/cupons": "Cupons",
  "/admin/entrega": "Entrega",
  "/admin/relatorios": "Relatórios",
  "/admin/configuracoes": "Configurações",
  "/admin/usuarios": "Usuários",
  "/admin/integracoes/ifood": "Integração iFood",
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
    <div className="flex h-full flex-col bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EE5C13]">
          <Sandwich className="h-[18px] w-[18px] text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-gray-900">
            Mais<span className="text-[#EE5C13]">Sub</span>
          </p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">ERP</p>
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
                  ? "bg-orange-50 text-[#EE5C13]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
              {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#EE5C13]" />}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="border-t border-gray-100 p-3">
        {user && (
          <div className="mb-2 flex items-center gap-2.5 px-2 py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EE5C13] text-xs font-bold text-white shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-gray-700">{user.name}</p>
              <p className="truncate text-[10px] text-gray-400">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
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
      <div className="admin-theme flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400">
        Carregando...
      </div>
    )
  }

  return (
    <div className="admin-theme min-h-screen bg-gray-50">
      {/* Sidebar fixa (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-gray-200 lg:block">
        <SidebarContent pathname={pathname} user={user} onLogout={handleLogout} />
      </aside>

      {/* Sidebar mobile */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0 border-r border-gray-200">
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
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-gray-500 hover:text-gray-800"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-gray-400">ERP</span>
              <span className="text-gray-300">/</span>
              <span className="font-medium text-gray-800">
                {BREADCRUMBS[pathname] ?? "Página"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StoreStatusWidget />
            <div className="hidden text-right sm:block">
              <p className="text-[13px] font-medium text-gray-800">{user?.name ?? "Administrador"}</p>
              <p className="text-[11px] text-gray-400">{user ? ROLE_LABELS[user.role] : ""}</p>
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
