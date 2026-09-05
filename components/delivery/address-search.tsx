'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, Loader2, MapPin } from 'lucide-react'

/**
 * Busca de endereço com sugestões, como no iFood.
 *
 * O cliente digita "rua sete 2480" e escolhe numa lista, em vez de decorar o
 * CEP. Some o erro de digitação, some o CEP que ninguém sabe de cor, e o
 * endereço já vem com a coordenada exata — que é o que o frete precisa.
 *
 * A chave do Google fica no servidor: este componente fala com /api/endereco.
 */
export interface EnderecoEscolhido {
  lat: number
  lng: number
  logradouro: string
  numero: string
  bairro: string
  cidade: string
  uf: string
  cep: string
  enderecoCompleto: string
}

interface Sugestao { id: string; principal: string; secundaria: string }

/**
 * Agrupa as teclas de uma mesma busca.
 *
 * O Google cobra por sessão de busca, não por tecla: sem isso, cada letra
 * digitada viraria uma cobrança separada. Um token novo a cada endereço
 * escolhido.
 */
function novoToken(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {}
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function AddressSearch({ onEscolher }: { onEscolher: (e: EnderecoEscolhido) => void }) {
  const [texto, setTexto] = useState('')
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [buscando, setBuscando] = useState(false)
  const [aberto, setAberto] = useState(false)
  const tokenRef = useRef(novoToken())
  const buscaRef = useRef(0)
  const caixaRef = useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora — a lista sobrepõe o formulário e atrapalharia.
  useEffect(() => {
    const aoClicar = (e: MouseEvent) => {
      if (caixaRef.current && !caixaRef.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', aoClicar)
    return () => document.removeEventListener('mousedown', aoClicar)
  }, [])

  // Espera o cliente parar de digitar: uma busca por tecla gastaria a cota à toa.
  useEffect(() => {
    if (texto.trim().length < 4) { setSugestoes([]); return }
    const minhaVez = ++buscaRef.current
    setBuscando(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/endereco?q=${encodeURIComponent(texto)}&token=${tokenRef.current}`,
          { cache: 'no-store' },
        )
        const d = await res.json().catch(() => ({}))
        // Resposta atrasada de uma busca antiga não pode substituir a atual.
        if (buscaRef.current !== minhaVez) return
        setSugestoes(d?.sugestoes ?? [])
        setAberto(true)
      } catch {
        if (buscaRef.current === minhaVez) setSugestoes([])
      } finally {
        if (buscaRef.current === minhaVez) setBuscando(false)
      }
    }, 450)
    return () => clearTimeout(t)
  }, [texto])

  async function escolher(s: Sugestao) {
    setAberto(false)
    setBuscando(true)
    try {
      const res = await fetch(
        `/api/endereco?id=${encodeURIComponent(s.id)}&token=${tokenRef.current}`,
        { cache: 'no-store' },
      )
      const d = await res.json().catch(() => ({}))
      if (d?.ok && d.endereco) {
        setTexto(`${s.principal} — ${s.secundaria}`)
        onEscolher(d.endereco as EnderecoEscolhido)
      }
    } catch {}
    // Endereço escolhido encerra a sessão de busca: a próxima começa do zero.
    tokenRef.current = novoToken()
    setBuscando(false)
  }

  return (
    <div ref={caixaRef} className="relative">
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onFocus={() => sugestoes.length > 0 && setAberto(true)}
          placeholder="Digite a rua e o número"
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-9 text-white outline-none placeholder:text-white/25 focus:border-brand"
        />
        {buscando && (
          <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-white/40" />
        )}
      </div>

      {aberto && sugestoes.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#012B52] shadow-2xl">
          {sugestoes.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => escolher(s)}
                className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-white/10"
              >
                <MapPin size={15} className="mt-0.5 shrink-0 text-brand" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">{s.principal}</span>
                  <span className="block truncate text-[12px] text-white/45">{s.secundaria}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {aberto && !buscando && sugestoes.length === 0 && texto.trim().length >= 4 && (
        <p className="absolute z-30 mt-1 w-full rounded-xl border border-white/10 bg-[#012B52] px-4 py-3 text-[13px] text-white/45">
          Nenhum endereço encontrado. Preencha os campos abaixo à mão.
        </p>
      )}
    </div>
  )
}
