'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sandwich, Search } from 'lucide-react'
import Link from 'next/link'

export default function AcompanharEntradaPage() {
  const [numero, setNumero] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const clean = numero.trim().toUpperCase()
    if (!clean) return
    router.push(`/acompanhar/${clean}`)
  }

  return (
    <div className="min-h-screen bg-[#0B1F3A] flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-3 mb-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EE5C13]">
          <Sandwich className="h-5 w-5 text-white" />
        </div>
        <p className="text-white font-black text-xl">Mais<span className="text-[#EE5C13]">Sub</span></p>
      </Link>

      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <h1 className="text-white font-black text-2xl mb-2">Acompanhar Pedido</h1>
        <p className="text-white/40 text-sm mb-8">Digite o número do seu pedido para ver o status em tempo real.</p>

        <form onSubmit={handleSearch} className="space-y-4">
          <input
            type="text"
            value={numero}
            onChange={e => setNumero(e.target.value)}
            placeholder="Ex: MS-1234"
            className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white text-center text-lg font-bold placeholder:text-white/20 outline-none focus:border-[#EE5C13] transition-colors"
          />
          <button
            type="submit"
            disabled={!numero.trim()}
            className="w-full flex items-center justify-center gap-2 bg-[#EE5C13] hover:bg-orange-600 text-white font-black py-3 rounded-xl text-sm transition-colors disabled:opacity-40"
          >
            <Search size={16} /> Buscar pedido
          </button>
        </form>

        <p className="text-white/20 text-xs mt-6">
          O número do pedido foi enviado por WhatsApp após a confirmação.
        </p>
      </div>

      <Link href="/cardapio" className="mt-8 text-[#EE5C13] text-sm font-bold hover:underline">
        Fazer um novo pedido →
      </Link>
    </div>
  )
}
