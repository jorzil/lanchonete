'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle, Loader2, Database, Copy } from 'lucide-react'
import { toast } from 'sonner'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const configured = URL.startsWith('https://') && KEY.length > 10

const SCHEMA_SQL = `-- Cole este SQL no Supabase → SQL Editor → New Query

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  whatsapp TEXT,
  cpf TEXT,
  email TEXT,
  address_cep TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('entrega', 'retirada')),
  items JSONB NOT NULL DEFAULT '[]',
  address JSONB,
  payment_method TEXT NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo','aceito','em_preparo','pronto','saiu_entrega','entregue','cancelado')),
  notes TEXT,
  whatsapp_sent_at JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Políticas (permite tudo com anon key)
DROP POLICY IF EXISTS "allow_all_customers" ON customers;
CREATE POLICY "allow_all_customers" ON customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_orders" ON orders;
CREATE POLICY "allow_all_orders" ON orders FOR ALL USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;

-- Índices
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();`

type Status = 'idle' | 'checking' | 'ok' | 'error'

interface Check { label: string; status: Status; detail?: string }

export default function SetupPage() {
  const [checks, setChecks] = useState<Check[]>([
    { label: 'Variáveis de ambiente', status: 'idle' },
    { label: 'Conexão com Supabase', status: 'idle' },
    { label: 'Tabela orders', status: 'idle' },
    { label: 'Tabela customers', status: 'idle' },
    { label: 'RLS e permissões (INSERT)', status: 'idle' },
  ])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const update = (i: number, patch: Partial<Check>) =>
    setChecks(prev => prev.map((c, idx) => idx === i ? { ...c, ...patch } : c))

  async function runDiagnostic() {
    setRunning(true)
    setDone(false)

    // Check 0: env vars
    update(0, { status: 'checking' })
    await tick()
    if (!configured) {
      update(0, { status: 'error', detail: `URL: "${URL.slice(0, 20)}..." KEY: "${KEY.slice(0, 20)}..."` })
      setRunning(false); setDone(true); return
    }
    update(0, { status: 'ok', detail: `URL: ${URL.slice(0, 40)}...` })

    const sb = createClient(URL, KEY)

    // Check 1: connection
    update(1, { status: 'checking' })
    await tick()
    try {
      const { error } = await sb.from('orders').select('id').limit(0)
      if (error && error.code === '42P01') {
        update(1, { status: 'ok', detail: 'Conectado (tabela ainda não existe)' })
      } else if (error) {
        update(1, { status: 'error', detail: error.message })
        setRunning(false); setDone(true); return
      } else {
        update(1, { status: 'ok', detail: 'Conectado com sucesso' })
      }
    } catch (e: unknown) {
      update(1, { status: 'error', detail: String(e) })
      setRunning(false); setDone(true); return
    }

    // Check 2: orders table
    update(2, { status: 'checking' })
    await tick()
    const { error: ordErr } = await sb.from('orders').select('id').limit(1)
    if (ordErr) {
      update(2, { status: 'error', detail: ordErr.code === '42P01' ? 'Tabela não existe — aplique o schema SQL abaixo' : ordErr.message })
    } else {
      update(2, { status: 'ok' })
    }

    // Check 3: customers table
    update(3, { status: 'checking' })
    await tick()
    const { error: custErr } = await sb.from('customers').select('id').limit(1)
    if (custErr) {
      update(3, { status: 'error', detail: custErr.code === '42P01' ? 'Tabela não existe — aplique o schema SQL abaixo' : custErr.message })
    } else {
      update(3, { status: 'ok' })
    }

    // Check 4: RLS insert test
    update(4, { status: 'checking' })
    await tick()
    if (ordErr || custErr) {
      update(4, { status: 'error', detail: 'Não testado — tabelas não existem' })
    } else {
      const testNum = `DIAG-${Date.now()}`
      const { data: ins, error: insErr } = await sb.from('orders').insert({
        order_number: testNum,
        customer_name: '_diagnostic_',
        customer_phone: '00000000000',
        order_type: 'retirada',
        items: [],
        payment_method: 'pix',
        subtotal: 0, delivery_fee: 0, discount: 0, total: 0,
        status: 'novo',
      }).select('id').single()

      if (insErr) {
        update(4, { status: 'error', detail: insErr.message })
      } else {
        await sb.from('orders').delete().eq('id', ins.id)
        update(4, { status: 'ok', detail: 'INSERT e DELETE OK' })
      }
    }

    setRunning(false)
    setDone(true)
  }

  const tick = () => new Promise(r => setTimeout(r, 300))

  const allOk = checks.every(c => c.status === 'ok')
  const hasError = checks.some(c => c.status === 'error')

  function copySchema() {
    navigator.clipboard.writeText(SCHEMA_SQL)
    toast.success('SQL copiado! Cole no Supabase → SQL Editor → New Query → Run')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Diagnóstico do Sistema</h1>
        <p className="text-sm text-gray-500 mt-1">Verifica conexão com Supabase e tabelas do banco de dados</p>
      </div>

      <Card className="p-6 space-y-4">
        {checks.map((c, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {c.status === 'idle' && <div className="h-5 w-5 rounded-full border-2 border-gray-200" />}
              {c.status === 'checking' && <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}
              {c.status === 'ok' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {c.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
            </div>
            <div>
              <p className={`text-sm font-medium ${c.status === 'error' ? 'text-red-700' : c.status === 'ok' ? 'text-green-700' : 'text-gray-700'}`}>
                {c.label}
              </p>
              {c.detail && <p className="text-xs text-gray-400 mt-0.5">{c.detail}</p>}
            </div>
          </div>
        ))}

        <Button onClick={runDiagnostic} disabled={running} className="w-full mt-2 bg-[#0B2C5C] hover:bg-[#163A6E] text-white">
          {running ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verificando...</> : <><Database className="h-4 w-4 mr-2" /> Rodar Diagnóstico</>}
        </Button>

        {done && allOk && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Tudo funcionando! Pedidos e clientes serão salvos no banco de dados.
          </div>
        )}
        {done && hasError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Problemas encontrados. Aplique o schema SQL abaixo no Supabase.
          </div>
        )}
      </Card>

      {done && hasError && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Schema SQL — aplicar no Supabase</h2>
            <Button variant="outline" size="sm" onClick={copySchema} className="gap-2">
              <Copy className="h-3.5 w-3.5" /> Copiar SQL
            </Button>
          </div>

          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Acesse <strong>supabase.com</strong> → seu projeto</li>
            <li>Clique em <strong>SQL Editor</strong> no menu lateral</li>
            <li>Clique em <strong>New Query</strong></li>
            <li>Cole o SQL copiado acima</li>
            <li>Clique em <strong>Run</strong></li>
            <li>Volte aqui e rode o diagnóstico novamente</li>
          </ol>

          <pre className="text-xs bg-gray-900 text-green-400 rounded-lg p-4 overflow-auto max-h-64 font-mono leading-relaxed">
            {SCHEMA_SQL}
          </pre>
        </Card>
      )}
    </div>
  )
}
