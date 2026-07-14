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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!res.ok) {
    throw new ApiError(res.status, await res.text())
  }

  const contentType = res.headers.get('content-type') ?? ''
  return (contentType.includes('application/json') ? res.json() : res.text()) as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
}
