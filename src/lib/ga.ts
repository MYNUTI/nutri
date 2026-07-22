declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

// dev·프리뷰 배포에는 gtag 로더가 주입되지 않으므로 자동으로 no-op
const enabled = () => typeof window.gtag === 'function'

export function eventGtag(name: string, params: Record<string, unknown> = {}) {
  if (!enabled()) return
  window.gtag!('event', name, params)
}

export function sendPageView(path: string, title: string) {
  eventGtag('page_view', {
    page_path: path,
    // window.location.href를 쓰면 OAuth 콜백의 ?code가 GA로 전송됨. 생략해도 gtag가
    // 현재 URL로 자동 채우므로 정제된 값으로 명시적으로 덮는다
    page_location: window.location.origin + path,
    page_title: title,
  })
}
