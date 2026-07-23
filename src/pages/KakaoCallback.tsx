import { useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../lib/apiClient'
import { consumeKakaoLoginNext, setTokens } from '../lib/auth'

type TokenResponse = {
  accessToken: string
  refreshToken: string
  memberId: number
  nickname: string
  newMember: boolean
}

function KakaoCallback() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const hasRequestedRef = useRef(false)

  useEffect(() => {
    // 카카오 인가 코드는 1회용이라, StrictMode(개발 모드)의 이중 effect 실행으로
    // 코드 교환 요청이 두 번 나가지 않도록 막는다 (두 번째 요청은 이미 소모된
    // 코드로 인해 KOE320으로 실패한다).
    if (hasRequestedRef.current) return
    hasRequestedRef.current = true

    const code = new URLSearchParams(window.location.search).get('code')
    if (!code) {
      setErrorMessage('카카오 인가 코드가 없습니다.')
      return
    }

    api
      .post<TokenResponse>('/api/auth/kakao/login', { code })
      .then((res) => {
        setTokens(res.accessToken, res.refreshToken)
        window.location.replace(consumeKakaoLoginNext() || '/')
      })
      .catch((err) => {
        setErrorMessage(err instanceof ApiError ? err.message : '로그인에 실패했습니다.')
      })
  }, [])

  return (
    <section id="center">
      <h1>카카오 로그인</h1>
      <p>{errorMessage ?? '로그인 처리 중입니다…'}</p>
    </section>
  )
}

export default KakaoCallback
