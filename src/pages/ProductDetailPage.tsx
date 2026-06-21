import { useEffect, useState } from 'react'
import { logView, logCta } from '../api/logging'
import { LoginPromptModal } from '../components/LoginPromptModal'
import { useFavorites } from '../contexts/FavoritesContext'
import { useProductDetailQuery } from '../queries/productQueries'
import { useProductReviewsQuery } from '../queries/reviewsQueries'
import type { NutrientsResponse, NutrientBounds } from '../api/products/types'
import type { Product } from '../types/product'
import './ProductDetailPage.css'

type Tab = 'nutrition' | 'review'

type ProductDetailPageProps = {
  product: Product
  onBack: () => void
  isAuthenticated?: boolean
  onNeedLogin?: () => void
}

// 비로그인 기본값: 670kcal (EER 2000 × mealRatio 1/3) 기준
const DEFAULT_BOUNDS: NutrientBounds = {
  caloriesMax:     670,
  carbMax:         Math.round(2000 * 0.65 / 4 / 3),   // 108
  carbMin:         Math.round(2000 * 0.55 / 4 / 3),   // 92
  sugarMax:        Math.round(2000 * 0.10 / 4 / 3),   // 17
  proteinMin:      Math.round(2000 * 0.10 / 4 / 3),   // 17
  proteinMax:      Math.round(2000 * 0.20 / 4 / 3),   // 33
  fatMax:          Math.round(2000 * 0.30 / 9 / 3),   // 22
  fatMin:          Math.round(2000 * 0.15 / 9 / 3),   // 11
  saturatedFatMax: Math.round(2000 * 0.07 / 9 / 3),  // 5
  transFatMax:     Math.round(2000 * 0.01 / 9 / 3 * 10) / 10, // 0.7
  cholesterolMax:  300,
  sodiumMax:       Math.round(2300 / 3),              // 767
  fiberTarget:     Math.round(25 / 3),                // 8
}

const NUTRITION_DEFS: { key: keyof NutrientsResponse; label: string; unit: string; boundKey: keyof NutrientBounds; fallbackMax: number }[] = [
  { key: 'calories',     label: '열량',       unit: 'kcal', boundKey: 'caloriesMax',     fallbackMax: 2000 },
  { key: 'carbohydrate', label: '탄수화물',   unit: 'g',    boundKey: 'carbMax',         fallbackMax: 324  },
  { key: 'sugar',        label: '당류',        unit: 'g',    boundKey: 'sugarMax',        fallbackMax: 100  },
  { key: 'protein',      label: '단백질',      unit: 'g',    boundKey: 'proteinMax',      fallbackMax: 55   },
  { key: 'fat',          label: '지방',         unit: 'g',    boundKey: 'fatMax',          fallbackMax: 54   },
  { key: 'saturatedFat', label: '포화지방',    unit: 'g',    boundKey: 'saturatedFatMax', fallbackMax: 15   },
  { key: 'transFat',     label: '트랜스지방',  unit: 'g',    boundKey: 'transFatMax',     fallbackMax: 2.2  },
  { key: 'cholesterol',  label: '콜레스테롤',  unit: 'mg',   boundKey: 'cholesterolMax',  fallbackMax: 300  },
  { key: 'sodium',       label: '나트륨',       unit: 'mg',   boundKey: 'sodiumMax',       fallbackMax: 2000 },
]

const NUTRIENT_CHAR: Record<string, string> = {
  calories:     '열',
  carbohydrate: '탄',
  sugar:        '당',
  protein:      '단',
  fat:          '지',
  saturatedFat: '포',
  transFat:     '트',
  cholesterol:  '콜',
  sodium:       '나',
}

// 영양성분 값 표시: 소수점 한 자리까지만 (초과분 절삭)
const fmt1 = (n: number) => String(Math.trunc(Math.round(n * 100) / 10) / 10)

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function StarRow({ score, size = 14, filledColor = '#facc15' }: { score: number; size?: number; filledColor?: string }) {
  return (
    <div className="det-star-row" style={{ gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={i <= Math.round(score) ? filledColor : '#e0e0e0'}
          />
        </svg>
      ))}
    </div>
  )
}

