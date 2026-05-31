import { useState } from 'react'
import { useBrandsQuery } from '../queries/brandsQueries'
import { useCategoriesQuery } from '../queries/categoriesQueries'
import { useNutrientClaimsQuery } from '../queries/nutrientClaimsQueries'
import './FilterPage.css'

type FilterPageProps = {
  initialCategoryIds?: number[]
  initialBrandIds?: number[]
  initialNutrients?: string[]
  onClose: () => void
  onApply?: (selection: { categoryIds: number[]; brandIds: number[]; nutrients: string[] }) => void
}

export const FilterPage = ({ initialCategoryIds = [], initialBrandIds = [], initialNutrients = [], onClose, onApply }: FilterPageProps) => {
  const { data: brandsData } = useBrandsQuery()
  const brandList = brandsData ?? []
  const { data: categoriesData } = useCategoriesQuery()
  const categoryList = (categoriesData ?? []).filter(c => c.depth === 1)
  const { data: claimsData } = useNutrientClaimsQuery()
  const claimOptions = claimsData ?? []
  const [catOpen, setCatOpen] = useState(true)
  const [brandOpen, setBrandOpen] = useState(false)
  const [calOpen, setCalOpen] = useState(false)

  const [selectedCatIds, setSelectedCatIds] = useState<Set<number>>(new Set(initialCategoryIds))
  const [selectedBrandIds, setSelectedBrandIds] = useState<Set<number>>(new Set(initialBrandIds))
  const [selectedCal, setSelectedCal] = useState<Set<string>>(new Set(initialNutrients))

  const toggleNumSet = (set: Set<number>, item: number): Set<number> => {
    const next = new Set(set)
    if (next.has(item)) next.delete(item)
    else next.add(item)
    return next
  }

  const toggleSet = (set: Set<string>, item: string): Set<string> => {
    const next = new Set(set)
    if (next.has(item)) next.delete(item)
    else next.add(item)
    return next
  }

  const handleReset = () => {
    setSelectedCatIds(new Set())
    setSelectedBrandIds(new Set())
    setSelectedCal(new Set())
  }

  const handleApply = () => {
    onApply?.({
      categoryIds: Array.from(selectedCatIds),
      brandIds: Array.from(selectedBrandIds),
      nutrients: Array.from(selectedCal),
    })
    onClose()
  }

  const totalSelected = selectedCatIds.size + selectedBrandIds.size + selectedCal.size

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
                      checked={selectedCatIds.has(cat.id)}
                      onChange={() => setSelectedCatIds(toggleNumSet(selectedCatIds, cat.id))}
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
                      checked={selectedBrandIds.has(b.id)}
                      onChange={() => setSelectedBrandIds(toggleNumSet(selectedBrandIds, b.id))}
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
                {claimOptions.map(c => (
                  <label key={c.code} className="fil-check-label">
                    <input
                      type="checkbox"
                      className="fil-check"
                      checked={selectedCal.has(c.code)}
                      onChange={() => setSelectedCal(toggleSet(selectedCal, c.code))}
                    />
                    <span>{c.label}</span>
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
