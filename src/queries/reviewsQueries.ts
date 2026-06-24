import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProductReviews,
  postReview,
  deleteReview,
  patchReview,
} from '../api/reviews'

export const reviewsKeys = {
  list: (productId: number) => ['reviews', productId] as const,
}

export const useProductReviewsQuery = (productId: number, enabled = true) =>
  useQuery({
    queryKey: reviewsKeys.list(productId),
    queryFn: () => getProductReviews(productId),
    enabled: enabled && productId > 0,
  })

export const useCreateReviewMutation = (productId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { scoreOverall: number; content: string }) =>
      postReview(productId, { ...payload, images: [] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewsKeys.list(productId) }),
  })
}

export const useUpdateReviewMutation = (productId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, scoreOverall, content }: { reviewId: number; scoreOverall: number; content: string }) =>
      patchReview(reviewId, { scoreOverall, content, images: [] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewsKeys.list(productId) }),
  })
}

export const useDeleteReviewMutation = (productId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reviewId: number) => deleteReview(reviewId),
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewsKeys.list(productId) }),
  })
}
