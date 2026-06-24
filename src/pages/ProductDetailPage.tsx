import { useEffect, useState } from 'react'
import { logView, logCta } from '../api/logging'
import { LoginPromptModal } from '../components/LoginPromptModal'
import { ConfirmModal } from '../components/ConfirmModal'
import { useFavorites } from '../contexts/FavoritesContext'
import { useProductDetailQuery } from '../queries/productQueries'
import {
  useProductReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} from '../queries/reviewsQueries'
import type { ReviewItem } from '../api/reviews'
import type { NutrientsResponse, NutrientBounds } from '../api/products/types'
import type { Product } from '../types/product'
import './ProductDetailPage.css'

type Tab = 'nutrition' | 'review'

type ProductDetailPageProps = {
  product: Product
  onBack: () => void
  isAuthenticated?: boolean
  onNeedLogin?: () => void
  myNickname?: string
}

// 비로그인 기본값: 670kcal (EER 2000 × mealRatio 1/3) 기준
const DEFAULT_BOUNDS: NutrientBounds = {
  caloriesMax:     670,
  carbMax:         Math.round(2000 * 0.65 / 4 / 3),
  carbMin:         Math.round(2000 * 0.55 / 4 / 3),
  sugarMax:        Math.round(2000 * 0.10 / 4 / 3),
  proteinMin:      Math.round(2000 * 0.10 / 4 / 3),
  proteinMax:      Math.round(2000 * 0.20 / 4 / 3),
  fatMax:          Math.round(2000 * 0.30 / 9 / 3),
  fatMin:          Math.round(2000 * 0.15 / 9 / 3),
  saturatedFatMax: Math.round(2000 * 0.07 / 9 / 3),
  transFatMax:     Math.round(2000 * 0.01 / 9 / 3 * 10) / 10,
  cholesterolMax:  300,
  sodiumMax:       Math.round(2300 / 3),
  fiberTarget:     Math.round(25 / 3),
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

// 리뷰 작성/수정 폼 (전체 화면 오버레이)
type ReviewFormProps = {
  productName: string
  productImage: string
  editTarget?: ReviewItem | null
  onClose: () => void
  onSubmit: (score: number, content: string) => Promise<void>
  submitting: boolean
}

function ReviewForm({ productName, productImage, editTarget, onClose, onSubmit, submitting }: ReviewFormProps) {
  const [score, setScore] = useState(editTarget?.scoreOverall ?? 0)
  const [content, setContent] = useState(editTarget?.content ?? '')
  const [hovered, setHovered] = useState(0)

  const isEdit = !!editTarget

  const handleSubmit = async () => {
    if (score === 0) return
    await onSubmit(score, content)
  }

  return (
    <div className="rv-form-overlay">
      {/* 헤더 */}
      <div className="rv-form-header">
        <button type="button" className="rv-form-back" onClick={onClose} aria-label="닫기">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15.7 5.3a1 1 0 0 1 0 1.4L10.41 12l5.3 5.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.42 0Z" fill="#1f1f22"/>
          </svg>
        </button>
        <span className="rv-form-title">{isEdit ? '리뷰 수정' : '리뷰 작성'}</span>
      </div>

      <div className="rv-form-body">
        {/* 상품 정보 */}
        <div className="rv-form-product">
          <div className="rv-form-product-img">
            {productImage
              ? <img src={productImage} alt={productName} />
              : <div className="rv-form-product-img-placeholder" />
            }
          </div>
          <span className="rv-form-product-name">{productName}</span>
        </div>

        {/* 구분선 (SVG y=200, h=8, #F2F3F5) */}
        <div className="rv-form-divider" />

        {/* 별점 선택 */}
        <div className="rv-star-selector">
          {[1, 2, 3, 4, 5].map(i => (
            <button
              key={i}
              type="button"
              className="rv-star-btn"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setScore(i)}
              aria-label={`${i}점`}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill={i <= (hovered || score) ? '#525760' : '#D9DCE0'}
                />
              </svg>
            </button>
          ))}
        </div>

        {/* 리뷰 내용 */}
        <textarea
          className="rv-textarea"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="최소 10자 이상 입력해주세요."
          maxLength={500}
        />
        <div className="rv-char-count">{content.length} / 500</div>
      </div>

      {/* 제출 버튼 */}
      <div className="rv-form-footer">
        <button
          type="button"
          className="rv-submit-btn"
          onClick={handleSubmit}
          disabled={submitting || score === 0}
        >
          {submitting ? '처리 중...' : isEdit ? '수정 완료' : '등록하기'}
        </button>
      </div>
    </div>
  )
}

