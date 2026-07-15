import { useEffect, useState } from 'react'
import { oauthLogin, register } from './api/auth'
import { postNutrition, type NutritionData } from './api/nutrition'
import './App.css'
import { AppRoutes } from './app/routes/AppRoutes'
import { useAppNavigation } from './app/routes/useAppNavigation'
import { useScrollRestoration } from './app/routes/useScrollRestoration'
import { NutritionEditModal } from './components/NutritionEditModal'
import { UserProfileSetupModal, type Profile } from './components/UserProfileSetupModal'
import { useFavorites } from './contexts/FavoritesContext'
import { FilterPage } from './pages/FilterPage'
import { type SortKey } from './pages/HomePage'
import { useLikesQuery } from './queries/likesQueries'
import { useMyPageQuery } from './queries/myPageQueries'
import type { Product } from './types/product'

function profileToNutrition(p: Profile): NutritionData {
  return {
    height: Number(p.height),
    weight: Number(p.weight),
    bodyFatRate: p.body_fat_rate ? Number(p.body_fat_rate) : undefined,
    skeletalMuscleMass: p.skeletal_muscle_mass ? Number(p.skeletal_muscle_mass) : undefined,
    dietPurpose: p.diet_purpose,
    activityType: p.activity_type,
    weeklyExerciseCount: Number(p.weekly_exercise_count) || 0,
    exerciseIntensity: p.exercise_intensity,
    dailyMealCount: p.daily_meal_count,
    dailySnackCount: p.daily_snack_count,
  }
}

