import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { FavoritesProvider, useFavorites } from './contexts/FavoritesContext'
import { useLikesQuery } from './queries/likesQueries'
import { useMyPageQuery } from './queries/myPageQueries'
import { UserProfileSetupModal, type Profile } from './components/UserProfileSetupModal'
import { NutritionEditModal } from './components/NutritionEditModal'
import { postNutrition, type NutritionData } from './api/nutrition'
import { oauthLogin, register } from './api/auth'
import { products as allProducts } from './mocks/products'
import { AdminPage } from './pages/AdminPage'
import { ComparePage } from './pages/ComparePage'
import { FilterPage } from './pages/FilterPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { PasswordChangePage } from './pages/PasswordChangePage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MyPage } from './pages/MyPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { SearchPage } from './pages/SearchPage'
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

type RouteKey =
  | 'home' | 'search' | 'mypage' | 'login' | 'admin'
  | 'detail' | 'compare' | 'favorites' | 'password-change'

const validRoutes = new Set<RouteKey>([
  'home', 'search', 'mypage', 'login', 'admin',
  'detail', 'compare', 'favorites', 'password-change',
])

const getRouteFromHash = (): RouteKey => {
  const hash = window.location.hash.replace('#', '') as RouteKey
  return validRoutes.has(hash) ? hash : 'home'
}

const setHashRoute = (route: RouteKey) => { window.location.hash = route }

