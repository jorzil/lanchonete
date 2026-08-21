// ============================================================================
// Telefone: uma forma canônica para o mesmo número.
//
// O cliente digita como quiser — "(33) 99999-1234", "33 99999 1234",
// "+55 33 99999-1234" — e o telefone é a chave que identifica a pessoa (tanto
// na tabela customers quanto no agrupamento da tela de Clientes). Sem
// normalizar, o mesmo cliente vira várias pessoas e o histórico se fragmenta.
// ============================================================================

/**
 * Chave canônica: só dígitos, sem o 55 do país, com o nono dígito quando o
 * número é de celular. Devolve o texto original (minúsculo) quando não há
 * dígitos — é o caso de "pdv-balcao" e dos pedidos do iFood sem telefone.
 */
export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return ''
  const texto = String(raw).trim()
  // Marcadores internos ("pdv-balcao", "ifood-6fa10b35") têm letras. Extrair os
  // dígitos deles produziria chaves sem sentido — e juntaria clientes distintos.
  if (/[a-zA-Z]/.test(texto)) return texto.toLowerCase()
  const digits = texto.replace(/\D/g, '')
  if (!digits) return texto.toLowerCase()

  let n = digits
  // Código do país: só remove quando sobra um número plausível (10 ou 11).
  if (n.length > 11 && n.startsWith('55')) n = n.slice(2)
  // Alguns cadastros trazem 0 antes do DDD
  if (n.length === 12 && n.startsWith('0')) n = n.slice(1)

  // Fixo com 10 dígitos vira celular com 11 quando o prefixo é de móvel (6-9).
  // Assim "33 9999-1234" e "33 99999-1234" viram a mesma pessoa.
  if (n.length === 10 && /[6-9]/.test(n[2])) n = `${n.slice(0, 2)}9${n.slice(2)}`

  return n
}

/** Mesma pessoa? */
export function samePhone(a: string, b: string): boolean {
  const na = normalizePhone(a)
  return !!na && na === normalizePhone(b)
}

/** Exibição: (33) 99999-1234. Devolve o original quando não dá para formatar. */
export function formatPhone(raw: string | null | undefined): string {
  const n = normalizePhone(raw)
  if (/^\d{11}$/.test(n)) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
  if (/^\d{10}$/.test(n)) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`
  return String(raw ?? '')
}

/** True quando o "telefone" é na verdade um marcador interno (PDV, iFood). */
export function isInternalPhone(raw: string | null | undefined): boolean {
  const s = String(raw ?? '')
  return /[a-zA-Z]/.test(s) || !/\d/.test(s)
}
