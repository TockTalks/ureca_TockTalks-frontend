import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Navbar from '../components/Navbar'
import { api, ApiError } from '../lib/apiClient'
import { formatPercent, profitTextClass, reportStatusBadgeClass, reportStatusLabel, statusBadgeClass, statusLabel } from '../lib/format'
import { useAuth } from '../lib/useAuth'
import type {
  DashboardCommunityResponse,
  DashboardMembersTradesResponse,
  DashboardRoomsRanksResponse,
  DashboardSummaryResponse,
} from '../lib/types'
import './AdminPage.css'

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-tile">
      <span className="stat-tile-label">{label}</span>
      <strong className="stat-tile-value">{value.toLocaleString('ko-KR')}</strong>
    </div>
  )
}

function AdminStatsPage() {
  const { me, authChecked, logout } = useAuth()
  const isAdmin = authChecked && me?.role === 'admin'

  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null)
  const [membersTrades, setMembersTrades] = useState<DashboardMembersTradesResponse | null>(null)
  const [roomsRanks, setRoomsRanks] = useState<DashboardRoomsRanksResponse | null>(null)
  const [community, setCommunity] = useState<DashboardCommunityResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authChecked) return
    if (!me) {
      window.location.replace('/login?next=/admin/stats')
      return
    }
    if (me.role !== 'admin') {
      window.location.replace('/')
    }
  }, [authChecked, me])

  useEffect(() => {
    if (!isAdmin) return
    setLoading(true)
    setError(null)

    Promise.all([
      api.get<DashboardSummaryResponse>('/api/admin/dashboard/summary'),
      api.get<DashboardMembersTradesResponse>('/api/admin/dashboard/members-trades'),
      api.get<DashboardRoomsRanksResponse>('/api/admin/dashboard/rooms-ranks'),
      api.get<DashboardCommunityResponse>('/api/admin/dashboard/community'),
    ])
      .then(([summaryRes, membersTradesRes, roomsRanksRes, communityRes]) => {
        setSummary(summaryRes)
        setMembersTrades(membersTradesRes)
        setRoomsRanks(roomsRanksRes)
        setCommunity(communityRes)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : '통계를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [isAdmin])

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="admin-main admin-stats-main">
        <h2>통계</h2>

        {error && <p className="alert-error">{error}</p>}
        {loading && !summary && <p className="admin-placeholder">불러오는 중입니다...</p>}

        {summary && (
          <section className="card admin-stats-section">
            <h3>핵심 지표</h3>
            <div className="stat-tile-grid">
              <StatTile label="가입자 수" value={summary.totalMemberCount} />
              <StatTile label="DAU" value={summary.dailyActiveUserCount} />
              <StatTile label="WAU" value={summary.weeklyActiveUserCount} />
              <StatTile label="현재 접속자" value={summary.currentOnlineCount} />
            </div>
            <div className="admin-stats-room-badges">
              <span className={statusBadgeClass('recruiting')}>{statusLabel('recruiting')} {summary.recruitingRoomCount}</span>
              <span className={statusBadgeClass('ongoing')}>{statusLabel('ongoing')} {summary.ongoingRoomCount}</span>
              <span className={statusBadgeClass('closed')}>{statusLabel('closed')} {summary.closedRoomCount}</span>
              <span className="admin-stats-muted">전체 {summary.totalRoomCount}개 방</span>
            </div>
          </section>
        )}

        {membersTrades && (
          <section className="card admin-stats-section">
            <h3>유저 · 거래 통계 (최근 30일)</h3>
            {membersTrades.dailyTrend.length === 0 ? (
              <p className="admin-placeholder">아직 집계된 일별 데이터가 없습니다.</p>
            ) : (
              <div className="admin-stats-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={membersTrades.dailyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="newMemberCount" name="신규 가입" stroke="#1677ff" dot={false} />
                    <Line type="monotone" dataKey="transactionCount" name="거래 건수" stroke="#ff4d4f" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <h4>인기 종목 Top {membersTrades.popularStocks.length}</h4>
            {membersTrades.popularStocks.length === 0 ? (
              <p className="admin-placeholder">거래 데이터가 없습니다.</p>
            ) : (
              <ol className="admin-stats-rank-list">
                {membersTrades.popularStocks.map((stock) => (
                  <li key={stock.stockCode}>
                    <span>
                      {stock.stockName} <span className="admin-stats-muted">({stock.stockCode})</span>
                    </span>
                    <span>{stock.tradeCount}건</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        {roomsRanks && (
          <section className="card admin-stats-section">
            <h3>방 · 랭킹 통계</h3>
            <div className="stat-tile-grid">
              <StatTile label="전체 방" value={roomsRanks.totalRoomCount} />
              <StatTile label="전체 참가자" value={roomsRanks.totalParticipantCount} />
              <StatTile label="활성 참가자" value={roomsRanks.activeParticipantCount} />
            </div>

            <h4>수익률 분포</h4>
            <div className="admin-stats-chart admin-stats-chart-small">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomsRanks.returnRateDistribution} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1677ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <h4>상위 유저</h4>
            {roomsRanks.topUsers.length === 0 ? (
              <p className="admin-placeholder">종료된 방이 없어 아직 순위가 없습니다.</p>
            ) : (
              <table className="admin-member-table">
                <thead>
                  <tr>
                    <th>순위</th>
                    <th>닉네임</th>
                    <th>방 ID</th>
                    <th>수익률</th>
                  </tr>
                </thead>
                <tbody>
                  {roomsRanks.topUsers.map((user, index) => (
                    <tr key={`${user.memberId}-${user.roomId}`}>
                      <td>{index + 1}</td>
                      <td>{user.nickname}</td>
                      <td>{user.roomId}</td>
                      <td className={profitTextClass(user.returnRate)}>{formatPercent(user.returnRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {community && (
          <section className="card admin-stats-section">
            <h3>커뮤니티 통계 (최근 30일)</h3>
            <div className="admin-stats-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={community.dailyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="newPostCount" name="신규 게시글" stroke="#1677ff" dot={false} />
                  <Line type="monotone" dataKey="newCommentCount" name="신규 댓글" stroke="#52c41a" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <h4>인기 글</h4>
            {community.popularPosts.length === 0 ? (
              <p className="admin-placeholder">게시글이 없습니다.</p>
            ) : (
              <ul className="admin-stats-rank-list">
                {community.popularPosts.map((post) => (
                  <li key={post.postId}>
                    <span className="admin-stats-post-content">{post.content}</span>
                    <span>♥ {post.likeCount} · 댓글 {post.commentCount}</span>
                  </li>
                ))}
              </ul>
            )}

            <h4>신고 현황</h4>
            <div className="admin-stats-report-badges">
              {community.reportStatusCounts.map((item) => (
                <span key={item.status} className={`badge ${reportStatusBadgeClass(item.status)}`}>
                  {reportStatusLabel(item.status)} {item.count}
                </span>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}

export default AdminStatsPage