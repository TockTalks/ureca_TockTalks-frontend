import Navbar from '../components/Navbar'
import { useAuth } from '../lib/useAuth'
import { useDefaultRoomRanking } from '../lib/useRanking'
import { formatMoney } from '../lib/format'
import './RankingPage.css'

function RankingPage() {
  const { me, authChecked, logout } = useAuth()
  const { ranking, roomName, loadError } = useDefaultRoomRanking()

  const myRanking = me ? ranking.find((entry) => entry.memberId === me.id) : undefined

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="ranking-page-main">
        <div className="section-title-row">
          <div>
            <span className="section-eyebrow">RANKING</span>
            <h1 className="home-section-title">{roomName ?? '실시간'} 랭킹</h1>
          </div>
        </div>

        {loadError && <p className="alert-error">랭킹을 불러오지 못했습니다.</p>}

        {authChecked && myRanking && (
          <div className="card ranking-my-summary">
            <span className="ranking-my-summary-label">내 순위</span>
            <div className="ranking-row">
              <span className={`ranking-rank ${myRanking.rank !== null && myRanking.rank <= 3 ? `ranking-rank-${myRanking.rank}` : ''}`}>
                {myRanking.rank ?? '-'}
              </span>
              <span className="ranking-nickname">{myRanking.nickname}</span>
              <span className="ranking-balance">{formatMoney(myRanking.balance)}</span>
            </div>
          </div>
        )}

        {ranking.length === 0 && !loadError ? (
          <p className="ranking-page-empty">아직 순위 데이터가 없습니다.</p>
        ) : (
          <ol className="card ranking-page-list">
            {ranking.map((entry) => (
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
      </main>
    </>
  )
}

export default RankingPage
