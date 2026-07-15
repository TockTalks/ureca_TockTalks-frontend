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

function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [nickname, setNickname] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (password.length < 8) {
      setErrorMessage('비밀번호는 8자 이상이어야 합니다.')
      return
    }
    if (password !== passwordConfirm) {
      setErrorMessage('비밀번호가 일치하지 않습니다.')
      return
    }
    if (nickname.length < 2 || nickname.length > 20) {
      setErrorMessage('닉네임은 2자 이상 20자 이하여야 합니다.')
      return
    }

    setSubmitting(true)
    try {
      const res = await api.post<TokenResponse>('/api/auth/signup', { email, password, nickname })
      setTokens(res.accessToken, res.refreshToken)
      window.location.replace('/')
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : '회원가입에 실패했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <a href="/" className="auth-brand">
        톡톡스
      </a>

      <div className="card auth-card">
        <h1>회원가입</h1>

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
            <span className="field-label">닉네임</span>
            <input
              type="text"
              className="input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              minLength={2}
              maxLength={20}
              autoComplete="nickname"
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
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          <label className="field">
            <span className="field-label">비밀번호 확인</span>
            <input
              type="password"
              className="input"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </label>

          {errorMessage && <p className="alert-error">{errorMessage}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? '가입 중…' : '회원가입'}
          </button>
        </form>

        <p className="auth-footer">
          이미 계정이 있으신가요? <a href="/login">로그인</a>
        </p>
      </div>
    </section>
  )
}

export default SignupPage
