import { apiFetch } from './client'
import type { CategoryResponse } from './products/types'

export async function getCategories(): Promise<CategoryResponse[]> {
  return apiFetch<CategoryResponse[]>('/categories')
}
