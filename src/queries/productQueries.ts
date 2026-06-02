import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { searchProducts, getProductDetail } from '../api/products/api'
import type { ProductSearchCondition } from '../api/products/types'

const productKeys = {
  all: ['products'] as const,
  list: (condition: ProductSearchCondition) => [...productKeys.all, 'list', condition] as const,
  detail: (id: number) => [...productKeys.all, 'detail', id] as const,
}

export const useInfiniteProductListQuery = (condition: ProductSearchCondition = {}) =>
  useInfiniteQuery({
    queryKey: productKeys.list(condition),
    queryFn: ({ pageParam }) => searchProducts({ ...condition, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1
      const totalPages = Math.ceil(lastPage.total / lastPage.size)
      return nextPage < totalPages ? nextPage : undefined
    },
  })

export const useProductDetailQuery = (id: number) =>
  useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProductDetail(id),
    enabled: id > 0,
  })
