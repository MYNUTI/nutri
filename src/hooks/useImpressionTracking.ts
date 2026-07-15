import { useCallback, useEffect, useRef } from 'react'
import { logImpression, type ImpressionSurface } from '../api/logging'

const FLUSH_DELAY = 800

export function useImpressionTracking(surface: ImpressionSurface, keyword?: string) {
  const seenRef = useRef<Set<number>>(new Set())
  const pendingRef = useRef<Map<number, number>>(new Map())
  const timerRef = useRef<number | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const flush = useCallback(() => {
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null }
    if (pendingRef.current.size === 0) return
    const items = Array.from(pendingRef.current, ([productId, position]) => ({ productId, position }))
    pendingRef.current.clear()
    logImpression(surface, items, keyword)
  }, [surface, keyword])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target as HTMLElement
          const productId = Number(el.dataset.productId)
          const position = Number(el.dataset.position)
          if (!productId || seenRef.current.has(productId)) continue
          seenRef.current.add(productId)
          pendingRef.current.set(productId, position)
          observer.unobserve(el)
          if (timerRef.current) window.clearTimeout(timerRef.current)
          timerRef.current = window.setTimeout(flush, FLUSH_DELAY) as unknown as number
        }
      },
      { threshold: 0.5 },
    )
    observerRef.current = observer
    return () => { observer.disconnect(); flush() }
  }, [flush])

  useEffect(() => {
    seenRef.current.clear()
    pendingRef.current.clear()
  }, [surface, keyword])

  const observe = useCallback((el: HTMLElement | null, productId: number, position: number) => {
    if (!el || !observerRef.current || seenRef.current.has(productId)) return
    el.dataset.productId = String(productId)
    el.dataset.position = String(position)
    observerRef.current.observe(el)
  }, [])

  return { observe }
}
