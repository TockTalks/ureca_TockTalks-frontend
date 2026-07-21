const ACCESS_TOKEN_KEY = 'tocktalks_access_token'
const REFRESH_TOKEN_KEY = 'tocktalks_refresh_token'
const KAKAO_LOGIN_NEXT_KEY = 'tocktalks_kakao_login_next'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function setKakaoLoginNext(path: string) {
  sessionStorage.setItem(KAKAO_LOGIN_NEXT_KEY, path)
}

export function consumeKakaoLoginNext(): string | null {
  const value = sessionStorage.getItem(KAKAO_LOGIN_NEXT_KEY)
  sessionStorage.removeItem(KAKAO_LOGIN_NEXT_KEY)
  return value
}
