import { apiFetch } from './client'

export type ReviewItem = {
  reviewId: number
  nickname: string
  scoreOverall: number
  content: string
  images: string[]
  createdAt: string
  updatedAt: string
}

export type ReviewListResponse = {
  total: number
  avgScoreOverall: number
  items: ReviewItem[]
  canReview: boolean | null  // true: 작성 가능 / false: 이력 있어 불가 / null: 비로그인
}

export type ReviewPayload = {
  scoreOverall: number
  content: string
  images: string[]
}

export const getProductReviews = (productId: number, page = 1, size = 20) =>
  apiFetch<ReviewListResponse>(`/reviews/${productId}?page=${page}&size=${size}`)

export const postReview = (productId: number, payload: ReviewPayload) =>
  apiFetch<{}>(`/reviews/${productId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const deleteReview = (reviewId: number) =>
  apiFetch<{}>(`/reviews/${reviewId}`, { method: 'DELETE' })

export const patchReview = (reviewId: number, payload: ReviewPayload) =>
  apiFetch<{}>(`/reviews/${reviewId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
