export function isEvolutionConfigured(): boolean {
  return !!(
    process.env.EVOLUTION_API_URL &&
    process.env.EVOLUTION_API_KEY &&
    process.env.EVOLUTION_INSTANCE_NAME
  )
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

  try {
    const res = await fetch(`${url}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: apiKey },
      body: JSON.stringify({ number, text }),
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data?.message ?? `HTTP ${res.status}` }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' }
  }
}
