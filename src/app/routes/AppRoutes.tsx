import { Navigate, Route, Routes } from 'react-router'
import { products as allProducts } from '../../mocks/products'
import { ComparePage } from '../../pages/ComparePage'
import { FavoritesPage } from '../../pages/FavoritesPage'
import { HomePage, type SortKey } from '../../pages/HomePage'
import { LoginPage } from '../../pages/LoginPage'
import { MyPage } from '../../pages/MyPage'
import { PasswordChangePage } from '../../pages/PasswordChangePage'
import { SearchPage } from '../../pages/SearchPage'
import { WithdrawPage } from '../../pages/WithdrawPage'
import type { Product } from '../../types/product'
import { AdminRoute } from './AdminRoute'
import { ProductRoute } from './ProductRoute'
import { useAppNavigation } from './useAppNavigation'

export type AppRoutesProps = {
  isAuthenticated: boolean
  isAdmin: boolean
  sessionChecking: boolean
  myNickname?: string
  onLogin: () => void
  onLogout: () => void
  onWithdraw: () => void
  homeKeyword: string
  homeSort: SortKey
  filterCategoryIds: number[]
  filterBrandIds: number[]
  filterNutrients: string[]
  setHomeKeyword: (kw: string) => void
  setHomeSort: (s: SortKey) => void
  onCategoryChange: (ids: number[]) => void
  resetHomeFilters: () => void
  onMoveToFilter: () => void
  onApplyFilter: (sel: { categoryIds: number[]; brandIds: number[]; nutrients: string[] }) => void
  onAddToCompare: (p: Product) => void
  compareProducts: Product[]
  onEditNutrition: () => void
}

export function AppRoutes(props: AppRoutesProps) {
  const { go, goBack } = useAppNavigation()
  const openProduct = (p: Product) => go(`/detail/${p.id}`, { state: { product: p } })

  const [c0, c1] = resolveComparePair(props.compareProducts)

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            keyword={props.homeKeyword}
            onClearKeyword={() => props.setHomeKeyword('')}
            selectedCategoryIds={props.filterCategoryIds}
            selectedBrandIds={props.filterBrandIds}
            selectedNutrients={props.filterNutrients}
            onCategoryChange={props.onCategoryChange}
            selectedSort={props.homeSort}
            onSortChange={props.setHomeSort}
            onMoveToFilter={props.onMoveToFilter}
            onApplyFilter={props.onApplyFilter}
            onMoveToMyPage={() => go('/mypage')}
            onMoveToSearch={() => go('/search')}
            onGoHome={() => { props.resetHomeFilters(); go('/', { replace: true }) }}
            onProductClick={openProduct}
            onAddToCompare={props.onAddToCompare}
            isAuthenticated={props.isAuthenticated}
            onNeedLogin={() => go('/login')}
          />
        }
      />
      <Route
        path="/detail/:id"
        element={
          <ProductRoute
            isAuthenticated={props.isAuthenticated}
            myNickname={props.myNickname}
            onBack={() => goBack('/')}
            onNeedLogin={() => go('/login')}
          />
        }
      />
      <Route
        path="/search"
        element={
          <SearchPage
            onBack={() => goBack('/')}
            onSubmitKeyword={(kw) => { props.setHomeKeyword(kw); go('/') }}
            onProductClick={openProduct}
            isAuthenticated={props.isAuthenticated}
          />
        }
      />
      <Route
        path="/mypage"
        element={
          <MyPage
            isAuthenticated={props.isAuthenticated}
            onBack={() => goBack('/')}
            onLogin={() => go('/login')}
            onGoFavorites={() => go('/favorites')}
            onGoPasswordChange={() => go('/password-change')}
            onLogout={props.onLogout}
            onEditNutrition={props.onEditNutrition}
            onWithdraw={() => go('/withdraw')}
          />
        }
      />
      <Route path="/login" element={<LoginPage onLogin={props.onLogin} />} />
      <Route
        path="/favorites"
        element={
          <FavoritesPage
            onBack={() => goBack('/mypage')}
            onProductClick={openProduct}
          />
        }
      />
      <Route path="/password-change" element={<PasswordChangePage onBack={() => goBack('/mypage')} />} />
      <Route
        path="/withdraw"
        element={<WithdrawPage onBack={() => goBack('/mypage')} onWithdraw={props.onWithdraw} />}
      />
      <Route
        path="/admin"
        element={
          <AdminRoute
            isAdmin={props.isAdmin}
            sessionChecking={props.sessionChecking}
            onLogin={props.onLogin}
          />
        }
      />
      <Route
        path="/compare"
        element={<ComparePage products={[c0, c1]} onBack={() => goBack('/')} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// 비교 페이지 새로고침 시 메모리의 compareProducts가 비므로 mock으로 폴백(기존 동작 유지)
function resolveComparePair(compareProducts: Product[]): [Product, Product] {
  if (compareProducts.length >= 2) return [compareProducts[0], compareProducts[1]]
  if (compareProducts.length === 1) {
    const p0 = compareProducts[0]
    return [p0, allProducts.find(p => p.id !== p0.id) ?? allProducts[1]]
  }
  return [allProducts[0], allProducts[1]]
}
