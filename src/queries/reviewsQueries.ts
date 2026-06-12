import { useQuery } from '@tanstack/react-query'
import { getProductReviews } from '../api/reviews'

export const reviewsKeys = {
  list: (productId: number) => ['reviews', productId] as const,
}

export const useProductReviewsQuery = (productId: number, enabled = true) =>
  useQuery({
    queryKey: reviewsKeys.list(productId),
    queryFn: () => getProductReviews(productId),
    enabled: enabled && productId > 0,
  })
