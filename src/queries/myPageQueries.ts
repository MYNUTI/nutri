import { useQuery } from '@tanstack/react-query'
import { getMe } from '../api/mypage/client'

export const myPageKeys = {
  me: ['users', 'me'] as const,
}

export const useMyPageQuery = (enabled = true) =>
  useQuery({
    queryKey: myPageKeys.me,
    queryFn: getMe,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
