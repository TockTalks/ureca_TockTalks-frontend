import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Navbar from '../components/Navbar'
import { api, ApiError } from '../lib/apiClient'
import { useAuth } from '../lib/useAuth'
import type { Room } from '../lib/types'
import './RoomPages.css'

function CreateRoomPage() {
  const { me, authChecked, logout } = useAuth()

  useEffect(() => {
    if (authChecked && !me) {
      window.location.replace('/login')
    }
  }, [authChecked, me])
  const [name, setName] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [seedMoney, setSeedMoney] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!startAt || !endAt) {
      setErrorMessage('시작일과 종료일을 입력해주세요.')
      return
    }
    if (new Date(endAt) <= new Date(startAt)) {
      setErrorMessage('종료일은 시작일 이후여야 합니다.')
      return
    }

    setSubmitting(true)
    try {
      const room = await api.post<Room>('/api/rooms', {
        name,
        isPublic,
        seedMoney: seedMoney ? Number(seedMoney) : undefined,
        startAt,
        endAt,
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
      })
      window.location.href = `/rooms/${room.id}`
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : '방 생성에 실패했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="rooms-main">
        <h2>방 만들기</h2>

        <form className="card create-room-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">방 이름</span>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </label>

          <div className="field">
            <span className="field-label">공개 여부</span>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                />
                공개방
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                />
                비공개방 (초대코드)
              </label>
            </div>
          </div>

          <div className="field-row">
            <label className="field">
              <span className="field-label">시작일시</span>
              <input
                type="datetime-local"
                className="input"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">종료일시</span>
              <input
                type="datetime-local"
                className="input"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span className="field-label">시드머니</span>
              <input
                type="number"
                className="input"
                placeholder="기본값 사용"
                value={seedMoney}
                onChange={(e) => setSeedMoney(e.target.value)}
                min={1}
              />
            </label>
            <label className="field">
              <span className="field-label">최대 인원</span>
              <input
                type="number"
                className="input"
                placeholder="제한 없음"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                min={1}
              />
            </label>
          </div>

          {errorMessage && <p className="alert-error">{errorMessage}</p>}

          <div className="room-detail-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '생성 중…' : '방 만들기'}
            </button>
            <a href="/rooms" className="btn btn-default">
              취소
            </a>
          </div>
        </form>
      </main>
    </>
  )
}

export default CreateRoomPage
