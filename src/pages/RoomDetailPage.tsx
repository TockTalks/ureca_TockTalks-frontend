import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Navbar from '../components/Navbar'
import { api, ApiError } from '../lib/apiClient'
import { useAuth } from '../lib/useAuth'
import type { Room } from '../lib/types'
import { formatDate, formatMoney, statusBadgeClass, statusLabel } from '../lib/format'
import './RoomPages.css'

function RoomDetailPage({ roomId }: { roomId: number }) {
  const { me, authChecked, logout } = useAuth()
  const [room, setRoom] = useState<Room | null>(null)
  const [isParticipant, setIsParticipant] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = () => {
    api
      .get<Room>(`/api/rooms/${roomId}`)
      .then(setRoom)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : '방 정보를 불러오지 못했습니다.'))

    if (me) {
      api
        .get<Room[]>('/api/rooms/mine')
        .then((rooms) => setIsParticipant(rooms.some((r) => r.id === roomId)))
        .catch(() => setIsParticipant(false))
    } else {
      setIsParticipant(false)
    }
  }

  useEffect(load, [roomId, me])

  const handleJoin = async () => {
    setErrorMessage(null)
    setBusy(true)
    try {
      await api.post(`/api/rooms/${roomId}/join`)
      load()
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : '참가에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const handleJoinByInviteCode = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setBusy(true)
    try {
      await api.post('/api/rooms/join', { inviteCode })
      setInviteCode('')
      load()
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : '참가에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const handleLeave = async () => {
    setErrorMessage(null)
    setBusy(true)
    try {
      await api.del(`/api/rooms/${roomId}/participants/me`)
      load()
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : '탈퇴에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const handleCopyInviteCode = () => {
    if (room?.inviteCode) {
      navigator.clipboard.writeText(room.inviteCode)
    }
  }

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="rooms-main">
        {loadError && <p className="alert-error">{loadError}</p>}

        {room && (
          <div className="card room-detail-card">
            <div className="room-detail-header">
              <h1>{room.name}</h1>
              <div className="room-detail-badges">
                {room.isDefault && <span className="badge badge-info">기본방</span>}
                <span className="badge badge-default">{room.isPublic ? '공개' : '비공개'}</span>
                <span className={statusBadgeClass(room.status)}>{statusLabel(room.status)}</span>
              </div>
            </div>

            <div className="room-detail-meta">
              <div className="room-detail-meta-item">
                <div className="label">시드머니</div>
                <div className="value">{formatMoney(room.seedMoney)}</div>
              </div>
              <div className="room-detail-meta-item">
                <div className="label">참가자</div>
                <div className="value">
                  {room.participantCount}
                  {room.maxParticipants ? ` / ${room.maxParticipants}` : ''}명
                </div>
              </div>
              <div className="room-detail-meta-item">
                <div className="label">시작</div>
                <div className="value">{formatDate(room.startAt)}</div>
              </div>
              <div className="room-detail-meta-item">
                <div className="label">종료</div>
                <div className="value">{formatDate(room.endAt)}</div>
              </div>
            </div>

            {room.inviteCode && (
              <div className="invite-code-box">
                <span className="field-label">초대코드</span>
                <code>{room.inviteCode}</code>
                <button type="button" className="btn btn-text" onClick={handleCopyInviteCode}>
                  복사
                </button>
              </div>
            )}

            {errorMessage && <p className="alert-error">{errorMessage}</p>}

            {!authChecked ? null : !me ? (
              <p className="rooms-empty">
                <a href="/login">로그인</a> 후 참가할 수 있습니다.
              </p>
            ) : room.status !== 'ongoing' ? (
              <p className="rooms-empty">종료된 방입니다.</p>
            ) : isParticipant ? (
              !room.isDefault && (
                <div className="room-detail-actions">
                  <button type="button" className="btn btn-default" disabled={busy} onClick={handleLeave}>
                    탈퇴하기
                  </button>
                </div>
              )
            ) : room.isPublic ? (
              <div className="room-detail-actions">
                <button type="button" className="btn btn-primary" disabled={busy} onClick={handleJoin}>
                  {busy ? '참가 중…' : '참가하기'}
                </button>
              </div>
            ) : (
              <form className="invite-join-form" onSubmit={handleJoinByInviteCode}>
                <input
                  type="text"
                  className="input"
                  placeholder="초대코드 입력"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  참가
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </>
  )
}

export default RoomDetailPage
