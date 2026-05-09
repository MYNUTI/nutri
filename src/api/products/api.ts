import { apiFetch } from '../client'
import type {
  PageResponse,
  ProductDetailResponse,
  ProductResponse,
  ProductSearchCondition,
} from './types'

function buildParams(condition: ProductSearchCondition): URLSearchParams {
  const p = new URLSearchParams()
  if (condition.keyword)                    p.set('keyword',              condition.keyword)
  if (condition.categoryId != null)         p.set('category_id',          String(condition.categoryId))
  if (condition.brandId != null)            p.set('brand_id',             String(condition.brandId))
  condition.brands?.forEach(b => p.append('brands', b))
  condition.categories?.forEach(c => p.append('categories', c))
  condition.grades?.forEach(g => p.append('grades', g))
  if (condition.minCalories != null)        p.set('min_calories',         String(condition.minCalories))
  if (condition.maxCalories != null)        p.set('max_calories',         String(condition.maxCalories))
  if (condition.minProtein != null)         p.set('min_protein',          String(condition.minProtein))
  if (condition.maxProtein != null)         p.set('max_protein',          String(condition.maxProtein))
  if (condition.minFat != null)             p.set('min_fat',              String(condition.minFat))
  if (condition.maxFat != null)             p.set('max_fat',              String(condition.maxFat))
  if (condition.minCarbohydrate != null)    p.set('min_carbohydrate',     String(condition.minCarbohydrate))
  if (condition.maxCarbohydrate != null)    p.set('max_carbohydrate',     String(condition.maxCarbohydrate))
  if (condition.minSugar != null)           p.set('min_sugar',            String(condition.minSugar))
  if (condition.maxSugar != null)           p.set('max_sugar',            String(condition.maxSugar))
  if (condition.minSodium != null)          p.set('min_sodium',           String(condition.minSodium))
  if (condition.maxSodium != null)          p.set('max_sodium',           String(condition.maxSodium))
  if (condition.minNutritionScore != null)  p.set('min_nutrition_score',  String(condition.minNutritionScore))
  if (condition.maxNutritionScore != null)  p.set('max_nutrition_score',  String(condition.maxNutritionScore))
  if (condition.sort)                       p.set('sort',                 condition.sort)
  if (condition.page != null)              p.set('page',                 String(condition.page))
  if (condition.size != null)              p.set('size',                 String(condition.size))
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
