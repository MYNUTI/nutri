import { useState } from 'react'
import { LoginPromptModal } from '../components/LoginPromptModal'
import { useFavorites } from '../contexts/FavoritesContext'
import { useProductDetailQuery } from '../queries/productQueries'
import type { NutrientsResponse } from '../api/products/types'
import type { Product } from '../types/product'
import './ProductDetailPage.css'

type ProductDetailPageProps = {
  product: Product
  onBack: () => void
  isAuthenticated?: boolean
  onNeedLogin?: () => void
}

const NUTRITION_DEFS: { key: keyof NutrientsResponse; label: string; unit: string; max: number }[] = [
  { key: 'calories',      label: '열량',      unit: 'kcal', max: 2000 },
  { key: 'sodium',        label: '나트륨',    unit: 'mg',   max: 2000 },
  { key: 'carbohydrate',  label: '탄수화물',  unit: 'g',    max: 324  },
  { key: 'sugar',         label: '당류',      unit: 'g',    max: 100  },
  { key: 'fat',           label: '지방',      unit: 'g',    max: 54   },
  { key: 'transFat',      label: '트랜스지방', unit: 'g',   max: 2.2  },
  { key: 'saturatedFat',  label: '포화지방',  unit: 'g',    max: 15   },
  { key: 'cholesterol',   label: '콜레스테롤', unit: 'mg',  max: 300  },
  { key: 'protein',       label: '단백질',    unit: 'g',    max: 55   },
]

export const ProductDetailPage = ({ product, onBack, isAuthenticated, onNeedLogin }: ProductDetailPageProps) => {
  const { isFavorite, toggle } = useFavorites()
  const faved = isFavorite(product.id)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const detailQuery = useProductDetailQuery(product.id)
  const detail = detailQuery.data

  return (
    <div className="det-page">
      {/* 상단 바 — Figma 시안: 뒤로가기만 */}
      <header className="det-header">
        <button type="button" className="det-icon-btn" aria-label="뒤로가기" onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.7 5.3a1 1 0 0 1 0 1.4L10.41 12l5.3 5.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.42 0Z" fill="#111"/></svg>
        </button>
      </header>

      {/* 상품 이미지 */}
      <div className="det-img-wrap">
        {product.image
          ? <img className="det-img" src={product.image} alt={product.name} />
          : <div className="det-img det-img--placeholder" />
        }
      </div>

      {/* 흰색 카드 (이미지 위로 살짝 올라옴) */}
      <div className="det-body">

      {/* 상품 정보 */}
      <div className="det-info">
        <span className="det-brand">{detail?.brand?.name ?? '-'}</span>
        <h1 className="det-name">{product.name}</h1>
        <div className="det-price-row">
          {detail?.coupang?.price != null && (
            <>
              <span className="det-price">{detail.coupang.price.toLocaleString('ko-KR')}원</span>
              <span className="det-per">(100g당 {detail.coupang.price.toLocaleString('ko-KR')}원)</span>
            </>
          )}
        </div>
        <div className="det-stars" aria-label="별점">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="det-star" aria-hidden="true">★</span>
          ))}
          <button
            type="button"
            className={`det-fav-toggle${faved ? ' on' : ''}`}
            aria-label={faved ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            onClick={() => {
              if (!isAuthenticated) { setShowLoginPrompt(true); return }
              toggle(product.id)
            }}
          >
            {faved ? '♥' : '♡'}
          </button>
        </div>
      </div>

      {/* 영양점수 카드 */}
      <div className="det-score-card">
        <div className="det-score-left">
          <div className="det-score-heading">
            <svg className="det-score-crown" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 18h18M4 18l2-8 5 4 3-7 3 7 5-4 2 8H4z"/>
            </svg>
            <span className="det-score-title">영양점수</span>
          </div>
          <p className="det-score-sub">
            {detail?.category?.name ?? '-'} 카테고리<br />
            {detail?.pns != null
              ? `총 ${detail.pns.categoryTotal}개 제품 중 상위 ${detail.pns.topPercent}%`
              : '-'}
          </p>
        </div>
        <div
          className="det-score-ring"
          style={{ background: `conic-gradient(#555 0deg ${(product.nutritionScore / 100) * 360}deg, #e8e8e8 ${(product.nutritionScore / 100) * 360}deg 360deg)` }}
        >
          <div className="det-score-inner">
            <span className="det-score-num">{product.nutritionScore}점</span>
          </div>
        </div>
      </div>

      {/* 쿠팡 바로가기 */}
      {detail?.coupang?.affiliateUrl
        ? <a href={detail.coupang.affiliateUrl} target="_blank" rel="noopener noreferrer" className="det-coupang-btn">쿠팡 바로가기</a>
        : <button type="button" className="det-coupang-btn" disabled>쿠팡 바로가기</button>
      }

      <div className="det-divider" />

      {/* 영양 성분 바 */}
      <section className="det-nutrition" aria-label="영양 성분">
        {NUTRITION_DEFS.map(({ key, label, unit, max }) => {
          const val = detail?.nutrients?.[key] ?? 0
          const pct = Math.min(100, (val / max) * 100)
          return (
            <div key={key} className="det-nut-row">
              <span className="det-nut-label">{label}</span>
              <div className="det-nut-bar-wrap">
                <div className="det-nut-bar" style={{ width: `${pct}%` }} />
              </div>
              <div className="det-nut-vals">
                <span>{val}{unit}</span>
                <span>{max}{unit}</span>
              </div>
            </div>
          )
        })}
      </section>

      </div>{/* det-body end */}
      {showLoginPrompt && (
        <LoginPromptModal
          onClose={() => setShowLoginPrompt(false)}
          onLogin={() => { setShowLoginPrompt(false); onNeedLogin?.() }}
        />
      )}
    </div>
  )
}
