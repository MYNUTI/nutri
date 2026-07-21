import { useEffect, useMemo, useRef, useState } from 'react'
import { logFilter, logSearch } from '../api/logging'
import type { ProductResponse, ProductSearchCondition, SortType } from '../api/products/types'
import { ChevronDownIcon, ChevronUpIcon, FilterIcon, UserIcon } from '../components/icons'
import { LoginPromptModal } from '../components/LoginPromptModal'
import { useFavorites } from '../contexts/FavoritesContext'
import { useImpressionTracking } from '../hooks/useImpressionTracking'
import { useCategoriesQuery } from '../queries/categoriesQueries'
import { useInfiniteProductListQuery } from '../queries/productQueries'
import type { Product } from '../types/product'

type HomePageProps = {
  keyword?: string
  onClearKeyword?: () => void
  selectedCategoryIds: number[]
  selectedBrandIds: number[]
  selectedNutrients: string[]
  onCategoryChange: (ids: number[]) => void
  selectedSort: SortKey
  onSortChange: (sort: SortKey) => void
  onMoveToFilter: (section?: 'nutrient' | 'brand') => void
  onMoveToMyPage: () => void
  onMoveToSearch?: () => void
  onGoHome?: () => void
  onProductClick?: (product: Product) => void
  onAddToCompare?: (product: Product) => void
  isAuthenticated?: boolean
  onNeedLogin?: () => void
}

const FILTER_CHIPS = ['성분', '브랜드'] as const

const SORT_OPTIONS = ['추천순', '영양점수순', '인기순', '정확도순'] as const
export type SortKey = typeof SORT_OPTIONS[number]

const SORT_MAP: Record<SortKey, SortType> = {
  '추천순':     'RECOMMENDED',
  '영양점수순': 'SCORE',
  '인기순':     'POPULAR',
  '정확도순':   'ACCURACY',
}

// 카테고리명 → 이미지 (public/categories/). 없는 카테고리는 글자로 폴백
const CATEGORY_IMAGES: Record<string, string> = {
  '음료류':         '/categories/drink.png',
  '쉐이크, 프로틴':  '/categories/shake_prot.png',
  '스낵, 빵, 디저트': '/categories/snack.png',
  '닭고기':         '/categories/chicken.png',
  '유제품':         '/categories/dairy.png',
  '견과류':         '/categories/nuts.png',
  '유지류·소스':     '/categories/oils.png',
  '밥 / 식사류':     '/categories/meal.png',
  '곡류, 시리얼':    '/categories/mean.png',
  '면류':           '/categories/noodle.png',
  '수산물':         '/categories/aquatic.png',
  '돼지, 소, 오리':   '/categories/meat.png',
  '식물성 단백질':   '/categories/veget_prot.png',
}

function mapToProduct(p: ProductResponse): Product {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    image: p.imageUrl,
    nutritionScore: p.nutritionScore,
    category: p.category,
    favorited: p.favorited,
  }
}

