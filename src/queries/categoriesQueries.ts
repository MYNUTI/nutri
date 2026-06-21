import { useQuery } from '@tanstack/react-query'
import { getCategories } from '../api/categories'
import type { CategoryResponse } from '../api/products/types'

// 프론트에서 숨길 카테고리명 (서버엔 존재하지만 화면엔 없는 것처럼 처리)
const HIDDEN_CATEGORY_NAMES = ['미분류']

const stripHidden = (list: CategoryResponse[]): CategoryResponse[] =>
  list
    .filter(c => !HIDDEN_CATEGORY_NAMES.includes(c.name))
    .map(c => (c.children ? { ...c, children: stripHidden(c.children) } : c))

// 상품에 붙은 카테고리명 표시용: 숨김 카테고리/빈값이면 '-'
export const displayCategoryName = (name?: string | null): string =>
  name && !HIDDEN_CATEGORY_NAMES.includes(name) ? name : '-'

export const useCategoriesQuery = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    select: stripHidden,
    staleTime: 1000 * 60 * 10,
  })