function App() {
  const { go } = useAppNavigation()
  useScrollRestoration()

  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('accessToken'))
  const [sessionChecking, setSessionChecking] = useState(() => !!localStorage.getItem('accessToken'))
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showNutritionEdit, setShowNutritionEdit] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [filterInitialSection, setFilterInitialSection] = useState<'nutrient' | 'brand' | undefined>(undefined)
  const [homeKeyword, setHomeKeyword] = useState('')
  const [homeSort, setHomeSort] = useState<SortKey>('추천순')
  const [filterCategoryIds, setFilterCategoryIds] = useState<number[]>([])
  const [filterBrandIds, setFilterBrandIds] = useState<number[]>([])
  const [filterNutrients, setFilterNutrients] = useState<string[]>([])
  const [compareProducts, setCompareProducts] = useState<Product[]>([])
  // 신규 OAuth 회원가입 진행 중일 때 임시 보관 (provider, oauthId, email)
  const [oauthPending, setOauthPending] = useState<{ provider: string; oauthId: string; email?: string } | null>(null)
  // 소셜 로그인 콜백 처리 중에는 홈이 깜빡이지 않도록 스플래시 표시
  const [oauthProcessing, setOauthProcessing] = useState(() => {
    const p = new URLSearchParams(window.location.search)
    const src = p.get('src')
    if (src) localStorage.setItem('cohort', src)
    return !!(p.get('code') && p.get('provider'))
  })

  const { setFavoriteIds } = useFavorites()

  // 로그인 상태일 때 찜 목록을 서버에서 로드해 FavoritesContext 동기화
  useLikesQuery(isAuthenticated)
  // 앱 시작 시 토큰 유효성 검증 — 만료 시 auth:logout 이벤트로 자동 로그아웃
  const myPageQuery = useMyPageQuery(isAuthenticated)
  const myNickname = myPageQuery.data?.nickname
  const isAdmin = isAuthenticated && myPageQuery.data?.role === 'ADMIN'

  // 앱 시작 시 저장된 토큰의 유효성을 /users/me 응답으로 확인 — 완료 전까지 UI 차단
  useEffect(() => {
    if (!sessionChecking) return
    if (myPageQuery.isSuccess || myPageQuery.isError) {
      setSessionChecking(false)
    }
  }, [sessionChecking, myPageQuery.isSuccess, myPageQuery.isError])

  // OAuth 콜백: URL ?code=xxx&provider=PROVIDER 감지 → /auth/oauth 호출
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
        // 신규 회원: 회원가입 모달 표시
        setOauthPending({ provider, oauthId: res.oauthId ?? '', email: res.email })
        setShowProfileSetup(true)
        go('/', { replace: true })
      } else {
        // 기존 회원: 토큰 저장 후 로그인 완료
        if (res.accessToken) localStorage.setItem('accessToken', res.accessToken)
        if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken)
        setIsAuthenticated(true)
        go('/', { replace: true })
      }
      setOauthProcessing(false)
    }).catch(() => {
      go('/login', { replace: true })
      setOauthProcessing(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handleForceLogout = () => {
      setIsAuthenticated(false)
      setFavoriteIds([])
      setSessionChecking(false)
      localStorage.removeItem('recentSearchKeywords')
    }
    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
    setShowProfileSetup(true)
    go('/', { replace: true })
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setFavoriteIds([])
    setSessionChecking(false)
    localStorage.removeItem('recentSearchKeywords')
    go('/', { replace: true })
  }

  const handleWithdraw = () => {
    setIsAuthenticated(false)
    setFavoriteIds([])
    go('/', { replace: true })
  }

  const handleAddToCompare = (product: Product) => {
    setCompareProducts(prev => {
      if (prev.length === 0) return [product]
      if (prev[0].id === product.id) return prev
      return [prev[0], product]
    })
    go('/compare')
  }

  return (
    <main className="screen-wrap">
      <section className="mobile-page app-shell">
          {showProfileSetup && (
            <UserProfileSetupModal
              initialProfile={oauthPending?.email
                ? { ...{ name: '', email: oauthPending.email, gender: '', birth_date: '', height: '', weight: '', body_fat_rate: '', skeletal_muscle_mass: '', activity_type: '', weekly_exercise_count: '', exercise_intensity: '', daily_meal_count: 3, daily_snack_count: 1, diet_purpose: '', personalInfoAgreed: false, healthInfoAgreed: false, ageConfirmed: false } }
                : undefined
              }
              onClose={() => { setShowProfileSetup(false); setOauthPending(null) }}
              onComplete={async (profile) => {
                setShowProfileSetup(false)
                try {
                  if (oauthPending) {
                    // 신규 OAuth 회원: register → nutrition 순서로 호출
                    await register({
                      provider: oauthPending.provider,
                      oauthId: oauthPending.oauthId,
                      name: profile.name,
                      email: profile.email,
                      gender: profile.gender,
                      birthDate: profile.birth_date,
                      personalInfoAgreed: profile.personalInfoAgreed,
                      healthInfoAgreed: profile.healthInfoAgreed,
                      ageConfirmed: profile.ageConfirmed,
                    })
                    setOauthPending(null)
                    setIsAuthenticated(true)
                    await postNutrition(profileToNutrition(profile))
                  } else {
                    await postNutrition(profileToNutrition(profile))
                  }
                } catch {
                  // 실패해도 로그인 흐름을 막지 않음
                }
              }}
            />
          )}
          {showNutritionEdit && (
            <NutritionEditModal onClose={() => setShowNutritionEdit(false)} />
          )}
          {showFilter && (
            <FilterPage
              initialCategoryIds={filterCategoryIds}
              initialBrandIds={filterBrandIds}
              initialNutrients={filterNutrients}
              initialOpenSection={filterInitialSection}
              onClose={() => { setShowFilter(false); setFilterInitialSection(undefined) }}
              onApply={(sel) => {
                setFilterCategoryIds(sel.categoryIds)
                setFilterBrandIds(sel.brandIds)
                setFilterNutrients(sel.nutrients)
              }}
            />
          )}
          <section className="page-body">
            {/* OAuth 콜백 처리 중에는 라우트를 마운트하지 않는다 —
                catch-all(*) Navigate가 effect보다 먼저 돌아 ?code&provider를 날리는 것 방지 */}
            {!oauthProcessing && (
              <AppRoutes
                isAuthenticated={isAuthenticated}
                isAdmin={isAdmin}
                sessionChecking={sessionChecking}
                myNickname={myNickname}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onWithdraw={handleWithdraw}
                homeKeyword={homeKeyword}
                homeSort={homeSort}
                filterCategoryIds={filterCategoryIds}
                filterBrandIds={filterBrandIds}
                filterNutrients={filterNutrients}
                setHomeKeyword={setHomeKeyword}
                setHomeSort={setHomeSort}
                onCategoryChange={(ids) => { setFilterCategoryIds(ids); setFilterBrandIds([]) }}
                resetHomeFilters={() => { setHomeKeyword(''); setFilterCategoryIds([]); setFilterBrandIds([]); setFilterNutrients([]) }}
                onMoveToFilter={(section) => { setFilterInitialSection(section); setShowFilter(true) }}
                onAddToCompare={handleAddToCompare}
                compareProducts={compareProducts}
                onEditNutrition={() => setShowNutritionEdit(true)}
              />
            )}
          </section>
          {(oauthProcessing || sessionChecking) && (
            <div className="oauth-splash" role="status" aria-live="polite">
              <span className="oauth-splash-spinner" aria-hidden="true" />
              <span className="oauth-splash-text">{oauthProcessing ? '로그인 중...' : '불러오는 중...'}</span>
            </div>
          )}
        </section>
      </main>
  )
}

export default App
