import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router'

// 라우트별(location.key) 스크롤 위치 저장 → POP(뒤로/앞으로) 시에만 복원.
// 신규 PUSH·상세 진입은 항상 맨 위. 기존 hash 라우팅의 RAF 강제 고정 로직을 이관한다.
export function useScrollRestoration() {
  const location = useLocation()
  const navType = useNavigationType()
  const positions = useRef<Map<string, number>>(new Map())
  const activeKey = useRef(location.key)

  useEffect(() => {
    history.scrollRestoration = 'manual'
    const onScroll = () => { positions.current.set(activeKey.current, window.scrollY) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 콘텐츠 높이 확정 지연 / Safari 스크롤 보정을 덮어쓰기 위해
  // 목표 위치에 도달할 때까지 ~650ms(40프레임) 동안 즉시 강제 고정한다.
  useLayoutEffect(() => {
    activeKey.current = location.key
    const target = navType === 'POP' ? (positions.current.get(location.key) ?? 0) : 0

    let raf = 0
    let cancelled = false
    let frames = 0
    const abort = () => { cancelled = true }
    if (target > 0) {
      window.addEventListener('wheel', abort, { passive: true })
      window.addEventListener('touchstart', abort, { passive: true })
      window.addEventListener('keydown', abort)
    }
    const apply = () => {
      if (cancelled) return
      if (Math.abs(window.scrollY - target) > 2) window.scrollTo(0, target)
      frames += 1
      if (frames < 40) raf = requestAnimationFrame(apply)
    }
    apply()
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.removeEventListener('wheel', abort)
      window.removeEventListener('touchstart', abort)
      window.removeEventListener('keydown', abort)
    }
  }, [location.key, navType])
}
