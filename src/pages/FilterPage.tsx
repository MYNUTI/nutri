import { useRef, useState } from 'react'
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

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#777F8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
)

export const FilterPage = ({
  initialCategoryIds = [],
  initialBrandIds = [],
  initialNutrients = [],
  onClose,
  onApply,
}: FilterPageProps) => {
  const { data: brandsData } = useBrandsQuery()
  const brandList = brandsData ?? []
  const { data: categoriesData } = useCategoriesQuery()
  const categoryList = (categoriesData ?? []).filter(c => c.depth === 1)
  const { data: claimsData } = useNutrientClaimsQuery()
  const claimOptions = claimsData ?? []

  const [selectedCatIds, setSelectedCatIds] = useState<Set<number>>(new Set(initialCategoryIds))
  const [selectedBrandIds, setSelectedBrandIds] = useState<Set<number>>(new Set(initialBrandIds))
  const [selectedNutrients, setSelectedNutrients] = useState<Set<string>>(new Set(initialNutrients))

  const [catOpen, setCatOpen] = useState(true)
  const [brandOpen, setBrandOpen] = useState(true)
  const [nutrientOpen, setNutrientOpen] = useState(true)

  const bodyRef = useRef<HTMLDivElement>(null)

  const toggleNum = (set: Set<number>, item: number): Set<number> => {
    const next = new Set(set)
    if (next.has(item)) next.delete(item); else next.add(item)
    return next
  }

  const toggleStr = (set: Set<string>, item: string): Set<string> => {
    const next = new Set(set)
    if (next.has(item)) next.delete(item); else next.add(item)
    return next
  }

  const handleReset = () => {
    setSelectedCatIds(new Set())
    setSelectedBrandIds(new Set())
    setSelectedNutrients(new Set())
  }

  const handleApply = () => {
    onApply?.({
      categoryIds: Array.from(selectedCatIds),
      brandIds: Array.from(selectedBrandIds),
      nutrients: Array.from(selectedNutrients),
    })
    onClose()
  }

  const totalSelected = selectedCatIds.size + selectedBrandIds.size + selectedNutrients.size

  const scrollToId = (id: string) => {
    bodyRef.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="fil-page">
      <header className="fil-header">
        <span className="fil-header-title">필터</span>
        <button type="button" className="fil-close" aria-label="닫기" onClick={onClose}>
          <CloseIcon />
        </button>
      </header>

      <div className="fil-nav" aria-label="섹션 이동">
        <button type="button" className="fil-nav-chip" onClick={() => scrollToId('fil-sec-cat')}>카테고리</button>
        <button type="button" className="fil-nav-chip" onClick={() => scrollToId('fil-sec-brand')}>브랜드</button>
        <button type="button" className="fil-nav-chip" onClick={() => scrollToId('fil-sec-nutrient')}>영양 성분</button>
      </div>

      <div className="fil-body" ref={bodyRef}>
        <section className="fil-section" id="fil-sec-cat">
          <button type="button" className="fil-section-head" onClick={() => setCatOpen(v => !v)}>
            <span className="fil-section-label">식품 카테고리</span>
            <ChevronIcon className={`fil-chevron${catOpen ? ' fil-chevron--up' : ''}`} />
          </button>
          {catOpen && (
            <div className="fil-chips">
              {categoryList.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`fil-chip${selectedCatIds.has(cat.id) ? ' fil-chip--on' : ''}`}
                  onClick={() => setSelectedCatIds(toggleNum(selectedCatIds, cat.id))}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="fil-section" id="fil-sec-brand">
          <button type="button" className="fil-section-head" onClick={() => setBrandOpen(v => !v)}>
            <span className="fil-section-label">브랜드</span>
            <ChevronIcon className={`fil-chevron${brandOpen ? ' fil-chevron--up' : ''}`} />
          </button>
          {brandOpen && (
            <div className="fil-chips">
              {brandList.map(b => (
                <button
                  key={b.id}
                  type="button"
                  className={`fil-chip${selectedBrandIds.has(b.id) ? ' fil-chip--on' : ''}`}
                  onClick={() => setSelectedBrandIds(toggleNum(selectedBrandIds, b.id))}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="fil-section" id="fil-sec-nutrient">
          <button type="button" className="fil-section-head" onClick={() => setNutrientOpen(v => !v)}>
            <span className="fil-section-label">영양 성분</span>
            <ChevronIcon className={`fil-chevron${nutrientOpen ? ' fil-chevron--up' : ''}`} />
          </button>
          {nutrientOpen && (
            <div className="fil-chips">
              {claimOptions.map(c => (
                <button
                  key={c.code}
                  type="button"
                  className={`fil-chip${selectedNutrients.has(c.code) ? ' fil-chip--on' : ''}`}
                  onClick={() => setSelectedNutrients(toggleStr(selectedNutrients, c.code))}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="fil-footer">
        <button type="button" className="fil-btn-reset" onClick={handleReset}>
          초기화
        </button>
        <button type="button" className="fil-btn-apply" onClick={handleApply}>
          적용하기{totalSelected > 0 ? ` ${totalSelected}` : ''}
        </button>
      </footer>
    </div>
  )
}
