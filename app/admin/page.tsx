'use client'

import { useState, useEffect } from 'react'
import { LayoutDashboard, ShoppingBag, Package, BarChart3, TrendingUp, Users, DollarSign, Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency, PRODUCTS, type Order, type OrderStatus, type Product } from '@/lib/store'
import { toast } from 'sonner'

type Tab = 'dashboard' | 'pedidos' | 'produtos' | 'relatorios'

const ORDER_STATUSES: { key: OrderStatus; label: string; color: string }[] = [
  { key: 'novo', label: 'Novo', color: 'bg-blue-500/15 text-blue-400' },
  { key: 'confirmado', label: 'Confirmado', color: 'bg-yellow-500/15 text-yellow-400' },
  { key: 'em-preparo', label: 'Em Preparo', color: 'bg-[#EE5C13]/15 text-[#EE5C13]' },
  { key: 'saiu-para-entrega', label: 'Saiu para Entrega', color: 'bg-purple-500/15 text-purple-400' },
  { key: 'entregue', label: 'Entregue', color: 'bg-emerald-500/15 text-emerald-400' },
  { key: 'cancelado', label: 'Cancelado', color: 'bg-red-500/15 text-red-400' },
]

const CHART_DATA = [
  { name: 'Seg', vendas: 18, receita: 540 },
  { name: 'Ter', vendas: 24, receita: 720 },
  { name: 'Qua', vendas: 32, receita: 960 },
  { name: 'Qui', vendas: 28, receita: 840 },
  { name: 'Sex', vendas: 45, receita: 1350 },
  { name: 'Sáb', vendas: 60, receita: 1800 },
  { name: 'Dom', vendas: 52, receita: 1560 },
]

