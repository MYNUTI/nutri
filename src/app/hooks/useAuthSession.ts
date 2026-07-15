import { useEffect, useState } from 'react'
import { useLikesQuery } from '../../queries/likesQueries'
import { useMyPageQuery } from '../../queries/myPageQueries'

type Options = {
  go: (to: string, opts?: { replace?: boolean }) => void
  setFavoriteIds: (ids: number[]) => void
}

// 인증 세션 전반: 토큰 유효성 검증, 찜/마이페이지 로드, 로그아웃/탈퇴/강제로그아웃.
// 기존 App.tsx에 흩어져 있던 세션 정리 로직 3곳(강제로그아웃 이벤트·로그아웃·탈퇴)을 통합한다.
export function useAuthSession({ go, setFavoriteIds }: Options) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('accessToken'))
  const [sessionChecking, setSessionChecking] = useState(() => !!localStorage.getItem('accessToken'))

  // 로그인 상태일 때 찜 목록을 서버에서 로드해 FavoritesContext 동기화
  useLikesQuery(isAuthenticated)
  // 앱 시작 시 토큰 유효성 검증 — 만료 시 auth:logout 이벤트로 자동 로그아웃
  const myPageQuery = useMyPageQuery(isAuthenticated)
  const myNickname = myPageQuery.data?.nickname
  const isAdmin = isAuthenticated && myPageQuery.data?.role === 'ADMIN'

  // 저장된 토큰의 유효성을 /users/me 응답으로 확인 — 완료 전까지 UI 차단
  useEffect(() => {
    if (!sessionChecking) return
    if (myPageQuery.isSuccess || myPageQuery.isError) {
      setSessionChecking(false)
    }
  }, [sessionChecking, myPageQuery.isSuccess, myPageQuery.isError])

  // 세션 상태 초기화 (강제로그아웃/로그아웃 공통)
  const clearSession = () => {
    setIsAuthenticated(false)
    setFavoriteIds([])
    setSessionChecking(false)
    localStorage.removeItem('recentSearchKeywords')
  }

  useEffect(() => {
    const handleForceLogout = () => clearSession()
    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const logout = () => {
    clearSession()
    go('/', { replace: true })
  }

  // 탈퇴는 logout과 달리 sessionChecking·recentSearchKeywords는 건드리지 않는다(기존 동작 유지)
  const withdraw = () => {
    setIsAuthenticated(false)
    setFavoriteIds([])
    go('/', { replace: true })
  }

  return { isAuthenticated, sessionChecking, isAdmin, myNickname, setIsAuthenticated, logout, withdraw }
}