export const ProductDetailPage = ({ product, onBack, isAuthenticated, onNeedLogin, myNickname }: ProductDetailPageProps) => {
  const { isFavorite, toggle } = useFavorites()
  const faved = isFavorite(product.id)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [tab, setTab] = useState<Tab>('nutrition')

  // 리뷰 폼 상태
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<ReviewItem | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [confirmAlert, setConfirmAlert] = useState<string | null>(null)

  const detailQuery = useProductDetailQuery(product.id)
  const detail = detailQuery.data

  const reviewQuery = useProductReviewsQuery(product.id)
  const reviewData = reviewQuery.data

  const createMutation = useCreateReviewMutation(product.id)
  const updateMutation = useUpdateReviewMutation(product.id)
  const deleteMutation = useDeleteReviewMutation(product.id)

  useEffect(() => { logView(product.id) }, [product.id])

  const handleFav = () => {
    if (!isAuthenticated) { setShowLoginPrompt(true); return }
    toggle(product.id)
  }

  // 본인 리뷰 여부
  const ownReview = myNickname
    ? (reviewData?.items ?? []).find(r => r.nickname === myNickname)
    : undefined

  // 별점 분포 계산 (로드된 items 기준)
  const starCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: (reviewData?.items ?? []).filter(r => Math.round(r.scoreOverall) === star).length,
  }))
  const maxCount = Math.max(...starCounts.map(s => s.count), 1)

  const handleWriteClick = () => {
    if (!isAuthenticated) { setShowLoginPrompt(true); return }
    setEditTarget(null)
    setShowForm(true)
  }

  const handleEditClick = (review: ReviewItem) => {
    setEditTarget(review)
    setShowForm(true)
  }

  const handleDeleteClick = (reviewId: number) => {
    setShowDeleteConfirm(reviewId)
  }

  const handleDeleteConfirm = async () => {
    if (showDeleteConfirm == null) return
    try {
      await deleteMutation.mutateAsync(showDeleteConfirm)
    } catch {
      // 에러 무시 (403 등)
    } finally {
      setShowDeleteConfirm(null)
    }
  }

  const handleFormSubmit = async (score: number, content: string) => {
    try {
      if (editTarget) {
        await updateMutation.mutateAsync({ reviewId: editTarget.reviewId, scoreOverall: score, content })
      } else {
        await createMutation.mutateAsync({ scoreOverall: score, content })
      }
      setShowForm(false)
    } catch (e: unknown) {
      setShowForm(false)
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('409') || msg.includes('이미')) {
        setConfirmAlert('이미 작성한 리뷰가 있습니다.')
      } else {
        setConfirmAlert('오류가 발생했습니다. 다시 시도해 주세요.')
      }
    }
  }

  const submitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="det-page">

      {/* 스크롤 영역 */}
      <div className="det-scroll">

      {/* 히어로 */}
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
                  <span className="det-info-rating-num">({reviewQuery.data.avgScoreOverall.toFixed(1)})</span>
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
                {/* 별점 요약 */}
                <div className="rv-summary">
                  <div className="rv-summary-left">
                    <span className="rv-avg-num">{reviewData.avgScoreOverall.toFixed(1)}</span>
                    <StarRow score={reviewData.avgScoreOverall} size={16} filledColor="#525760" />
                  </div>
                  <div className="rv-summary-right">
                    {starCounts.map(({ star, count }) => (
                      <div key={star} className="rv-bar-row">
                        <span className="rv-bar-label">{star}점</span>
                        <div className="rv-bar-track">
                          <div
                            className="rv-bar-fill"
                            style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="rv-bar-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 구분선 */}
                <div className="rv-divider" />

                {/* 액션 행 */}
                <div className="rv-action-row">
                  <span className="rv-total-label">리뷰 {reviewData.total}개</span>
                  {isAuthenticated && !ownReview && (
                    <button type="button" className="rv-write-btn" onClick={handleWriteClick}>
                      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#B0B8C1"/>
                      </svg>
                      리뷰 쓰기
                    </button>
                  )}
                  {isAuthenticated && ownReview && (
                    <button type="button" className="rv-write-btn" onClick={() => handleEditClick(ownReview)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#B0B8C1"/>
                      </svg>
                      내 리뷰 수정
                    </button>
                  )}
                  {!isAuthenticated && (
                    <button type="button" className="rv-write-btn" onClick={handleWriteClick}>
                      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#B0B8C1"/>
                      </svg>
                      리뷰 쓰기
                    </button>
                  )}
                </div>

                {/* 리뷰 목록 */}
                <div className="rv-list">
                  {reviewData.items.map(review => {
                    const isOwn = myNickname ? review.nickname === myNickname : false
                    const isEdited = review.updatedAt && review.createdAt !== review.updatedAt
                    return (
                      <div key={review.reviewId} className="rv-item">
                        <div className="rv-item-header">
                          <span className="rv-nickname">{review.nickname}</span>
                          {isEdited && <span className="rv-edited-badge">수정됨</span>}
                        </div>
                        <StarRow score={review.scoreOverall} size={13} filledColor="#525760" />
                        {review.content && (
                          <p className="rv-content">{review.content}</p>
                        )}
                        <span className="rv-date">{formatDate(review.createdAt)}</span>
                        {isAuthenticated && isOwn && (
                          <div className="rv-item-actions">
                            <button
                              type="button"
                              className="rv-action-btn"
                              onClick={() => handleEditClick(review)}
                            >수정</button>
                            <span className="rv-action-sep">·</span>
                            <button
                              type="button"
                              className="rv-action-btn rv-action-btn--delete"
                              onClick={() => handleDeleteClick(review.reviewId)}
                            >삭제</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* 리뷰 없을 때 */}
            {!reviewQuery.isLoading && (!reviewData || reviewData.total === 0) && (
              <div className="rv-empty">
                <p className="rv-empty-text">아직 리뷰가 없어요</p>
                <p className="rv-empty-sub">첫 번째 리뷰를 남겨보세요</p>
                <button type="button" className="rv-empty-write-btn" onClick={handleWriteClick}>
                  리뷰 작성하기
                </button>
              </div>
            )}
          </div>
        )}

        {/* 파트너스 고지 */}
        {detail?.coupang?.affiliateUrl && (
          <div className="det-partners-notice">
            <p className="det-partners-text">
              이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
            </p>
          </div>
        )}

      </div>
      </div>

      {/* 쿠팡 구매 버튼 */}
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

      {/* 리뷰 작성/수정 폼 */}
      {showForm && (
        <ReviewForm
          productName={detail?.name ?? product.name}
          productImage={detail?.imageUrl ?? product.image}
          editTarget={editTarget}
          onClose={() => setShowForm(false)}
          onSubmit={handleFormSubmit}
          submitting={submitting}
        />
      )}

      {/* 삭제 확인 */}
      {showDeleteConfirm != null && (
        <ConfirmModal
          message={'한 번 삭제하면 이 상품에\n다시 리뷰를 쓸 수 없어요.'}
          confirmText={deleteMutation.isPending ? '삭제 중...' : '삭제'}
          cancelText="취소"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}

      {/* 에러/알림 팝업 */}
      {confirmAlert && (
        <ConfirmModal
          message={confirmAlert}
          onConfirm={() => setConfirmAlert(null)}
        />
      )}
    </div>
  )
}
