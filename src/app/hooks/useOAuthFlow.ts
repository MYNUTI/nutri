import { useEffect, useState } from 'react'
import { oauthLogin } from '../../api/auth'

export type OAuthPending = { provider: string; oauthId: string; email?: string }

type Options = {
  go: (to: string, opts?: { replace?: boolean }) => void
  onAuthenticated: () => void  // 기존 회원 로그인 완료
  onNewUser: () => void        // 신규 회원 — 회원가입 모달 표시
}

// 소셜 로그인 콜백(?code&provider) 처리 + 신규 가입 임시 상태 + ?src cohort 기록.
export function useOAuthFlow({ go, onAuthenticated, onNewUser }: Options) {
  const [oauthPending, setOauthPending] = useState<OAuthPending | null>(null)
  // 콜백 처리 중에는 홈이 깜빡이지 않도록 스플래시 표시
  const [oauthProcessing, setOauthProcessing] = useState(() => {
    const p = new URLSearchParams(window.location.search)
    const src = p.get('src')
    if (src) localStorage.setItem('cohort', src)
    return !!(p.get('code') && p.get('provider'))
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const provider = params.get('provider')
    if (!code || !provider) return

    // 콜백 파라미터를 URL에서 제거 (StrictMode 2회차 실행은 여기서 early return)
    // react-router 히스토리 상태(key/idx/usr)는 보존 — {}로 덮으면 뒤로가기 시 navType 오판/스크롤 복원 깨짐
    window.history.replaceState(window.history.state, '', window.location.pathname)

    oauthLogin(provider, code).then((res) => {
      if (res.newUser) {
        setOauthPending({ provider, oauthId: res.oauthId ?? '', email: res.email })
        onNewUser()
        go('/', { replace: true })
      } else {
        if (res.accessToken) localStorage.setItem('accessToken', res.accessToken)
        if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken)
        onAuthenticated()
        go('/', { replace: true })
      }
      setOauthProcessing(false)
    }).catch(() => {
      go('/login', { replace: true })
      setOauthProcessing(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { oauthPending, setOauthPending, oauthProcessing }
}
