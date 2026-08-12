// ============================================================================
// PIX Copia e Cola (BR Code / EMV QRCPS-MPM do Banco Central).
//
// Gera o payload estático de cobrança a partir da chave PIX da loja. Não
// depende de banco nem de API: o mesmo texto serve para o QR Code e para o
// botão "copiar código". Como é estático, o banco NÃO avisa o sistema quando
// o cliente paga — a confirmação continua sendo do operador.
// ============================================================================

export interface PixConfig {
  /** Chave PIX: CPF/CNPJ, telefone, e-mail ou chave aleatória. */
  key: string
  /** Nome do recebedor, como aparece no app do cliente (máx. 25). */
  receiverName: string
  /** Cidade do recebedor (máx. 15). */
  city: string
  enabled: boolean
}

export const DEFAULT_PIX_CONFIG: PixConfig = {
  key: '',
  receiverName: 'MAIS SUB',
  city: 'GOV VALADARES',
  enabled: false,
}

/** Campo no formato EMV: id + tamanho em 2 dígitos + valor. */
function field(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`
}

/**
 * CRC16/CCITT-FALSE, exigido pelo padrão no campo 63.
 * Sem ele (ou com ele errado) o app do banco recusa o código.
 */
function crc16(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * Remove acento e caractere fora do ASCII imprimível: o padrão só aceita esse
 * conjunto, e um "ç" no nome faz o app recusar o código.
 */
function sanitize(text: string, max: number): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim()
    .slice(0, max)
    .toUpperCase()
}

/** O identificador da transação aceita só letras e números (até 25). */
function sanitizeTxid(txid: string): string {
  const clean = txid.replace(/[^A-Za-z0-9]/g, '').slice(0, 25)
  return clean || '***'
}

/**
 * Monta o payload do PIX Copia e Cola.
 * @param amount valor em reais; omita para o cliente digitar o valor.
 */
export function buildPixPayload(cfg: PixConfig, amount?: number, txid = '***'): string {
  const key = cfg.key.trim()
  if (!key) return ''

  // Conta do recebedor (26): GUI fixo do PIX + a chave
  const merchantAccount = field('00', 'br.gov.bcb.pix') + field('01', key)

  const parts = [
    field('00', '01'),                                   // versão do payload
    field('26', merchantAccount),
    field('52', '0000'),                                 // categoria do comerciante
    field('53', '986'),                                  // moeda: BRL
  ]

  // Valor: sempre com 2 casas e ponto decimal. Ausente = cliente digita.
  if (amount != null && amount > 0) {
    parts.push(field('54', amount.toFixed(2)))
  }

  parts.push(
    field('58', 'BR'),                                   // país
    field('59', sanitize(cfg.receiverName, 25)),
    field('60', sanitize(cfg.city, 15)),
    field('62', field('05', sanitizeTxid(txid))),        // identificador
  )

  // O CRC é calculado sobre o payload já com "6304" no fim.
  const partial = parts.join('') + '6304'
  return partial + crc16(partial)
}

/** Confere se a configuração dá para gerar um código válido. */
export function isPixReady(cfg: PixConfig | null): cfg is PixConfig {
  return !!cfg && cfg.enabled && cfg.key.trim().length > 0 && cfg.receiverName.trim().length > 0
}

export async function fetchPixConfig(): Promise<PixConfig> {
  try {
    const res = await fetch('/api/pix-config', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      return { ...DEFAULT_PIX_CONFIG, ...(data.pix ?? {}) }
    }
  } catch {}
  return DEFAULT_PIX_CONFIG
}

export async function patchPixConfig(pix: Partial<PixConfig>): Promise<boolean> {
  try {
    const res = await fetch('/api/pix-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pix }),
    })
    const data = await res.json().catch(() => ({}))
    return res.ok && !!data.ok
  } catch {
    return false
  }
}
