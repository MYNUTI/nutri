import { useEffect } from 'react'
import { matchPath, useLocation } from 'react-router'
import { sendPageView } from '../lib/ga'

const VARIANT = '영양대학'

const PAGE_TITLES: Record<string, string> = {
  '/': '홈',
  '/detail/:id': '상품 상세',
  '/search': '검색',
  '/mypage': '마이페이지',
  '/login': '로그인',
  '/favorites': '즐겨찾기',
  '/password-change': '비밀번호 변경',
  '/withdraw': '회원 탈퇴',
  '/admin': '관리자',
  '/compare': '상품 비교',
}

export function PageViewTracker() {
  const location = useLocation()

  useEffect(() => {
    const pattern = Object.keys(PAGE_TITLES).find(p => matchPath(p, location.pathname))
    // 미정의 경로는 곧바로 홈으로 리다이렉트되므로 전송하지 않음 (봇·오타 유입으로 인한 카디널리티 증가 방지)
    if (!pattern) return
    // location.search는 OAuth 콜백 인가 코드(?code)가 담길 수 있어 전송에서 제외
    sendPageView(location.pathname, `${VARIANT}-${PAGE_TITLES[pattern]}`)
  }, [location.pathname])

  return null
}
