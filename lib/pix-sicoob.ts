// ============================================================================
// PIX Cobrança via Sicoob (SERVER-ONLY)
//
// Diferente do QR estático (lib/pix.ts), aqui o banco cria a cobrança e avisa
// o site por webhook quando o cliente paga — o pedido é confirmado sozinho.
//
// Autenticação: OAuth client_credentials. Em PRODUÇÃO o Sicoob exige mTLS com
// certificado ICP-Brasil; o sandbox dispensa. Os endereços não são fixos no
// código de propósito: vêm da tela, para serem copiados do portal do Sicoob.
// ============================================================================

import https from 'node:https'

export interface SicoobConfig {
  enabled: boolean
  /** 'sandbox' dispensa certificado; 'producao' exige. */
  environment: 'sandbox' | 'producao'
  clientId: string
  /** Chave PIX que recebe (a mesma cadastrada no Sicoob). */
  pixKey: string
  /** Endereço do token OAuth, copiado do portal. */
  tokenUrl: string
  /** Base da API PIX, copiada do portal (termina em /pix/api/v2). */
  apiBaseUrl: string
  /** Minutos de validade da cobrança. */
  expiracaoMinutos: number
  /** Confirma o pedido sozinho quando o webhook avisa o pagamento. */
  autoConfirmar: boolean
}

export const SICOOB_DEFAULTS: SicoobConfig = {
  enabled: false,
  environment: 'sandbox',
  clientId: '',
  pixKey: '',
  // Endereço do sandbox divulgado pelo Sicoob; confira no portal antes de usar.
  tokenUrl: 'https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token',
  apiBaseUrl: 'https://sandbox.sicoob.com.br/sicoob/sandbox/pix/api/v2',
  expiracaoMinutos: 30,
  autoConfirmar: true,
}

export const SICOOB_SCOPES = 'cob.read cob.write pix.read webhook.read webhook.write'

/**
 * Certificado de produção vem de variável de ambiente, nunca do banco: é uma
 * chave privada. Guarde em base64 na Vercel (SICOOB_CERT_PEM / SICOOB_KEY_PEM).
 */
function readCert(): { cert: string; key: string } | null {
  const cert = process.env.SICOOB_CERT_PEM
  const key = process.env.SICOOB_KEY_PEM
  if (!cert || !key) return null
  const decode = (v: string) => (v.includes('-----BEGIN') ? v : Buffer.from(v, 'base64').toString('utf8'))
  try {
    return { cert: decode(cert), key: decode(key) }
  } catch {
    return null
  }
}

export function hasCertificate(): boolean {
  return readCert() !== null
}

/** Agente HTTPS com o certificado do cliente (mTLS). null quando não há. */
function mtlsAgent(): https.Agent | undefined {
  const c = readCert()
  if (!c) return undefined
  return new https.Agent({ cert: c.cert, key: c.key, keepAlive: true })
}

export interface SicoobResult<T> {
  ok: boolean
  data?: T
  /** Mensagem pronta para a tela — o diagnóstico é o que salva, já que só dá
   *  para testar em produção. */
  error?: string
  status?: number
  /** Corpo cru da resposta, para o log. */
  raw?: string
}

/**
 * Requisição via módulo https do Node — o fetch padrão não aceita certificado
 * de cliente, e o mTLS é obrigatório em produção no Sicoob.
 */
function requestSicoob(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string },
): Promise<{ status: number; text: string; ok: boolean }> {
  return new Promise((resolve, reject) => {
    let alvo: URL
    try { alvo = new URL(url) } catch { return reject(new Error(`Endereço inválido: ${url}`)) }

    const req = https.request(
      {
        protocol: alvo.protocol,
        hostname: alvo.hostname,
        port: alvo.port || 443,
        path: alvo.pathname + alvo.search,
        method: init.method ?? 'GET',
        headers: init.headers,
        agent: mtlsAgent(),
        timeout: 20_000,
      },
      (res) => {
        let text = ''
        res.setEncoding('utf8')
        res.on('data', (c) => { text += c })
        res.on('end', () => {
          const status = res.statusCode ?? 0
          resolve({ status, text, ok: status >= 200 && status < 300 })
        })
      },
    )
    req.on('timeout', () => { req.destroy(new Error('tempo esgotado (20s)')) })
    req.on('error', reject)
    if (init.body) req.write(init.body)
    req.end()
  })
}