export const ProductDetailPage = ({ product, onBack, isAuthenticated, onNeedLogin }: ProductDetailPageProps) => {
  const { isFavorite, toggle } = useFavorites()
  const faved = isFavorite(product.id)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [tab, setTab] = useState<Tab>('nutrition')

  const detailQuery = useProductDetailQuery(product.id)
  const detail = detailQuery.data

  const reviewQuery = useProductReviewsQuery(product.id)
  const reviewData = reviewQuery.data

  useEffect(() => { logView(product.id) }, [product.id])

  const handleFav = () => {
    if (!isAuthenticated) { setShowLoginPrompt(true); return }
    toggle(product.id)
  }

  return (
    <div className="det-page">

      {/* 스크롤 영역 (히어로 + 본문) */}
      <div className="det-scroll">

      {/* 히어로: 이미지 + 헤더 오버레이 */}
      <div className="det-hero">
        <header className="det-header">
          <button type="button" className="det-icon-btn" aria-label="뒤로가기" onClick={onBack}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15.7 5.3a1 1 0 0 1 0 1.4L10.41 12l5.3 5.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.42 0Z" fill="#1f1f22"/>
            </svg>
          </button>
          <button
            type="button"
            className={`det-icon-btn${faved ? ' det-fav-on' : ''}`}
            aria-label={faved ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            onClick={handleFav}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {faved
                ? <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#ea4335"/>
                : <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" fill="#1f1f22"/>
              }
            </svg>
          </button>
        </header>

        <div className="det-img-wrap">
          {(detail?.imageUrl ?? product.image)
            ? <img className="det-img" src={detail?.imageUrl ?? product.image} alt={detail?.name ?? product.name} />
            : <div className="det-img det-img--placeholder" />
          }
        </div>
      </div>

      {/* 본문 카드 */}
      <div className="det-body">

        {/* 상품 정보 */}
        <div className="det-info">
          <div className="det-info-brand-row">
            <span className="det-brand">{detail?.brand?.name ?? product.brand.name}</span>
            <button
              type="button"
              className="det-share-btn"
              aria-label="공유"
              onClick={() => {
                const url = window.location.href
                const title = detail?.name ?? product.name
                if (navigator.share) navigator.share({ title, url }).catch(() => {})
                else navigator.clipboard?.writeText(url).then(() => alert('링크가 복사되었어요')).catch(() => {})
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="18" cy="5"  r="3" stroke="#8a8a8e" strokeWidth="1.8"/>
                <circle cx="6"  cy="12" r="3" stroke="#8a8a8e" strokeWidth="1.8"/>
                <circle cx="18" cy="19" r="3" stroke="#8a8a8e" strokeWidth="1.8"/>
                <line x1="8.59"  y1="13.51" x2="15.42" y2="17.49" stroke="#8a8a8e" strokeWidth="1.8"/>
                <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49" stroke="#8a8a8e" strokeWidth="1.8"/>
              </svg>
            </button>
          </div>
          <h1 className="det-name">{detail?.name ?? product.name}</h1>
          {detail?.coupang?.price != null && (
            <span className="det-price">₩{detail.coupang.price.toLocaleString('ko-KR')}</span>
          )}
          {(detail?.grade || (reviewQuery.data && reviewQuery.data.total > 0)) && (
            <div className="det-info-rating-row">
              {reviewQuery.data && reviewQuery.data.total > 0 && (
                <>
                  <StarRow score={reviewQuery.data.avgScoreOverall} size={22} filledColor="#525760" />
                  <span className="det-info-rating-num">{reviewQuery.data.avgScoreOverall.toFixed(1)}</span>
                </>
              )}
              {detail?.grade && (
                <span className="det-grade-badge">{detail.grade}등급</span>
              )}
            </div>
          )}
        </div>

        {/* 탭 */}
        <div className="det-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'nutrition'}
            className={`det-tab${tab === 'nutrition' ? ' active' : ''}`}
            onClick={() => setTab('nutrition')}
          >영양성분</button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'review'}
            className={`det-tab${tab === 'review' ? ' active' : ''}`}
            onClick={() => setTab('review')}
          >리뷰</button>
        </div>

        {/* 영양성분 탭 */}
        {tab === 'nutrition' && (
          <section className="det-nutrition" aria-label="영양 성분">
            {(() => {
              const totalCal   = Math.round(detail?.nutrients?.calories ?? 0)
              const carbCal    = Math.round((detail?.nutrients?.carbohydrate ?? 0) * 4)
              const fatCal     = Math.round((detail?.nutrients?.fat ?? 0) * 9)
              const proteinCal = Math.round((detail?.nutrients?.protein ?? 0) * 4)
              const totalMacro = carbCal + fatCal + proteinCal
              const pct = (cal: number) => totalMacro > 0 ? Math.round((cal / totalMacro) * 100) : 0
              const carbG    = detail?.nutrients?.carbohydrate ?? 0
              const proteinG = detail?.nutrients?.protein ?? 0
              const fatG     = detail?.nutrients?.fat ?? 0
              return (
                <div className="det-cal-section">
                  <div className="det-cal-top">
                    <span className="det-cal-total-num">총 {totalCal}</span>
                    <span className="det-cal-total-unit">kcal</span>
                    <span className="det-cal-macro-list">
                      <span className="det-cal-macro">탄 {carbG}g</span>
                      <span className="det-cal-dot">·</span>
                      <span className="det-cal-macro">단 {proteinG}g</span>
                      <span className="det-cal-dot">·</span>
                      <span className="det-cal-macro">지 {fatG}g</span>
                    </span>
                  </div>
                  <div className="det-cal-bar">
                    <div className="det-cal-seg det-cal-seg--carb"    style={{ flex: carbCal || 1 }} />
                    <div className="det-cal-seg det-cal-seg--protein" style={{ flex: proteinCal || 1 }} />
                    <div className="det-cal-seg det-cal-seg--fat"     style={{ flex: fatCal || 1 }} />
                  </div>
                  <div className="det-cal-name-row">
                    <span className="det-cal-name-text" style={{ flex: carbCal || 1 }}>탄 {pct(carbCal)}%</span>
                    <span className="det-cal-name-text" style={{ flex: proteinCal || 1 }}>단 {pct(proteinCal)}%</span>
                    <span className="det-cal-name-text" style={{ flex: fatCal || 1 }}>지 {pct(fatCal)}%</span>
                  </div>
                </div>
              )
            })()}
            <div className="det-nut-serving-row">
              {detail?.nutrients?.servingSize != null && (
                <span className="det-nut-serving">1회 제공량 {detail.nutrients.servingSize} 기준</span>
              )}
              <span className="det-nut-serving-bound">한끼 권장 섭취량</span>
            </div>
            {NUTRITION_DEFS.map(({ key, label, unit, boundKey, fallbackMax }) => {
              const val = detail?.nutrients?.[key] ?? 0
              // 비로그인은 서버 값 무시하고 항상 670kcal 기준 DEFAULT_BOUNDS 사용
              const bounds = isAuthenticated ? (detail?.nutrientBounds ?? DEFAULT_BOUNDS) : DEFAULT_BOUNDS
              const maxVal = (bounds[boundKey] as number) || fallbackMax
              const pct = Math.min(100, (val / maxVal) * 100)
              return (
                <div key={key} className="det-nut-row">
                  <div className="det-nut-circle">
                    <span className="det-nut-circle-char">{NUTRIENT_CHAR[key]}</span>
                  </div>
                  <div className="det-nut-body">
                    <span className="det-nut-label">{label}</span>
                    <div className="det-nut-bar-track">
                      <div className="det-nut-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="det-nut-meta">
                      <span className="det-nut-value">{fmt1(val)}{unit}</span>
                      <span className="det-nut-pct">{fmt1(maxVal)}{unit}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {/* 리뷰 탭 */}
        {tab === 'review' && (
          <div className="det-review">
            {reviewQuery.isLoading && (
              <p className="det-review-loading">불러오는 중...</p>
            )}

            {!reviewQuery.isLoading && reviewData && reviewData.total > 0 && (
              <>
                <div className="det-review-summary">
                  <span className="det-review-avg-num">{reviewData.avgScoreOverall.toFixed(1)}</span>
                  <div className="det-review-summary-right">
                    <StarRow score={reviewData.avgScoreOverall} size={16} />
                    <span className="det-review-total">리뷰 {reviewData.total}개</span>
                  </div>
                </div>

                <div className="det-review-list">
                  {reviewData.items.map(review => (
                    <div key={review.reviewId} className="det-review-item">
                      <div className="det-review-item-header">
                        <span className="det-review-nickname">{review.nickname}</span>
                        <span className="det-review-date">{formatDate(review.createdAt)}</span>
                      </div>
                      <StarRow score={review.scoreOverall} size={13} />
                      {review.content && (
                        <p className="det-review-content">{review.content}</p>
                      )}
                      {review.images.length > 0 && (
                        <div className="det-review-images">
                          {review.images.map((src, i) => (
                            <img key={i} src={src} alt="" className="det-review-img" loading="lazy" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {!reviewQuery.isLoading && (!reviewData || reviewData.total === 0) && (
              <div className="det-review-empty">
                <p>아직 리뷰가 없어요</p>
              </div>
            )}
          </div>
        )}

        {/* 파트너스 고지 — 스크롤 콘텐츠 맨 끝(자연 푸터) */}
        {detail?.coupang?.affiliateUrl && (
          <div className="det-partners-notice">
            <p className="det-partners-text">
              이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
            </p>
          </div>
        )}

      </div>
      </div>

      {/* 쿠팡 구매 버튼 — 화면 하단 고정 */}
      {detail?.coupang?.affiliateUrl && (
        <div className="det-coupang-bar">
          <a
            href={detail.coupang.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="det-coupang-btn"
            onClick={() => logCta(product.id)}
          >
            쿠팡 바로가기
          </a>
        </div>
      )}

      {showLoginPrompt && (
        <LoginPromptModal
          onClose={() => setShowLoginPrompt(false)}
          onLogin={() => { setShowLoginPrompt(false); onNeedLogin?.() }}
        />
      )}
    </div>
  )
}
