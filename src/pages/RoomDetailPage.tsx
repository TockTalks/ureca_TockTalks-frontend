import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Navbar from '../components/Navbar'
import { api, ApiError } from '../lib/apiClient'
import { useAuth } from '../lib/useAuth'
import type { FinalRanking, PortfolioSummary, Room, RoomRanking } from '../lib/types'
import { toRankedEntries, type RankedEntry } from '../lib/ranking'
import { formatDate, formatMoney, formatPercent, statusBadgeClass, statusLabel } from '../lib/format'
import './RoomPages.css'
import './RankingPage.css'

function RoomDetailPage({ roomId }: { roomId: number }) {
  const { me, authChecked, logout } = useAuth()
  const isAdmin = me?.role === 'admin'
  const [room, setRoom] = useState<Room | null>(null)
  const [isParticipant, setIsParticipant] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [finalRanking, setFinalRanking] = useState<FinalRanking[]>([])
  const [myPortfolio, setMyPortfolio] = useState<PortfolioSummary | null>(null)
  const [liveRanking, setLiveRanking] = useState<RankedEntry[]>([])

  const load = () => {
    api
      .get<Room>(`/api/rooms/${roomId}`)
      .then((data) => {
        setRoom(data)
        if (data.status !== 'ongoing') {
          api
            .get<FinalRanking[]>(`/api/rooms/${roomId}/rankings/final`)
            .then(setFinalRanking)
            .catch(() => setFinalRanking([]))
        }
      })
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

  useEffect(() => {
    if (!me || !isParticipant || room?.status !== 'ongoing') {
      setMyPortfolio(null)
      setLiveRanking([])
      return
    }

    let cancelled = false

    api
      .get<PortfolioSummary[]>('/api/portfolios')
      .then((portfolios) => {
        if (!cancelled) setMyPortfolio(portfolios.find((p) => p.roomId === roomId) ?? null)
      })
      .catch(() => {
        if (!cancelled) setMyPortfolio(null)
      })

    api
      .get<RoomRanking[]>(`/api/rooms/${roomId}/ranking`)
      .then((data) => {
        if (!cancelled) setLiveRanking(toRankedEntries(data))
      })
      .catch(() => {
        if (!cancelled) setLiveRanking([])
      })

    return () => {
      cancelled = true
    }
  }, [roomId, me, isParticipant, room?.status])

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

  const handleDelete = async () => {
    if (!window.confirm('방을 정말로 삭제하시겠습니까?')) return
    setErrorMessage(null)
    setBusy(true)
    try {
      await api.del(`/api/admin/rooms/${roomId}`)
      window.location.href = '/rooms'
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : '삭제에 실패했습니다.')
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
              finalRanking.length === 0 ? (
                <p className="rooms-empty">종료된 방입니다.</p>
              ) : (
                <ol className="card ranking-page-list">
                  {finalRanking.map((entry) => (
                    <li
                      key={entry.memberId}
                      className={`ranking-row ranking-page-item ${
                        me?.id === entry.memberId ? 'ranking-page-item-me' : ''
                      }`}
                    >
                      <span className={`ranking-rank ${entry.finalRank <= 3 ? `ranking-rank-${entry.finalRank}` : ''}`}>
                        {entry.finalRank}
                      </span>
                      <span className="ranking-nickname">{entry.nickname}</span>
                      <span className="ranking-balance">
                        {formatMoney(entry.finalAsset)} ({formatPercent(entry.finalReturnRate)})
                      </span>
                    </li>
                  ))}
                </ol>
              )
            ) : isParticipant ? (
              <>
                {myPortfolio && (
                  <>
                    <div className="room-detail-meta">
                      <div className="room-detail-meta-item">
                        <div className="label">보유 현금</div>
                        <div className="value">{formatMoney(myPortfolio.balance)}</div>
                      </div>
                      <div className="room-detail-meta-item">
                        <div className="label">평가자산</div>
                        <div className="value">{formatMoney(myPortfolio.totalAssetValue)}</div>
                      </div>
                      <div className="room-detail-meta-item">
                        <div className="label">수익률</div>
                        <div className="value">{formatPercent(myPortfolio.profitRate)}</div>
                      </div>
                      <div className="room-detail-meta-item">
                        <div className="label">보유 종목</div>
                        <div className="value">{myPortfolio.holdingCount}개</div>
                      </div>
                    </div>

                    <div className="room-detail-actions">
                      <a
                        href={`/stocks?roomParticipantId=${myPortfolio.roomParticipantId}`}
                        className="btn btn-primary"
                      >
                        이 방에서 거래하기
                      </a>
                      <a href={`/portfolio/${myPortfolio.roomParticipantId}`} className="btn btn-text">
                        내 포트폴리오 자세히 보기 →
                      </a>
                    </div>
                  </>
                )}

                <section className="rooms-section">
                  <div className="rooms-section-header">
                    <h2>방 랭킹</h2>
                  </div>
                  {liveRanking.length === 0 ? (
                    <p className="rooms-empty">아직 순위 데이터가 없습니다.</p>
                  ) : (
                    <ol className="card ranking-page-list">
                      {liveRanking.map((entry) => (
                        <li
                          key={entry.memberId}
                          className={`ranking-row ranking-page-item ${
                            me?.id === entry.memberId ? 'ranking-page-item-me' : ''
                          }`}
                        >
                          <span className={`ranking-rank ${entry.rank !== null && entry.rank <= 3 ? `ranking-rank-${entry.rank}` : ''}`}>
                            {entry.rank ?? '-'}
                          </span>
                          <span className="ranking-nickname">{entry.nickname}</span>
                          <span className="ranking-balance">{formatMoney(entry.balance)}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>

                {!room.isDefault && (
                  <div className="room-detail-actions">
                    <button type="button" className="btn btn-default" disabled={busy} onClick={handleLeave}>
                      탈퇴하기
                    </button>
                  </div>
                )}
              </>
            ) : room.isPublic ? (
              <div className="room-detail-actions">
                <button type="button" className="btn btn-primary" disabled={busy} onClick={handleJoin}>
                  {busy ? '참가 중…' : '참가하기'}
                </button>
                {isAdmin && !room.isDefault && (
                  <button type="button" className="btn btn-text room-delete-btn" disabled={busy} onClick={handleDelete}>
                    삭제
                  </button>
                )}
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