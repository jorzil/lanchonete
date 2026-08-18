'use client'

import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { Copy, Check, QrCode } from 'lucide-react'
import { formatCurrency } from '@/lib/data'
import { buildPixPayload, fetchPixConfig, isPixReady, type PixConfig } from '@/lib/pix'

/**
 * QR Code + Copia e Cola do PIX da loja.
 * Só aparece quando o admin cadastrou a chave em Configurações.
 */
export function PixPayment({ amount, txid, className = '' }: {
  amount: number
  /** Número do pedido — vira o identificador da transação no extrato. */
  txid?: string
  className?: string
}) {
  const [cfg, setCfg] = useState<PixConfig | null>(null)
  const [copied, setCopied] = useState(false)
  // Cobrança do banco (Sicoob): quando existe, o pagamento é confirmado sozinho
  const [cobranca, setCobranca] = useState<string | null>(null)
  const [tentouBanco, setTentouBanco] = useState(false)

  useEffect(() => { fetchPixConfig().then(setCfg) }, [])

  // Tenta a cobrança no banco primeiro. Se não estiver ligada ou falhar, o QR
  // estático continua valendo — o cliente nunca fica sem forma de pagar.
  useEffect(() => {
    if (!txid || tentouBanco) return
    setTentouBanco(true)
    fetch('/api/pix/sicoob/cobranca', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber: txid, valor: amount }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.ok && d.cobranca?.pixCopiaECola) setCobranca(d.cobranca.pixCopiaECola) })
      .catch(() => {})
  }, [txid, amount, tentouBanco])

  const estatico = isPixReady(cfg) ? buildPixPayload(cfg, amount, txid) : ''
  const payload = cobranca || estatico
  if (!payload) return null

  async function copiar() {
    try {
      await navigator.clipboard.writeText(payload)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Sem permissão de área de transferência: o cliente seleciona o texto.
    }
  }

  return (
    <div className={`rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-5 ${className}`}>
      <p className="flex items-center justify-center gap-2 text-[13px] font-black uppercase tracking-widest text-emerald-400">
        <QrCode size={15} /> Pague com PIX
      </p>
      <p className="mt-1 text-center text-sm text-white/50">
        Escaneie o código no app do seu banco
      </p>

      {/* Fundo branco é exigência de leitura: o leitor precisa do contraste. */}
      <div className="mx-auto mt-4 w-fit rounded-xl bg-white p-3">
        <QRCode value={payload} size={180} level="M" />
      </div>

      <p className="mt-3 text-center text-lg font-black text-white">{formatCurrency(amount)}</p>

      <button
        type="button"
        onClick={copiar}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors ${
          copied
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            : 'bg-emerald-500 text-white hover:bg-emerald-600'
        }`}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? 'Código copiado!' : 'Copiar código PIX'}
      </button>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-white/35">
        {cobranca
          ? 'Assim que o pagamento cair, seu pedido é confirmado automaticamente.'
          : 'Após pagar, envie o comprovante no WhatsApp para agilizarmos seu pedido.'}
      </p>
    </div>
  )
}
