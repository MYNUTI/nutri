import { useState } from 'react'
import { register } from './api/auth'
import { postNutrition, type NutritionData } from './api/nutrition'
import './App.css'
import { AppRoutes } from './app/routes/AppRoutes'
import { useAppNavigation } from './app/routes/useAppNavigation'
import { useScrollRestoration } from './app/routes/useScrollRestoration'
import { useAuthSession } from './app/hooks/useAuthSession'
import { useHomeSearchState } from './app/hooks/useHomeSearchState'
import { useOAuthFlow } from './app/hooks/useOAuthFlow'
import { NutritionEditModal } from './components/NutritionEditModal'
import { UserProfileSetupModal, type Profile } from './components/UserProfileSetupModal'
import { useFavorites } from './contexts/FavoritesContext'
import { FilterPage } from './pages/FilterPage'
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
  const { setFavoriteIds } = useFavorites()

  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showNutritionEdit, setShowNutritionEdit] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [compareProducts, setCompareProducts] = useState<Product[]>([])

  const auth = useAuthSession({ go, setFavoriteIds })
  const oauth = useOAuthFlow({
    go,
    onAuthenticated: () => auth.setIsAuthenticated(true),
    onNewUser: () => setShowProfileSetup(true),
  })
  const search = useHomeSearchState()

  const handleLogin = () => {
    auth.setIsAuthenticated(true)
    setShowProfileSetup(true)
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
              initialProfile={oauth.oauthPending?.email
                ? { ...{ name: '', email: oauth.oauthPending.email, gender: '', birth_date: '', height: '', weight: '', body_fat_rate: '', skeletal_muscle_mass: '', activity_type: '', weekly_exercise_count: '', exercise_intensity: '', daily_meal_count: 3, daily_snack_count: 1, diet_purpose: '', personalInfoAgreed: false, healthInfoAgreed: false, ageConfirmed: false } }
                : undefined
              }
              onClose={() => { setShowProfileSetup(false); oauth.setOauthPending(null) }}
              onComplete={async (profile) => {
                setShowProfileSetup(false)
                try {
                  if (oauth.oauthPending) {
                    // 신규 OAuth 회원: register → nutrition 순서로 호출
                    await register({
                      provider: oauth.oauthPending.provider,
                      oauthId: oauth.oauthPending.oauthId,
                      name: profile.name,
                      email: profile.email,
                      gender: profile.gender,
                      birthDate: profile.birth_date,
                      personalInfoAgreed: profile.personalInfoAgreed,
                      healthInfoAgreed: profile.healthInfoAgreed,
                      ageConfirmed: profile.ageConfirmed,
                    })
                    oauth.setOauthPending(null)
                    auth.setIsAuthenticated(true)
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
              initialCategoryIds={search.state.categoryIds}
              initialBrandIds={search.state.brandIds}
              initialNutrients={search.state.nutrients}
              onClose={() => setShowFilter(false)}
              onApply={(sel) => search.applyFilter(sel)}
            />
          )}
          <section className="page-body">
            {/* OAuth 콜백 처리 중에는 라우트를 마운트하지 않는다 —
                catch-all(*) Navigate가 effect보다 먼저 돌아 ?code&provider를 날리는 것 방지 */}
            {!oauth.oauthProcessing && (
              <AppRoutes
                isAuthenticated={auth.isAuthenticated}
                isAdmin={auth.isAdmin}
                sessionChecking={auth.sessionChecking}
                myNickname={auth.myNickname}
                onLogin={handleLogin}
                onLogout={auth.logout}
                onWithdraw={auth.withdraw}
                homeKeyword={search.state.keyword}
                homeSort={search.state.sort}
                filterCategoryIds={search.state.categoryIds}
                filterBrandIds={search.state.brandIds}
                filterNutrients={search.state.nutrients}
                setHomeKeyword={search.setKeyword}
                setHomeSort={search.setSort}
                onCategoryChange={search.setCategories}
                resetHomeFilters={search.reset}
                onMoveToFilter={() => setShowFilter(true)}
                onApplyFilter={(sel) => search.applyFilter(sel)}
                onAddToCompare={handleAddToCompare}
                compareProducts={compareProducts}
                onEditNutrition={() => setShowNutritionEdit(true)}
              />
            )}
          </section>
          {(oauth.oauthProcessing || auth.sessionChecking) && (
            <div className="oauth-splash" role="status" aria-live="polite">
              <span className="oauth-splash-spinner" aria-hidden="true" />
              <span className="oauth-splash-text">{oauth.oauthProcessing ? '로그인 중...' : '불러오는 중...'}</span>
            </div>
          )}
        </section>
      </main>
  )
}

export default App
