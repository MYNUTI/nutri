import { useMemo, useState } from 'react'
import { useBrandsQuery, useCategoryBrandsQuery } from '../queries/brandsQueries'
import { useCategoriesQuery } from '../queries/categoriesQueries'
import { useNutrientClaimsQuery } from '../queries/nutrientClaimsQueries'
import { logFilter } from '../api/logging'
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
  const { data: categoriesData } = useCategoriesQuery()
  const categories = useMemo(() => (categoriesData ?? []).filter(c => c.depth === 1), [categoriesData])

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(initialCategoryIds[0] ?? null)
  const [selectedBrandIds, setSelectedBrandIds] = useState<Set<number>>(new Set(initialBrandIds))
  const [selectedNutrients, setSelectedNutrients] = useState<Set<string>>(new Set(initialNutrients))

  // 카테고리가 선택돼 있으면 해당 카테고리 브랜드만, 아니면 전체 브랜드
  const categoryId = selectedCategoryId ?? undefined
  const { data: allBrands, isLoading: allBrandsLoading } = useBrandsQuery(categoryId == null)
  const { data: categoryBrands, isLoading: categoryBrandsLoading } = useCategoryBrandsQuery(categoryId)
  const brandList = categoryId != null ? (categoryBrands ?? []) : (allBrands ?? [])
  const brandsLoading = categoryId != null ? categoryBrandsLoading : allBrandsLoading
  const { data: claimsData } = useNutrientClaimsQuery()
  const claimOptions = claimsData ?? []

  const [categoryOpen, setCategoryOpen] = useState(true)
  const [nutrientOpen, setNutrientOpen] = useState(true)
  const [brandOpen, setBrandOpen] = useState(true)

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
    setSelectedCategoryId(null)
    setSelectedBrandIds(new Set())
    setSelectedNutrients(new Set())
  }

  const handleApply = () => {
    if (selectedCategoryId != null) logFilter('CATEGORY', String(selectedCategoryId))
    if (selectedBrandIds.size > 0) logFilter('BRAND', Array.from(selectedBrandIds).join(','))
    if (selectedNutrients.size > 0) logFilter('NUTRIENT', Array.from(selectedNutrients).join(','))
    onApply?.({
      categoryIds: selectedCategoryId != null ? [selectedCategoryId] : [],
      brandIds: Array.from(selectedBrandIds),
      nutrients: Array.from(selectedNutrients),
    })
    onClose()
  }

  const totalSelected = (selectedCategoryId != null ? 1 : 0) + selectedBrandIds.size + selectedNutrients.size
  const initialCount = initialCategoryIds.length + initialBrandIds.length + initialNutrients.length
  // 선택도 없고 기존 적용값도 없으면 누를 이유가 없음. 선택만 비었으면 "해제 적용"으로 동작
  const applyInert = totalSelected === 0 && initialCount === 0

  return (
    <div className="fil-page">
      <header className="fil-header">
        <span className="fil-header-title">필터</span>
        <button type="button" className="fil-close" aria-label="닫기" onClick={onClose}>
          <CloseIcon />
        </button>
      </header>

      <div className="fil-body">
        <section className="fil-section">
          <button type="button" className="fil-section-head" onClick={() => setCategoryOpen(v => !v)}>
            <span className="fil-section-label">카테고리</span>
            <ChevronIcon className={`fil-chevron${categoryOpen ? ' fil-chevron--up' : ''}`} />
          </button>
          {categoryOpen && (
            <div className="fil-chips">
              {categories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`fil-chip${selectedCategoryId === c.id ? ' fil-chip--on' : ''}`}
                  onClick={() => {
                    // 브랜드 목록이 카테고리 종속이라 카테고리를 바꾸면 브랜드 선택도 초기화
                    setSelectedCategoryId(selectedCategoryId === c.id ? null : c.id)
                    setSelectedBrandIds(new Set())
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="fil-section">
          <button type="button" className="fil-section-head" onClick={() => setNutrientOpen(v => !v)}>
            <span className="fil-section-label">영양성분</span>
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

        <section className="fil-section">
          <button type="button" className="fil-section-head" onClick={() => setBrandOpen(v => !v)}>
            <span className="fil-section-label">브랜드</span>
            <ChevronIcon className={`fil-chevron${brandOpen ? ' fil-chevron--up' : ''}`} />
          </button>
          {brandOpen && (
            brandList.length > 0 ? (
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
            ) : (
              <p className="fil-empty">
                {brandsLoading
                  ? '브랜드를 불러오는 중...'
                  : categoryId != null ? '이 카테고리에 등록된 브랜드가 없어요.' : '등록된 브랜드가 없어요.'}
              </p>
            )
          )}
        </section>

      </div>

      <footer className="fil-footer">
        <button type="button" className="fil-btn-reset" onClick={handleReset}>
          <img src="/common/reset.svg" alt="" width="16" height="16" aria-hidden="true" />
          초기화
        </button>
        <button
          type="button"
          className={`fil-btn-apply${applyInert ? ' fil-btn-apply--off' : ''}`}
          disabled={applyInert}
          onClick={handleApply}
        >
          적용하기{totalSelected > 0 ? ` (${totalSelected})` : ''}
        </button>
      </footer>
    </div>
  )
}
