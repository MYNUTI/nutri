# 영양대학 (NutriUniv) 프론트엔드

영양제·건강기능식품 정보를 검색·비교하고, 쿠팡 파트너스 링크를 통해 구매로 연결해 주는 모바일 웹 서비스입니다.

---

## 기술 스택

| 분류 | 라이브러리 |
|------|-----------|
| UI | React 19 |
| 언어 | TypeScript |
| 빌드 | Vite |
| 서버 상태 관리 | TanStack React Query v5 |

---

## 프로젝트 구조

```
src/
├── api/                  # API 클라이언트 및 데이터 프로바이더
│   ├── admin/            # 관리자 API (provider.ts / mockAdminProvider.ts / client.ts)
│   ├── mypage/           # 마이페이지 API (provider.ts / mockMyPageProvider.ts / client.ts)
│   └── products/         # 상품 API (api.ts / types.ts)
├── components/           # 공통 컴포넌트 (Typography, icons, UserProfileSetupModal)
├── mocks/                # 목업 데이터 (products.ts / adminData.ts / myPageData.ts)
├── pages/                # 페이지 컴포넌트
├── queries/              # React Query 훅 (productQueries / adminQueries / myPageQueries)
├── tokens/               # 디자인 토큰 (typography.ts)
├── types/                # 공통 타입 정의 (product.ts / admin.ts / mypage.ts)
├── App.tsx               # 라우팅 및 앱 루트
└── main.tsx              # 진입점
```

---

## 페이지 구성

라우팅은 URL 해시(`#`)로 동작합니다. 별도의 라우터 라이브러리 없이 `window.location.hash`를 직접 사용합니다.

| 해시 | 페이지 | 설명 |
|------|--------|------|
| `#home` | 홈 | 상품 목록, 인기순 정렬, 검색·필터·마이페이지 진입 |
| `#search` | 검색 | 키워드 검색 |
| `#filter` | 필터 | 카테고리 / 브랜드 / 영양성분 범위 필터 |
| `#detail` | 상품 상세 | 영양성분 전체 정보, 쿠팡 구매 링크, 비교 추가 |
| `#compare` | 상품 비교 | 두 상품의 영양성분 나란히 비교 |
| `#mypage` | 마이페이지 | 회원 정보, 찜한 상품, 영양정보 (로그인 필요) |
| `#login` | 로그인 | 로그인 처리, 완료 시 프로필 설정 모달 노출 |
| `#admin` | 관리자 | 데이터 대시보드, 클릭·검색 통계, 상품 목록 조회 |

---

## 주요 기능

### 상품 목록 / 검색 / 필터
- 백엔드 API(`/api/products`)를 통해 상품 목록을 가져옵니다.
- 필터 조건: 카테고리, 브랜드, 가격 범위, 영양성분(칼로리·단백질·탄수화물·지방·당류·나트륨) 범위
- 각 상품 카드에는 영양 점수, 등급(A/B/C…), 카테고리, 브랜드가 표시됩니다.

### 상품 상세
- 1회 제공량 기준 영양성분 전체 항목(칼로리, 나트륨, 탄수화물, 당류, 지방, 트랜스지방, 포화지방, 콜레스테롤, 단백질) 표시
- 쿠팡 파트너스 링크로 구매 페이지 이동

### 상품 비교
- 두 상품을 선택하여 영양성분을 나란히 비교합니다.
- 홈 또는 상세 페이지에서 "비교하기" 버튼으로 추가합니다.

### 관리자 대시보드 (`#admin`)
- 총 상품 수, 카테고리 수, 평균 영양 점수
- 쿠팡 파트너스 API 연동 현황 (이미지 보유, 쿠팡 연동, 미연동 개수)
- 제휴 링크 클릭 통계 및 검색어 통계
- 상품 목록 검색 테이블

---

## API 연동

백엔드 서버: `http://52.78.69.113:8080`

모든 응답은 아래 공통 형식을 따릅니다.

```json
{ "isSuccess": true, "data": { ... } }
```

### 주요 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/products` | 상품 목록·검색 (페이지네이션, 다양한 필터 조건) |
| GET | `/api/products/{id}` | 상품 상세 |
| GET | `/api/products/compare?ids=1&ids=2` | 상품 비교 |
| GET | `/api/products/brand-counts` | 브랜드별 상품 수 집계 |
| GET | `/api/categories` | 카테고리 목록 |

전체 API 명세는 프로젝트 루트의 [openapi.json](./openapi.json)을 참고하세요.

### 목업(Mock) 데이터

