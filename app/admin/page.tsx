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
import { Logo } from '@/components/brand/logo'
import { toast } from 'sonner'

type Tab = 'dashboard' | 'pedidos' | 'produtos' | 'relatorios'

const ORDER_STATUSES: { key: OrderStatus; label: string; color: string }[] = [
  { key: 'novo', label: 'Novo', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { key: 'confirmado', label: 'Confirmado', color: 'bg-amber-50 text-amber-800 border-amber-100' },
  { key: 'em-preparo', label: 'Em preparo', color: 'bg-[#FCE7D7] text-[#9C3D0E] border-[#F5D5BB]' },
  { key: 'saiu-para-entrega', label: 'Saiu para entrega', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  { key: 'entregue', label: 'Entregue', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { key: 'cancelado', label: 'Cancelado', color: 'bg-red-50 text-red-700 border-red-100' },
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

function StatCard({ title, value, sub, icon }: { title: string; value: string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E8E0D0]">
      <div className="flex items-start justify-between mb-4">
        <p className="text-[12px] text-[#8B95A8] font-medium">{title}</p>
        <div className="text-[#EE5C13]">{icon}</div>
      </div>
      <p className="h-editorial text-[#0E1F3C] text-[36px] tabular-nums leading-none">{value}</p>
      <p className="text-[11.5px] text-[#8B95A8] mt-2">{sub}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const found = ORDER_STATUSES.find((s) => s.key === status)
  return <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${found?.color || 'bg-[#F2ECDF] text-[#3D4D6A] border-[#E8E0D0]'}`}>{found?.label || status}</span>
}

function DashboardTab({ orders }: { orders: Order[] }) {
  const today = new Date().toDateString()
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today)
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0)
  const avgTicket = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Pedidos hoje" value={String(todayOrders.length || 42)} sub="+12% vs ontem" icon={<ShoppingBag size={18} strokeWidth={1.8} />} />
        <StatCard title="Receita hoje" value={formatCurrency(todayRevenue || 1260)} sub="+8% vs ontem" icon={<DollarSign size={18} strokeWidth={1.8} />} />
        <StatCard title="Ticket médio" value={formatCurrency(avgTicket || 30)} sub="Por pedido" icon={<TrendingUp size={18} strokeWidth={1.8} />} />
        <StatCard title="Clientes ativos" value="128" sub="Esta semana" icon={<Users size={18} strokeWidth={1.8} />} />
      </div>
      <div className="bg-white rounded-2xl border border-[#E8E0D0] p-6">
        <h3 className="h-editorial text-[#0E1F3C] text-[22px] mb-5">Pedidos recentes</h3>
        {orders.length === 0 ? <p className="text-[#8B95A8] text-[13px]">Nenhum pedido ainda.</p> : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3 border-b border-[#E8E0D0] last:border-0">
                <div><p className="font-medium text-[#0E1F3C] text-[13px]">{order.orderNumber}</p><p className="text-[12px] text-[#8B95A8]">{order.customer.name}</p></div>
                <div className="flex items-center gap-3"><StatusBadge status={order.status} /><span className="font-medium text-[#0E1F3C] text-[13px] tabular-nums">{formatCurrency(order.total)}</span></div>
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
    <div className="bg-white rounded-2xl border border-[#E8E0D0] overflow-hidden">
      <div className="p-6 border-b border-[#E8E0D0]">
        <h3 className="h-editorial text-[#0E1F3C] text-[22px]">Todos os pedidos</h3>
        <p className="text-[12.5px] text-[#8B95A8] mt-1">{orders.length} pedidos</p>
      </div>
      {orders.length === 0 ? (
        <div className="p-16 text-center text-[#8B95A8]"><ShoppingBag size={32} strokeWidth={1.5} className="mx-auto mb-3 opacity-40" /><p className="text-[13px]">Nenhum pedido ainda.</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-[#F2ECDF] text-left text-[10.5px] font-medium text-[#8B95A8] uppercase tracking-[0.12em]">
              <th className="px-6 py-3">Pedido</th><th className="px-6 py-3">Cliente</th><th className="px-6 py-3">Itens</th><th className="px-6 py-3">Total</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Ação</th>
            </tr></thead>
            <tbody className="divide-y divide-[#E8E0D0]">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FAF6EE] transition-colors">
                  <td className="px-6 py-4"><p className="font-medium text-[13px] text-[#0E1F3C] tabular-nums">{order.orderNumber}</p><p className="text-[11px] text-[#8B95A8] tabular-nums">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p></td>
                  <td className="px-6 py-4"><p className="font-medium text-[13px] text-[#0E1F3C]">{order.customer.name}</p><p className="text-[11px] text-[#8B95A8]">{order.customer.phone}</p></td>
                  <td className="px-6 py-4"><span className="text-[13px] text-[#3D4D6A]">{order.items.length} item{order.items.length !== 1 && 's'}</span></td>
                  <td className="px-6 py-4"><span className="font-medium text-[13px] text-[#0E1F3C] tabular-nums">{formatCurrency(order.total)}</span></td>
                  <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                  <td className="px-6 py-4">
                    <Select value={order.status} onValueChange={(val) => onUpdateStatus(order.id, val as OrderStatus)}>
                      <SelectTrigger className="h-8 text-[12px] w-44 bg-white border-[#E8E0D0] text-[#0E1F3C]"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white border-[#E8E0D0] text-[#0E1F3C]">{ORDER_STATUSES.map((s) => <SelectItem key={s.key} value={s.key} className="text-[12px]">{s.label}</SelectItem>)}</SelectContent>
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
    <div className="bg-white rounded-2xl border border-[#E8E0D0] overflow-hidden">
      <div className="p-6 border-b border-[#E8E0D0] flex items-center justify-between">
        <div><h3 className="h-editorial text-[#0E1F3C] text-[22px]">Produtos</h3><p className="text-[12.5px] text-[#8B95A8] mt-1">{products.filter((p) => p.active).length} ativos</p></div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0E1F3C] hover:bg-[#1a2e54] text-[#FAF6EE] rounded-full px-4 h-9 flex items-center gap-2 text-[13px]"><Plus size={14} strokeWidth={1.8} />Novo produto</Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-[#E8E0D0] text-[#0E1F3C]">
            <DialogHeader><DialogTitle className="h-editorial text-[#0E1F3C] text-[22px]">Novo produto</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5"><Label className="text-[12px] text-[#3D4D6A]">Emoji/ícone</Label><Input value={newProduct.image} onChange={(e) => setNewProduct((p) => ({ ...p, image: e.target.value }))} placeholder="🥖" className="w-20 bg-white border-[#E8E0D0] text-[#0E1F3C]" /></div>
              <div className="space-y-1.5"><Label className="text-[12px] text-[#3D4D6A]">Nome *</Label><Input value={newProduct.name} onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} placeholder="Nome do produto" className="bg-white border-[#E8E0D0] text-[#0E1F3C] placeholder:text-[#8B95A8]" /></div>
              <div className="space-y-1.5"><Label className="text-[12px] text-[#3D4D6A]">Descrição</Label><Input value={newProduct.description} onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))} placeholder="Descrição" className="bg-white border-[#E8E0D0] text-[#0E1F3C] placeholder:text-[#8B95A8]" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-[12px] text-[#3D4D6A]">Preço *</Label><Input type="number" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))} placeholder="21.90" className="bg-white border-[#E8E0D0] text-[#0E1F3C] placeholder:text-[#8B95A8]" /></div>
                <div className="space-y-1.5"><Label className="text-[12px] text-[#3D4D6A]">Categoria</Label>
                  <Select value={newProduct.category} onValueChange={(v) => setNewProduct((p) => ({ ...p, category: v }))}>
                    <SelectTrigger className="bg-white border-[#E8E0D0] text-[#0E1F3C]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border-[#E8E0D0] text-[#0E1F3C]">
                      <SelectItem value="subs-15cm">Subs 15cm</SelectItem>
                      <SelectItem value="subs-30cm">Subs 30cm</SelectItem>
                      <SelectItem value="combos">Combos</SelectItem>
                      <SelectItem value="bebidas">Bebidas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full bg-[#0E1F3C] hover:bg-[#1a2e54] text-[#FAF6EE]">Adicionar produto</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-[#F2ECDF] text-left text-[10.5px] font-medium text-[#8B95A8] uppercase tracking-[0.12em]"><th className="px-6 py-3">Produto</th><th className="px-6 py-3">Categoria</th><th className="px-6 py-3">Preço</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Ações</th></tr></thead>
          <tbody className="divide-y divide-[#E8E0D0]">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-[#FAF6EE] transition-colors">
                <td className="px-6 py-4"><div className="flex items-center gap-3"><span className="text-2xl">{product.image}</span><div><p className="font-medium text-[13px] text-[#0E1F3C]">{product.name}</p><p className="text-[11.5px] text-[#8B95A8] truncate max-w-xs">{product.description}</p></div></div></td>
                <td className="px-6 py-4"><span className="text-[11px] bg-[#F2ECDF] text-[#3D4D6A] px-2 py-1 rounded-full font-medium border border-[#E8E0D0]">{product.category}</span></td>
                <td className="px-6 py-4"><span className="font-medium text-[13px] text-[#0E1F3C] tabular-nums">{formatCurrency(product.price)}</span></td>
                <td className="px-6 py-4">
                  <button onClick={() => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, active: !p.active } : p))}
                    className={`text-[11px] font-medium px-3 py-1 rounded-full border transition-colors ${
                      product.active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-[#F2ECDF] text-[#8B95A8] border-[#E8E0D0]'
                    }`}>{product.active ? 'Ativo' : 'Inativo'}</button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-[#F2ECDF] text-[#3D4D6A] transition-colors"><Edit size={13} strokeWidth={1.8} /></button>
                    <button onClick={() => { setProducts((prev) => prev.filter((p) => p.id !== product.id)); toast.success('Produto removido.') }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={13} strokeWidth={1.8} /></button>
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
  const tooltipStyle = { borderRadius: '8px', border: '1px solid #E8E0D0', background: '#FFFFFF', color: '#0E1F3C', fontSize: '12px' }
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-[#E8E0D0] p-7">
        <h3 className="h-editorial text-[#0E1F3C] text-[22px] mb-6">Vendas — últimos 7 dias</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={CHART_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#8B95A8' }} stroke="#E8E0D0" />
            <YAxis tick={{ fontSize: 12, fill: '#8B95A8' }} stroke="#E8E0D0" />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(238,92,19,0.06)' }} />
            <Bar dataKey="vendas" fill="#EE5C13" radius={[4, 4, 0, 0]} name="Pedidos" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-2xl border border-[#E8E0D0] p-7">
        <h3 className="h-editorial text-[#0E1F3C] text-[22px] mb-6">Receita — últimos 7 dias</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={CHART_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#8B95A8' }} stroke="#E8E0D0" />
            <YAxis tick={{ fontSize: 12, fill: '#8B95A8' }} stroke="#E8E0D0" />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(14,31,60,0.04)' }} formatter={(value: number) => [formatCurrency(value), 'Receita']} />
            <Bar dataKey="receita" fill="#0E1F3C" radius={[4, 4, 0, 0]} name="Receita" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const NAV_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} strokeWidth={1.8} /> },
  { key: 'pedidos', label: 'Pedidos', icon: <ShoppingBag size={16} strokeWidth={1.8} /> },
  { key: 'produtos', label: 'Produtos', icon: <Package size={16} strokeWidth={1.8} /> },
  { key: 'relatorios', label: 'Relatórios', icon: <BarChart3 size={16} strokeWidth={1.8} /> },
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
    <div className="min-h-screen bg-[#FAF6EE] flex">
      <aside className="w-64 bg-white border-r border-[#E8E0D0] flex flex-col fixed h-full z-10 hidden lg:flex">
        <div className="p-6 border-b border-[#E8E0D0]">
          <Logo height={32} />
          <p className="text-[11px] text-[#8B95A8] mt-3 uppercase tracking-[0.18em]">Admin</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button key={item.key} onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-[13px] transition-all ${
                activeTab === item.key ? 'bg-[#0E1F3C] text-[#FAF6EE]' : 'text-[#3D4D6A] hover:bg-[#F2ECDF]'
              }`}>
              {item.icon}{item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[#E8E0D0] text-[11px] text-[#8B95A8]">Área restrita. Adicione autenticação antes de publicar.</div>
      </aside>

      <main className="lg:ml-64 flex-1 flex flex-col">
        <header className="bg-[#FAF6EE]/85 backdrop-blur-xl border-b border-[#E8E0D0] px-6 py-5 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="h-editorial text-[#0E1F3C] text-[24px]">{NAV_ITEMS.find((n) => n.key === activeTab)?.label}</h2>
            <p className="text-[11.5px] text-[#8B95A8] mt-0.5">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex lg:hidden gap-2">
            {NAV_ITEMS.map((item) => (
              <button key={item.key} onClick={() => setActiveTab(item.key)} title={item.label}
                className={`p-2 rounded-lg transition-colors ${activeTab === item.key ? 'bg-[#0E1F3C] text-[#FAF6EE]' : 'text-[#3D4D6A] hover:bg-[#F2ECDF]'}`}>
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
