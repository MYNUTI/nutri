const LEGACY_ROUTES = new Set([
  'home', 'search', 'mypage', 'login', 'admin',
  'detail', 'compare', 'favorites', 'password-change', 'withdraw',
])

// 구 해시 라우팅(#detail/5)으로 저장된 북마크·공유 링크를 path로 변환.
// 렌더 전 동기 실행 — hash만 걷어내고 query(?code&provider&src 등)는 보존한다.
export function normalizeLegacyLocation() {
  const hash = window.location.hash
  if (!hash || hash === '#') return

  const [base, param] = hash.replace(/^#\/?/, '').split('/')
  if (!LEGACY_ROUTES.has(base)) {
    // 레거시 라우트가 아니면 경로는 두고 hash만 제거 (path + stray hash 조합 대비)
    window.history.replaceState({}, '', window.location.pathname + window.location.search)
    return
  }

  const path = base === 'home'
    ? '/'
    : base === 'detail' && param
      ? `/detail/${param}`
      : `/${base}`

  window.history.replaceState({}, '', path + window.location.search)
}
