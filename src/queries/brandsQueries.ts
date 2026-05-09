import { useQuery } from '@tanstack/react-query'
import { getBrands } from '../api/brands'

export const useBrandsQuery = () =>
  useQuery({
    queryKey: ['brands'],
    queryFn: getBrands,
    staleTime: 1000 * 60 * 10,
  })
