import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { api } from '../lib/apiClient'
import { useAuth } from '../lib/useAuth'
import type { RoomHistoryEntry } from '../lib/types'
import { formatDate, formatMoney, formatPercent, profitTextClass } from '../lib/format'
import './RoomPages.css'

function RoomHistoryPage() {
  const { me, authChecked, logout } = useAuth()
  const [history, setHistory] = useState<RoomHistoryEntry[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!me) return
    api
      .get<RoomHistoryEntry[]>('/api/rooms/mine/history')
      .then(setHistory)
      .catch(() => setLoadError('지난 방 기록을 불러오지 못했습니다.'))
  }, [me])

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="rooms-main">
        <div className="section-title-row">
          <div>
            <span className="section-eyebrow">HISTORY</span>
            <h1 className="home-section-title">역대 방 결과</h1>
          </div>
        </div>

        {loadError && <p className="alert-error">{loadError}</p>}

        {authChecked && !me && (
          <p className="rooms-empty">
            <a href="/login">로그인</a> 후 지난 방 기록을 볼 수 있습니다.
          </p>
        )}

        {authChecked && me && history.length === 0 && !loadError && (
          <p className="rooms-empty">아직 종료된 방 기록이 없습니다.</p>
        )}

        {history.length > 0 && (
          <div className="room-list">
            {history.map((entry) => (
              <a key={entry.roomId} href={`/rooms/${entry.roomId}`} className="card room-card history-card">
                <div className="room-card-header">
                  <h3>{entry.roomName}</h3>
                  <span className="history-rank-badge">
                    <span className={`ranking-rank ${entry.hasTraded && entry.finalRank <= 3 ? `ranking-rank-${entry.finalRank}` : ''}`}>
                      {entry.hasTraded ? entry.finalRank : '-'}
                    </span>
                    {entry.hasTraded && '등'}
                  </span>
                </div>
                <div className="room-card-meta">
                  <span>종료일 {formatDate(entry.endAt)}</span>
                  <span>참가자 {entry.participantCount}명</span>
                </div>
                <div className="history-card-result">
                  {entry.hasTraded ? (
                    <>
                      <span>{formatMoney(entry.finalAsset)}</span>
                      <span className={profitTextClass(entry.finalReturnRate)}>
                        {formatPercent(entry.finalReturnRate)}
                      </span>
                    </>
                  ) : (
                    <span>-</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

export default RoomHistoryPage