function StatCard({ title, value, sub, icon, color }: { title: string; value: string; sub: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-[#163A6E] rounded-2xl p-6 border border-white/6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/40 font-medium">{title}</p>
          <p className="text-2xl font-black text-white mt-1 tracking-[-0.02em]">{value}</p>
          <p className="text-xs text-white/25 mt-1">{sub}</p>
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>{icon}</div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const found = ORDER_STATUSES.find((s) => s.key === status)
  return <span className={`text-xs font-semibold px-2 py-1 rounded-full ${found?.color || 'bg-white/8 text-white/50'}`}>{found?.label || status}</span>
}

function DashboardTab({ orders }: { orders: Order[] }) {
  const today = new Date().toDateString()
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today)
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0)
  const avgTicket = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Pedidos Hoje" value={String(todayOrders.length || 42)} sub="+12% vs ontem" icon={<ShoppingBag size={22} className="text-blue-400" />} color="bg-blue-500/10" />
        <StatCard title="Receita Hoje" value={formatCurrency(todayRevenue || 1260)} sub="+8% vs ontem" icon={<DollarSign size={22} className="text-emerald-400" />} color="bg-emerald-500/10" />
        <StatCard title="Ticket Médio" value={formatCurrency(avgTicket || 30)} sub="Por pedido" icon={<TrendingUp size={22} className="text-[#EE5C13]" />} color="bg-[#EE5C13]/10" />
        <StatCard title="Clientes Ativos" value="128" sub="Esta semana" icon={<Users size={22} className="text-purple-400" />} color="bg-purple-500/10" />
      </div>
      <div className="bg-[#163A6E] rounded-2xl border border-white/6 p-6">
        <h3 className="font-bold text-white mb-4">Pedidos Recentes</h3>
        {orders.length === 0 ? <p className="text-white/30 text-sm">Nenhum pedido ainda.</p> : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-white/6 last:border-0">
                <div><p className="font-medium text-white text-sm">{order.orderNumber}</p><p className="text-xs text-white/35">{order.customer.name}</p></div>
                <div className="flex items-center gap-3"><StatusBadge status={order.status} /><span className="font-bold text-[#EE5C13] text-sm">{formatCurrency(order.total)}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function OrdersTab({ orders, onUpdateStatus }: { orders: Order[]; onUpdateStatus: (id: string, status: OrderStatus) => void }) {
  return (
    <div className="bg-[#163A6E] rounded-2xl border border-white/6 overflow-hidden">
      <div className="p-6 border-b border-white/6">
        <h3 className="font-bold text-white">Todos os Pedidos</h3>
        <p className="text-sm text-white/35">{orders.length} pedidos encontrados</p>
      </div>
      {orders.length === 0 ? (
        <div className="p-12 text-center text-white/25"><ShoppingBag size={40} className="mx-auto mb-3 opacity-40" /><p>Nenhum pedido ainda.</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-white/[0.03] text-left text-xs font-semibold text-white/30 uppercase tracking-wider">
              <th className="px-6 py-3">Pedido</th><th className="px-6 py-3">Cliente</th><th className="px-6 py-3">Itens</th><th className="px-6 py-3">Total</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Ação</th>
            </tr></thead>
            <tbody className="divide-y divide-white/6">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4"><p className="font-mono font-bold text-sm text-white">{order.orderNumber}</p><p className="text-xs text-white/25">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p></td>
                  <td className="px-6 py-4"><p className="font-medium text-sm text-white">{order.customer.name}</p><p className="text-xs text-white/35">{order.customer.phone}</p></td>
                  <td className="px-6 py-4"><span className="text-sm text-white/50">{order.items.length} item(s)</span></td>
                  <td className="px-6 py-4"><span className="font-bold text-[#EE5C13]">{formatCurrency(order.total)}</span></td>
                  <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                  <td className="px-6 py-4">
                    <Select value={order.status} onValueChange={(val) => onUpdateStatus(order.id, val as OrderStatus)}>
                      <SelectTrigger className="h-8 text-xs w-40 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#163A6E] border-white/10 text-white">{ORDER_STATUSES.map((s) => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ProductsTab() {
  const [products, setProducts] = useState<Product[]>(PRODUCTS)
  const [addOpen, setAddOpen] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', category: 'subs-15cm', image: '🥖' })

  const handleAdd = () => {
    if (!newProduct.name || !newProduct.price) { toast.error('Preencha nome e preço.'); return }
    const p: Product = { id: `custom-${Date.now()}`, name: newProduct.name, description: newProduct.description, price: parseFloat(newProduct.price), image: newProduct.image || '🥖', category: newProduct.category as Product['category'], active: true }
    setProducts((prev) => [...prev, p])
    setAddOpen(false)
    setNewProduct({ name: '', description: '', price: '', category: 'subs-15cm', image: '🥖' })
    toast.success('Produto adicionado!')
  }

  return (
    <div className="bg-[#163A6E] rounded-2xl border border-white/6 overflow-hidden">
      <div className="p-6 border-b border-white/6 flex items-center justify-between">
        <div><h3 className="font-bold text-white">Produtos</h3><p className="text-sm text-white/35">{products.filter((p) => p.active).length} ativos</p></div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#EE5C13] hover:bg-[#ff6b1a] text-white rounded-full px-4 flex items-center gap-2 shadow-[0_0_20px_rgba(238,92,19,0.3)]"><Plus size={16} />Adicionar</Button>
          </DialogTrigger>
          <DialogContent className="bg-[#163A6E] border-white/10 text-white">
            <DialogHeader><DialogTitle className="text-white">Novo Produto</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label className="text-white/50">Emoji/Ícone</Label><Input value={newProduct.image} onChange={(e) => setNewProduct((p) => ({ ...p, image: e.target.value }))} placeholder="🥖" className="w-20 bg-white/5 border-white/10 text-white" /></div>
              <div className="space-y-2"><Label className="text-white/50">Nome *</Label><Input value={newProduct.name} onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} placeholder="Nome do produto" className="bg-white/5 border-white/10 text-white placeholder:text-white/25" /></div>
              <div className="space-y-2"><Label className="text-white/50">Descrição</Label><Input value={newProduct.description} onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))} placeholder="Descrição" className="bg-white/5 border-white/10 text-white placeholder:text-white/25" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label className="text-white/50">Preço *</Label><Input type="number" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))} placeholder="21.90" className="bg-white/5 border-white/10 text-white placeholder:text-white/25" /></div>
                <div className="space-y-2"><Label className="text-white/50">Categoria</Label>
                  <Select value={newProduct.category} onValueChange={(v) => setNewProduct((p) => ({ ...p, category: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#163A6E] border-white/10 text-white">
                      <SelectItem value="subs-15cm">Subs 15cm</SelectItem>
                      <SelectItem value="subs-30cm">Subs 30cm</SelectItem>
                      <SelectItem value="combos">Combos</SelectItem>
                      <SelectItem value="bebidas">Bebidas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full bg-[#EE5C13] hover:bg-[#ff6b1a] text-white">Adicionar Produto</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-white/[0.03] text-left text-xs font-semibold text-white/30 uppercase"><th className="px-6 py-3">Produto</th><th className="px-6 py-3">Categoria</th><th className="px-6 py-3">Preço</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Ações</th></tr></thead>
          <tbody className="divide-y divide-white/6">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4"><div className="flex items-center gap-3"><span className="text-2xl">{product.image}</span><div><p className="font-medium text-sm text-white">{product.name}</p><p className="text-xs text-white/35 truncate max-w-xs">{product.description}</p></div></div></td>
                <td className="px-6 py-4"><span className="text-xs bg-white/8 text-white/60 px-2 py-1 rounded-full font-medium">{product.category}</span></td>
                <td className="px-6 py-4"><span className="font-bold text-[#EE5C13]">{formatCurrency(product.price)}</span></td>
                <td className="px-6 py-4">
                  <button onClick={() => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, active: !p.active } : p))}
                    className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
                      product.active ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' : 'bg-white/8 text-white/40 hover:bg-white/12'
                    }`}>{product.active ? 'Ativo' : 'Inativo'}</button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors"><Edit size={14} /></button>
                    <button onClick={() => { setProducts((prev) => prev.filter((p) => p.id !== product.id)); toast.success('Produto removido.') }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReportsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-[#163A6E] rounded-2xl border border-white/6 p-6">
        <h3 className="font-bold text-white mb-6">Vendas dos últimos 7 dias</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={CHART_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} />
            <YAxis tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: '#163A6E', color: '#fff' }} />
            <Bar dataKey="vendas" fill="#EE5C13" radius={[6, 6, 0, 0]} name="Pedidos" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-[#163A6E] rounded-2xl border border-white/6 p-6">
        <h3 className="font-bold text-white mb-6">Receita dos últimos 7 dias (R$)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={CHART_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} />
            <YAxis tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: '#163A6E', color: '#fff' }} formatter={(value: number) => [formatCurrency(value), 'Receita']} />
            <Bar dataKey="receita" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Receita" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const NAV_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { key: 'pedidos', label: 'Pedidos', icon: <ShoppingBag size={18} /> },
  { key: 'produtos', label: 'Produtos', icon: <Package size={18} /> },
  { key: 'relatorios', label: 'Relatórios', icon: <BarChart3 size={18} /> },
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    try { const stored = localStorage.getItem('mais-sub-orders'); if (stored) setOrders(JSON.parse(stored)) } catch { /* ignore */ }
  }, [])

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) => {
      const updated = prev.map((o) => o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o)
      try { localStorage.setItem('mais-sub-orders', JSON.stringify(updated)) } catch { /* ignore */ }
      return updated
    })
    toast.success('Status atualizado!')
  }

  return (
    <div className="min-h-screen bg-[#0B2C5C] flex">
      <aside className="w-64 bg-[#0A2452] border-r border-white/6 text-white flex flex-col fixed h-full z-10 hidden lg:flex">
        <div className="p-6 border-b border-white/6">
          <h1 className="text-xl font-black tracking-[-0.02em]">MAIS <span className="text-[#EE5C13]">SUB</span></h1>
          <p className="text-white/35 text-xs mt-0.5">Painel Administrativo</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button key={item.key} onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                activeTab === item.key ? 'bg-[#EE5C13] text-white shadow-[0_0_20px_rgba(238,92,19,0.25)]' : 'text-white/50 hover:bg-white/6 hover:text-white'
              }`}>
              {item.icon}{item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/6 text-xs text-white/25">⚠️ Área restrita. Adicione autenticação antes de publicar.</div>
      </aside>

      <main className="lg:ml-64 flex-1 flex flex-col">
        <header className="bg-[#0A2452] border-b border-white/6 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="font-bold text-white">{NAV_ITEMS.find((n) => n.key === activeTab)?.label}</h2>
            <p className="text-xs text-white/30">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex lg:hidden gap-2">
            {NAV_ITEMS.map((item) => (
              <button key={item.key} onClick={() => setActiveTab(item.key)} title={item.label}
                className={`p-2 rounded-lg transition-colors ${activeTab === item.key ? 'bg-[#EE5C13] text-white' : 'text-white/40 hover:bg-white/8'}`}>
                {item.icon}
              </button>
            ))}
          </div>
        </header>
        <div className="p-6 flex-1">
          {activeTab === 'dashboard' && <DashboardTab orders={orders} />}
          {activeTab === 'pedidos' && <OrdersTab orders={orders} onUpdateStatus={updateOrderStatus} />}
          {activeTab === 'produtos' && <ProductsTab />}
          {activeTab === 'relatorios' && <ReportsTab />}
        </div>
      </main>
    </div>
  )
}
