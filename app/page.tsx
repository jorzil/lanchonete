"use client"

import React, { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import {
  Sandwich,
  ShoppingCart,
  Package,
  BarChart3,
  Wallet,
  LogOut,
  Save,
  Boxes,
  ArrowDownCircle,
  Users,
  Menu,
  Cloud,
  CloudOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import {
  DEFAULT_PRODUCTS,
  formatCurrency,
  generateOrderNumber,
  usePersistedState,
  type Product,
  type CartItem,
  type Sale,
  type StockEntry,
  type Expense,
  type Customer,
  type OrderType,
  DEFAULT_CATEGORIES,
  type PaymentMethod,
  type AppView,
  type UserRole,
} from "@/lib/store"
import { ProductGrid } from "@/components/product-grid"
import { CartPanel } from "@/components/cart-panel"
import { SandwichBuilder } from "@/components/sandwich-builder"
import { CheckoutModal } from "@/components/checkout-modal"
import { ProductsView, StockView, ReportsView, CashierView, ExpensesView, CustomersView } from "@/components/admin-views"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

type TableOrder = { tableNumber: string; cart: CartItem[]; customerName: string; customerPhone: string }

// ==================== TABLES VIEW ====================
function TablesView({
  tableOrders,
  onNew,
  onEdit,
}: {
  tableOrders: TableOrder[]
  onNew: (tableNumber: string) => void
  onEdit: (tableNumber: string) => void
}) {
  const [newTableNumber, setNewTableNumber] = useState("")

  const handleNew = (e: React.FormEvent) => {
    e.preventDefault()
    onNew(newTableNumber)
    setNewTableNumber("")
  }

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-black text-foreground">Mesas</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {tableOrders.length === 0 ? "Nenhuma mesa aberta" : `${tableOrders.length} mesa${tableOrders.length > 1 ? "s" : ""} ativa${tableOrders.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <form onSubmit={handleNew} className="flex gap-2">
          <Input
            placeholder="Número da mesa"
            value={newTableNumber}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTableNumber(e.target.value)}
            className="w-40 h-10"
          />
          <Button type="submit" className="h-10 px-5 bg-primary text-primary-foreground font-bold shadow-sm">
            <Users className="h-4 w-4 mr-2" />
            Abrir
          </Button>
        </form>
      </div>

      {tableOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Users className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-bold text-foreground">Nenhuma mesa aberta</p>
          <p className="text-sm text-muted-foreground mt-1">Insira o número e clique em Abrir para iniciar um atendimento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {tableOrders.map((order) => {
            const tableTotal = order.cart.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0)
            const itemCount = order.cart.reduce((sum: number, item: CartItem) => sum + item.quantity, 0)
            return (
              <button
                key={order.tableNumber}
                onClick={() => onEdit(order.tableNumber)}
                className="group bg-card border border-border rounded-2xl p-4 text-center hover:border-primary hover:shadow-lg transition-all active:scale-95 relative overflow-hidden"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-primary rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-black text-primary">{order.tableNumber}</span>
                </div>
                <p className="font-bold text-sm text-foreground mb-1">Mesa {order.tableNumber}</p>
                <p className="text-xs text-muted-foreground mb-2">{itemCount} {itemCount === 1 ? "item" : "itens"}</p>
                <p className="text-base font-black text-primary">{formatCurrency(tableTotal)}</p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ==================== LOGIN SCREEN ====================
function LoginScreen({ onLogin }: { onLogin: (role: UserRole) => void }) {
  const [role, setRole] = useState<UserRole>("attendant")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username && password) {
      onLogin(role)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, hsl(158,72%,28%) 0%, hsl(158,72%,20%) 50%, hsl(30,80%,25%) 100%)" }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10" style={{ background: "hsl(38,95%,50%)" }} />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-10" style={{ background: "hsl(38,95%,50%)" }} />
      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-2 h-32 rounded-r-full opacity-20" style={{ background: "hsl(38,95%,50%)" }} />

      <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"
            style={{ background: "linear-gradient(135deg, hsl(38,95%,50%), hsl(38,95%,40%))" }}
          >
            <Sandwich className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Movearena</h1>
          <p className="text-white/60 text-sm mt-1 font-medium">Sistema de Pedidos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={cn(
                "py-2.5 rounded-lg text-sm font-bold transition-all",
                role === "admin"
                  ? "bg-white text-foreground shadow-md"
                  : "text-white/70 hover:text-white"
              )}
            >
              Administrador
            </button>
            <button
              type="button"
              onClick={() => setRole("attendant")}
              className={cn(
                "py-2.5 rounded-lg text-sm font-bold transition-all",
                role === "attendant"
                  ? "bg-white text-foreground shadow-md"
                  : "text-white/70 hover:text-white"
              )}
            >
              Atendente
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5">Usuário</label>
              <Input
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/50 focus:ring-white/20 h-11"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5">Senha</label>
              <Input
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/50 focus:ring-white/20 h-11"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={!username || !password}
            className="w-full h-12 text-base font-black rounded-xl shadow-lg disabled:opacity-40 mt-2"
            style={{ background: "linear-gradient(135deg, hsl(38,95%,50%), hsl(38,90%,42%))", color: "hsl(30,30%,10%)" }}
          >
            Entrar
          </Button>
        </form>
      </div>
    </div>
  )
}

// ==================== UI CONSTANTS ====================
const NAV_ITEMS: { key: AppView; label: string; icon: any }[] = [
  { key: "pos", label: "PDV", icon: ShoppingCart },
  { key: "products", label: "Produtos", icon: Package },
  { key: "stock", label: "Estoque", icon: Boxes },
  { key: "tables", label: "Mesas", icon: Users },
  { key: "customers", label: "Clientes", icon: Users },
  { key: "expenses", label: "Despesas", icon: ArrowDownCircle },
  { key: "reports", label: "Relatorios", icon: BarChart3 },
  { key: "cashier", label: "Caixa", icon: Wallet },
]

// ==================== MAIN APP ====================
export default function MovearenaPDV() {
  const [loggedIn, setLoggedIn] = usePersistedState<boolean>("mv_logged_in", false)
  const [role, setRole] = usePersistedState<UserRole>("mv_user_role", "attendant")
  const [view, setView] = usePersistedState<AppView>("mv_current_view", "pos")
  const [isOnline, setIsOnline] = useState(true) // Simulação de status de conexão
  
  // -- SUPABASE STATES --
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [stockHistory, setStockHistory] = useState<StockEntry[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [tableOrders, setTableOrders] = useState<TableOrder[]>([])
  
  // -- LOCAL STATES (Configurações locais) --
  const [customExpenseCategories, setCustomExpenseCategories] = usePersistedState<string[]>("mv_expense_categories", [])
  const [productCategories, setProductCategories] = usePersistedState<string[]>("mv_product_categories", DEFAULT_CATEGORIES)
  
  // -- CASHIER STATE (Now synced with DB) --
  const [cashierSessionId, setCashierSessionId] = useState<number | null>(null)
  const [cashierOpen, setCashierOpen] = useState(false)
  const [cashierData, setCashierData] = useState<{
    opening: number
    sales: Record<string, number>
    openedAt?: string
  }>({
    opening: 0,
    sales: { money: 0, pix: 0, debit: 0, credit: 0 },
  })

  const [editingTable, setEditingTable] = usePersistedState<string | null>("mv_editing_table", null)

  // -- Persisted states (saved in localStorage) --
  const [cart, setCart] = usePersistedState<CartItem[]>("mv_cart", [])
  const [orderType, setOrderType] = usePersistedState<OrderType>("mv_order_type", "pickup")
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [customerName, setCustomerName] = usePersistedState<string>("mv_customer_name", "")
  const [customerPhone, setCustomerPhone] = usePersistedState<string>("mv_customer_phone", "")
  const [deliveryAddress, setDeliveryAddress] = usePersistedState<string>("mv_delivery_address", "")
  const [orderObservation, setOrderObservation] = usePersistedState<string>("mv_order_observation", "")
  const [deliveryFee, setDeliveryFee] = usePersistedState<number>("mv_delivery_fee", 5.0)
  const [showBuilder, setShowBuilder] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  // ++ MEMOIZED CALCULATIONS ++
  const subtotal = React.useMemo(() => 
    cart.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0),
    [cart]
  )
  const totalDeliveryFee = orderType === "delivery" ? deliveryFee : 0
  const total = subtotal + totalDeliveryFee

  // ++ DATA FETCHING ++
  const fetchData = useCallback(async () => {
    try {
      // Verificação explícita das variáveis de ambiente
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Configuração ausente: Verifique se NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão no arquivo .env.local")
      }

      const { data: p, error: pError } = await supabase.from('products').select('*').order('name')
      if (pError) throw pError
      if (p) setProducts(p)

      const { data: s, error: sError } = await supabase.from('sales').select('*').order('date', { ascending: false })
      if (sError) throw sError
      if (s) {
        setSales(s.map((item: any) => ({
          ...item,
          deliveryFee: item.delivery_fee ?? item.deliveryFee ?? 0,
          orderType: item.order_type ?? item.orderType ?? "pickup",
          paymentMethod: item.payment_method ?? item.paymentMethod ?? "money",
        })))
      }

      const { data: t, error: tError } = await supabase.from('table_orders').select('*')
      if (tError) throw tError
      if (t) setTableOrders(t.map((row: any) => ({
        tableNumber: row.table_number,
        cart: row.cart,
        customerName: row.customer_name,
        customerPhone: row.customer_phone
      })))

      const { data: c, error: cError } = await supabase.from('customers').select('*')
      if (cError) throw cError
      if (c) setCustomers(c)

      const { data: e, error: eError } = await supabase.from('expenses').select('*').order('date', { ascending: false })
      if (eError) throw eError
      if (e) setExpenses(e)

      const { data: sh, error: shError } = await supabase.from('stock_history').select('*').order('date', { ascending: false })
      if (shError) throw shError
      if (sh) setStockHistory(sh)

      // -- FETCH CASHIER STATUS --
      const { data: session, error: sessionError } = await supabase
        .from('cashier_sessions')
        .select('*')
        .is('closed_at', null)
        .maybeSingle()

      if (session) {
        setCashierOpen(true)
        setCashierSessionId(session.id)
        
        // Calculate sales since opening
        const sessionSales = s ? s.filter((sale: any) => new Date(sale.date) >= new Date(session.opened_at)) : []
        const salesSummary: Record<string, number> = { money: 0, pix: 0, debit: 0, credit: 0 }
        
        sessionSales.forEach((sale: any) => {
          const method = sale.paymentMethod || "money"
          if (salesSummary[method] !== undefined) salesSummary[method] += sale.total
          else salesSummary[method] = sale.total
        })

        setCashierData({ opening: session.opening_balance, sales: salesSummary, openedAt: session.opened_at })
      } else {
        setCashierOpen(false)
        setCashierSessionId(null)
        setCashierData({ opening: 0, sales: { money: 0, pix: 0, debit: 0, credit: 0 } })
      }

      setIsOnline(true)
    } catch (error: any) {
      console.error("Erro ao buscar dados:", error)
      
      const errorMessage = error.message || ""
      if (errorMessage.includes("Invalid API key") || error.code === "401" || errorMessage.includes("JWT")) {
        toast.error("Erro de Autenticação: Verifique as chaves no arquivo .env.local")
      } else if (error.code === "42P01") {
        toast.error("Erro: Tabelas não encontradas. Crie as tabelas no Supabase.")
      } else if (errorMessage.toLowerCase().includes("failed to fetch")) {
        toast.error("Erro de Conexão: Verifique a URL do Supabase no .env.local")
      } else {
        toast.error(`Erro ao carregar dados: ${errorMessage || "Verifique o console"}`)
      }
      setIsOnline(false)
    }
  }, [])

  useEffect(() => {
    fetchData()

    // Inscreva-se para atualizações em tempo real (opcional, mas bom para mobile)
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchData])

  // ++ AUTO-SAVE EFFECT ++
  // Removido o auto-save local para evitar conflitos. 
  // Agora salvamos explicitamente ao clicar em "Salvar" ou sair da mesa.

  // Login
  const handleLogin = useCallback((r: UserRole) => {
    setRole(r)
    setLoggedIn(true)
    toast.success("Bem-vindo ao Movearena!")
  }, [])

  const handleLogout = useCallback(() => {
    setLoggedIn(false)
    setView("pos")
    setCart([])
    setCustomerName("")
    setCustomerPhone("")
    setDeliveryAddress("")
    setOrderObservation("")
    setEditingTable(null)
    setDeliveryFee(5.0)
    toast.info("Ate logo!")
  }, [])

  // -- Table management --
  const handleEditTable = useCallback(
    (tableNumber: string) => {
      const tableOrder = tableOrders.find((t) => t.tableNumber === tableNumber)
      if (tableOrder) {
        setCart(tableOrder.cart)
        setCustomerName(tableOrder.customerName)
        setCustomerPhone(tableOrder.customerPhone)
        setOrderType("table")
        setEditingTable(tableNumber)
        setView("pos")
        toast.info(`Editando mesa ${tableNumber}.`)
      }
    },
    [tableOrders]
  )

  const handleUpdateTableOrder = useCallback(async () => {
    if (!editingTable) return

    try {
      const { error } = await supabase
        .from('table_orders')
        .update({
          cart: cart,
          customer_name: customerName,
          customer_phone: customerPhone,
        })
        .eq('table_number', editingTable)

      if (error) throw new Error(error.message)

      toast.success(`Mesa ${editingTable} salva!`)
      // O Supabase Realtime vai cuidar de atualizar os dados,
      // então apenas limpamos o estado local e mudamos de tela.
      setCart([])
      setCustomerName("")
      setCustomerPhone("")
      setEditingTable(null)
      setOrderType("pickup")
      setView("tables")
    } catch (error: any) {
      toast.error(error.message)
    }
  }, [editingTable, cart, customerName, customerPhone])

  const handleNewTableOrder = useCallback(
    async (tableNumber: string) => {
      if (!tableNumber.trim()) {
        toast.error("Por favor, insira o número da mesa.")
        return
      }

      try {
        const { error } = await supabase.from('table_orders').insert({
          table_number: tableNumber,
          cart: [],
          customer_name: '',
          customer_phone: '',
        })

        if (error) throw new Error(error.message)
        
        // A subscrição do Supabase Realtime vai atualizar a lista de mesas.
        // Apenas entramos no modo de edição.
        setCart([])
        setCustomerName("")
        setCustomerPhone("")
        setOrderType("table")
        setEditingTable(tableNumber)
        setView("pos")
        
        toast.success(`Mesa ${tableNumber} aberta! Adicione itens ao pedido.`)
      } catch (error: any) {
        toast.error(error.message)
      }
    },
    []
  )

  // Cart operations
  const addProductToCart = useCallback((product: Product) => {
    setCart((prev: CartItem[]) => {
      const existing = prev.find((item: CartItem) => item.id === product.id && !item.isCustom)
      if (existing) {
        return prev.map((item: CartItem) =>
          item.id === product.id && !item.isCustom ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          cost: product.cost,
          quantity: 1,
          observation: "",
          isCustom: false,
        },
      ]
    })
    toast.success(`${product.name} adicionado!`)
  }, [])

  const addCustomToCart = useCallback((item: CartItem) => {
    setCart((prev) => [...prev, item])
    toast.success("Lanche adicionado!")
  }, [])

  const changeQuantity = useCallback((index: number, delta: number) => {
    setCart((prev: CartItem[]) => {
      const newCart = [...prev]
      newCart[index] = { ...newCart[index], quantity: newCart[index].quantity + delta }
      if (newCart[index].quantity <= 0) {
        newCart.splice(index, 1)
      }
      return newCart
    })
  }, [])

  const removeItem = useCallback((index: number) => {
    setCart((prev: CartItem[]) => prev.filter((_: CartItem, i: number) => i !== index))
  }, [])

  // Checkout
  const handleFinalize = useCallback(
    async (method: PaymentMethod) => {
      try {
        const sale: Sale = {
          id: Date.now(),
          date: new Date().toISOString(),
          customer: customerName || "Cliente",
          phone: customerPhone,
          address: orderType === "delivery" ? deliveryAddress : "",
          orderType,
          deliveryFee: totalDeliveryFee,
          items: [...cart],
          subtotal,
          discount: { type: null, value: 0 },
          total,
          paymentMethod: method,
          observation: orderObservation,
          user: role === "admin" ? "Admin" : "Atendente",
        }

        // If it was a table order, remove it from the open tables list via API
        if (editingTable) {
          const { error: deleteError } = await supabase.from('table_orders').delete().eq('table_number', editingTable)
          if (deleteError) throw deleteError
          setEditingTable(null)
        }

        // Save Sale
        const { error: insertError } = await supabase.from('sales').insert({
          id: sale.id,
          date: sale.date,
          customer: sale.customer,
          phone: sale.phone,
          address: sale.address,
          order_type: sale.orderType,
          delivery_fee: sale.deliveryFee,
          items: sale.items,
          subtotal: sale.subtotal,
          discount: sale.discount,
          total: sale.total,
          payment_method: sale.paymentMethod,
          observation: sale.observation,
          user: sale.user
        })
        if (insertError) throw insertError

        // Deduct stock
        for (const item of cart) {
          if (!item.isCustom) {
            const product = products.find(p => p.id === item.id)
            if (product) {
              await supabase.from('products').update({ stock: Math.max(0, product.stock - item.quantity) }).eq('id', product.id)
            }
          }
        }

        // Auto-save customer if name is provided
        if (customerName.trim()) {
          const existing = customers.find(c => c.name.toLowerCase() === customerName.trim().toLowerCase())
          if (!existing) {
            await supabase.from('customers').insert({
              id: Date.now(),
              name: customerName.trim(),
              phone: customerPhone.trim(),
              address: orderType === "delivery" ? deliveryAddress.trim() : "",
            })
          } else if (orderType === "delivery" && deliveryAddress.trim() && existing.address !== deliveryAddress.trim()) {
             await supabase.from('customers').update({ address: deliveryAddress.trim() }).eq('id', existing.id)
          }
        }

        // Refresh data
        await fetchData()

        setCart([])
        setCustomerName("")
        setCustomerPhone("")
        setDeliveryAddress("")
        setOrderObservation("")
        setShowCheckout(false)
        toast.success("Venda finalizada!")
      } catch (error: any) {
        console.error("Erro ao finalizar venda:", error)
        toast.error(`Falha ao salvar a venda: ${error.message}`)
      }
    },
    [cart, customerName, customerPhone, orderType, deliveryAddress, totalDeliveryFee, subtotal, total, role, editingTable, orderObservation, products, customers, setCashierData, fetchData]
  )

  const handleReprint = useCallback((sale: Sale) => {
    if (!sale || !sale.items || sale.items.length === 0) {
      toast.error("Venda inválida para reimpressão!");
      return;
    }

    const orderNum = sale.id.toString().slice(-5);
    const date = new Date(sale.date).toLocaleString("pt-BR");
    const orderTypeLabel =
      sale.orderType === "delivery" ? "ENTREGA"
      : sale.orderType === "table" ? `MESA (Fechada)`
      : "RETIRADA";

    let itemsHtml = "";
    sale.items.forEach((item: CartItem) => {
      const itemTotal = (item.price * item.quantity).toFixed(2);
      itemsHtml += `<tr><td style="font-weight:900;font-size:14px;padding-top:5px;">${item.quantity}x ${item.name}</td></tr>\n`;
      if (item.observation) {
        const obsLines = item.observation.split("\n");
        obsLines.forEach((line: string) => {
          if (line.trim()) {
            itemsHtml += `<tr><td style="font-size:13px;padding-left:6px;font-weight:700;">${line.trim()}</td></tr>\n`;
          }
        });
      }
      itemsHtml += `<tr><td style="text-align:right;font-size:13px;font-weight:800;padding-bottom:3px;">R$ ${itemTotal}</td></tr>\n`;
    });

    const printWindow = window.open("", "_blank", "width=380,height=700");
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Reimpressão Pedido #${orderNum}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: 58mm auto; margin: 0; }
  @media print { html, body { width: 58mm; } }
  body {
    width: 54mm;
    max-width: 54mm;
    margin: 0 auto;
    font-family: 'Courier New', 'Lucida Console', monospace;
    font-size: 11px;
    font-weight: 700;
    padding: 1mm;
    overflow: hidden;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  td { vertical-align: top; padding: 0; word-wrap: break-word; overflow-wrap: break-word; }
  .sep { border-top: 1px dashed #000; margin: 3px 0; }
  .sep-bold { border-top: 2px solid #000; margin: 4px 0; }
</style>
</head><body>

<table>
  <tr><td style="text-align:center;font-size:16px;font-weight:900;letter-spacing:1px;padding-bottom:1px;">MOVEARENA</td></tr>
  <tr><td style="text-align:center;font-size:13px;font-weight:900;">** REIMPRESSÃO **</td></tr>
  <tr><td style="text-align:center;font-size:13px;font-weight:900;">PEDIDO #${orderNum}</td></tr>
  <tr><td style="text-align:center;font-size:10px;font-weight:600;padding-bottom:2px;">${date}</td></tr>
</table>

<div class="sep"></div>

<table>
  <tr><td style="font-size:11px;font-weight:900;">Cliente: ${sale.customer || "Cliente"}</td></tr>
  ${sale.phone ? `<tr><td style="font-size:10px;font-weight:700;">Tel: ${sale.phone}</td></tr>` : ""}
  ${sale.orderType === "delivery" ? `<tr><td style="font-size:10px;font-weight:700;">End: ${sale.address}</td></tr>` : ""}
  <tr><td style="font-size:11px;font-weight:900;">Tipo: ${orderTypeLabel}</td></tr>
  ${sale.observation ? `<tr><td style="font-size:11px;font-weight:900;padding-top:2px;">Obs: ${sale.observation}</td></tr>` : ""}
</table>

<div class="sep"></div>

<table>
  ${itemsHtml}
</table>

<div class="sep"></div>

<table>
  <colgroup><col style="width:50%"><col style="width:50%"></colgroup>
  <tr>
    <td style="font-size:11px;font-weight:700;">Subtotal:</td>
    <td style="font-size:11px;font-weight:700;text-align:right;">R$ ${sale.subtotal.toFixed(2)}</td>
  </tr>
  ${sale.deliveryFee > 0 ? `<tr><td style="font-size:11px;font-weight:700;">Taxa entrega:</td><td style="font-size:11px;font-weight:700;text-align:right;">R$ ${sale.deliveryFee.toFixed(2)}</td></tr>` : ""}
</table>

<div class="sep-bold"></div>

<table>
  <colgroup><col style="width:40%"><col style="width:60%"></colgroup>
  <tr>
    <td style="font-size:14px;font-weight:900;">TOTAL:</td>
    <td style="font-size:14px;font-weight:900;text-align:right;">R$ ${sale.total.toFixed(2)}</td>
  </tr>
</table>

<div class="sep"></div>

<table>
  <tr><td style="text-align:center;font-size:10px;font-weight:700;padding-top:3px;">Obrigado pela preferencia!</td></tr>
  <tr><td style="text-align:center;font-size:10px;font-weight:700;">Volte sempre!</td></tr>
</table>

<script>window.onload=function(){setTimeout(function(){window.print();window.close();},400)};<\/script>
</body></html>`);
      printWindow.document.close();
    }
    toast.success("Reimpressão enviada!");
  }, []);

  // Print
  const handlePrint = useCallback(() => {
    if (cart.length === 0) {
      toast.error("Carrinho vazio!")
      return
    }

    const orderNum = generateOrderNumber()
    const date = new Date().toLocaleString("pt-BR")
    const orderTypeLabel =
      orderType === "delivery" ? "ENTREGA"
      : editingTable ? `MESA ${editingTable}`
      : "RETIRADA"

    let itemsText = ""
    cart.forEach((item: CartItem) => {
      const itemTotal = (item.price * item.quantity).toFixed(2)
      itemsText += `${item.quantity}x ${item.name}\n`
      if (item.observation) {
        itemsText += `   ${item.observation.replace(/\n/g, "\n   ")}\n`
      }
      itemsText += `   R$ ${itemTotal}\n`
    })

    let itemsHtml = ""
    cart.forEach((item: CartItem) => {
      const itemTotal = (item.price * item.quantity).toFixed(2)
      itemsHtml += `<tr><td style="font-weight:900;font-size:14px;padding-top:5px;">${item.quantity}x ${item.name}</td></tr>\n`
      if (item.observation) {
        const obsLines = item.observation.split("\n")
        obsLines.forEach((line: string) => {
          if (line.trim()) {
            itemsHtml += `<tr><td style="font-size:13px;padding-left:6px;font-weight:700;">${line.trim()}</td></tr>\n`
          }
        })
      }
      itemsHtml += `<tr><td style="text-align:right;font-size:13px;font-weight:800;padding-bottom:3px;">R$ ${itemTotal}</td></tr>\n`
    })

    const printWindow = window.open("", "_blank", "width=380,height=700")
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Pedido #${orderNum}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: 58mm auto; margin: 0; }
  @media print { html, body { width: 58mm; } }
  body {
    width: 54mm;
    max-width: 54mm;
    margin: 0 auto;
    font-family: 'Courier New', 'Lucida Console', monospace;
    font-size: 11px;
    font-weight: 700;
    padding: 1mm;
    overflow: hidden;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  td { vertical-align: top; padding: 0; word-wrap: break-word; overflow-wrap: break-word; }
  .sep { border-top: 1px dashed #000; margin: 3px 0; }
  .sep-bold { border-top: 2px solid #000; margin: 4px 0; }
</style>
</head><body>

<table>
  <tr><td style="text-align:center;font-size:16px;font-weight:900;letter-spacing:1px;padding-bottom:1px;">MOVEARENA</td></tr>
  <tr><td style="text-align:center;font-size:13px;font-weight:900;">PEDIDO #${orderNum}</td></tr>
  <tr><td style="text-align:center;font-size:10px;font-weight:600;padding-bottom:2px;">${date}</td></tr>
</table>

<div class="sep"></div>

<table>
  <tr><td style="font-size:11px;font-weight:900;">Cliente: ${customerName || "Cliente"}</td></tr>
  ${customerPhone ? `<tr><td style="font-size:10px;font-weight:700;">Tel: ${customerPhone}</td></tr>` : ""}
  ${orderType === "delivery" ? `<tr><td style="font-size:10px;font-weight:700;">End: ${deliveryAddress}</td></tr>` : ""}
  <tr><td style="font-size:11px;font-weight:900;">Tipo: ${orderTypeLabel}</td></tr>
  ${orderObservation ? `<tr><td style="font-size:11px;font-weight:900;padding-top:2px;">Obs: ${orderObservation}</td></tr>` : ""}
</table>

<div class="sep"></div>

<table>
  ${itemsHtml}
</table>

<div class="sep"></div>

<table>
  <colgroup><col style="width:50%"><col style="width:50%"></colgroup>
  <tr>
    <td style="font-size:11px;font-weight:700;">Subtotal:</td>
    <td style="font-size:11px;font-weight:700;text-align:right;">R$ ${subtotal.toFixed(2)}</td>
  </tr>
  ${totalDeliveryFee > 0 ? `<tr><td style="font-size:11px;font-weight:700;">Taxa entrega:</td><td style="font-size:11px;font-weight:700;text-align:right;">R$ ${totalDeliveryFee.toFixed(2)}</td></tr>` : ""}
</table>

<div class="sep-bold"></div>

<table>
  <colgroup><col style="width:40%"><col style="width:60%"></colgroup>
  <tr>
    <td style="font-size:14px;font-weight:900;">TOTAL:</td>
    <td style="font-size:14px;font-weight:900;text-align:right;">R$ ${total.toFixed(2)}</td>
  </tr>
</table>

<div class="sep"></div>

<table>
  <tr><td style="text-align:center;font-size:10px;font-weight:700;padding-top:3px;">Obrigado pela preferencia!</td></tr>
  <tr><td style="text-align:center;font-size:10px;font-weight:700;">Volte sempre!</td></tr>
</table>

<script>window.onload=function(){setTimeout(function(){window.print();window.close();},400)};<\/script>
</body></html>`)
      printWindow.document.close()
    }
    toast.success("Pedido enviado para impressao!")
  }, [cart, customerName, customerPhone, deliveryAddress, orderType, subtotal, total, totalDeliveryFee, editingTable, orderObservation])

  // Sales management
  const deleteSale = useCallback(async (id: number) => {
    const saleToDelete = sales.find(s => s.id === id)
    if (saleToDelete) {
      // Restore stock
      for (const item of saleToDelete.items) {
        if (!item.isCustom) {
           const product = products.find(p => p.id === item.id)
           if (product) {
             await supabase.from('products').update({ stock: product.stock + item.quantity }).eq('id', product.id)
           }
        }
      }
    }
    await supabase.from('sales').delete().eq('id', id)
    fetchData()
    toast.success("Venda excluida e estoque recomposto!")
  }, [sales, setSales, setProducts])

  const updateSale = useCallback(async (id: number, updatedData: Partial<Sale>) => {
    await supabase.from('sales').update(updatedData).eq('id', id)
    fetchData()
    toast.success("Venda atualizada!")
  }, [])

  // Product management
  const updateProduct = useCallback(async (id: number, field: string, value: string | number | boolean) => {
    await supabase.from('products').update({ [field]: value }).eq('id', id)
    fetchData()
    toast.success("Produto atualizado!")
  }, [])

  const deleteProduct = useCallback(async (id: number) => {
    if (confirm("Excluir produto?")) {
      await supabase.from('products').delete().eq('id', id)
      fetchData()
      toast.success("Produto excluido!")
    }
  }, [])

  const addProduct = useCallback(async (product: Product) => {
    await supabase.from('products').insert(product)
    fetchData()
    toast.success("Produto adicionado!")
  }, [])

  const restoreProducts = useCallback(async () => {
    if (!confirm("Deseja restaurar os produtos padrão e tentar recuperar dados antigos do dispositivo?")) return
    
    try {
      // Tenta recuperar do localStorage antigo
      const localData = localStorage.getItem("mv_products")
      let items = [...DEFAULT_PRODUCTS]
      
      if (localData) {
        try {
          const parsed = JSON.parse(localData)
          if (Array.isArray(parsed) && parsed.length > 0) items = parsed
        } catch {}
      }

      const { error } = await supabase.from('products').upsert(items)
      if (error) throw error
      
      fetchData()
      toast.success("Produtos restaurados e sincronizados!")
    } catch (e) {
      console.error(e)
      toast.error("Erro ao restaurar produtos.")
    }
  }, [fetchData])

  const toggleActive = useCallback(async (id: number) => {
    const p = products.find(x => x.id === id)
    if (p) {
      await supabase.from('products').update({ active: !p.active }).eq('id', id)
      fetchData()
    }
  }, [products])

  // Stock management
  const adjustStock = useCallback(
    async (productId: number, quantity: number, type: "add" | "remove" | "set", reason: string) => {
      const product = products.find((p) => p.id === productId)
      if (product) {
        let newStock = product.stock
        if (type === "add") newStock += quantity
        else if (type === "remove") newStock = Math.max(0, product.stock - quantity)
        else newStock = quantity

        await supabase.from('products').update({ stock: newStock }).eq('id', productId)

        const actualChange =
          type === "add" ? quantity : type === "remove" ? -quantity : quantity - product.stock

        await supabase.from('stock_history').insert({
          id: Date.now(),
          date: new Date().toISOString(),
          productName: product.name,
          type: type === "add" ? "Entrada" : type === "remove" ? "Saida" : "Ajuste",
          quantity: actualChange,
          reason,
        })
        fetchData()
      }
      toast.success("Estoque atualizado!")
    },
    [products]
  )

  // Cashier
  const openCashier = useCallback(async (amount: number) => {
    const { error } = await supabase.from('cashier_sessions').insert({
      opening_balance: amount,
      opened_at: new Date().toISOString()
    })
    
    if (error) toast.error("Erro ao abrir caixa")
    else {
      toast.success("Caixa aberto!")
      fetchData()
    }
  }, [])

  // Expenses
  const addExpense = useCallback(async (expense: Expense) => {
    await supabase.from('expenses').insert(expense)
    fetchData()
    toast.success("Despesa registrada!")
  }, [])

  const deleteExpense = useCallback(async (id: number) => {
    await supabase.from('expenses').delete().eq('id', id)
    fetchData()
    toast.success("Despesa excluida!")
  }, [])

  const editExpense = useCallback(async (updated: Expense) => {
    await supabase.from('expenses').update(updated).eq('id', updated.id)
    fetchData()
    toast.success("Despesa atualizada!")
  }, [])

  const addCustomExpenseCategory = useCallback((cat: string) => {
    setCustomExpenseCategories((prev: string[]) => prev.includes(cat) ? prev : [...prev, cat])
  }, [])

  const addProductCategory = useCallback((cat: string) => {
    setProductCategories((prev: string[]) => prev.includes(cat.toLowerCase()) ? prev : [...prev, cat.toLowerCase()])
  }, [])

  const deleteProductCategory = useCallback((cat: string) => {
    setProductCategories((prev: string[]) => prev.filter((c: string) => c !== cat))
  }, [])

  // Stock entry management
  const editStockEntry = useCallback(async (updated: StockEntry) => {
    await supabase.from('stock_history').update(updated).eq('id', updated.id)
    fetchData()
    toast.success("Movimentacao atualizada!")
  }, [])

  const deleteStockEntry = useCallback(async (id: number) => {
    await supabase.from('stock_history').delete().eq('id', id)
    fetchData()
    toast.success("Movimentacao excluida!")
  }, [])

  // Customer management
  const addCustomer = useCallback(async (customer: Customer) => {
    await supabase.from('customers').insert(customer)
    fetchData()
    toast.success("Cliente cadastrado!")
  }, [])

  const editCustomer = useCallback(async (updated: Customer) => {
    await supabase.from('customers').update(updated).eq('id', updated.id)
    fetchData()
    toast.success("Cliente atualizado!")
  }, [])

  const deleteCustomer = useCallback(async (id: number) => {
    await supabase.from('customers').delete().eq('id', id)
    fetchData()
    toast.success("Cliente excluido!")
  }, [])

  const closeCashier = useCallback(async () => {
    const totalSales = Object.values(cashierData.sales).reduce((a: number, b: number) => a + b, 0)
    const todayExpenses = expenses
      .filter((e: Expense) => new Date(e.date).toDateString() === new Date().toDateString())
      .reduce((sum: number, e: Expense) => sum + e.amount, 0)
    
    const finalBalance = cashierData.opening + totalSales - todayExpenses

    if (confirm(`Confirmar fechamento?\nSaldo Final: ${formatCurrency(finalBalance)}`)) {
      const { error } = await supabase.from('cashier_sessions')
        .update({ closed_at: new Date().toISOString(), final_balance: finalBalance })
        .eq('id', cashierSessionId)

      if (error) toast.error("Erro ao fechar caixa")
      else {
        toast.success("Caixa fechado!")
        fetchData()
      }
    }
  }, [cashierData, expenses, cashierSessionId, fetchData])

  // ==================== RENDER ====================
  if (!loggedIn) return <LoginScreen onLogin={handleLogin} />

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border z-40 shadow-sm">
        <div className="flex items-center justify-between px-3 md:px-4 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(158,72%,36%), hsl(158,72%,28%))" }}
            >
              <Sandwich className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-foreground leading-none">Movearena</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md text-white leading-none"
                  style={{ background: "hsl(38,95%,50%)", color: "hsl(30,30%,10%)" }}
                >PRO</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-muted-foreground">{role === "admin" ? "Administrador" : "Atendente"}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className={cn(
                  "text-[11px] font-bold",
                  cashierOpen ? "text-primary" : "text-destructive"
                )}>
                  {cashierOpen ? "Caixa aberto" : "Caixa fechado"}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 bg-muted/60 rounded-xl p-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  onClick={() => setView(item.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all",
                    view === item.key
                      ? "bg-card shadow-sm text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden lg:inline">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Connection indicator */}
            <div className={cn(
              "hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold",
              isOnline
                ? "bg-primary/10 text-primary"
                : "bg-destructive/10 text-destructive"
            )}>
              {isOnline
                ? <Cloud className="h-3 w-3" />
                : <CloudOff className="h-3 w-3" />}
              <span>{isOnline ? "Online" : "Offline"}</span>
            </div>

            <Button
              size="sm"
              className="hidden md:flex h-8 text-xs font-bold"
              style={{ background: "hsl(38,95%,50%)", color: "hsl(30,30%,10%)" }}
              onClick={() => { setView("pos"); setShowBuilder(true) }}
            >
              <Sandwich className="h-3.5 w-3.5 mr-1.5" />
              Montar Lanche
            </Button>

            {/* Mobile hamburger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden h-9 w-9">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-5 border-b border-border"
                    style={{ background: "linear-gradient(135deg, hsl(158,72%,36%), hsl(158,72%,28%))" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Sandwich className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-black text-white text-base">Movearena PRO</p>
                        <p className="text-white/70 text-xs">{role === "admin" ? "Administrador" : "Atendente"}</p>
                      </div>
                    </div>
                  </div>
                  <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.key}
                          onClick={() => setView(item.key)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                            view === item.key
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          {item.label}
                        </button>
                      )
                    })}
                  </nav>
                  <div className="p-3 border-t border-border space-y-2">
                    <Button
                      className="w-full font-bold"
                      style={{ background: "hsl(38,95%,50%)", color: "hsl(30,30%,10%)" }}
                      onClick={() => { setView("pos"); setShowBuilder(true) }}
                    >
                      <Sandwich className="h-4 w-4 mr-2" />
                      Montar Lanche
                    </Button>
                    <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hidden md:flex h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden pb-16 md:pb-0">
        {view === "pos" && (
          <div className="h-full flex flex-row relative">
            {/* Product grid - takes remaining space, scrolls internally */}
            <div className="flex-1 min-w-0 h-full overflow-y-auto">
              <ProductGrid
                products={products}
                onAddToCart={addProductToCart}
                onStartCustomBurger={() => setShowBuilder(true)}
              />
            </div>

            {/* Desktop cart sidebar - always visible on lg+ */}
            <div className="hidden lg:flex h-full">
              <CartPanel
                cart={cart}
                orderType={orderType}
                onSetOrderType={setOrderType}
                onChangeQuantity={changeQuantity}
                onRemoveItem={removeItem}
                onOpenCheckout={() => setShowCheckout(true)}
                onUpdateTable={handleUpdateTableOrder}
                editingTable={editingTable}
                onPrintOrder={handlePrint}
                customerName={customerName}
                customerPhone={customerPhone}
                deliveryAddress={deliveryAddress}
                deliveryFee={deliveryFee}
                onCustomerNameChange={setCustomerName}
                onCustomerPhoneChange={setCustomerPhone}
                onDeliveryAddressChange={setDeliveryAddress}
                onOrderObservationChange={setOrderObservation}
                onDeliveryFeeChange={setDeliveryFee}
                orderObservation={orderObservation}
                customers={customers}
              />
            </div>

            {/* Mobile floating cart button */}
            {cart.length > 0 && (
              <button
                onClick={() => setMobileCartOpen(true)}
                className="lg:hidden fixed bottom-20 right-4 z-50 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold text-sm px-4 py-3"
                style={{ background: "linear-gradient(135deg, hsl(158,72%,36%), hsl(158,72%,28%))", color: "white" }}
              >
                <div className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                    style={{ background: "hsl(38,95%,50%)", color: "hsl(30,30%,10%)" }}
                  >
                    {cart.reduce((s: number, i: CartItem) => s + i.quantity, 0)}
                  </span>
                </div>
                <span>{formatCurrency(total)}</span>
              </button>
            )}

            {/* Mobile cart sheet */}
            <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
              <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-2xl lg:hidden">
                <CartPanel
                  cart={cart}
                  orderType={orderType}
                  onSetOrderType={setOrderType}
                  onChangeQuantity={changeQuantity}
                  onRemoveItem={removeItem}
                  onOpenCheckout={() => { setMobileCartOpen(false); setShowCheckout(true) }}
                  onUpdateTable={handleUpdateTableOrder}
                  editingTable={editingTable}
                  onPrintOrder={handlePrint}
                  customerName={customerName}
                  customerPhone={customerPhone}
                  deliveryAddress={deliveryAddress}
                  deliveryFee={deliveryFee}
                  onCustomerNameChange={setCustomerName}
                  onCustomerPhoneChange={setCustomerPhone}
                  onDeliveryAddressChange={setDeliveryAddress}
                  onOrderObservationChange={setOrderObservation}
                  onDeliveryFeeChange={setDeliveryFee}
                  orderObservation={orderObservation}
                  customers={customers}
                />
              </SheetContent>
            </Sheet>
          </div>
        )}

        {view === "tables" && (
          <TablesView tableOrders={tableOrders} onNew={handleNewTableOrder} onEdit={handleEditTable} />
        )}

        {view === "products" && (
          <ProductsView
            products={products}
            onUpdateProduct={updateProduct}
            onDeleteProduct={deleteProduct}
            onAddProduct={addProduct}
            onToggleActive={toggleActive}
            categories={productCategories}
            onAddCategory={addProductCategory}
            onDeleteCategory={deleteProductCategory}
            onRestoreProducts={restoreProducts}
          />
        )}

        {view === "stock" && (
          <StockView products={products} stockHistory={stockHistory} onAdjustStock={adjustStock} onEditStockEntry={editStockEntry} onDeleteStockEntry={deleteStockEntry} />
        )}

        {view === "customers" && (
          <CustomersView
            customers={customers}
            onAddCustomer={addCustomer}
            onEditCustomer={editCustomer}
            onDeleteCustomer={deleteCustomer}
          />
        )}

        {view === "expenses" && (
          <ExpensesView
            expenses={expenses}
            onAddExpense={addExpense}
            onEditExpense={editExpense}
            onDeleteExpense={deleteExpense}
            customCategories={customExpenseCategories}
            onAddCategory={addCustomExpenseCategory}
          />
        )}

        {view === "reports" && (
          <ReportsView
            sales={sales}
            expenses={expenses}
            onDeleteSale={deleteSale}
            onUpdateSale={updateSale}
            onReprint={handleReprint}
          />
        )}

        {view === "cashier" && (
          <CashierView
            cashierOpen={cashierOpen}
            cashierData={cashierData}
            onOpenCashier={openCashier}
            onCloseCashier={closeCashier}
            expenses={expenses}
          />
        )}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border flex items-stretch">
        <button
          onClick={() => setView("tables")}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all min-h-[58px]",
            view === "tables" ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Users className={cn("h-5 w-5 transition-transform", view === "tables" && "scale-110")} />
          <span className="text-[10px] font-bold leading-none">Mesas</span>
        </button>

        <button
          onClick={() => setView("pos")}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all min-h-[58px]",
            view === "pos" ? "text-primary" : "text-muted-foreground"
          )}
        >
          <ShoppingCart className={cn("h-5 w-5 transition-transform", view === "pos" && "scale-110")} />
          <span className="text-[10px] font-bold leading-none">PDV</span>
        </button>

        <button
          onClick={() => { setView("pos"); setShowBuilder(true) }}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 min-h-[58px] relative"
        >
          <div className="absolute -top-4 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, hsl(38,95%,50%), hsl(38,90%,42%))" }}
          >
            <Sandwich className="h-6 w-6" style={{ color: "hsl(30,30%,10%)" }} />
          </div>
          <span className="text-[10px] font-bold leading-none text-muted-foreground mt-7">Montar</span>
        </button>
      </nav>

      {/* Modals */}
      <SandwichBuilder open={showBuilder} onClose={() => setShowBuilder(false)} onAddToCart={addCustomToCart} />

      <CheckoutModal open={showCheckout} onClose={() => setShowCheckout(false)} total={total} onFinalize={handleFinalize} />
    </div>
  )
}
