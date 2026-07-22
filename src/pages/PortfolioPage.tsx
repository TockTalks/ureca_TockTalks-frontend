import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import ProfitRateGauge from '../components/ProfitRateGauge' // ===== 추가: 수익률 원형 게이지 =====
import { api, ApiError } from '../lib/apiClient'
import { useAuth } from '../lib/useAuth'
import type { PortfolioSummary } from '../lib/types'
import { formatMoney, formatPercent, profitBadgeClass, statusBadgeClass, statusLabel } from '../lib/format'
import './PortfolioPage.css'

function PortfolioPage() {
  const { me, authChecked, logout } = useAuth()
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (authChecked && !me) {
      window.location.replace('/login?next=/portfolio')
    }
  }, [authChecked, me])

  useEffect(() => {
    if (!me) return

    let cancelled = false

    setLoaded(false)
    setErrorMessage(null)

    api
      .get<PortfolioSummary[]>('/api/portfolios')
      .then((data) => {
        if (cancelled) return

        setPortfolios(data)
        setErrorMessage(null)
      })
      .catch((err) => {
        if (cancelled) return

        setErrorMessage(
          err instanceof ApiError ? err.message : '포트폴리오를 불러오지 못했습니다.',
        )
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [me])

  const totalAssetValue = portfolios.reduce((sum, p) => sum + p.totalAssetValue, 0)
  const totalSeedMoney = portfolios.reduce((sum, p) => sum + p.initialSeedMoney, 0)
  const totalProfitAmount = totalAssetValue - totalSeedMoney
  const totalProfitRate = totalSeedMoney > 0 ? (totalProfitAmount / totalSeedMoney) * 100 : 0

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="rooms-main">
        <h2>내 포트폴리오</h2>

        {errorMessage && <p className="alert-error">{errorMessage}</p>}

        {loaded && portfolios.length > 0 && (
          <div className="card portfolio-summary-bar">
            {/* ===== 추가: 전체 수익률 게이지 ===== */}
            <ProfitRateGauge rate={totalProfitRate} size={96} />
            {/* ===== 추가 끝 ===== */}
            <div className="portfolio-summary-item">
              <div className="label">총 평가자산</div>
              <div className="value">{formatMoney(totalAssetValue)}</div>
            </div>
            <div className="portfolio-summary-item">
              <div className="label">총 시드머니</div>
              <div className="value">{formatMoney(totalSeedMoney)}</div>
            </div>
            <div className="portfolio-summary-item">
              <div className="label">총 수익</div>
              <div className={`value ${totalProfitAmount > 0 ? 'text-rise' : totalProfitAmount < 0 ? 'text-fall' : ''}`}>
                {formatMoney(totalProfitAmount)} ({formatPercent(totalProfitRate)})
              </div>
            </div>
          </div>
        )}

        {loaded && !errorMessage && portfolios.length === 0 && (
          <p className="rooms-empty">
            참가중인 방이 없습니다. <a href="/rooms">방 목록</a>에서 방에 참가해보세요.
          </p>
        )}

        {portfolios.length > 0 && (
          <div className="room-list">
            {portfolios.map((p) => (
              <a key={p.roomParticipantId} href={`/portfolio/${p.roomParticipantId}`} className="card room-card">
                <div className="room-card-header">
                  <h3>{p.roomName}</h3>
                  <span className={statusBadgeClass(p.roomStatus)}>{statusLabel(p.roomStatus)}</span>
                </div>
                <div className="room-card-meta">
                  <span>평가자산 {formatMoney(p.totalAssetValue)}</span>
                  <span>보유 종목 {p.holdingCount}개</span>
                </div>
                <div className="portfolio-card-profit">
                  {/* ===== 추가: 방별 수익률 게이지 ===== */}
                  <ProfitRateGauge rate={p.profitRate} size={48} />
                  {/* ===== 추가 끝 ===== */}
                  <span className={profitBadgeClass(p.profitAmount)}>{formatPercent(p.profitRate)}</span>
                  <span className={`profit-amount ${p.profitAmount > 0 ? 'text-rise' : p.profitAmount < 0 ? 'text-fall' : ''}`}>
                    {formatMoney(p.profitAmount)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

export default PortfolioPage
