import { useQuery } from '@tanstack/react-query'
import { getBrands } from '../api/brands'
import { getCategoryBrands } from '../api/categories'

export const useBrandsQuery = (enabled = true) =>
  useQuery({
    queryKey: ['brands'],
    queryFn: getBrands,
    staleTime: 1000 * 60 * 10,
    enabled,
  })

// 카테고리가 선택됐을 때만 해당 카테고리의 브랜드 목록을 조회
export const useCategoryBrandsQuery = (categoryId?: number) =>
  useQuery({
    queryKey: ['categoryBrands', categoryId],
    queryFn: () => getCategoryBrands(categoryId as number),
    enabled: categoryId != null && categoryId > 0,
    staleTime: 1000 * 60 * 10,
  })
