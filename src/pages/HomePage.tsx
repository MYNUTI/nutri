import { useEffect, useMemo, useRef, useState } from 'react'
import { useFavorites } from '../contexts/FavoritesContext'
import { FilterIcon, UserIcon } from '../components/icons'
import { useProductListQuery } from '../queries/productQueries'
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
}

const PAGE_SIZE = 4

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
}: HomePageProps) => {
  const { data: brandsData } = useBrandsQuery()
  const brandOptions = brandsData ?? []
  const { data: claimsData } = useNutrientClaimsQuery()
  const claimOptions = claimsData ?? []
  const { data: categoriesData } = useCategoriesQuery()
  const categories = useMemo(() => (categoriesData ?? []).filter(c => c.depth === 1), [categoriesData])
  const pageCount = Math.ceil(categories.length / PAGE_SIZE)
  const [activePage, setActivePage] = useState(0)
  const [openChip, setOpenChip] = useState<ChipKey | null>(null)
  const [selectedSort, setSelectedSort] = useState<SortKey>('추천순')
  const [tempBrandIds, setTempBrandIds] = useState<number[]>(selectedBrandIds)
  const [tempNutrients, setTempNutrients] = useState<string[]>(selectedNutrients)

  useEffect(() => {
    if (openChip === '브랜드') setTempBrandIds([...selectedBrandIds])
    if (openChip === '성분') setTempNutrients([...selectedNutrients])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openChip])
  const catsScrollRef = useRef<HTMLDivElement | null>(null)
  const { toggle, isFavorite } = useFavorites()

  const condition = useMemo<ProductSearchCondition>(() => {
    const c: ProductSearchCondition = {
      sort: SORT_MAP[selectedSort],
      page: 0,
      size: 20,
    }
    if (keyword?.trim()) c.keyword = keyword.trim()
    if (selectedBrandIds.length > 0) c.brandIds = selectedBrandIds
    if (selectedCategoryIds.length > 0) c.categoryIds = selectedCategoryIds
    if (selectedNutrients.length > 0) c.nutrientClaims = selectedNutrients
    return c
  }, [keyword, selectedSort, selectedBrandIds, selectedNutrients, selectedCategoryIds])

  const { data, isLoading, isError } = useProductListQuery(condition)
  const products = (data?.items ?? []).filter(p => !!p.imageUrl)

  const handleCatsScroll = () => {
    const el = catsScrollRef.current
    if (!el) return
    const page = Math.round(el.scrollLeft / el.clientWidth)
    if (page !== activePage) setActivePage(page)
  }

  const goToPage = (idx: number) => {
    const el = catsScrollRef.current
    if (!el) return
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
  }

  const dragStateRef = useRef<{ startX: number; startScroll: number; moved: boolean } | null>(null)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = catsScrollRef.current
    if (!el) return
    dragStateRef.current = { startX: e.clientX, startScroll: el.scrollLeft, moved: false }
    el.classList.add('home-cats--dragging')
  }
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = catsScrollRef.current
    const st = dragStateRef.current
    if (!el || !st) return
    const dx = e.clientX - st.startX
    if (Math.abs(dx) > 4) st.moved = true
    el.scrollLeft = st.startScroll - dx
  }
  const endDrag = () => {
    const el = catsScrollRef.current
    const st = dragStateRef.current
    if (!el || !st) return
    el.classList.remove('home-cats--dragging')
    const page = Math.round(el.scrollLeft / el.clientWidth)
    el.scrollTo({ left: page * el.clientWidth, behavior: 'smooth' })
    dragStateRef.current = null
  }
  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.moved) {
      e.stopPropagation()
      e.preventDefault()
    }
  }

  return (
    <div className="home-page">
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

      <div className="home-cats-wrap">
        <div
          className="home-cats"
          role="list"
          aria-label="카테고리"
          ref={catsScrollRef}
          onScroll={handleCatsScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onClickCapture={handleClickCapture}
        >
          {Array.from({ length: pageCount }).map((_, pageIdx) => {
            const slice = categories.slice(pageIdx * PAGE_SIZE, (pageIdx + 1) * PAGE_SIZE)
            return (
              <div className="home-cats-page" key={pageIdx}>
                {slice.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`home-cat${selectedCategoryIds.includes(c.id) ? ' home-cat--on' : ''}`}
                    role="listitem"
                    onClick={() => onCategoryChange(
                      selectedCategoryIds.includes(c.id)
                        ? selectedCategoryIds.filter(id => id !== c.id)
                        : [...selectedCategoryIds, c.id]
                    )}
                  >
                    <span className="home-cat-label">{c.name}</span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
        <div className="home-cat-dots" role="tablist" aria-label="카테고리 페이지">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === activePage}
              aria-label={`${i + 1}페이지`}
              className={`home-cat-dot${i === activePage ? ' home-cat-dot--on' : ''}`}
              onClick={() => goToPage(i)}
            />
          ))}
        </div>
      </div>

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
              onClick={() => setOpenChip(isOpen ? null : label)}
            >
              {display}{count > 0 ? ` ${count}` : ''} <span aria-hidden="true">{isOpen ? '▴' : '▾'}</span>
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
            <button
              type="button"
              className="home-dropdown-close"
              aria-label="닫기"
              onClick={() => setOpenChip(null)}
            >
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
            <button
              type="button"
              className="home-dropdown-close"
              aria-label="닫기"
              onClick={() => setOpenChip(null)}
            >
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
                <span className="home-card-grade">{item.nutritionScore}</span>
              </div>
              <div className="home-card-bottom">
                <div className="home-card-text">
                  <p className="home-card-brand">{item.brand?.name ?? '-'}</p>
                  <p className="home-card-name">{item.name}</p>
                </div>
                <button
                  type="button"
                  className={`home-card-heart${faved ? ' on' : ''}`}
                  aria-label={faved ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                  onClick={e => { e.stopPropagation(); toggle(item.id) }}
                >
                  {faved ? '♥' : '♡'}
                </button>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
