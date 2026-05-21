import { apiFetch } from '../client'
import type {
  PageResponse,
  ProductDetailResponse,
  ProductResponse,
  ProductSearchCondition,
} from './types'

function buildParams(condition: ProductSearchCondition): URLSearchParams {
  const p = new URLSearchParams()
  if (condition.keyword)                    p.set('keyword',           condition.keyword)
  if (condition.categoryId != null)         p.set('categoryId',        String(condition.categoryId))
  if (condition.brandId != null)            p.set('brandId',           String(condition.brandId))
  condition.nutrientClaims?.forEach(c =>    p.append('nutrientClaims', c))
  if (condition.minNutritionScore != null)  p.set('minNutritionScore', String(condition.minNutritionScore))
  if (condition.maxNutritionScore != null)  p.set('maxNutritionScore', String(condition.maxNutritionScore))
  if (condition.sort)                       p.set('sort',              condition.sort)
  if (condition.page != null)               p.set('page',              String(condition.page))
  if (condition.size != null)               p.set('size',              String(condition.size))
  return p
}

export async function searchProducts(
  condition: ProductSearchCondition = {},
): Promise<PageResponse<ProductResponse>> {
  return apiFetch<PageResponse<ProductResponse>>(`/products?${buildParams(condition)}`)
}

export async function getProductDetail(id: number): Promise<ProductDetailResponse> {
  return apiFetch<ProductDetailResponse>(`/products/${id}`)
}
