'use client'

import { useRef, useEffect } from 'react'

const FADE_MS = 500
const FADE_OUT_LEAD = 0.55

interface FadingVideoProps {
  src: string
  className?: string
  style?: React.CSSProperties
}

export function FadingVideo({ src, className, style }: FadingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const rafRef = useRef<number>(0)
  const fadingOutRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    function fadeTo(target: number, duration: number) {
      cancelAnimationFrame(rafRef.current)
      const start = performance.now()
      const from = parseFloat(video!.style.opacity || '0')

      function tick(now: number) {
        const t = Math.min((now - start) / duration, 1)
        video!.style.opacity = String(from + (target - from) * t)
        if (t < 1) rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    function onLoaded() {
      video!.style.opacity = '0'
      video!.play().catch(() => {})
      fadeTo(1, FADE_MS)
    }

    function onTimeUpdate() {
      const remaining = video!.duration - video!.currentTime
      if (!fadingOutRef.current && remaining <= FADE_OUT_LEAD && remaining > 0) {
        fadingOutRef.current = true
        fadeTo(0, FADE_MS)
      }
    }

    function onEnded() {
      video!.style.opacity = '0'
      setTimeout(() => {
        video!.currentTime = 0
        video!.play().catch(() => {})
        fadingOutRef.current = false
        fadeTo(1, FADE_MS)
      }, 100)
    }

    video.style.opacity = '0'
    video.addEventListener('loadeddata', onLoaded)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('ended', onEnded)

    return () => {
      cancelAnimationFrame(rafRef.current)
      video.removeEventListener('loadeddata', onLoaded)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('ended', onEnded)
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      muted
      playsInline
      preload="auto"
      className={className}
      style={{ opacity: 0, ...style }}
    />
  )
}
