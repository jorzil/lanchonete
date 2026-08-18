import { NextRequest, NextResponse } from 'next/server'
import { getSicoobConfig } from '@/lib/pix-sicoob-store'
import { getSicoobToken, criarCobranca, registrarWebhook, hasCertificate } from '@/lib/pix-sicoob'

export const dynamic = 'force-dynamic'

/**
 * Diagnóstico em etapas. Como só dá para testar em produção, cada passo é
 * reportado separado — assim dá para ver ONDE parou, não só que falhou.
 */
export async function POST(req: NextRequest) {
  const cfg = await getSicoobConfig()
  const { cadastrarWebhook } = await req.json().catch(() => ({ cadastrarWebhook: false }))
  const etapas: Array<{ etapa: string; ok: boolean; detalhe: string }> = []

  etapas.push({
    etapa: 'Certificado',
    ok: cfg.environment === 'sandbox' || hasCertificate(),
    detalhe: hasCertificate()
      ? 'Certificado carregado das variáveis de ambiente.'
      : cfg.environment === 'sandbox'
        ? 'Sandbox não exige certificado.'
        : 'Faltam SICOOB_CERT_PEM e SICOOB_KEY_PEM na Vercel.',
  })

  const token = await getSicoobToken(cfg, true)
  etapas.push({
    etapa: 'Token de acesso',
    ok: token.ok,
    detalhe: token.ok ? 'Autenticado com sucesso.' : (token.error ?? 'falha'),
  })

  if (token.ok) {
    const cob = await criarCobranca(cfg, { valor: 0.01, orderNumber: 'MSTESTE', descricao: 'Teste de integração' })
    etapas.push({
      etapa: 'Criar cobrança (R$ 0,01)',
      ok: cob.ok,
      detalhe: cob.ok ? `Cobrança criada. txid ${cob.data?.txid}` : (cob.error ?? 'falha'),
    })

    if (cadastrarWebhook && cob.ok) {
      const origem = req.headers.get('origin') ?? `https://${req.headers.get('host')}`
      const url = `${origem}/api/pix/sicoob/webhook`
      const w = await registrarWebhook(cfg, url)
      etapas.push({
        etapa: 'Cadastrar webhook',
        ok: w.ok,
        detalhe: w.ok ? `Webhook apontando para ${url}` : (w.error ?? 'falha'),
      })
    }
  }

  return NextResponse.json({ ok: etapas.every((e) => e.ok), etapas })
}
