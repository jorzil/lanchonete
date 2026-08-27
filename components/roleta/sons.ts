/**
 * Sons da roleta, sintetizados na hora via WebAudio — nenhum arquivo baixado.
 *
 * O contexto só nasce no primeiro clique porque navegador nenhum deixa tocar
 * áudio antes de o usuário interagir. Tudo dentro de try/catch: som é enfeite,
 * e enfeite não pode derrubar o giro.
 */
export interface SonsRoleta {
  tique(): void
  vitoria(): void
  semPremio(): void
}

export function criarSons(): SonsRoleta {
  let ctx: AudioContext | null = null

  function contexto(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!ctx) {
      const AC = window.AudioContext
        ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ctx = new AC()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  }

  function nota(hz: number, dur: number, vol: number, tipo: OscillatorType, atraso = 0) {
    try {
      const c = contexto()
      if (!c) return
      const t = c.currentTime + atraso
      const osc = c.createOscillator()
      const gan = c.createGain()
      osc.type = tipo
      osc.frequency.setValueAtTime(hz, t)
      gan.gain.setValueAtTime(0, t)
      gan.gain.linearRampToValueAtTime(vol, t + 0.005)
      gan.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      osc.connect(gan).connect(c.destination)
      osc.start(t)
      osc.stop(t + dur + 0.02)
    } catch {}
  }

  return {
    tique: () => nota(1180, 0.03, 0.045, 'square'),
    vitoria: () => [523, 659, 784, 1047].forEach((hz, i) => nota(hz, 0.34, 0.075, 'triangle', i * 0.1)),
    semPremio: () => [392, 294].forEach((hz, i) => nota(hz, 0.3, 0.055, 'sine', i * 0.13)),
  }
}

const CHAVE = 'roleta-som'

export function somLigado(): boolean {
  try { return localStorage.getItem(CHAVE) !== '0' } catch { return true }
}

export function salvarSom(ligado: boolean) {
  try { localStorage.setItem(CHAVE, ligado ? '1' : '0') } catch {}
}
