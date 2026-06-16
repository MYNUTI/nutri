import { useQuery } from '@tanstack/react-query'
import { getNutrientClaims, type NutrientClaim } from '../api/nutrientClaims'

// 사용할 영양성분 필터 5종만 노출 (원본 label로 매칭, 표시 label은 교체)
// code는 필터 전송값이라 원본 유지
const ALLOWED_CLAIMS: { match: string; label: string }[] = [
  { match: '고단백', label: '고단백' },
  { match: '저당',   label: '저당' },
  { match: '저열량', label: '저칼로리' },
  { match: '무당',   label: '제로당' },
  { match: '무열량', label: '제로칼로리' },
]

export const useNutrientClaimsQuery = () =>
  useQuery({
    queryKey: ['nutrient-claims'],
    queryFn: getNutrientClaims,
    staleTime: Infinity,
    select: (claims: NutrientClaim[]) =>
      ALLOWED_CLAIMS.flatMap(({ match, label }) => {
        const found = claims.find(c => c.label === match)
        return found ? [{ ...found, label }] : []
      }),
  })
