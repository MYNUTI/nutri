import { apiFetch } from './client'

export type PopularKeyword = {
  rank: number
  keyword: string
  previousRank: number | null
  change: 'UP' | 'DOWN' | 'SAME' | 'NEW'
  rankDelta: number | null
}

export type RecommendedKeyword = {
  productId: number
  name: string
}

export function getPopularKeywords(): Promise<PopularKeyword[]> {
  return apiFetch<PopularKeyword[]>('/search/keywords/popular')
}

export function getRecommendedKeywords(): Promise<RecommendedKeyword[] | null> {
  return apiFetch<RecommendedKeyword[] | null>('/search/keywords/recommended')
}
