import { createClient } from '@supabase/supabase-js'

// Remove aspas duplas ou simples que podem ter sido coladas por engano e remove espaços
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/["']/g, "").trim()
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.replace(/["']/g, "").trim()

if (!supabaseUrl || !supabaseKey) {
  console.error('-------------------------------------------------------')
  console.error('❌ ERRO CRÍTICO: Variáveis do Supabase não encontradas.')
  console.error(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'OK' : 'FALTANDO'}`)
  console.error(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? 'OK' : 'FALTANDO'}`)
  console.error('Verifique se o arquivo .env.local está na pasta "codigo" e reinicie o servidor.')
  console.error('-------------------------------------------------------')
  throw new Error("Faltam as variáveis de ambiente do Supabase (.env.local)")
}

// Validação básica para ajudar no debug
if (supabaseKey.length < 20 || !supabaseKey.includes('.')) {
  console.error('❌ AVISO: A chave do Supabase parece inválida (muito curta ou formato errado).')
  console.error('Chave atual (início):', supabaseKey.substring(0, 10) + '...')
  console.error('Verifique se você copiou a chave "anon" / "public" inteira.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)