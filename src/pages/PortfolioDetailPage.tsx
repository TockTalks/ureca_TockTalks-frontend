import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { api, ApiError } from '../lib/apiClient'
import { useAuth } from '../lib/useAuth'
import type { PortfolioDetail, PortfolioHistoryPoint } from '../lib/types'
import { formatDate, formatMoney, formatPercent, profitBadgeClass, statusBadgeClass, statusLabel } from '../lib/format'
import './PortfolioPage.css'

function PortfolioDetailPage({ roomParticipantId }: { roomParticipantId: number }) {
  const { me, authChecked, logout } = useAuth()
  const [detail, setDetail] = useState<PortfolioDetail | null>(null)
  const [history, setHistory] = useState<PortfolioHistoryPoint[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (authChecked && !me) {
      window.location.replace('/login?next=/portfolio')
    }
  }, [authChecked, me])

  useEffect(() => {
    if (!me) return
    api
      .get<PortfolioDetail>(`/api/portfolios/${roomParticipantId}`)
      .then(setDetail)
      .catch((err) => setErrorMessage(err instanceof ApiError ? err.message : '포트폴리오를 불러오지 못했습니다.'))

    api
      .get<PortfolioHistoryPoint[]>(`/api/portfolios/${roomParticipantId}/history`)
      .then(setHistory)
      .catch(() => setHistory([]))
  }, [me, roomParticipantId])

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="rooms-main">
        <a href="/portfolio" className="btn btn-text portfolio-back-link">
          ← 내 포트폴리오
        </a>

        {errorMessage && <p className="alert-error">{errorMessage}</p>}

        {detail && (
          <>
            <div className="card room-detail-card">
              <div className="room-detail-header">
                <h1>{detail.roomName}</h1>
                <span className={statusBadgeClass(detail.roomStatus)}>{statusLabel(detail.roomStatus)}</span>
              </div>

              <div className="room-detail-meta">
                <div className="room-detail-meta-item">
                  <div className="label">평가자산</div>
                  <div className="value">{formatMoney(detail.totalAssetValue)}</div>
                </div>
                <div className="room-detail-meta-item">
                  <div className="label">현금 잔고</div>
                  <div className="value">{formatMoney(detail.balance)}</div>
                </div>
                <div className="room-detail-meta-item">
                  <div className="label">주식 평가금액</div>
                  <div className="value">{formatMoney(detail.stockValuation)}</div>
                </div>
                <div className="room-detail-meta-item">
                  <div className="label">시드머니</div>
                  <div className="value">{formatMoney(detail.initialSeedMoney)}</div>
                </div>
                <div className="room-detail-meta-item">
                  <div className="label">수익률</div>
                  <div className="value">
                    <span className={profitBadgeClass(detail.profitAmount)}>{formatPercent(detail.profitRate)}</span>
                  </div>
                </div>
                <div className="room-detail-meta-item">
                  <div className="label">수익금</div>
                  <div className={`value ${detail.profitAmount > 0 ? 'text-rise' : detail.profitAmount < 0 ? 'text-fall' : ''}`}>
                    {formatMoney(detail.profitAmount)}
                  </div>
                </div>
              </div>
            </div>

            <section className="rooms-section">
              <div className="rooms-section-header">
                <h2>보유 종목</h2>
              </div>
              {detail.holdings.length === 0 ? (
                <p className="rooms-empty">보유중인 종목이 없습니다.</p>
              ) : (
                <div className="card portfolio-table-wrap">
                  <table className="portfolio-table">
                    <thead>
                      <tr>
                        <th>종목명</th>
                        <th>수량</th>
                        <th>평균매입가</th>
                        <th>현재가</th>
                        <th>평가금액</th>
                        <th>수익률</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.holdings.map((h) => (
                        <tr key={h.stockCode}>
                          <td>{h.stockName}</td>
                          <td>{h.quantity.toLocaleString('ko-KR')}주</td>
                          <td>{formatMoney(h.avgPurchasePrice)}</td>
                          <td>{formatMoney(h.currentPrice)}</td>
                          <td>{formatMoney(h.evaluationAmount)}</td>
                          <td className={h.profitAmount > 0 ? 'text-rise' : h.profitAmount < 0 ? 'text-fall' : ''}>
                            {formatPercent(h.profitRate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rooms-section">
              <div className="rooms-section-header">
                <h2>자산 변동 히스토리</h2>
              </div>
              {history.length === 0 ? (
                <p className="rooms-empty">히스토리 데이터가 없습니다.</p>
              ) : (
                <div className="card portfolio-table-wrap">
                  <table className="portfolio-table">
                    <thead>
                      <tr>
                        <th>일시</th>
                        <th>총자산</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h) => (
                        <tr key={h.recordedAt}>
                          <td>{formatDate(h.recordedAt)}</td>
                          <td>{formatMoney(h.totalAssetValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  )
}

export default PortfolioDetailPage
