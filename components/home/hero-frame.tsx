'use client'

import { useEffect, useRef } from 'react'

// Hero (banner original) embutido via iframe, com altura ajustada ao conteúdo
// para não cortar nada no mobile.
export function HeroFrame() {
  const ref = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const iframe = ref.current
    if (!iframe) return

    function fit() {
      try {
        const doc = iframe!.contentDocument || iframe!.contentWindow?.document
        if (!doc) return
        const h = Math.max(
          doc.documentElement.scrollHeight,
          doc.body?.scrollHeight ?? 0,
          // nunca menor que a viewport (desktop = tela cheia)
          Math.round(window.innerHeight),
        )
        iframe!.style.height = h + 'px'
      } catch {}
    }

    function bind() {
      fit()
      // recalcula quando fontes/imagens carregam e ao redimensionar
      const doc = iframe!.contentDocument
      let ro: ResizeObserver | undefined
      if (doc && 'ResizeObserver' in window) {
        ro = new ResizeObserver(() => fit())
        ro.observe(doc.documentElement)
      }
      const t1 = setTimeout(fit, 300)
      const t2 = setTimeout(fit, 1200)
      return () => { ro?.disconnect(); clearTimeout(t1); clearTimeout(t2) }
    }

    let cleanup = () => {}
    iframe.addEventListener('load', () => { cleanup(); cleanup = bind() })
    // caso já tenha carregado
    if (iframe.contentDocument?.readyState === 'complete') { cleanup = bind() }

    const onResize = () => fit()
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); cleanup() }
  }, [])

  return (
    <iframe
      ref={ref}
      src="/hero.html"
      title="Mais Sub"
      className="block w-full border-0"
      style={{ height: '100svh', minHeight: 520, display: 'block' }}
      scrolling="no"
    />
  )
}
