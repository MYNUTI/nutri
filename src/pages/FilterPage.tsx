import { useState } from 'react'
import { NUTRIENT_OPTIONS } from '../constants/nutrientFilters'
import { useBrandsQuery } from '../queries/brandsQueries'
import { useCategoriesQuery } from '../queries/categoriesQueries'
import type { CategoryResponse } from '../api/products/types'
import './FilterPage.css'

type FilterPageProps = {
  onClose: () => void
  onApply?: (selection: { categories: string[]; brands: string[]; nutrients: string[] }) => void
}

function flattenCategories(cats: CategoryResponse[]): CategoryResponse[] {
  return cats.flatMap(c => [c, ...flattenCategories(c.children ?? [])])
}

const NUTRIENT_CHIPS = NUTRIENT_OPTIONS

export const FilterPage = ({ onClose, onApply }: FilterPageProps) => {
  const { data: brandsData } = useBrandsQuery()
  const brandList = brandsData ?? []
  const { data: categoriesData } = useCategoriesQuery()
  const categoryList = flattenCategories(categoriesData ?? [])
  const [catOpen, setCatOpen] = useState(true)
  const [brandOpen, setBrandOpen] = useState(false)
  const [calOpen, setCalOpen] = useState(false)

  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set())
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set())
  const [selectedCal, setSelectedCal] = useState<Set<string>>(new Set())

  const toggleSet = (set: Set<string>, item: string): Set<string> => {
    const next = new Set(set)
    if (next.has(item)) next.delete(item)
    else next.add(item)
    return next
  }

  const handleReset = () => {
    setSelectedCats(new Set())
    setSelectedBrands(new Set())
    setSelectedCal(new Set())
  }

  const handleApply = () => {
    onApply?.({
      categories: Array.from(selectedCats),
      brands: Array.from(selectedBrands),
      nutrients: Array.from(selectedCal),
    })
    onClose()
  }

  const totalSelected = selectedCats.size + selectedBrands.size + selectedCal.size

  return (
    <div className="fil-overlay">
      <div className="fil-panel">
        <header className="fil-header">
          <span className="fil-header-title">필터</span>
          <button type="button" className="fil-close" aria-label="닫기" onClick={onClose}>✕</button>
        </header>

        <div className="fil-body">
          {/* 식품 카테고리 */}
          <div className="fil-section">
            <button type="button" className="fil-section-btn" onClick={() => setCatOpen(v => !v)}>
              <span>식품 카테고리</span>
              <span className="fil-chevron">{catOpen ? '∧' : '∨'}</span>
            </button>
            {catOpen && (
              <div className="fil-grid2">
                {categoryList.map(cat => (
                  <label key={cat.id} className="fil-check-label">
                    <input
                      type="checkbox"
                      className="fil-check"
                      checked={selectedCats.has(cat.name)}
                      onChange={() => setSelectedCats(toggleSet(selectedCats, cat.name))}
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 브랜드 */}
          <div className="fil-section">
            <button type="button" className="fil-section-btn" onClick={() => setBrandOpen(v => !v)}>
              <span>브랜드</span>
              <span className="fil-chevron">{brandOpen ? '∧' : '∨'}</span>
            </button>
            {brandOpen && (
              <div className="fil-grid2">
                {brandList.map(b => (
                  <label key={b.id} className="fil-check-label">
                    <input
                      type="checkbox"
                      className="fil-check"
                      checked={selectedBrands.has(b.name)}
                      onChange={() => setSelectedBrands(toggleSet(selectedBrands, b.name))}
                    />
                    <span>{b.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 성분 */}
          <div className="fil-section">
            <button type="button" className="fil-section-btn" onClick={() => setCalOpen(v => !v)}>
              <span>성분</span>
              <span className="fil-chevron">{calOpen ? '∧' : '∨'}</span>
            </button>
            {calOpen && (
              <div className="fil-grid2">
                {NUTRIENT_CHIPS.map(c => (
                  <label key={c} className="fil-check-label">
                    <input
                      type="checkbox"
                      className="fil-check"
                      checked={selectedCal.has(c)}
                      onChange={() => setSelectedCal(toggleSet(selectedCal, c))}
                    />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="fil-footer">
          <button type="button" className="fil-btn fil-btn--reset" onClick={handleReset}>
            초기화
          </button>
          <button type="button" className="fil-btn fil-btn--apply" onClick={handleApply}>
            적용하기{totalSelected > 0 ? ` (${totalSelected})` : ''}
          </button>
        </footer>
      </div>
    </div>
  )
}
