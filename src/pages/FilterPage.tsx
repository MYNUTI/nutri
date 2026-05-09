import { useState } from 'react'
import './FilterPage.css'

type FilterPageProps = {
  onClose: () => void
  onApply?: (selection: { categories: string[]; brands: string[]; nutrients: string[] }) => void
}

const FOOD_CATS = [
  '견과류', '곡류, 시리얼', '면류', '음료류',
  '과일류', '채소류', '유제품', '육류, 어류',
  '조미료', '간식류', '식용유', '음료수, 주스',
  '해산물', '냉동식품', '베이커리', '디저트류',
]

const BRANDS = ['풀무원', '꼬기닭', '하닭', '하림']

const CALORIE_CHIPS = ['저당', '고단백']

export const FilterPage = ({ onClose, onApply }: FilterPageProps) => {
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
                {FOOD_CATS.map(cat => (
                  <label key={cat} className="fil-check-label">
                    <input
                      type="checkbox"
                      className="fil-check"
                      checked={selectedCats.has(cat)}
                      onChange={() => setSelectedCats(toggleSet(selectedCats, cat))}
                    />
                    <span>{cat}</span>
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
                {BRANDS.map(b => (
                  <label key={b} className="fil-check-label">
                    <input
                      type="checkbox"
                      className="fil-check"
                      checked={selectedBrands.has(b)}
                      onChange={() => setSelectedBrands(toggleSet(selectedBrands, b))}
                    />
                    <span>{b}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 칼로리 */}
          <div className="fil-section">
            <button type="button" className="fil-section-btn" onClick={() => setCalOpen(v => !v)}>
              <span>칼로리</span>
              <span className="fil-chevron">{calOpen ? '∧' : '∨'}</span>
            </button>
            {calOpen && (
              <div className="fil-chips">
                {CALORIE_CHIPS.map(c => (
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
