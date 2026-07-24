import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Navbar from '../components/Navbar'
import { api, ApiError } from '../lib/apiClient'
import { useAuth } from '../lib/useAuth'
import './ProfilePage.css'

const PROFILE_MESSAGE_KEY = 'tocktalks_profile_message'
const WITHDRAWAL_CONFIRMATION = '회원탈퇴'

function ProfilePage() {
  const { me, authChecked, logout } = useAuth()
  const isKakao = me?.provider === 'kakao'

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

  // 회원탈퇴 입력과 요청 상태는 다른 프로필 수정 상태와 분리해 오조작을 방지한다.
  const [withdrawalOpen, setWithdrawalOpen] = useState(false)
  const [withdrawalConfirmation, setWithdrawalConfirmation] = useState('')
  const [withdrawalPassword, setWithdrawalPassword] = useState('')
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null)
  const [withdrawalSubmitting, setWithdrawalSubmitting] = useState(false)

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

  const handleWithdrawalSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setWithdrawalError(null)

    if (withdrawalConfirmation !== WITHDRAWAL_CONFIRMATION) {
      setWithdrawalError(`확인 문구로 '${WITHDRAWAL_CONFIRMATION}'를 정확히 입력해 주세요.`)
      return
    }
    if (!isKakao && !withdrawalPassword) {
      setWithdrawalError('현재 비밀번호를 입력해 주세요.')
      return
    }
    if (!window.confirm('회원탈퇴 후에는 현재 계정과 투자 기록을 다시 이용할 수 없습니다. 탈퇴할까요?')) {
      return
    }

    setWithdrawalSubmitting(true)
    try {
      await api.del('/api/auth/me', {
        currentPassword: isKakao ? null : withdrawalPassword,
      })
      logout()
      window.location.replace('/login?withdrawn=1')
    } catch (err) {
      setWithdrawalError(err instanceof ApiError ? err.message : '회원탈퇴에 실패했습니다.')
      setWithdrawalSubmitting(false)
    }
  }

  if (!me) return null

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

        {/* 회원탈퇴: 기존 자산·거래 기록은 보존되지만 계정은 익명화되어 다시 접근할 수 없다. */}
        <div className="card profile-card profile-withdrawal-card">
          <h3>회원탈퇴</h3>
          <p className="profile-withdrawal-description">
            탈퇴하면 진행 중인 방과 랭킹에서 제외됩니다. 재가입하더라도 기존 자산은 복구되지 않으며
            새 계정으로 시작합니다. 종료된 방의 최종 기록은 익명으로 보존됩니다.
          </p>

          {!withdrawalOpen ? (
            <button
              type="button"
              className="btn profile-withdrawal-open"
              onClick={() => setWithdrawalOpen(true)}
            >
              회원탈퇴
            </button>
          ) : (
            <form className="auth-form profile-withdrawal-form" onSubmit={handleWithdrawalSubmit}>
              {!isKakao && (
                <label className="field">
                  <span className="field-label">현재 비밀번호</span>
                  <input
                    type="password"
                    className="input"
                    value={withdrawalPassword}
                    onChange={(e) => setWithdrawalPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </label>
              )}

              <label className="field">
                <span className="field-label">
                  확인을 위해 <strong>{WITHDRAWAL_CONFIRMATION}</strong>를 입력해 주세요.
                </span>
                <input
                  type="text"
                  className="input"
                  value={withdrawalConfirmation}
                  onChange={(e) => setWithdrawalConfirmation(e.target.value)}
                  required
                  autoComplete="off"
                />
              </label>

              {withdrawalError && <p className="alert-error">{withdrawalError}</p>}

              <div className="profile-withdrawal-actions">
                <button
                  type="button"
                  className="btn btn-default"
                  disabled={withdrawalSubmitting}
                  onClick={() => {
                    setWithdrawalOpen(false)
                    setWithdrawalPassword('')
                    setWithdrawalConfirmation('')
                    setWithdrawalError(null)
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn profile-withdrawal-submit"
                  disabled={
                    withdrawalSubmitting
                    || withdrawalConfirmation !== WITHDRAWAL_CONFIRMATION
                    || (!isKakao && !withdrawalPassword)
                  }
                >
                  {withdrawalSubmitting ? '탈퇴 처리 중…' : '회원탈퇴 확인'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </>
  )
}

export default ProfilePage
