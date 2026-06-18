import { useEffect, useMemo, useState } from 'react'
import type { Product } from '../types/product'
import { getPopularKeywords, getRecommendedKeywords, type PopularKeyword, type RecommendedKeyword } from '../api/search'

const RECOMMENDED_KEYWORDS = [
  '아침 단백질 한 끼',
  '당 없는 두유',
  '간편 도시락',
  '고단백 저지방',
  '식이섬유 많은',
  '대용량 닭가슴살',
]

type Trend = 'up' | 'down' | 'same' | 'new'
type PopularItem = { rank: number; keyword: string; trend: Trend }

const RECENT_KEY = 'recentSearchKeywords'
const RECENT_MAX = 10

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function saveRecent(list: string[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX))) } catch { /* noop */ }
}

function formatPopularStamp(d: Date): string {
  const isPM = d.getHours() >= 12
  const h = ((d.getHours() + 11) % 12) + 1
  return `오늘 ${isPM ? '오후' : '오전'}${h}:${String(d.getMinutes()).padStart(2, '0')} 기준`
}

function changeToTrend(change: PopularKeyword['change']): Trend {
  if (change === 'UP') return 'up'
  if (change === 'DOWN') return 'down'
  if (change === 'NEW') return 'new'
  return 'same'
}

type SearchPageProps = {
  onBack?: () => void
  onSubmitKeyword?: (keyword: string) => void
  onProductClick?: (product: Product) => void
  isAuthenticated?: boolean
}

export const SearchPage = ({ onBack, onSubmitKeyword, onProductClick, isAuthenticated }: SearchPageProps) => {
  const [inputValue, setInputValue] = useState('')
  const [recent, setRecent] = useState<string[]>(() => loadRecent())
  const [popularItems, setPopularItems] = useState<PopularItem[]>([])
  const [popularLoading, setPopularLoading] = useState(true)
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedKeyword[]>([])
  const [recommendedLoading, setRecommendedLoading] = useState(false)

  useEffect(() => {
    getPopularKeywords()
      .then(data => {
        setPopularItems(data.map(item => ({
          rank: item.rank,
          keyword: item.keyword,
          trend: changeToTrend(item.change),
        })))
      })
      .catch(() => {})
      .finally(() => setPopularLoading(false))
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    setRecommendedLoading(true)
    getRecommendedKeywords()
      .then(data => setRecommendedProducts(data ?? []))
      .catch(() => {})
      .finally(() => setRecommendedLoading(false))
  }, [isAuthenticated])

  const stamp = useMemo(() => formatPopularStamp(new Date()), [])

  useEffect(() => { saveRecent(recent) }, [recent])

  const runSearch = (kw: string) => {
    const trimmed = kw.trim()
    if (!trimmed) return
    const next = [trimmed, ...recent.filter(k => k !== trimmed)].slice(0, RECENT_MAX)
    setRecent(next)
    saveRecent(next)
    onSubmitKeyword?.(trimmed)
  }

  const handleRecommendedProductClick = (item: RecommendedKeyword) => {
    onProductClick?.({
      id: item.productId,
      name: item.name,
      brand: { id: 0, name: '' },
      image: '',
      nutritionScore: 0,
      category: { id: 0, name: '' },
      favorited: false,
    })
  }

  const removeRecent = (kw: string) => setRecent(prev => prev.filter(k => k !== kw))
  const clearRecent = () => setRecent([])

  const left = popularItems.slice(0, 5)
  const right = popularItems.slice(5, 10)

  return (
    <section className="sp" aria-label="검색 페이지">
      {/* 상단 검색바 */}
      <header className="sp-top">
        <button type="button" className="sp-back" aria-label="뒤로 가기" onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15.7 5.3a1 1 0 0 1 0 1.4L10.41 12l5.3 5.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.42 0Z" />
          </svg>
        </button>
        <div className="sp-input-wrap">
          <svg className="sp-input-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M10 2a8 8 0 1 1-5.3 14L1 19.7 2.3 21l3.7-3.7A8 8 0 0 1 10 2zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" fill="#9a9a9a"/>
          </svg>
          <input
            className="sp-input"
            placeholder="상품을 검색하세요"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runSearch(inputValue) }}
            aria-label="검색어 입력"
          />
        </div>
      </header>

      {/* 최근 검색어 */}
      <section className="sp-section" aria-label="최근 검색어">
        <div className="sp-section-head">
          <h3 className="sp-section-title">최근 검색어</h3>
          {recent.length > 0 && (
            <button type="button" className="sp-section-action" onClick={clearRecent}>전체삭제</button>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="sp-empty">최근 검색한 키워드가 없습니다</p>
        ) : (
          <div className="sp-chip-row sp-chip-row--scroll">
            {recent.map(kw => (
              <span key={kw} className="sp-chip sp-chip--removable">
                <button type="button" className="sp-chip-text" onClick={() => runSearch(kw)}>{kw}</button>
                <button
                  type="button"
                  className="sp-chip-remove"
                  aria-label={`${kw} 삭제`}
                  onClick={() => removeRecent(kw)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 추천 검색어 */}
      <section className="sp-section" aria-label="추천 검색어">
        <h3 className="sp-section-title">추천 검색어</h3>
        {isAuthenticated ? (
          recommendedLoading ? (
            <p className="sp-empty">불러오는 중...</p>
          ) : recommendedProducts.length > 0 ? (
            <div className="sp-chip-row sp-chip-row--wrap">
              {recommendedProducts.map(item => (
                <button key={item.productId} type="button" className="sp-chip" onClick={() => handleRecommendedProductClick(item)}>
                  {item.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="sp-empty">추천 검색어가 없습니다</p>
          )
        ) : (
          <div className="sp-chip-row sp-chip-row--wrap">
            {RECOMMENDED_KEYWORDS.map(kw => (
              <button key={kw} type="button" className="sp-chip" onClick={() => runSearch(kw)}>
                {kw}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 인기 검색어 */}
      <section className="sp-section sp-section--popular" aria-label="인기 검색어">
        <div className="sp-section-head">
          <h3 className="sp-section-title">인기 검색어</h3>
          <span className="sp-stamp">{stamp}</span>
        </div>
        {popularLoading ? (
          <p className="sp-empty">불러오는 중...</p>
        ) : popularItems.length === 0 ? (
          <p className="sp-empty">집계 중입니다</p>
        ) : (
          <div className="sp-popular-grid">
            <ol className="sp-popular-col" start={1}>
              {left.map(it => <PopularRow key={it.rank} item={it} onClick={() => runSearch(it.keyword)} />)}
            </ol>
            <ol className="sp-popular-col" start={6}>
              {right.map(it => <PopularRow key={it.rank} item={it} onClick={() => runSearch(it.keyword)} />)}
            </ol>
          </div>
        )}
      </section>
    </section>
  )
}

const PopularRow = ({ item, onClick }: { item: PopularItem; onClick: () => void }) => (
  <li className="sp-popular-row">
    <span className="sp-popular-rank">{item.rank}</span>
    <button type="button" className="sp-popular-term" onClick={onClick}>{item.keyword}</button>
    <span className={`sp-popular-trend sp-popular-trend--${item.trend}`} aria-hidden="true">
      {item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : item.trend === 'new' ? 'N' : '–'}
    </span>
  </li>
)