export const HomePage = ({
  keyword, onClearKeyword,
  selectedCategoryIds, selectedBrandIds, selectedNutrients,
  onCategoryChange, selectedSort, onSortChange,
  onMoveToFilter, onMoveToMyPage, onMoveToSearch, onGoHome, onProductClick,
  isAuthenticated, onNeedLogin,
}: HomePageProps) => {
  const { data: categoriesData } = useCategoriesQuery()
  const categories = useMemo(() => (categoriesData ?? []).filter(c => c.depth === 1), [categoriesData])

  const [catOpen, setCatOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  const { toggle, isFavorite } = useFavorites()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const catsScrollRef = useRef<HTMLDivElement | null>(null)
  const scrollReadyRef = useRef(false)
  const loggedSearchRef = useRef<string | null>(null)

  useEffect(() => {
    if (catOpen || !catsScrollRef.current) return
    const selected = catsScrollRef.current.querySelector<HTMLElement>('.home-cat-chip--on')
    if (selected) selected.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [catOpen])

  const condition = useMemo<ProductSearchCondition>(() => {
    const c: ProductSearchCondition = {
      sort: SORT_MAP[selectedSort],
      size: 20,
    }
    if (keyword?.trim()) c.keyword = keyword.trim()
    if (selectedBrandIds.length > 0) c.brandIds = selectedBrandIds
    if (selectedCategoryIds.length > 0) c.categoryIds = selectedCategoryIds
    if (selectedNutrients.length > 0) c.nutrientClaims = selectedNutrients
    return c
  }, [keyword, selectedSort, selectedBrandIds, selectedNutrients, selectedCategoryIds])

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteProductListQuery(condition)
  const products = data?.pages.flatMap(p => p.items) ?? []

  const trimmedKeyword = keyword?.trim()
  const { observe } = useImpressionTracking(trimmedKeyword ? 'SEARCH' : 'LIST', trimmedKeyword)

  useEffect(() => {
    const trimmed = keyword?.trim()
    if (!trimmed || !data?.pages[0]) return
    const total = data.pages[0].total
    const logKey = `${trimmed}:${total}`
    if (loggedSearchRef.current === logKey) return
    loggedSearchRef.current = logKey
    logSearch(trimmed, total)
  }, [keyword, data?.pages])

  useEffect(() => {
    scrollReadyRef.current = false
    const timer = setTimeout(() => { scrollReadyRef.current = true }, 700)
    return () => { clearTimeout(timer); scrollReadyRef.current = false }
  }, [])

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return

    const handleScroll = () => {
      if (!scrollReadyRef.current) return
      const scrollTop = window.scrollY
      const clientHeight = window.innerHeight
      const scrollHeight = document.documentElement.scrollHeight
      if (scrollHeight - scrollTop - clientHeight < 300) fetchNextPage()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!sortOpen) return
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('.home-sort-menu, .home-meta-sort')) return
      setSortOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [sortOpen])

  useEffect(() => {
    const locked = catOpen || sortOpen
    if (!locked) return
    const prevent = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('.home-cat-panel, .home-sort-menu')) return
      e.preventDefault()
    }
    window.addEventListener('wheel', prevent, { passive: false })
    window.addEventListener('touchmove', prevent, { passive: false })
    return () => {
      window.removeEventListener('wheel', prevent)
      window.removeEventListener('touchmove', prevent)
    }
  }, [catOpen, sortOpen])

  const handleCatSelect = (id: number) => {
    onCategoryChange(selectedCategoryIds[0] === id ? [] : [id])
    setCatOpen(false)
  }

  const handleExpandClick = () => {
    if (!catOpen) setSortOpen(false)
    setCatOpen(prev => !prev)
  }

  const categoryPanelGrid = (
    <div className="home-cat-panel-grid">
      <button
        type="button"
        className={`home-cat-panel-item${selectedCategoryIds.length === 0 ? ' home-cat-panel-item--on' : ''}`}
        onClick={() => { onCategoryChange([]); setCatOpen(false) }}
      >
        <span className="home-cat-panel-icon">
          <img src={'/categories/all.png'} alt="" className="home-cat-panel-img" />
        </span>
        <span className="home-cat-panel-label">전체</span>
      </button>
      {categories.map(c => {
        const img = CATEGORY_IMAGES[c.name]
        return (
          <button
            key={c.id}
            type="button"
            className={`home-cat-panel-item${selectedCategoryIds.includes(c.id) ? ' home-cat-panel-item--on' : ''}`}
            onClick={() => handleCatSelect(c.id)}
          >
            <span className="home-cat-panel-icon">
              {img
                ? <img src={img} alt="" className="home-cat-panel-img" />
                : c.name.slice(0, 2)}
            </span>
            <span className="home-cat-panel-label">{c.name}</span>
          </button>
        )
      })}
    </div>
  )

  return (
    <div
      className={`home-page${catOpen ? ' home-page--catopen' : ''}`}
      ref={scrollContainerRef}
    >
      <div className="home-topbar">
        <header className="home-header">
          <button
            type="button"
            className="home-brand"
            onClick={() => onGoHome?.()}
            aria-label="홈으로"
          >
            영양대학
          </button>
          <button className="icon-btn home-header-user" type="button" aria-label="마이페이지" onClick={onMoveToMyPage}>
            <UserIcon />
          </button>
        </header>

        <div className="home-search">
        <button
          type="button"
          className="home-search--btn"
          onClick={() => onMoveToSearch?.()}
          aria-label={keyword ? `검색어: ${keyword}` : '검색 페이지로 이동'}
        >
          {keyword
            ? <span className="home-search-keyword">{keyword}</span>
            : <span className="home-search-placeholder">검색</span>
          }
          <svg className="home-search-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M10 2a8 8 0 1 1-5.3 14L1 19.7 2.3 21l3.7-3.7A8 8 0 0 1 10 2zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" fill="#9a9a9a"/>
          </svg>
        </button>
        {keyword && (
          <button
            type="button"
            className="home-search-clear"
            aria-label="검색어 해제"
            onClick={(e) => { e.stopPropagation(); onClearKeyword?.() }}
          >
            ×
          </button>
        )}
        </div>
      </div>

      {/* 카테고리 가로 스크롤 바 */}
      <div className="home-cats-area">
        <div className="home-cats-scroll" role="list" aria-label="카테고리" ref={catsScrollRef}>
          <button
            type="button"
            role="listitem"
            className={`home-cat-chip${selectedCategoryIds.length === 0 ? ' home-cat-chip--on' : ''}`}
            onClick={() => onCategoryChange([])}
          >
            전체
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              type="button"
              role="listitem"
              className={`home-cat-chip${selectedCategoryIds.includes(c.id) ? ' home-cat-chip--on' : ''}`}
              onClick={() => onCategoryChange(selectedCategoryIds.includes(c.id) ? [] : [c.id])}
            >
              {c.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`home-cats-expand${catOpen ? ' home-cats-expand--on' : ''}`}
          aria-label={catOpen ? '카테고리 전체보기 닫기' : '카테고리 전체보기'}
          aria-expanded={catOpen}
          onClick={handleExpandClick}
        >
          {catOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>

        {catOpen && (
          <div className="home-cat-panel" role="dialog" aria-label="카테고리 전체보기">
            {categoryPanelGrid}
          </div>
        )}
      </div>

      {/* 필터 칩 */}
      <div className="home-chips-wrap">
        <div className="home-chips">
          <button
            className="home-chip-icon"
            type="button"
            aria-label="필터"
            onClick={() => { setCatOpen(false); setSortOpen(false); onMoveToFilter() }}
          >
            <FilterIcon />
          </button>
          {FILTER_CHIPS.map(label => {
            const hasFilter =
              (label === '브랜드' && selectedBrandIds.length > 0) ||
              (label === '성분' && selectedNutrients.length > 0)

            return (
              <button
                key={label}
                type="button"
                className={`home-chip${hasFilter ? ' home-chip--on' : ''}`}
                onClick={() => {
                  setCatOpen(false)
                  setSortOpen(false)
                  onMoveToFilter(label === '성분' ? 'nutrient' : 'brand')
                }}
              >
                {label}
                <span className="home-chip-chevron" aria-hidden="true">
                  <ChevronDownIcon />
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 상품 개수 + 정렬 */}
      <div className="home-meta">
        <p className="home-meta-count">상품 <span className="home-meta-total">{data?.pages[0]?.total ?? 0}</span></p>
        <button
          type="button"
          className="home-meta-sort"
          aria-expanded={sortOpen}
          aria-haspopup="menu"
          onClick={() => {
            if (!sortOpen) setCatOpen(false)
            setSortOpen(prev => !prev)
          }}
        >
          {selectedSort}
          <img src="/common/sort.svg" alt="" width="22" height="20" aria-hidden="true" />
        </button>

        {sortOpen && (
          <div className="home-sort-menu" role="menu" aria-label="정렬">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                role="menuitemradio"
                aria-checked={selectedSort === opt}
                className={`home-sort-menu-item${selectedSort === opt ? ' home-sort-menu-item--on' : ''}`}
                onClick={() => {
                  onSortChange(opt)
                  logFilter('SORT', opt)
                  setSortOpen(false)
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* 상품 목록 영역 — catOpen / 정렬 패널 시 딤 처리 */}
      <div className="home-body">
        {catOpen && (
          <div
            className="home-cat-dim"
            onClick={() => setCatOpen(false)}
            aria-hidden="true"
          />
        )}


        {isLoading && <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>불러오는 중...</p>}
        {isError && <p style={{ textAlign: 'center', color: '#b42318', padding: '2rem' }}>상품을 불러오지 못했습니다.</p>}
        {!isLoading && !isError && products.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>조건에 맞는 상품이 없습니다.</p>
        )}

        <section className="home-grid" aria-label="상품 목록">
          {products.map((item, index) => {
            const product = mapToProduct(item)
            const faved = isFavorite(item.id)
            return (
              <article
                key={item.id}
                ref={el => observe(el, item.id, index + 1)}
                className="home-card"
                onClick={() => onProductClick?.(product)}
              >
                <div className="home-card-img-wrap">
                  {item.imageUrl
                    ? <img className="home-card-img" src={item.imageUrl} alt={item.name} loading="lazy" />
                    : <div className="home-card-img home-card-img--placeholder" />
                  }
                  <span className="home-card-grade" data-grade={item.grade?.toUpperCase()}>{item.grade ?? item.nutritionScore}</span>
                </div>
                <div className="home-card-bottom">
                  <div className="home-card-text">
                    <p className="home-card-brand">{item.brand?.name ?? '-'}</p>
                    <p className="home-card-name">{item.name}</p>
                    {item.price != null && (
                      <p className="home-card-price">
                        ₩{Number(item.price).toLocaleString('ko-KR')}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className={`home-card-heart${faved ? ' on' : ''}`}
                    aria-label={faved ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                    onClick={e => {
                      e.stopPropagation()
                      if (!isAuthenticated) { setShowLoginPrompt(true); return }
                      toggle(item.id)
                    }}
                  >
                    {faved ? '♥' : '♡'}
                  </button>
                </div>
              </article>
            )
          })}
        </section>

        {isFetchingNextPage && (
          <p style={{ textAlign: 'center', color: '#888', padding: '1rem' }}>불러오는 중...</p>
        )}
      </div>
      {showLoginPrompt && (
        <LoginPromptModal
          onClose={() => setShowLoginPrompt(false)}
          onLogin={() => { setShowLoginPrompt(false); onNeedLogin?.() }}
        />
      )}
      {showScrollTop && (
        <button
          type="button"
          className="home-scroll-top"
          aria-label="맨 위로"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ChevronUpIcon />
        </button>
      )}
    </div>
  )
}
