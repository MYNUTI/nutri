// 식약처 영양강조표시 기준에 따른 성분 필터 정의
// (100g 고형식품 기준으로 단일 임계값으로 단순화)
import type { ProductSearchCondition } from '../api/products/types'

export const NUTRIENT_OPTIONS = [
  '고단백',
  '저당류',
  '저열량',
  '제로슈거',
  '제로칼로리',
  '저지방',
  '저나트륨',
] as const

export type NutrientOption = typeof NUTRIENT_OPTIONS[number]

// 각 성분 칩이 검색 조건에 추가할 임계값 partial
// 출처: 식약처 영양강조표시 — 100g 고형식품 기준
export const NUTRIENT_THRESHOLDS: Record<NutrientOption, Partial<ProductSearchCondition>> = {
  // 단백질 "고" = 1일 기준치(약 55g)의 20% 이상 = 100g당 약 11g
  '고단백':     { minProtein:   11   },
  // 당류 "저" = 100g당 5g 미만
  '저당류':     { maxSugar:     5    },
  // 열량 "저" = 100g당 40kcal 미만
  '저열량':     { maxCalories:  40   },
  // 당류 "무" = 100g당 0.5g 미만
  '제로슈거':   { maxSugar:     0.5  },
  // 열량 "무" = 100mL당 4kcal 미만 (액체 기준이지만 가장 엄격한 값 적용)
  '제로칼로리': { maxCalories:  4    },
  // 지방 "저" = 100g당 3g 미만
  '저지방':     { maxFat:       3    },
  // 나트륨 "저" = 100g당 120mg 미만
  '저나트륨':   { maxSodium:    120  },
}