// ─── Token ───────────────────────────────────────────────────────────────────
let tokenCache: { token: string; exp: number } | null = null

export async function getSicoobToken(cfg: SicoobConfig, force = false): Promise<SicoobResult<string>> {
  const agora = Date.now()
  if (!force && tokenCache && tokenCache.exp - 30_000 > agora) {
    return { ok: true, data: tokenCache.token }
  }
  if (!cfg.clientId) return { ok: false, error: 'Informe o Client ID do aplicativo no portal do Sicoob.' }
  if (!cfg.tokenUrl) return { ok: false, error: 'Informe o endereço do token (copie do portal do Sicoob).' }
  if (cfg.environment === 'producao' && !hasCertificate()) {
    return {
      ok: false,
      error: 'Produção exige o certificado ICP-Brasil. Cadastre SICOOB_CERT_PEM e SICOOB_KEY_PEM na Vercel.',
    }
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: cfg.clientId,
    scope: SICOOB_SCOPES,
  })

  try {
    const r = await requestSicoob(cfg.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    if (!r.ok) {
      return { ok: false, status: r.status, raw: r.text, error: explicarErro(r.status, r.text, 'token') }
    }
    const data = JSON.parse(r.text) as { access_token?: string; expires_in?: number }
    if (!data.access_token) {
      return { ok: false, status: r.status, raw: r.text, error: 'O Sicoob respondeu sem access_token.' }
    }
    tokenCache = { token: data.access_token, exp: agora + (data.expires_in ?? 300) * 1000 }
    return { ok: true, data: data.access_token }
  } catch (e) {
    return { ok: false, error: `Falha de conexão com o Sicoob: ${e instanceof Error ? e.message : 'erro'}` }
  }
}

/** Traduz o status para algo acionável — não adianta devolver "401" e pronto. */
function explicarErro(status: number, corpo: string, etapa: string): string {
  const trecho = corpo.slice(0, 300)
  if (status === 401) return `Não autorizado (${etapa}). Confira o Client ID e se o aplicativo está aprovado no portal. ${trecho}`
  if (status === 403) return `Acesso negado (${etapa}). Faltam escopos no aplicativo (cob.write, cob.read) ou o certificado não corresponde à conta. ${trecho}`
  if (status === 404) return `Endereço não encontrado (${etapa}). Confira a URL copiada do portal. ${trecho}`
  if (status >= 500) return `O Sicoob está indisponível no momento (${status}). ${trecho}`
  return `Falha na etapa de ${etapa} (${status}). ${trecho}`
}

// ─── Cobrança imediata ───────────────────────────────────────────────────────
export interface CobrancaCriada {
  txid: string
  /** O "copia e cola" — mesma string que vira o QR Code. */
  pixCopiaECola: string
  valor: number
  expiracaoSegundos: number
  status: string
}

/** txid do PIX: 26 a 35 caracteres alfanuméricos, sem símbolo. */
export function montarTxid(orderNumber: string): string {
  const base = orderNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  const preenchido = (base + Date.now().toString(36).toUpperCase()).replace(/[^A-Z0-9]/g, '')
  return preenchido.padEnd(26, '0').slice(0, 35)
}

