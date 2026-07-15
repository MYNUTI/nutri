import { apiFetch } from './client'

const silent = (p: Promise<unknown>) => p.catch(() => {})

export const logView = (productId: number) =>
  silent(apiFetch('/logging/view', { method: 'POST', body: JSON.stringify({ productId }) }))

export const logSearch = (keyword: string, resultCount: number) =>
  silent(apiFetch('/logging/search', { method: 'POST', body: JSON.stringify({ keyword, resultCount }) }))

export const logFilter = (filterType: string, filterValue?: string) =>
  silent(apiFetch('/logging/filter', { method: 'POST', body: JSON.stringify({ filterType, filterValue }) }))

export const logCta = (productId: number) =>
  silent(apiFetch('/logging/cta', { method: 'POST', body: JSON.stringify({ productId }) }))

export type ImpressionSurface = 'LIST' | 'RECOMMENDATION' | 'SEARCH'
export type ImpressionItem = { productId: number; position: number }

export const logImpression = (surface: ImpressionSurface, items: ImpressionItem[], keyword?: string) => {
  if (items.length === 0) return
  silent(apiFetch('/logging/impression', { method: 'POST', body: JSON.stringify({ surface, keyword, items }) }))
}
