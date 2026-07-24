import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Navbar from '../components/Navbar'
import { api, ApiError } from '../lib/apiClient'
import { useAuth } from '../lib/useAuth'
import type { Room } from '../lib/types'
import { formatMoney, statusBadgeClass, statusLabel } from '../lib/format'
import './RoomPages.css'

function RoomsPage() {
  const { me, authChecked, logout } = useAuth()
  const isAdmin = me?.role === 'admin'
  const [publicRooms, setPublicRooms] = useState<Room[]>([])
  const [myRooms, setMyRooms] = useState<Room[]>([])
  const [inviteCode, setInviteCode] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [joiningRoomId, setJoiningRoomId] = useState<number | null>(null)
  const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null)

  const loadPublicRooms = () => {
    api.get<Room[]>('/api/rooms').then(setPublicRooms).catch(() => setPublicRooms([]))
  }

  const loadMyRooms = () => {
    if (!me) {
      setMyRooms([])
      return
    }
    api.get<Room[]>('/api/rooms/mine').then(setMyRooms).catch(() => setMyRooms([]))
  }

  useEffect(loadPublicRooms, [])
  useEffect(loadMyRooms, [me])

  const myRoomIds = new Set(myRooms.map((r) => r.id))

  const handleJoin = async (roomId: number) => {
    setErrorMessage(null)
    setJoiningRoomId(roomId)
    try {
      await api.post(`/api/rooms/${roomId}/join`)
      loadPublicRooms()
      loadMyRooms()
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : '참가에 실패했습니다.')
    } finally {
      setJoiningRoomId(null)
    }
  }

  const handleJoinByInviteCode = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    try {
      await api.post('/api/rooms/join', { inviteCode })
      setInviteCode('')
      loadPublicRooms()
      loadMyRooms()
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : '참가에 실패했습니다.')
    }
  }

  const handleDelete = async (roomId: number) => {
    if (!window.confirm('방을 정말로 삭제하시겠습니까?')) return
    setErrorMessage(null)
    setDeletingRoomId(roomId)
    try {
      await api.del(`/api/admin/rooms/${roomId}`)
      loadPublicRooms()
      loadMyRooms()
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : '삭제에 실패했습니다.')
    } finally {
      setDeletingRoomId(null)
    }
  }

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="rooms-main">
        {errorMessage && <p className="alert-error">{errorMessage}</p>}

        {authChecked && me && (
          <section className="rooms-section">
            <div className="rooms-section-header">
              <h2>내 방</h2>
              <div className="rooms-toolbar">
                <form className="invite-join-form" onSubmit={handleJoinByInviteCode}>
                  <input
                    type="text"
                    className="input"
                    placeholder="초대코드"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                  />
                  <button type="submit" className="btn btn-default">
                    참가
                  </button>
                </form>
                <a href="/rooms/new" className="btn btn-primary">
                  방 만들기
                </a>
              </div>
            </div>

            {myRooms.length === 0 ? (
              <p className="rooms-empty">아직 참가한 방이 없습니다.</p>
            ) : (
              <div className="room-list">
                {myRooms.map((room) => (
                  <RoomCard key={room.id} room={room} joined />
                ))}
              </div>
            )}
          </section>
        )}

        {authChecked && !me && (
          <section className="rooms-section">
            <p className="rooms-empty">
              <a href="/login">로그인</a> 후 방을 만들거나 참가할 수 있습니다.
            </p>
          </section>
        )}

        <section className="rooms-section">
          <div className="rooms-section-header">
            <h2>공개방</h2>
          </div>

          {publicRooms.length === 0 ? (
            <p className="rooms-empty">공개된 방이 없습니다.</p>
          ) : (
            <div className="room-list">
              {publicRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  joined={myRoomIds.has(room.id)}
                  onJoin={me ? () => handleJoin(room.id) : undefined}
                  joining={joiningRoomId === room.id}
                  isAdmin={isAdmin}
                  onDelete={() => handleDelete(room.id)}
                  deleting={deletingRoomId === room.id}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}

function RoomCard({
  room,
  joined,
  onJoin,
  joining,
  isAdmin,
  onDelete,
  deleting,
}: {
  room: Room
  joined: boolean
  onJoin?: () => void
  joining?: boolean
  isAdmin?: boolean
  onDelete?: () => void
  deleting?: boolean
}) {
  const showJoinButton = !joined && onJoin
  const showDeleteButton = isAdmin && onDelete && !room.isDefault

  return (
    <a href={`/rooms/${room.id}`} className="card room-card">
      <div className="room-card-header">
        <h3>{room.name}</h3>
        <span className={statusBadgeClass(room.status)}>{statusLabel(room.status)}</span>
      </div>
      <div className="room-card-meta">
        <span>시드머니 {formatMoney(room.seedMoney)}</span>
        <span>
          참가자 {room.participantCount}
          {room.maxParticipants ? ` / ${room.maxParticipants}` : ''}명
        </span>
      </div>
      {(showJoinButton || showDeleteButton) && (
        <div className="room-card-actions">
          {showJoinButton && (
            <button
              type="button"
              className="btn btn-default"
              disabled={joining}
              onClick={(e) => {
                e.preventDefault()
                onJoin!()
              }}
            >
              {joining ? '참가 중…' : '참가하기'}
            </button>
          )}
          {showDeleteButton && (
            <button
              type="button"
              className="btn btn-text room-delete-btn"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault()
                onDelete!()
              }}
            >
              {deleting ? '삭제 중…' : '삭제'}
            </button>
          )}
        </div>
      )}
    </a>
  )
}

export default RoomsPage