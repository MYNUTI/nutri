const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID as string | undefined
const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID as string | undefined

const OAUTH_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8080'
  : 'https://api.nutriuniv.co.kr'

function buildOAuthUrl(provider: string): string {
  if (provider === 'GOOGLE' && GOOGLE_CLIENT_ID) {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: `${OAUTH_BASE}/auth/oauth/google`,
      response_type: 'code',
      scope: 'email profile',
    })
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }
  if (provider === 'KAKAO' && KAKAO_CLIENT_ID) {
    const params = new URLSearchParams({
      client_id: KAKAO_CLIENT_ID,
      redirect_uri: `${OAUTH_BASE}/auth/oauth/kakao`,
      response_type: 'code',
    })
    return `https://kauth.kakao.com/oauth/authorize?${params}`
  }
  if (provider === 'NAVER' && NAVER_CLIENT_ID) {
    const params = new URLSearchParams({
      client_id: NAVER_CLIENT_ID,
      redirect_uri: `${OAUTH_BASE}/auth/oauth/naver`,
      response_type: 'code',
      state: Math.random().toString(36).slice(2),
    })
    return `https://nid.naver.com/oauth2.0/authorize?${params}`
  }
  return `#login`
}

type LoginPageProps = {
  onLogin: (isAdmin: boolean) => void
}

const KakaoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.86 5.31 4.66 6.74-.2.7-.74 2.6-.85 3-.13.5.18.5.39.36.16-.11 2.55-1.73 3.59-2.43.72.1 1.46.16 2.21.16 5.52 0 10-3.58 10-8s-4.48-8-10-8z" fill="#3A1D1D"/>
  </svg>
)

const NaverIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M14.65 12.36L10.49 6H6v12h3.35V11.64L13.51 18H18V6h-3.35v6.36z" fill="#fff"/>
  </svg>
)

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.39c1.31.07 2.22.74 2.98.8 1.12-.21 2.2-.9 3.39-.84 1.44.07 2.52.6 3.22 1.52-2.95 1.78-2.25 5.7.5 6.8-.57 1.56-1.32 3.1-2.09 4.61zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
)

export const LoginPage = ({ onLogin: _onLogin }: LoginPageProps) => (
  <section className="login-page">
    <div className="login-top">
      <h1 className="login-title">
        <span className="login-title-sub">나에게 딱 맞는</span>
        <span className="login-title-main">영양대학</span>
      </h1>
    </div>

    <div className="login-social">
      <div className="social-btn-list">
        <button type="button" className="social-btn social-btn--kakao" onClick={() => { window.location.href = buildOAuthUrl('KAKAO') }}>
          <KakaoIcon />
          <span>카카오로 로그인</span>
        </button>
        <button type="button" className="social-btn social-btn--naver" onClick={() => { window.location.href = buildOAuthUrl('NAVER') }}>
          <NaverIcon />
          <span>네이버로 로그인</span>
        </button>
        <button type="button" className="social-btn social-btn--google" onClick={() => { window.location.href = buildOAuthUrl('GOOGLE') }}>
          <GoogleIcon />
          <span>구글로 로그인</span>
        </button>
        <button type="button" className="social-btn social-btn--apple" onClick={() => { window.location.href = buildOAuthUrl('APPLE') }}>
          <AppleIcon />
          <span>Apple로 로그인</span>
        </button>
      </div>
    </div>
  </section>
)
