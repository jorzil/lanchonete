"use client"

import { useEffect, useState } from "react"
import { Users, Plus, Pencil, Trash2, Shield, KeyRound } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  listManagedUsers, upsertAccount, deleteAccount, getAccountPassword,
  ROLE_LABELS, ROLE_PERMISSIONS, type Role, type ManagedUser,
} from "@/lib/admin-auth"
import { pullAdminUsers, pushAdminUsers } from "@/lib/admin-users-sync"

const ROLES = Object.keys(ROLE_LABELS) as Role[]

export default function UsuariosPage() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [open, setOpen] = useState(false)
  const [isNew, setIsNew] = useState(true)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("atendente")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [toDelete, setToDelete] = useState<ManagedUser | null>(null)

  function refresh() { setUsers(listManagedUsers()) }

  useEffect(() => {
    pullAdminUsers().then(() => refresh())
  }, [])

  function openNew() {
    setIsNew(true); setName(""); setEmail(""); setRole("atendente"); setPassword(""); setError("")
    setOpen(true)
  }

  function openEdit(u: ManagedUser) {
    setIsNew(false); setName(u.name); setEmail(u.email); setRole(u.role)
    setPassword(getAccountPassword(u.email)); setError("")
    setOpen(true)
  }

  async function save() {
    const res = upsertAccount({ email, name, role, password })
    if (!res.ok) { setError(res.error ?? "Erro ao salvar."); return }
    await pushAdminUsers()
    setOpen(false)
    refresh()
  }

  async function confirmDelete() {
    if (!toDelete) return
    deleteAccount(toDelete.email)
    await pushAdminUsers()
    setToDelete(null)
    refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-[#EE5C13]" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usuários &amp; Acessos</h1>
            <p className="text-sm text-gray-500">Crie acessos para sua equipe com diferentes permissões</p>
          </div>
        </div>
        <Button onClick={openNew} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">
          <Plus className="mr-1 h-4 w-4" /> Novo usuário
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">Usuário (login)</th>
                <th className="px-5 py-3 font-medium">Função</th>
                <th className="px-5 py-3 font-medium">Acessos</th>
                <th className="px-5 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.email} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-5 py-3 text-gray-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <Badge className="bg-orange-100 text-orange-700 gap-1"><Shield size={11} /> {ROLE_LABELS[u.role]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">{ROLE_PERMISSIONS[u.role].length} módulo(s)</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </Button>
                      {u.isDefault ? (
                        <span className="text-[10px] text-gray-300 px-2">conta mestre</span>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setToDelete(u)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Editor */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="admin-theme max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-[#EE5C13]" /> {isNew ? "Novo usuário" : "Editar usuário"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João Silva" />
            </div>
            <div className="space-y-1.5">
              <Label>Usuário (login)</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ex: joao" disabled={!isNew}
                autoCapitalize="none" />
              {!isNew && <p className="text-[11px] text-gray-400">O login não pode ser alterado.</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Senha</Label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Defina a senha" />
            </div>
            <div className="space-y-1.5">
              <Label>Função / Permissões</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-gray-400">
                Acessa: {ROLE_PERMISSIONS[role].join(", ")}
              </p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-[#EE5C13] text-white hover:bg-[#FF6B1A]">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Remover acesso?</h3>
            <p className="mt-1 text-sm text-gray-500">
              O usuário <strong>{toDelete.name}</strong> ({toDelete.email}) não poderá mais acessar o sistema.
            </p>
            <div className="mt-5 flex gap-3">
              <button className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setToDelete(null)}>Cancelar</button>
              <button className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600" onClick={confirmDelete}>Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
