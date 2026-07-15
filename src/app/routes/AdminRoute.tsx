import { AdminPage } from '../../pages/AdminPage'
import { LoginPage } from '../../pages/LoginPage'

type AdminRouteProps = {
  isAdmin: boolean
  sessionChecking: boolean
  onLogin: () => void
}

// 세션 확인이 끝난 뒤 판정 — 확인 중에는 null(AppShell 스플래시가 덮음).
// 비관리자(비로그인 포함)는 로그인 화면 표시(리다이렉트 없음).
export function AdminRoute({ isAdmin, sessionChecking, onLogin }: AdminRouteProps) {
  if (sessionChecking) return null
  return isAdmin ? <AdminPage /> : <LoginPage onLogin={onLogin} />
}
