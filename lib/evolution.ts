export function isEvolutionConfigured(): boolean {
  return !!(
    process.env.EVOLUTION_API_URL &&
    process.env.EVOLUTION_API_KEY &&
    process.env.EVOLUTION_INSTANCE_NAME
  )
}

async function resolveWhatsAppNumber(
  url: string,
  apiKey: string,
  instance: string,
  number: string,
): Promise<string> {
  // Tenta verificar o número correto no WhatsApp (com ou sem 9º dígito)
  try {
    const res = await fetch(`${url}/chat/whatsappNumbers/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: apiKey },
      body: JSON.stringify({ numbers: [number] }),
    })
    if (res.ok) {
      const data = await res.json()
      const found = Array.isArray(data) ? data[0] : null
      if (found?.exists && found?.jid) {
        // Retorna apenas os dígitos do JID (remove @s.whatsapp.net)
        return found.jid.replace('@s.whatsapp.net', '').replace('@c.us', '')
      }
    }
  } catch {}
  return number
}

export async function sendEvolutionMessage(
  phone: string,
  text: string,
): Promise<{ success: boolean; error?: string }> {
  const url      = process.env.EVOLUTION_API_URL?.replace(/\/$/, '')
  const apiKey   = process.env.EVOLUTION_API_KEY
  const instance = process.env.EVOLUTION_INSTANCE_NAME

  if (!url || !apiKey || !instance) {
    return { success: false, error: 'Evolution API não configurada' }
  }

  const digits = phone.replace(/\D/g, '')
  const number = digits.startsWith('55') ? digits : `55${digits}`

  // Resolve o número correto no WhatsApp antes de enviar
  const resolvedNumber = await resolveWhatsAppNumber(url, apiKey, instance, number)

  try {
    const res = await fetch(`${url}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: apiKey },
      body: JSON.stringify({ number: resolvedNumber, text }),
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data?.message ?? `HTTP ${res.status}` }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' }
  }
}
