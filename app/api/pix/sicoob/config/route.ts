import { NextRequest, NextResponse } from 'next/server'
import { getSicoobConfig, saveSicoobConfig } from '@/lib/pix-sicoob-store'
import { hasCertificate } from '@/lib/pix-sicoob'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cfg = await getSicoobConfig()
  // certificado não vai na resposta: só se ele existe
  return NextResponse.json({ sicoob: cfg, certificadoPresente: hasCertificate() })
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const p = body.sicoob ?? {}
    const cfg = await saveSicoobConfig({
      ...(typeof p.enabled === 'boolean' ? { enabled: p.enabled } : {}),
      ...(p.environment === 'producao' || p.environment === 'sandbox' ? { environment: p.environment } : {}),
      ...(typeof p.clientId === 'string' ? { clientId: p.clientId.trim() } : {}),
      ...(typeof p.pixKey === 'string' ? { pixKey: p.pixKey.trim() } : {}),
      ...(typeof p.tokenUrl === 'string' ? { tokenUrl: p.tokenUrl.trim() } : {}),
      ...(typeof p.apiBaseUrl === 'string' ? { apiBaseUrl: p.apiBaseUrl.trim() } : {}),
      ...(typeof p.expiracaoMinutos === 'number' && p.expiracaoMinutos > 0
        ? { expiracaoMinutos: Math.min(1440, Math.round(p.expiracaoMinutos)) } : {}),
      ...(typeof p.autoConfirmar === 'boolean' ? { autoConfirmar: p.autoConfirmar } : {}),
    })
    return NextResponse.json({ ok: true, sicoob: cfg, certificadoPresente: hasCertificate() })
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida' }, { status: 400 })
  }
}
