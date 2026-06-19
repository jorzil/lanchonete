"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
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
import { isAuthenticated, logout, getCurrentUser, type AdminUser } from "@/lib/admin-auth"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
]

const BREADCRUMBS: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/pedidos": "Pedidos",
  "/admin/produtos": "Produtos",
  "/admin/clientes": "Clientes",
  "/admin/relatorios": "Relatórios",
  "/admin/configuracoes": "Configurações",
}

function SidebarContent({
  pathname,
  onNavigate,
  onLogout,
}: {
  pathname: string
  onNavigate?: () => void
  onLogout: () => void
}) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B2C5C]">
          <Sandwich className="h-5 w-5 text-[#FF6B1A]" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-gray-900">
            Mais <span className="text-[#EE5C13]">Sub</span>
          </p>
          <p className="text-xs text-gray-400">Admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[#EE5C13]/10 text-[#EE5C13]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
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
    setUser(getCurrentUser())
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
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] text-sm text-gray-400">
        Carregando...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Sidebar fixa (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-gray-200 lg:block">
        <SidebarContent pathname={pathname} onLogout={handleLogout} />
      </aside>

      {/* Sidebar mobile */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarContent
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
            onLogout={handleLogout}
          />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Admin</span>
              <span className="text-gray-300">/</span>
              <span className="font-medium text-gray-900">
                {BREADCRUMBS[pathname] ?? "Página"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name ?? "Administrador"}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EE5C13] text-sm font-semibold text-white">
              {(user?.name ?? "A").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
