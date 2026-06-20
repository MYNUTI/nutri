const BASE = '/api'

function getAnonymousId(): string {
  let id = localStorage.getItem('anonymousId')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('anonymousId', id) }
  return id
}

function getSessionId(): string {
  const TIMEOUT = 30 * 60 * 1000
  const now = Date.now()
  const last = Number(localStorage.getItem('sessionLastActivity') || 0)
  let sid = localStorage.getItem('sessionId')
  if (!sid || now - last > TIMEOUT) { sid = crypto.randomUUID(); localStorage.setItem('sessionId', sid) }
  localStorage.setItem('sessionLastActivity', String(now))
  return sid
}

// 동시 다발 refresh 방지: 진행 중인 refresh가 있으면 같은 Promise 공유
let refreshingPromise: Promise<string | null> | null = null

async function tryRefresh(): Promise<string | null> {
  if (refreshingPromise) return refreshingPromise

  refreshingPromise = (async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken')
    if (!storedRefreshToken) return null
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      })
      if (!res.ok) return null
      const json = await res.json()
      if (!json.isSuccess) return null
      const { accessToken, refreshToken: newRefreshToken } = json.data as { accessToken: string; refreshToken: string }
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', newRefreshToken)
      return accessToken
    } catch {
      return null
    }
  })().finally(() => {
    refreshingPromise = null
  })

  return refreshingPromise
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth, ...init } = options
  const headers = new Headers(init.headers)

  // JSON 바디일 때 Content-Type 자동 설정
  if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (!skipAuth) {
    const token = localStorage.getItem('accessToken')
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  headers.set('X-Anonymous-Id', getAnonymousId())
  headers.set('X-Session-Id', getSessionId())
  const cohort = localStorage.getItem('cohort')
  if (cohort) headers.set('X-Cohort', cohort)

  let res = await fetch(`${BASE}${path}`, { ...init, headers })

  // 401 → 토큰 갱신 후 재시도
  if (res.status === 401 && !skipAuth) {
    const newToken = await tryRefresh()
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`)
      res = await fetch(`${BASE}${path}`, { ...init, headers })
    } else {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.dispatchEvent(new Event('auth:logout'))
      throw new Error('세션이 만료되었습니다. 다시 로그인해 주세요.')
    }
  }

  const text = await res.text()
  const json = text ? JSON.parse(text) : { isSuccess: true, data: null }
  if (!res.ok || !json.isSuccess) {
    throw new Error(json.data?.message ?? `HTTP ${res.status}`)
  }
  return json.data as T
}
