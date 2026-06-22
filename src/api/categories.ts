import { apiFetch } from './client'
import type { BrandResponse, CategoryResponse } from './products/types'

export async function getCategories(): Promise<CategoryResponse[]> {
  return apiFetch<CategoryResponse[]>('/categories')
}

// 특정 카테고리에 속한 브랜드 목록 (+ 상품 수)
export async function getCategoryBrands(categoryId: number): Promise<BrandResponse[]> {
  return apiFetch<BrandResponse[]>(`/categories/${categoryId}/brands`)
}
