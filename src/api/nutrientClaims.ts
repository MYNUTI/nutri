import { apiFetch } from './client'

export type NutrientClaim = {
  claimLevel: string
  code: string
  label: string
  nutrient: string
}

export async function getNutrientClaims(): Promise<NutrientClaim[]> {
  return apiFetch<NutrientClaim[]>('/products/nutrient-claims')
}
