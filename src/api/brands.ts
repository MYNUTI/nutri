import { apiFetch } from './client'
import type { BrandResponse } from './products/types'

export async function getBrands(): Promise<BrandResponse[]> {
  return apiFetch<BrandResponse[]>('/brands')
}
