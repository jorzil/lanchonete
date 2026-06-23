import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabaseConfigured =
  url.length > 10 &&
  !url.includes('placeholder') &&
  key.length > 20 &&
  !key.includes('placeholder')

export const supabase = supabaseConfigured
  ? createClient(url, key, { realtime: { params: { eventsPerSecond: 10 } } })
  : (null as unknown as ReturnType<typeof createClient>)
