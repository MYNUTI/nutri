import { useMemo, useReducer } from 'react'
import type { SortKey } from '../../pages/HomePage'

type HomeSearchState = {
  keyword: string
  sort: SortKey
  categoryIds: number[]
  brandIds: number[]
  nutrients: string[]
}

type Action =
  | { type: 'setKeyword'; keyword: string }
  | { type: 'setSort'; sort: SortKey }
  | { type: 'setCategories'; categoryIds: number[] }
  | { type: 'applyFilter'; categoryIds: number[]; brandIds: number[]; nutrients: string[] }
  | { type: 'reset' }

const initialState: HomeSearchState = {
  keyword: '',
  sort: '추천순',
  categoryIds: [],
  brandIds: [],
  nutrients: [],
}

function reducer(state: HomeSearchState, action: Action): HomeSearchState {
  switch (action.type) {
    case 'setKeyword':
      return { ...state, keyword: action.keyword }
    case 'setSort':
      return { ...state, sort: action.sort }
    case 'setCategories':
      // 카테고리 변경 시 브랜드 선택 초기화
      return { ...state, categoryIds: action.categoryIds, brandIds: [] }
    case 'applyFilter':
      return { ...state, categoryIds: action.categoryIds, brandIds: action.brandIds, nutrients: action.nutrients }
    case 'reset':
      // 키워드·필터만 초기화, 정렬은 유지
      return { ...state, keyword: '', categoryIds: [], brandIds: [], nutrients: [] }
    default:
      return state
  }
}

// 홈 검색/정렬/필터 상태 — 메모리 유지(URL 직렬화 안 함, 새로고침 시 초기화는 의도된 동작)
export function useHomeSearchState() {
  const [state, dispatch] = useReducer(reducer, initialState)

  // dispatch는 안정적 — 액션 래퍼를 메모이즈해 소비처가 React.memo여도 참조가 유지되게 한다
  const actions = useMemo(() => ({
    setKeyword: (keyword: string) => dispatch({ type: 'setKeyword', keyword }),
    setSort: (sort: SortKey) => dispatch({ type: 'setSort', sort }),
    setCategories: (categoryIds: number[]) => dispatch({ type: 'setCategories', categoryIds }),
    applyFilter: (sel: { categoryIds: number[]; brandIds: number[]; nutrients: string[] }) =>
      dispatch({ type: 'applyFilter', ...sel }),
    reset: () => dispatch({ type: 'reset' }),
  }), [])

  return { state, ...actions }
}
