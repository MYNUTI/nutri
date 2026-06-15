import { useEffect, useMemo, useRef, useState } from 'react'
import { LoginPromptModal } from '../components/LoginPromptModal'
import { useFavorites } from '../contexts/FavoritesContext'
import { FilterIcon, UserIcon, ChevronDownIcon, ChevronUpIcon } from '../components/icons'
import { useInfiniteProductListQuery } from '../queries/productQueries'
import { useBrandsQuery } from '../queries/brandsQueries'
import { useCategoriesQuery } from '../queries/categoriesQueries'
import type { ProductResponse, ProductSearchCondition, SortType } from '../api/products/types'
import type { Product } from '../types/product'
import { useNutrientClaimsQuery } from '../queries/nutrientClaimsQueries'

type HomePageProps = {
  keyword?: string
  onClearKeyword?: () => void
  selectedCategoryIds: number[]
  selectedBrandIds: number[]
  selectedNutrients: string[]
  onCategoryChange: (ids: number[]) => void
  onBrandChange: (ids: number[]) => void
  onNutrientsChange: (nutrients: string[]) => void
  onMoveToFilter: () => void
  onMoveToMyPage: () => void
  onMoveToSearch?: () => void
  onGoHome?: () => void
  onProductClick?: (product: Product) => void
  onAddToCompare?: (product: Product) => void
  isAuthenticated?: boolean
  onNeedLogin?: () => void
}

const FILTER_CHIPS = ['추천순', '브랜드', '성분'] as const
type ChipKey = typeof FILTER_CHIPS[number]

const SORT_OPTIONS = ['추천순', '영양점수순', '인기순', '정확도순'] as const
type SortKey = typeof SORT_OPTIONS[number]

