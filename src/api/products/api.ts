import { apiFetch } from '../client'
import type {
  PageResponse,
  ProductDetailResponse,
  ProductResponse,
  ProductSearchCondition,
} from './types'

function buildParams(condition: ProductSearchCondition): URLSearchParams {
  const p = new URLSearchParams()
  if (condition.keyword)                    p.set('keyword',             condition.keyword)
  if (condition.categoryId != null)         p.set('categoryId',          String(condition.categoryId))
  if (condition.brandId != null)            p.set('brandId',             String(condition.brandId))
  if (condition.minCalories != null)        p.set('minCalories',         String(condition.minCalories))
  if (condition.maxCalories != null)        p.set('maxCalories',         String(condition.maxCalories))
  if (condition.minProtein != null)         p.set('minProtein',          String(condition.minProtein))
  if (condition.maxProtein != null)         p.set('maxProtein',          String(condition.maxProtein))
  if (condition.minFat != null)             p.set('minFat',              String(condition.minFat))
  if (condition.maxFat != null)             p.set('maxFat',              String(condition.maxFat))
  if (condition.minCarbohydrate != null)    p.set('minCarbohydrate',     String(condition.minCarbohydrate))
  if (condition.maxCarbohydrate != null)    p.set('maxCarbohydrate',     String(condition.maxCarbohydrate))
  if (condition.minSugar != null)           p.set('minSugar',            String(condition.minSugar))
  if (condition.maxSugar != null)           p.set('maxSugar',            String(condition.maxSugar))
  if (condition.minSodium != null)          p.set('minSodium',           String(condition.minSodium))
  if (condition.maxSodium != null)          p.set('maxSodium',           String(condition.maxSodium))
  if (condition.minNutritionScore != null)  p.set('minNutritionScore',   String(condition.minNutritionScore))
  if (condition.maxNutritionScore != null)  p.set('maxNutritionScore',   String(condition.maxNutritionScore))
  if (condition.sort)                       p.set('sort',                condition.sort)
  if (condition.page != null)               p.set('page',                String(condition.page))
  if (condition.size != null)               p.set('size',                String(condition.size))
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
