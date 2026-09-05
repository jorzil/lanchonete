import { supabase, supabaseConfigured } from '@/lib/supabase'
import type { DeliveryConfig } from '@/lib/delivery-zones'

/**
 * Configuração de entrega lida direto do banco.
 *
 * A rota /api/delivery-config existe, mas chamá-la por HTTP de dentro de outra
 * rota gastaria uma viagem de rede à toa e ainda dependeria da URL própria
 * estar certa em produção. Aqui vamos direto na origem.
 */
export async function readDeliveryConfig(): Promise<DeliveryConfig | null> {
  if (!supabaseConfigured) return null
  const { data } = await supabase
    .from('customers').select('address_reference').eq('phone', '__delivery_config__').maybeSingle()
  if (!data?.address_reference) return null
  try {
    const cfg = JSON.parse(data.address_reference)
    return Array.isArray(cfg?.zones) && cfg.zones.length > 0 ? (cfg as DeliveryConfig) : null
  } catch {
    return null
  }
}