`src/api/admin/mockAdminProvider.ts`, `src/api/mypage/mockMyPageProvider.ts`에 목업 프로바이더가 구현되어 있습니다. 백엔드가 없는 환경에서 UI 개발 시 이 프로바이더로 교체하여 사용합니다.

---

## 로컬 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview
```

> Vite 개발 서버는 `/api` 경로 요청을 백엔드 서버로 프록시하도록 설정이 필요할 수 있습니다. `vite.config.ts`의 `server.proxy` 설정을 확인하세요.

---

## 상태 관리 구조

### 1. 서버 데이터 — React Query (`src/queries/`)

API에서 가져오는 데이터는 모두 TanStack React Query로 관리합니다. 자동 캐싱, 로딩/에러 상태, 중복 요청 방지를 처리합니다.

| 훅 | 연결 API | 비고 |
|----|---------|------|
| `useProductListQuery` | `GET /products` | 필터·정렬 조건 포함 |
| `useBrandsQuery` | `GET /brands` | 전체 캐시 (`staleTime: Infinity`) |
| `useCategoriesQuery` | `GET /categories` | 전체 캐시 (`staleTime: Infinity`) |
| `useNutrientClaimsQuery` | `GET /products/nutrient-claims` | 전체 캐시 (`staleTime: Infinity`) |
| `useMyPageQuery` | `GET /users/me` | 로그인 상태일 때만 실행 |
| `useLikesQuery` | `GET /likes` | 로그인 상태일 때만 실행, 결과를 FavoritesContext에 동기화 |

### 2. 전역 UI 상태 — `App.tsx`

여러 페이지에서 공유해야 하는 상태를 `App.tsx`에서 관리하고 props로 하위 컴포넌트에 전달합니다.

| 상태 | 타입 | 설명 |
|------|------|------|
| `route` | `string` | 현재 페이지 (`home` / `detail` / `mypage` 등) |
| `isAuthenticated` | `boolean` | 로그인 여부 |
| `isAdmin` | `boolean` | 관리자 여부 |
| `selectedProduct` | `Product \| null` | 상세 페이지에서 보고 있는 상품 |
| `filterCategoryId` | `number \| null` | 선택된 카테고리 필터 |
| `filterBrandId` | `number \| null` | 선택된 브랜드 필터 |
| `filterNutrients` | `string[]` | 선택된 성분 필터 코드 목록 |
| `homeKeyword` | `string` | 검색어 |
| `compareProducts` | `Product[]` | 비교 중인 상품 (최대 2개) |

### 3. 공유 상태 — `FavoritesContext` (`src/contexts/FavoritesContext.tsx`)

찜(좋아요) 상태는 홈, 즐겨찾기, 상세 페이지 등 여러 곳에서 동시에 필요하기 때문에 Context로 분리했습니다.

- 앱 시작 시 `GET /likes`로 서버에서 찜 목록을 불러와 초기화
- 찜 버튼 클릭 시 UI를 즉시 반영(낙관적 업데이트) 후 `POST /likes` / `DELETE /likes/{id}` 호출
- 서버 요청 실패 시 자동 롤백

### 4. 로컬 상태 — 각 컴포넌트 `useState`

해당 컴포넌트 안에서만 쓰이는 임시 데이터 (드롭다운 열림 여부, 필터 페이지 내 선택값 등)

---

### 인증 흐름

- `accessToken` / `refreshToken`은 `localStorage`에 저장
- 앱 시작 시 `GET /users/me` 호출로 토큰 유효성 검증 — 만료 시 자동 로그아웃
- API 응답 401 수신 → `auth:logout` 커스텀 이벤트 발생 → `App.tsx`가 감지하여 로그아웃 처리
- 로그아웃 시 초기화되는 것: `isAuthenticated`, 찜 목록(메모리), 최근 검색어(`localStorage`)

---

## 주요 설계 결정

- **해시 라우팅**: React Router 없이 `window.location.hash`로 페이지를 전환합니다. SPA지만 별도 서버 설정 없이 정적 호스팅이 가능합니다.
- **Provider 패턴**: Admin / MyPage API는 인터페이스(`AdminDataProvider`, `MyPageDataProvider`)로 추상화되어 있어, 실제 API와 목업을 쉽게 교체할 수 있습니다.
- **React Query**: 서버 데이터 패칭·캐싱은 TanStack React Query로 처리하며, 쿼리 훅은 `src/queries/`에 모아 두었습니다.
- **Typography 컴포넌트**: 디자인 시스템 기반의 `<Typography>` 컴포넌트와 `src/tokens/typography.ts` 토큰으로 일관된 텍스트 스타일을 유지합니다.