const SORT_MAP: Record<SortKey, SortType> = {
  '추천순':     'RECOMMENDED',
  '영양점수순': 'SCORE',
  '인기순':     'POPULAR',
  '정확도순':   'ACCURACY',
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
  onCategoryChange, onBrandChange, onNutrientsChange,
  onMoveToFilter, onMoveToMyPage, onMoveToSearch, onGoHome, onProductClick,
  isAuthenticated, onNeedLogin,
}: HomePageProps) => {
  const { data: brandsData } = useBrandsQuery()
  const brandOptions = brandsData ?? []
  const { data: claimsData } = useNutrientClaimsQuery()
  const claimOptions = claimsData ?? []
  const { data: categoriesData } = useCategoriesQuery()
  const categories = useMemo(() => (categoriesData ?? []).filter(c => c.depth === 1), [categoriesData])

  const [catOpen, setCatOpen] = useState(false)
  const [openChip, setOpenChip] = useState<ChipKey | null>(null)
  const [selectedSort, setSelectedSort] = useState<SortKey>('추천순')
  const [tempBrandIds, setTempBrandIds] = useState<number[]>(selectedBrandIds)
  const [tempNutrients, setTempNutrients] = useState<string[]>(selectedNutrients)

  const { toggle, isFavorite } = useFavorites()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const catsScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (catOpen || !catsScrollRef.current) return
    const selected = catsScrollRef.current.querySelector<HTMLElement>('.home-cat-chip--on')
    if (selected) selected.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [catOpen])

  useEffect(() => {
    if (openChip === '브랜드') setTempBrandIds([...selectedBrandIds])
    if (openChip === '성분') setTempNutrients([...selectedNutrients])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openChip])

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
  const products = (data?.pages.flatMap(p => p.items) ?? []).filter(p => !!p.imageUrl)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasNextPage) fetchNextPage() },
      { root: scrollContainerRef.current, threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage])

  const handleCatSelect = (id: number) => {
    onCategoryChange(selectedCategoryIds[0] === id ? [] : [id])
    setCatOpen(false)
  }

  const handleExpandClick = () => {
    if (!catOpen) setOpenChip(null)
    setCatOpen(prev => !prev)
  }

  const handleFilterChipClick = (label: ChipKey) => {
    if (openChip !== label) setCatOpen(false)
    setOpenChip(openChip === label ? null : label)
  }

  return (
    <div
      className={`home-page${catOpen ? ' home-page--catopen' : ''}`}
      ref={scrollContainerRef}
    >
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
          <svg className="home-search-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M10 2a8 8 0 1 1-5.3 14L1 19.7 2.3 21l3.7-3.7A8 8 0 0 1 10 2zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" fill="#9a9a9a"/>
          </svg>
          {keyword
            ? <span className="home-search-keyword">{keyword}</span>
            : <span className="home-search-placeholder">검색</span>
          }
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

      {/* 카테고리 가로 스크롤 바 */}
      <div className="home-cats-area">
        <div className="home-cats-scroll" role="list" aria-label="카테고리" ref={catsScrollRef}>
          {catOpen ? (
            <span className="home-cats-open-label">카테고리 전체보기</span>
          ) : (
            <>
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
            </>
          )}
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
            <div className="home-cat-panel-grid">
              <button
                type="button"
                className={`home-cat-panel-item${selectedCategoryIds.length === 0 ? ' home-cat-panel-item--on' : ''}`}
                onClick={() => { onCategoryChange([]); setCatOpen(false) }}
              >
                <span className="home-cat-panel-icon">전체</span>
                <span className="home-cat-panel-label">전체</span>
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`home-cat-panel-item${selectedCategoryIds.includes(c.id) ? ' home-cat-panel-item--on' : ''}`}
                  onClick={() => handleCatSelect(c.id)}
                >
                  <span className="home-cat-panel-icon">{c.name.slice(0, 2)}</span>
                  <span className="home-cat-panel-label">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 필터 칩 */}
      <div className="home-chips-wrap">
        <div className="home-chips">
          <button className="home-chip-icon" type="button" aria-label="필터" onClick={onMoveToFilter}>
            <FilterIcon />
          </button>
          {FILTER_CHIPS.map(label => {
            const isOpen = openChip === label
            const count =
              label === '브랜드' ? selectedBrandIds.length :
              label === '성분' ? selectedNutrients.length : 0
            const display = label === '추천순' ? selectedSort : label
            return (
              <button
                key={label}
                type="button"
                className={`home-chip${isOpen ? ' home-chip--on' : ''}`}
                onClick={() => handleFilterChipClick(label)}
                aria-expanded={isOpen}
              >
                {display}{count > 0 ? ` ${count}` : ''}
          <span className="home-chip-chevron" aria-hidden="true">
            {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </span>
              </button>
            )
          })}
        </div>

        {openChip === '추천순' && (
          <div className="home-dropdown" role="listbox" aria-label="정렬">
            <ul className="home-dropdown-list">
              {SORT_OPTIONS.map(opt => {
                const isActive = opt === selectedSort
                return (
                  <li key={opt}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      className={`home-dropdown-row${isActive ? ' home-dropdown-row--on' : ''}`}
                      onClick={() => { setSelectedSort(opt); setOpenChip(null) }}
                    >
                      {opt}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {openChip === '브랜드' && (
          <div className="home-dropdown" role="dialog" aria-label="브랜드 필터">
            <div className="home-dropdown-header">
              <span className="home-dropdown-title">브랜드</span>
              <button type="button" className="home-dropdown-close" aria-label="닫기" onClick={() => setOpenChip(null)}>
                <span aria-hidden="true">▾</span>
              </button>
            </div>
            <div className="home-dropdown-grid">
              {brandOptions.map(b => (
                <label key={b.id} className="home-dropdown-item">
                  <input
                    type="checkbox"
                    className="home-dropdown-check"
                    checked={tempBrandIds.includes(b.id)}
                    onChange={() => setTempBrandIds(
                      tempBrandIds.includes(b.id)
                        ? tempBrandIds.filter(id => id !== b.id)
                        : [...tempBrandIds, b.id]
                    )}
                  />
                  <span>{b.name}</span>
                </label>
              ))}
            </div>
            <div className="home-dropdown-footer">
              <button type="button" className="home-dropdown-reset" onClick={() => setTempBrandIds([])}>초기화</button>
              <button type="button" className="home-dropdown-apply" onClick={() => { onBrandChange(tempBrandIds); setOpenChip(null) }}>적용하기</button>
            </div>
          </div>
        )}

        {openChip === '성분' && (
          <div className="home-dropdown" role="dialog" aria-label="성분 필터">
            <div className="home-dropdown-header">
              <span className="home-dropdown-title">성분</span>
              <button type="button" className="home-dropdown-close" aria-label="닫기" onClick={() => setOpenChip(null)}>
                <span aria-hidden="true">▾</span>
              </button>
            </div>
            <div className="home-dropdown-grid">
              {claimOptions.map(opt => (
                <label key={opt.code} className="home-dropdown-item">
                  <input
                    type="checkbox"
                    className="home-dropdown-check"
                    checked={tempNutrients.includes(opt.code)}
                    onChange={() => setTempNutrients(
                      tempNutrients.includes(opt.code)
                        ? tempNutrients.filter(n => n !== opt.code)
                        : [...tempNutrients, opt.code]
                    )}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            <div className="home-dropdown-footer">
              <button type="button" className="home-dropdown-reset" onClick={() => setTempNutrients([])}>초기화</button>
              <button type="button" className="home-dropdown-apply" onClick={() => { onNutrientsChange(tempNutrients); setOpenChip(null) }}>적용하기</button>
            </div>
          </div>
        )}
      </div>

      {/* 상품 목록 영역 — catOpen 시 딤 처리 */}
      <div className="home-body">
        {catOpen && (
          <div
            className="home-cat-dim"
            onClick={() => setCatOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className="home-divider" />

        {isLoading && <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>불러오는 중...</p>}
        {isError && <p style={{ textAlign: 'center', color: '#b42318', padding: '2rem' }}>상품을 불러오지 못했습니다.</p>}
        {!isLoading && !isError && products.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>조건에 맞는 상품이 없습니다.</p>
        )}

        <section className="home-grid" aria-label="상품 목록">
          {products.map(item => {
            const product = mapToProduct(item)
            const faved = isFavorite(item.id)
            return (
              <article key={item.id} className="home-card" onClick={() => onProductClick?.(product)}>
                <div className="home-card-img-wrap">
                  {item.imageUrl
                    ? <img className="home-card-img" src={item.imageUrl} alt={item.name} loading="lazy" />
                    : <div className="home-card-img home-card-img--placeholder" />
                  }
                  <span className="home-card-grade">{item.grade ?? item.nutritionScore}</span>
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

        <div ref={sentinelRef} style={{ height: 1 }} />
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
    </div>
  )
}