function AppShell() {
  const [route, setRoute] = useState<RouteKey>(() => getRouteFromHash())
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('accessToken'))
  const [isAdmin, setIsAdmin] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showNutritionEdit, setShowNutritionEdit] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [homeKeyword, setHomeKeyword] = useState('')
  const [filterCategoryIds, setFilterCategoryIds] = useState<number[]>([])
  const [filterBrandIds, setFilterBrandIds] = useState<number[]>([])
  const [filterNutrients, setFilterNutrients] = useState<string[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [compareProducts, setCompareProducts] = useState<Product[]>([])
  // 신규 OAuth 회원가입 진행 중일 때 임시 보관 (provider, oauthId, email)
  const [oauthPending, setOauthPending] = useState<{ provider: string; oauthId: string; email?: string } | null>(null)

  const { setFavoriteIds } = useFavorites()

  // 로그인 상태일 때 찜 목록을 서버에서 로드해 FavoritesContext 동기화
  useLikesQuery(isAuthenticated)
  // 앱 시작 시 토큰 유효성 검증 — 만료 시 auth:logout 이벤트로 자동 로그아웃
  useMyPageQuery(isAuthenticated)

  // OAuth 콜백: URL ?code=xxx&provider=PROVIDER 감지 → /auth/oauth 호출
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const provider = params.get('provider')
    if (!code || !provider) return

    // 콜백 파라미터를 URL에서 제거
    window.history.replaceState({}, '', window.location.pathname + window.location.hash)

    oauthLogin(provider, code).then((res) => {
      if (res.newUser) {
        // 신규 회원: 회원가입 모달 표시
        setOauthPending({ provider, oauthId: res.oauthId ?? '', email: res.email })
        setShowProfileSetup(true)
        navigate('home')
      } else {
        // 기존 회원: 토큰 저장 후 로그인 완료
        if (res.accessToken) localStorage.setItem('accessToken', res.accessToken)
        if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken)
        setIsAuthenticated(true)
        navigate('home')
      }
    }).catch(() => {
      navigate('login')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handleHashChange = () => setRoute(getRouteFromHash())
    if (!window.location.hash) setHashRoute('home')
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    const handleForceLogout = () => {
      setIsAuthenticated(false)
      setIsAdmin(false)
      setFavoriteIds([])
      localStorage.removeItem('recentSearchKeywords')
    }
    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 문서 스크롤 구조: 라우트별 스크롤 위치 저장 → 뒤로 돌아올 때 복원
  const scrollPositions = useRef<Record<string, number>>({})

  // 라우트 전환 시: 상세는 항상 맨 위, 그 외 페이지는 직전 위치 복원.
  // 콘텐츠 높이 확정 지연 / Safari의 스크롤 보정 애니메이션을 덮어쓰기 위해
  // 목표 위치에 도달할 때까지 몇 프레임 동안 즉시 강제 고정한다.
  useLayoutEffect(() => {
    const target = route === 'detail' ? 0 : (scrollPositions.current[route] ?? 0)
    console.log('[restore] route=', route, 'target=', target, 'saved=', JSON.stringify(scrollPositions.current), 'docHeight=', document.documentElement.scrollHeight, 'winH=', window.innerHeight)
    let raf = 0
    let tries = 0
    const apply = () => {
      window.scrollTo(0, target)
      tries += 1
      if (Math.abs(window.scrollY - target) > 2 && tries < 20) {
        raf = requestAnimationFrame(apply)
      } else {
        console.log('[restore done] route=', route, 'target=', target, 'final scrollY=', window.scrollY, 'tries=', tries)
      }
    }
    apply()
    return () => cancelAnimationFrame(raf)
  }, [route])

  const navigate = (r: RouteKey) => {
    // 떠나는 페이지의 현재 스크롤 위치 저장 (뒤로 돌아올 때 복원용)
    scrollPositions.current[route] = window.scrollY
    console.log('[nav] leaving', route, 'savedScrollY=', window.scrollY, '-> going', r)
    setRoute(r)
    setHashRoute(r)
  }

  const handleLogin = (nextAdmin = false) => {
    setIsAuthenticated(true)
    setIsAdmin(nextAdmin)
    setShowProfileSetup(true)
    navigate('home')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setIsAdmin(false)
    setFavoriteIds([])
    localStorage.removeItem('recentSearchKeywords')
    navigate('home')
  }

  const handleWithdraw = () => {
    setIsAuthenticated(false)
    setIsAdmin(false)
    navigate('home')
  }

  const handleAddToCompare = (product: Product) => {
    setCompareProducts(prev => {
      if (prev.length === 0) return [product]
      if (prev[0].id === product.id) return prev
      return [prev[0], product]
    })
    navigate('compare')
  }

  const currentPage = useMemo(() => {
    switch (route) {
      case 'home':
        return (
          <HomePage
            keyword={homeKeyword}
            onClearKeyword={() => setHomeKeyword('')}
            selectedCategoryIds={filterCategoryIds}
            selectedBrandIds={filterBrandIds}
            selectedNutrients={filterNutrients}
            onCategoryChange={setFilterCategoryIds}
            onBrandChange={setFilterBrandIds}
            onNutrientsChange={setFilterNutrients}
            onMoveToFilter={() => setShowFilter(true)}
            onMoveToMyPage={() => navigate('mypage')}
            onMoveToSearch={() => navigate('search')}
            onGoHome={() => { setHomeKeyword(''); setFilterCategoryIds([]); setFilterBrandIds([]); setFilterNutrients([]); navigate('home'); scrollPositions.current.home = 0; window.scrollTo({ top: 0 }) }}
            onProductClick={product => { setSelectedProduct(product); navigate('detail') }}
            onAddToCompare={handleAddToCompare}
            isAuthenticated={isAuthenticated}
            onNeedLogin={() => navigate('login')}
          />
        )
      case 'detail':
        return selectedProduct ? (
          <ProductDetailPage
            product={selectedProduct}
            onBack={() => { setSelectedProduct(null); navigate('home') }}
            isAuthenticated={isAuthenticated}
            onNeedLogin={() => navigate('login')}
          />
        ) : null
      case 'search':
        return (
          <SearchPage
            onBack={() => navigate('home')}
            onSubmitKeyword={(kw) => { scrollPositions.current.home = 0; setHomeKeyword(kw); navigate('home') }}
            onProductClick={product => { setSelectedProduct(product); navigate('detail') }}
          />
        )
      case 'mypage':
        return (
          <MyPage
            isAuthenticated={isAuthenticated}
            onBack={() => navigate('home')}
            onLogin={() => navigate('login')}
            onGoFavorites={() => navigate('favorites')}
            onGoPasswordChange={() => navigate('password-change')}
            onLogout={handleLogout}
            onEditNutrition={() => setShowNutritionEdit(true)}
            onWithdraw={handleWithdraw}
          />
        )
      case 'login':
        return (
          <LoginPage
            onLogin={(nextAdmin) => handleLogin(nextAdmin)}
          />
        )
      case 'favorites':
        return (
          <FavoritesPage
            onBack={() => navigate('mypage')}
            onProductClick={product => { setSelectedProduct(product); navigate('detail') }}
          />
        )
      case 'password-change':
        return (
          <PasswordChangePage
            onBack={() => navigate('mypage')}
          />
        )
      case 'admin':
        return isAuthenticated && isAdmin
          ? <AdminPage />
          : <LoginPage onLogin={() => { setIsAuthenticated(true); setIsAdmin(true) }} />
      case 'compare': {
        let p0: Product, p1: Product
        if (compareProducts.length >= 2) {
          [p0, p1] = compareProducts as [Product, Product]
        } else if (compareProducts.length === 1) {
          p0 = compareProducts[0]
          p1 = allProducts.find(p => p.id !== p0.id) ?? allProducts[1]
        } else {
          p0 = allProducts[0]; p1 = allProducts[1]
        }
        return (
          <ComparePage
            products={[p0, p1]}
            onBack={() => navigate('home')}
          />
        )
      }
      default:
        return null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, isAuthenticated, isAdmin, selectedProduct, compareProducts, homeKeyword, filterCategoryIds, filterBrandIds, filterNutrients])

  return (
    <main className="screen-wrap">
      <section className="mobile-page app-shell">
          {showProfileSetup && (
            <UserProfileSetupModal
              initialProfile={oauthPending?.email
                ? { ...{ name: '', email: oauthPending.email, gender: '', birth_date: '', height: '', weight: '', body_fat_rate: '', skeletal_muscle_mass: '', activity_type: '', weekly_exercise_count: '', exercise_intensity: '', daily_meal_count: 3, daily_snack_count: 1, diet_purpose: '' } }
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
              onClose={() => setShowFilter(false)}
              onApply={(sel) => {
                setFilterCategoryIds(sel.categoryIds)
                setFilterBrandIds(sel.brandIds)
                setFilterNutrients(sel.nutrients)
              }}
            />
          )}
          <section className="page-body">{currentPage}</section>
        </section>
      </main>
  )
}

function App() {
  return (
    <FavoritesProvider>
      <AppShell />
    </FavoritesProvider>
  )
}

export default App