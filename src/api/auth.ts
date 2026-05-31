import { apiFetch } from './client'

// ── OAuth ──────────────────────────────────────────────────────

export type OAuthResponse = {
  accessToken?: string
  refreshToken?: string
  email?: string
  oauthId?: string
  newUser: boolean
}

export async function oauthLogin(provider: string, code: string): Promise<OAuthResponse> {
  const res = await apiFetch<OAuthResponse>('/auth/oauth', {
    method: 'POST',
    body: JSON.stringify({ provider, code }),
    skipAuth: true,
  } as Parameters<typeof apiFetch>[1])
  return res
}

export type RegisterPayload = {
  provider: string
  oauthId: string
  name: string
  email: string
  gender: string
  birthDate: string
}

export async function register(payload: RegisterPayload): Promise<OAuthResponse> {
  const res = await apiFetch<OAuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  } as Parameters<typeof apiFetch>[1])
  if (res.accessToken) localStorage.setItem('accessToken', res.accessToken)
  if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken)
  return res
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>('/auth/logout', { method: 'POST' })
  } catch {
    // 서버 로그아웃 실패해도 로컬 토큰은 제거
  } finally {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }
}

export type UpdateUserPayload = {
  name?: string
  email?: string
  nickname?: string
  gender?: string
  birthDate?: string
}

export async function updateMe(payload: UpdateUserPayload): Promise<UpdateUserPayload> {
  return apiFetch<UpdateUserPayload>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function withdraw(reason?: string): Promise<void> {
  await apiFetch<void>('/users/me', {
    method: 'DELETE',
    body: reason ? JSON.stringify({ reason }) : undefined,
  })
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}
