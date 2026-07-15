import { useState } from 'react'
import type { FormEvent } from 'react'
import { api, ApiError } from '../lib/apiClient'
import { setTokens } from '../lib/auth'
import './AuthPage.css'

type TokenResponse = {
  accessToken: string
  refreshToken: string
  memberId: number
  nickname: string
  newMember: boolean
}

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSubmitting(true)
    try {
      const res = await api.post<TokenResponse>('/api/auth/login', { email, password })
      setTokens(res.accessToken, res.refreshToken)
      window.location.replace('/')
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : '로그인에 실패했습니다.')
      setSubmitting(false)
    }
  }

  const handleKakaoLogin = async () => {
    const { url } = await api.get<{ url: string }>('/api/auth/kakao/authorize-url')
    window.location.href = url
  }

  return (
    <section className="auth-page">
      <a href="/" className="auth-brand">
        톡톡스
      </a>

      <div className="card auth-card">
        <h1>로그인</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">이메일</span>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span className="field-label">비밀번호</span>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          {errorMessage && <p className="alert-error">{errorMessage}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? '로그인 중…' : '로그인'}
          </button>
        </form>

        <div className="auth-divider">또는</div>

        <button type="button" className="btn kakao-login btn-block" onClick={handleKakaoLogin}>
          카카오로 로그인
        </button>

        <p className="auth-footer">
          계정이 없으신가요? <a href="/signup">회원가입</a>
        </p>
      </div>
    </section>
  )
}

export default LoginPage
