import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';

type NavState = Record<string, unknown>
type GoOptions = { replace?: boolean; state?: NavState }

// 앱 내부 이동에 fromApp 플래그를 심어, 화면 뒤로가기가
// 직접 진입(새로고침)인지 내부 진입인지 구분할 수 있게 한다.
export function useAppNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  const go = useCallback((to: string, opts?: GoOptions) => {
    navigate(to, {
      replace: opts?.replace,
      state: { fromApp: true, ...opts?.state },
    })
  }, [navigate])

  const goBack = useCallback((fallback: string) => {
    const fromApp = (location.state as { fromApp?: boolean } | null)?.fromApp
    if (fromApp) {
      navigate(-1)
    } else {
      navigate(fallback, { replace: true, state: { fromApp: true } })
    }
  }, [navigate, location.state])

  return { go, goBack }
}
