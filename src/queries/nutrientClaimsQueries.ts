import { useQuery } from '@tanstack/react-query'
import { getNutrientClaims } from '../api/nutrientClaims'

export const useNutrientClaimsQuery = () =>
  useQuery({
    queryKey: ['nutrient-claims'],
    queryFn: getNutrientClaims,
    staleTime: Infinity,
  })
