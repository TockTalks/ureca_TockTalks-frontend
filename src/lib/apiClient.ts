import { getAccessToken } from './auth'

// 개발 환경: VITE_API_BASE_URL 비워두면 vite dev 프록시(/api -> :8080)를 사용
// 배포 환경: VITE_API_BASE_URL에 실제 API 오리진을 지정
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function extractErrorMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: string }
    return parsed.message ?? body
  } catch {
    return body
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new ApiError(res.status, extractErrorMessage(body))
  }

  const contentType = res.headers.get('content-type') ?? ''
  return (contentType.includes('application/json') ? res.json() : res.text()) as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  // 회원탈퇴처럼 본인 확인 정보가 필요한 DELETE 요청도 지원한다.
  del: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'DELETE', body: body === undefined ? undefined : JSON.stringify(body) }),
}
