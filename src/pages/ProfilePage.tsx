import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Navbar from '../components/Navbar'
import { api, ApiError } from '../lib/apiClient'
import { useAuth } from '../lib/useAuth'
import './ProfilePage.css'

const PROFILE_MESSAGE_KEY = 'tocktalks_profile_message'

function ProfilePage() {
  const { me, authChecked, logout } = useAuth()

  const [nickname, setNickname] = useState('')
  const [nicknameMessage, setNicknameMessage] = useState<string | null>(() => {
    const message = sessionStorage.getItem(PROFILE_MESSAGE_KEY)
    if (message) sessionStorage.removeItem(PROFILE_MESSAGE_KEY)
    return message
  })
  const [nicknameError, setNicknameError] = useState<string | null>(null)
  const [nicknameSubmitting, setNicknameSubmitting] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  useEffect(() => {
    if (authChecked && !me) {
      window.location.replace('/login?next=/profile')
    }
  }, [authChecked, me])

  useEffect(() => {
    if (me) setNickname(me.nickname)
  }, [me])

  const handleNicknameSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setNicknameMessage(null)
    setNicknameError(null)

    if (nickname.length < 2 || nickname.length > 20) {
      setNicknameError('닉네임은 2자 이상 20자 이하여야 합니다.')
      return
    }

    setNicknameSubmitting(true)
    try {
      await api.patch('/api/auth/me', { nickname })
      sessionStorage.setItem(PROFILE_MESSAGE_KEY, '닉네임이 변경되었습니다.')
      window.location.reload()
    } catch (err) {
      setNicknameError(err instanceof ApiError ? err.message : '닉네임 변경에 실패했습니다.')
      setNicknameSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)
    setPasswordError(null)

    if (newPassword.length < 8) {
      setPasswordError('새 비밀번호는 8자 이상이어야 합니다.')
      return
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.')
      return
    }

    setPasswordSubmitting(true)
    try {
      await api.patch('/api/auth/me', { currentPassword, newPassword })
      setPasswordMessage('비밀번호가 변경되었습니다.')
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirm('')
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : '비밀번호 변경에 실패했습니다.')
    } finally {
      setPasswordSubmitting(false)
    }
  }

  if (!me) return null

  const isKakao = me.provider === 'kakao'

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="profile-main">
        <h2>내 정보 수정</h2>

        <div className="card profile-card">
          <h3>계정 정보</h3>
          <div className="field">
            <span className="field-label">이메일</span>
            <p className="profile-readonly-value">{isKakao ? '카카오 계정으로 연동됨' : me.email}</p>
          </div>
        </div>

        <div className="card profile-card">
          <h3>닉네임 변경</h3>
          {isKakao ? (
            <p className="profile-hint">카카오 계정은 로그인할 때마다 카카오 닉네임으로 동기화되어 직접 변경할 수 없습니다.</p>
          ) : (
            <form className="auth-form" onSubmit={handleNicknameSubmit}>
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

              {nicknameError && <p className="alert-error">{nicknameError}</p>}
              {nicknameMessage && <p className="alert-success">{nicknameMessage}</p>}

              <button type="submit" className="btn btn-primary" disabled={nicknameSubmitting}>
                {nicknameSubmitting ? '변경 중…' : '닉네임 변경'}
              </button>
            </form>
          )}
        </div>

        {!isKakao && (
          <div className="card profile-card">
            <h3>비밀번호 변경</h3>
            <form className="auth-form" onSubmit={handlePasswordSubmit}>
              <label className="field">
                <span className="field-label">현재 비밀번호</span>
                <input
                  type="password"
                  className="input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </label>

              <label className="field">
                <span className="field-label">새 비밀번호</span>
                <input
                  type="password"
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>

              <label className="field">
                <span className="field-label">새 비밀번호 확인</span>
                <input
                  type="password"
                  className="input"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </label>

              {passwordError && <p className="alert-error">{passwordError}</p>}
              {passwordMessage && <p className="alert-success">{passwordMessage}</p>}

              <button type="submit" className="btn btn-primary" disabled={passwordSubmitting}>
                {passwordSubmitting ? '변경 중…' : '비밀번호 변경'}
              </button>
            </form>
          </div>
        )}
      </main>
    </>
  )
}

export default ProfilePage
