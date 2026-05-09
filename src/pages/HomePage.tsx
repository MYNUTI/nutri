import { useRef, useState } from 'react'
import { useFavorites } from '../contexts/FavoritesContext'
import { FilterIcon, UserIcon } from '../components/icons'
import { useProductListQuery } from '../queries/productQueries'
import type { ProductResponse } from '../api/products/types'
import type { Product } from '../types/product'

type HomePageProps = {
  onMoveToFilter: () => void
  onMoveToMyPage: () => void
  onProductClick?: (product: Product) => void
  onAddToCompare?: (product: Product) => void
}

const CATEGORIES = [
  { id: 'nuts',     label: '견과류',         emoji: '🥜' },
  { id: 'grain',    label: '곡류,시리얼',    emoji: '🌾' },
  { id: 'chicken',  label: '닭고기',         emoji: '🍗' },
  { id: 'plant',    label: '식물성 단백질',  emoji: '🫛' },
  { id: 'meat',     label: '돼지,소,오리',   emoji: '🥩' },
  { id: 'noodle',   label: '면류',           emoji: '🍜' },
  { id: 'rice',     label: '밥,식사류',      emoji: '🍚' },
  { id: 'seafood',  label: '수산물',         emoji: '🐟' },
  { id: 'protein',  label: '프로틴,쉐이크',  emoji: '🥤' },
  { id: 'snack',    label: '스낵,빵',        emoji: '🍞' },
  { id: 'dairy',    label: '유제품',         emoji: '🧀' },
  { id: 'sauce',    label: '유지류,소스',    emoji: '🧈' },
  { id: 'drink',    label: '음료류',         emoji: '🥤' },
]
const PAGE_SIZE = 4
const PAGE_COUNT = Math.ceil(CATEGORIES.length / PAGE_SIZE)

const FILTER_CHIPS = ['추천순', '브랜드', '성분'] as const
type ChipKey = typeof FILTER_CHIPS[number]

const BRAND_OPTIONS = ['풀무원', '꼬기닭', '허닭', '하림']
const NUTRIENT_OPTIONS = ['저당', '고단백']

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

export const HomePage = ({ onMoveToFilter, onMoveToMyPage, onProductClick }: HomePageProps) => {
  const { data, isLoading, isError } = useProductListQuery()
  const products = data?.items ?? []
  const [activeCat, setActiveCat] = useState(0)
  const [activePage, setActivePage] = useState(0)
  const [openChip, setOpenChip] = useState<ChipKey | null>(null)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedNutrients, setSelectedNutrients] = useState<string[]>([])
  const catsScrollRef = useRef<HTMLDivElement | null>(null)
  const { toggle, isFavorite } = useFavorites()

  const toggleInArray = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]

  const handleCatsScroll = () => {
    const el = catsScrollRef.current
    if (!el) return
    const page = Math.round(el.scrollLeft / el.clientWidth)
    if (page !== activePage) setActivePage(page)
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <button className="icon-btn" type="button" aria-label="마이페이지" onClick={onMoveToMyPage}>
          <UserIcon />
        </button>
      </header>

      <div className="home-search">
        <svg className="home-search-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M10 2a8 8 0 1 1-5.3 14L1 19.7 2.3 21l3.7-3.7A8 8 0 0 1 10 2zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" fill="#9a9a9a"/>
        </svg>
        <input type="text" placeholder="검색" aria-label="상품 검색" />
      </div>

      <div className="home-cats-wrap">
        <div
          className="home-cats"
          role="list"
          aria-label="카테고리"
          ref={catsScrollRef}
          onScroll={handleCatsScroll}
        >
          {Array.from({ length: PAGE_COUNT }).map((_, pageIdx) => {
            const slice = CATEGORIES.slice(pageIdx * PAGE_SIZE, (pageIdx + 1) * PAGE_SIZE)
            return (
              <div className="home-cats-page" key={pageIdx}>
                {slice.map((c) => {
                  const globalIdx = CATEGORIES.indexOf(c)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`home-cat${globalIdx === activeCat ? ' home-cat--on' : ''}`}
                      role="listitem"
                      onClick={() => setActiveCat(globalIdx)}
                    >
                      <span className="home-cat-emoji" aria-hidden="true">{c.emoji}</span>
                      <span className="home-cat-label">{c.label}</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
        <div className="home-cat-dots" aria-hidden="true">
          {Array.from({ length: PAGE_COUNT }).map((_, i) => (
            <span key={i} className={`home-cat-dot${i === activePage ? ' home-cat-dot--on' : ''}`} />
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
            label === '브랜드' ? selectedBrands.length :
            label === '성분' ? selectedNutrients.length : 0
          return (
            <button
              key={label}
              type="button"
              className={`home-chip${isOpen ? ' home-chip--on' : ''}`}
              onClick={() => setOpenChip(isOpen ? null : label)}
            >
              {label}{count > 0 ? ` ${count}` : ''} <span aria-hidden="true">▾</span>
            </button>
          )
        })}
      </div>

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
            {BRAND_OPTIONS.map(opt => (
              <label key={opt} className="home-dropdown-item">
                <input
                  type="checkbox"
                  className="home-dropdown-check"
                  checked={selectedBrands.includes(opt)}
                  onChange={() => setSelectedBrands(prev => toggleInArray(prev, opt))}
                />
                <span>{opt}</span>
              </label>
            ))}
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
            {NUTRIENT_OPTIONS.map(opt => (
              <label key={opt} className="home-dropdown-item">
                <input
                  type="checkbox"
                  className="home-dropdown-check"
                  checked={selectedNutrients.includes(opt)}
                  onChange={() => setSelectedNutrients(prev => toggleInArray(prev, opt))}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="home-divider" />

      {isLoading && <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>불러오는 중...</p>}
      {isError && <p style={{ textAlign: 'center', color: '#b42318', padding: '2rem' }}>상품을 불러오지 못했습니다.</p>}

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
                  <p className="home-card-price">{item.category?.name ?? '-'}</p>
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