export async function criarCobranca(
  cfg: SicoobConfig,
  params: { valor: number; orderNumber: string; nomeCliente?: string; descricao?: string },
): Promise<SicoobResult<CobrancaCriada>> {
  const t = await getSicoobToken(cfg)
  if (!t.ok || !t.data) return { ok: false, error: t.error, status: t.status, raw: t.raw }
  if (!cfg.pixKey) return { ok: false, error: 'Informe a chave PIX que vai receber.' }

  const txid = montarTxid(params.orderNumber)
  const corpo = {
    calendario: { expiracao: Math.max(60, cfg.expiracaoMinutos * 60) },
    valor: { original: params.valor.toFixed(2) },
    chave: cfg.pixKey,
    solicitacaoPagador: (params.descricao ?? `Pedido ${params.orderNumber}`).slice(0, 140),
  }

  try {
    const url = `${cfg.apiBaseUrl.replace(/\/$/, '')}/cob/${txid}`
    const r = await requestSicoob(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${t.data}`,
        client_id: cfg.clientId,
      },
      body: JSON.stringify(corpo),
    })
    if (!r.ok) {
      return { ok: false, status: r.status, raw: r.text, error: explicarErro(r.status, r.text, 'criar cobrança') }
    }
    const data = JSON.parse(r.text) as {
      txid?: string
      pixCopiaECola?: string
      status?: string
      calendario?: { expiracao?: number }
      valor?: { original?: string }
    }
    if (!data.pixCopiaECola) {
      return { ok: false, status: r.status, raw: r.text, error: 'O Sicoob criou a cobrança mas não devolveu o código PIX.' }
    }
    return {
      ok: true,
      data: {
        txid: data.txid ?? txid,
        pixCopiaECola: data.pixCopiaECola,
        valor: Number(data.valor?.original ?? params.valor),
        expiracaoSegundos: data.calendario?.expiracao ?? cfg.expiracaoMinutos * 60,
        status: data.status ?? 'ATIVA',
      },
    }
  } catch (e) {
    return { ok: false, error: `Falha ao criar a cobrança: ${e instanceof Error ? e.message : 'erro'}` }
  }
}

/** Consulta a cobrança — usado para conferir pagamento sem depender do webhook. */
export async function consultarCobranca(cfg: SicoobConfig, txid: string): Promise<SicoobResult<{ status: string }>> {
  const t = await getSicoobToken(cfg)
  if (!t.ok || !t.data) return { ok: false, error: t.error }
  try {
    const url = `${cfg.apiBaseUrl.replace(/\/$/, '')}/cob/${txid}`
    const r = await requestSicoob(url, {
      headers: { Authorization: `Bearer ${t.data}`, client_id: cfg.clientId },
    })
    if (!r.ok) return { ok: false, status: r.status, raw: r.text, error: explicarErro(r.status, r.text, 'consultar cobrança') }
    const data = JSON.parse(r.text) as { status?: string }
    return { ok: true, data: { status: data.status ?? 'DESCONHECIDO' } }
  } catch (e) {
    return { ok: false, error: `Falha ao consultar: ${e instanceof Error ? e.message : 'erro'}` }
  }
}

/** Cadastra o webhook que avisa o site quando o PIX cair. */
export async function registrarWebhook(cfg: SicoobConfig, webhookUrl: string): Promise<SicoobResult<true>> {
  const t = await getSicoobToken(cfg)
  if (!t.ok || !t.data) return { ok: false, error: t.error }
  if (!cfg.pixKey) return { ok: false, error: 'Informe a chave PIX antes de cadastrar o webhook.' }
  try {
    const url = `${cfg.apiBaseUrl.replace(/\/$/, '')}/webhook/${encodeURIComponent(cfg.pixKey)}`
    const r = await requestSicoob(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${t.data}`,
        client_id: cfg.clientId,
      },
      body: JSON.stringify({ webhookUrl }),
    })
    if (!r.ok) return { ok: false, status: r.status, raw: r.text, error: explicarErro(r.status, r.text, 'cadastrar webhook') }
    return { ok: true, data: true }
  } catch (e) {
    return { ok: false, error: `Falha ao cadastrar o webhook: ${e instanceof Error ? e.message : 'erro'}` }
  }
}
