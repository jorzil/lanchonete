import { NextRequest, NextResponse } from 'next/server'
import { ENTREGAS_USER, ENTREGAS_PASS, ENTREGAS_TOKEN } from '@/lib/entregas-auth'

export async function POST(req: NextRequest) {
  try {
    const { user, password } = await req.json()
    if (
      typeof user === 'string' &&
      typeof password === 'string' &&
      user.trim().toLowerCase() === ENTREGAS_USER.toLowerCase() &&
      password === ENTREGAS_PASS
    ) {
      return NextResponse.json({ ok: true, token: ENTREGAS_TOKEN })
    }
    return NextResponse.json({ ok: false, error: 'Usuário ou senha inválidos' }, { status: 401 })
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida' }, { status: 400 })
  }
}
