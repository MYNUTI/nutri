import { useState } from 'react'
import { NUTRIENT_OPTIONS } from '../constants/nutrientFilters'
import { useBrandsQuery } from '../queries/brandsQueries'
import { useCategoriesQuery } from '../queries/categoriesQueries'
import './FilterPage.css'

type FilterPageProps = {
  initialCategoryId?: number | null
  initialBrandId?: number | null
  initialNutrients?: string[]
  onClose: () => void
  onApply?: (selection: { categoryId: number | null; brandId: number | null; nutrients: string[] }) => void
}

const NUTRIENT_CHIPS = NUTRIENT_OPTIONS

export const FilterPage = ({ initialCategoryId = null, initialBrandId = null, initialNutrients = [], onClose, onApply }: FilterPageProps) => {
  const { data: brandsData } = useBrandsQuery()
  const brandList = brandsData ?? []
  const { data: categoriesData } = useCategoriesQuery()
  const categoryList = (categoriesData ?? []).filter(c => c.depth === 1)
  const [catOpen, setCatOpen] = useState(true)
  const [brandOpen, setBrandOpen] = useState(false)
  const [calOpen, setCalOpen] = useState(false)

  const [selectedCatId, setSelectedCatId] = useState<number | null>(initialCategoryId)
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(initialBrandId)
  const [selectedCal, setSelectedCal] = useState<Set<string>>(new Set(initialNutrients))

  const toggleSet = (set: Set<string>, item: string): Set<string> => {
    const next = new Set(set)
    if (next.has(item)) next.delete(item)
    else next.add(item)
    return next
  }

  const handleReset = () => {
    setSelectedCatId(null)
    setSelectedBrandId(null)
    setSelectedCal(new Set())
  }

  const handleApply = () => {
    onApply?.({
      categoryId: selectedCatId,
      brandId: selectedBrandId,
      nutrients: Array.from(selectedCal),
    })
    onClose()
  }

  const totalSelected = (selectedCatId != null ? 1 : 0) + (selectedBrandId != null ? 1 : 0) + selectedCal.size

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
                      type="radio"
                      name="fil-category"
                      className="fil-check"
                      checked={selectedCatId === cat.id}
                      onChange={() => setSelectedCatId(cat.id)}
                      onClick={() => { if (selectedCatId === cat.id) setSelectedCatId(null) }}
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
                      type="radio"
                      name="fil-brand"
                      className="fil-check"
                      checked={selectedBrandId === b.id}
                      onChange={() => setSelectedBrandId(b.id)}
                      onClick={() => { if (selectedBrandId === b.id) setSelectedBrandId(null) }}
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
