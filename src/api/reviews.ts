import { apiFetch } from './client'

export type ReviewItem = {
  reviewId: number
  nickname: string
  scoreOverall: number
  content: string
  images: string[]
  createdAt: string
}

export type ReviewListResponse = {
  total: number
  avgScoreOverall: number
  items: ReviewItem[]
}

export const getProductReviews = (productId: number, page = 1, size = 20) =>
  apiFetch<ReviewListResponse>(
    `/reviews/${productId}?page=${page}&size=${size}`,
    { skipAuth: true },
  )
