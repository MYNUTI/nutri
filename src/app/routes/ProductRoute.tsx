import { useLocation, useParams } from 'react-router'
import { ProductDetailPage } from '../../pages/ProductDetailPage'
import type { Product } from '../../types/product'

// 딥링크 진입 시 ID만 가진 임시 Product (상세 쿼리가 나머지 필드를 채움)
const makeProductFromId = (id: number): Product => ({
  id, name: '', brand: { id: 0, name: '' }, image: '',
  nutritionScore: 0, category: { id: 0, name: '' }, favorited: false,
})

type ProductRouteProps = {
  isAuthenticated: boolean
  myNickname?: string
  onBack: () => void
  onNeedLogin: () => void
}

export function ProductRoute({ isAuthenticated, myNickname, onBack, onNeedLogin }: ProductRouteProps) {
  const { id } = useParams()
  const location = useLocation()
  const numId = Number(id)

  if (!id || !Number.isInteger(numId) || numId <= 0) {
    return (
      <section className="detail-error" role="alert">
        <p>존재하지 않는 상품입니다.</p>
        <button type="button" onClick={onBack}>홈으로</button>
      </section>
    )
  }

  // 목록에서 넘긴 Product는 렌더 힌트로만 사용 — ID는 useParams가 유일한 진실 공급원
  const hint = (location.state as { product?: Product } | null)?.product
  const product = hint && hint.id === numId ? hint : makeProductFromId(numId)

  return (
    <ProductDetailPage
      product={product}
      onBack={onBack}
      isAuthenticated={isAuthenticated}
      onNeedLogin={onNeedLogin}
      myNickname={myNickname}
    />
  )
}
