import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import PortfolioCompositionChart from '../components/PortfolioCompositionChart' // ===== 변경: 수익률 게이지 → 종목 구성 도넛 차트 =====
import { api, ApiError } from '../lib/apiClient'
import { useAuth } from '../lib/useAuth'
import type { PortfolioDetail, PortfolioHistoryPoint } from '../lib/types'
import {
  formatDate,
  formatMoney,
  formatPercent,
  profitBadgeClass,
  profitTextClass, // ===== 추가 =====
  statusBadgeClass,
  statusLabel,
} from '../lib/format'
import './PortfolioPage.css'

function PortfolioDetailPage({ roomParticipantId }: { roomParticipantId: number }) {
  const { me, authChecked, logout } = useAuth()
  const [detail, setDetail] = useState<PortfolioDetail | null>(null)
  const [history, setHistory] = useState<PortfolioHistoryPoint[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // ===== 추가: 자산 변동 히스토리 공유 버튼 - 클릭까지만 구현, 실제 이동 로직은 커뮤니티 담당 팀원이 연결 예정 =====
  const handleShareHistory = (transactionId: number | null) => {
    // TODO: 커뮤니티 담당 팀원이 이어서 구현 - /community/write?transactionId=... 로 이동해 인증글 작성
    console.log('공유 버튼 클릭 - transactionId:', transactionId)
  }
  // ===== 추가 끝 =====

  useEffect(() => {
    if (authChecked && !me) {
      window.location.replace('/login?next=/portfolio')
    }
  }, [authChecked, me])

  useEffect(() => {
    if (!me) return

    let cancelled = false

    setDetail(null)
    setHistory([])
    setErrorMessage(null)

    api
      .get<PortfolioDetail>(`/api/portfolios/${roomParticipantId}`)
      .then((data) => {
        if (cancelled) return

        setDetail(data)
        setErrorMessage(null)
      })
      .catch((err) => {
        if (cancelled) return

        setErrorMessage(
          err instanceof ApiError ? err.message : '포트폴리오를 불러오지 못했습니다.',
        )
      })

    api
      .get<PortfolioHistoryPoint[]>(`/api/portfolios/${roomParticipantId}/history`)
      .then((data) => {
        if (!cancelled) {
          setHistory(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHistory([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [me, roomParticipantId])

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="rooms-main">
        <a href="/portfolio" className="btn btn-text portfolio-back-link">
          ← 내 포트폴리오
        </a>

        {errorMessage && <p className="alert-error">{errorMessage}</p>}

        {/* ===== 추가: 로딩 중 안내 ===== */}
        {!detail && !errorMessage && (
          <div className="portfolio-loading">
            <p>포트폴리오를 불러오는 중...</p>
            <div className="portfolio-spinner" />
          </div>
        )}
        {/* ===== 추가 끝 ===== */}

        {detail && (
          <>
            <div className="card room-detail-card">
              <div className="room-detail-header">
                <h1>
                  <a href={`/rooms/${detail.roomId}`} className="portfolio-room-name-link">
                    {detail.roomName}
                  </a>
                </h1>
                <span className={statusBadgeClass(detail.roomStatus)}>{statusLabel(detail.roomStatus)}</span>
              </div>

              {detail.roomStatus !== 'ongoing' ? (
                <a href={`/rooms/${detail.roomId}`} className="btn btn-text">
                  이 방 최종 순위 보기 →
                </a>
              ) : (
                <div className="room-detail-actions">
                  <a href={`/stocks?roomParticipantId=${roomParticipantId}`} className="btn btn-primary">
                    이 방에서 거래하기
                  </a>
                </div>
              )}

              {/* ===== 변경: 수익률 게이지 → 종목 구성(매입/평가) 도넛 차트, 가운데엔 여전히 수익률 표시 ===== */}
              <div className="portfolio-detail-gauge-wrap">
                <PortfolioCompositionChart holdings={detail.holdings} balance={detail.balance} profitRate={detail.profitRate} />
              </div>
              {/* ===== 변경 끝 ===== */}

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
                          <td>
                            {/* ===== 변경: 종목명 클릭 시 해당 방 계좌로 매수/매도 화면 이동 ===== */}
                            <a href={`/stocks/${h.stockCode}?roomParticipantId=${roomParticipantId}`} className="portfolio-holding-link">
                              {h.stockName}
                            </a>
                            {/* ===== 변경 끝 ===== */}
                          </td>
                          <td>{h.quantity.toLocaleString('ko-KR')}주</td>
                          <td>{formatMoney(h.avgPurchasePrice)}</td>
                          <td>{formatMoney(h.currentPrice)}</td>
                          <td>{formatMoney(h.evaluationAmount)}</td>
                          <td className={h.profitAmount > 0 ? 'text-rise' : h.profitAmount < 0 ? 'text-fall' : ''}>
                            {/* ===== 변경: 수익률 옆 괄호로 수익금 같이 표시 ===== */}
                            {formatPercent(h.profitRate)} ({formatMoney(h.profitAmount)})
                            {/* ===== 변경 끝 ===== */}
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
                        {/* ===== 변경: 매수 상세/매도 손익 컬럼 + 공유 버튼 컬럼 추가, "총자산" → "평가 자산"으로 표기 수정 ===== */}
                        <th>내용</th>
                        <th>손익</th>
                        <th>평가 자산</th>
                        <th></th>
                        {/* ===== 변경 끝 ===== */}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h, index) => (
                        <tr key={`${h.recordedAt}-${index}`}>
                          <td>{formatDate(h.recordedAt)}</td>
                          {/* ===== 추가: 매수는 종목/가격/수량, 매도는 종목/수량만 표시 (손익은 옆 컬럼에) ===== */}
                          <td>
                            {h.tradeType === 'BUY' &&
                              `${h.stockName} ${formatMoney(h.price ?? 0)} · ${h.quantity?.toLocaleString('ko-KR')}주 매수`}
                            {h.tradeType === 'SELL' && `${h.stockName} ${h.quantity?.toLocaleString('ko-KR')}주 매도`}
                            {!h.tradeType && '-'}
                          </td>
                          <td className={h.tradeType === 'SELL' && h.profitAmount != null ? profitTextClass(h.profitAmount) : ''}>
                            {h.tradeType === 'SELL' && h.profitAmount != null && h.profitRate != null
                              ? `${formatPercent(h.profitRate)} (${formatMoney(h.profitAmount)})`
                              : '-'}
                          </td>
                          <td>{formatMoney(h.totalAssetValue)}</td>
                          <td>
                            {/* ===== 변경: 우선 클릭 가능하도록 disabled 제거 - 실제 연결은 커뮤니티 담당 팀원이 진행 ===== */}
                            <button
                              type="button"
                              className="btn btn-text"
                              onClick={() => handleShareHistory(h.transactionId)}
                            >
                              공유
                            </button>
                            {/* ===== 변경 끝 ===== */}
                          </td>
                          {/* ===== 추가 끝 ===== */}
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
