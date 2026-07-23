import { useEffect, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import PortfolioCompositionChart from '../components/PortfolioCompositionChart' // ===== 변경: 상단 요약 게이지 → 기본방 구성 도넛 차트 =====
import ProfitRateGauge from '../components/ProfitRateGauge'
import { api, ApiError } from '../lib/apiClient'
import { useAuth } from '../lib/useAuth'
import type { PortfolioDetail, PortfolioSummary } from '../lib/types'
import { formatMoney, formatPercent, profitBadgeClass, statusBadgeClass, statusLabel } from '../lib/format'
import './PortfolioPage.css'

function PortfolioPage() {
  const { me, authChecked, logout } = useAuth()
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([])
  const [defaultDetail, setDefaultDetail] = useState<PortfolioDetail | null>(null) // ===== 추가 =====
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

  // ===== 추가: 기본방(로비) 상세를 별도로 조회해서 상단에 종목 구성 도넛 차트를 그림 =====
  const defaultPortfolio = portfolios.find((p) => p.isDefault) ?? null

  useEffect(() => {
    if (!defaultPortfolio) return

    let cancelled = false

    api
      .get<PortfolioDetail>(`/api/portfolios/${defaultPortfolio.roomParticipantId}`)
      .then((data) => {
        if (!cancelled) setDefaultDetail(data)
      })
      .catch(() => {
        if (!cancelled) setDefaultDetail(null)
      })

    return () => {
      cancelled = true
    }
  }, [defaultPortfolio?.roomParticipantId])
  // ===== 추가 끝 =====

  // ===== 변경: 기본방 제외 - 참여중인 방 / 종료된 배틀 두 섹션으로 분리 =====
  const activePortfolios = portfolios.filter((p) => !p.isDefault && p.roomStatus !== 'closed')
  const endedPortfolios = portfolios.filter((p) => !p.isDefault && p.roomStatus === 'closed')
  // ===== 변경 끝 =====

  // ===== 추가: 카드에 마우스 올리면 상세 API 미리 호출 (백엔드 Redis 시세 캐시 워밍업) =====
  const prefetchedRef = useRef<Set<number>>(new Set())

  const prefetchDetail = (roomParticipantId: number) => {
    if (prefetchedRef.current.has(roomParticipantId)) return
    prefetchedRef.current.add(roomParticipantId)
    api.get(`/api/portfolios/${roomParticipantId}`).catch(() => {})
  }
  // ===== 추가 끝 =====

  const renderPortfolioCard = (p: PortfolioSummary) => (
    <a
      key={p.roomParticipantId}
      href={`/portfolio/${p.roomParticipantId}`}
      className="card room-card"
      onMouseEnter={() => prefetchDetail(p.roomParticipantId)} // ===== 추가 =====
    >
      <div className="room-card-header">
        <h3>{p.roomName}</h3>
        <span className={statusBadgeClass(p.roomStatus)}>{statusLabel(p.roomStatus)}</span>
      </div>
      <div className="room-card-meta">
        <span>평가자산 {formatMoney(p.totalAssetValue)}</span>
        <span>보유 종목 {p.holdingCount}개</span>
      </div>
      <div className="portfolio-card-profit">
        <ProfitRateGauge rate={p.profitRate} size={48} />
        <span className={profitBadgeClass(p.profitAmount)}>{formatPercent(p.profitRate)}</span>
        <span className={`profit-amount ${p.profitAmount > 0 ? 'text-rise' : p.profitAmount < 0 ? 'text-fall' : ''}`}>
          {formatMoney(p.profitAmount)}
        </span>
      </div>
    </a>
  )

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="rooms-main">
        <h2>내 포트폴리오</h2>

        {errorMessage && <p className="alert-error">{errorMessage}</p>}

        {/* ===== 추가: 로딩 중 안내 ===== */}
        {!loaded && !errorMessage && (
          <div className="portfolio-loading">
            <p>포트폴리오를 불러오는 중...</p>
            <div className="portfolio-spinner" />
          </div>
        )}
        {/* ===== 추가 끝 ===== */}

        {/* ===== 변경: 총합 요약바 → 기본방(로비) 포트폴리오 상세 카드 ===== */}
        {loaded && !errorMessage && defaultDetail && defaultPortfolio && (
          <a href={`/portfolio/${defaultPortfolio.roomParticipantId}`} className="card room-detail-card portfolio-lobby-card">
            <div className="room-detail-header">
              <h1>{defaultDetail.roomName}</h1>
              <span className={statusBadgeClass(defaultDetail.roomStatus)}>{statusLabel(defaultDetail.roomStatus)}</span>
            </div>

            <div className="portfolio-detail-gauge-wrap">
              <PortfolioCompositionChart
                holdings={defaultDetail.holdings}
                balance={defaultDetail.balance}
                profitRate={defaultDetail.profitRate}
              />
            </div>

            <div className="room-detail-meta">
              <div className="room-detail-meta-item">
                <div className="label">평가자산</div>
                <div className="value">{formatMoney(defaultDetail.totalAssetValue)}</div>
              </div>
              <div className="room-detail-meta-item">
                <div className="label">현금 잔고</div>
                <div className="value">{formatMoney(defaultDetail.balance)}</div>
              </div>
              <div className="room-detail-meta-item">
                <div className="label">주식 평가금액</div>
                <div className="value">{formatMoney(defaultDetail.stockValuation)}</div>
              </div>
              <div className="room-detail-meta-item">
                <div className="label">시드머니</div>
                <div className="value">{formatMoney(defaultDetail.initialSeedMoney)}</div>
              </div>
              <div className="room-detail-meta-item">
                <div className="label">수익률</div>
                <div className="value">
                  <span className={profitBadgeClass(defaultDetail.profitAmount)}>{formatPercent(defaultDetail.profitRate)}</span>
                </div>
              </div>
              <div className="room-detail-meta-item">
                <div className="label">수익금</div>
                <div className={`value ${defaultDetail.profitAmount > 0 ? 'text-rise' : defaultDetail.profitAmount < 0 ? 'text-fall' : ''}`}>
                  {formatMoney(defaultDetail.profitAmount)}
                </div>
              </div>
            </div>
          </a>
        )}
        {/* ===== 변경 끝 ===== */}

        {loaded && !errorMessage && portfolios.length === 0 && (
          <p className="rooms-empty">
            참가중인 방이 없습니다. <a href="/rooms">방 목록</a>에서 방에 참가해보세요.
          </p>
        )}

        {/* ===== 변경: 참여중인 방 / 종료된 배틀 섹션 - 내용 없어도 항상 표시하고 빈 문구 안내 ===== */}
        {loaded && !errorMessage && portfolios.length > 0 && (
          <>
            <section className="rooms-section">
              <div className="rooms-section-header">
                <h2>참여중인 방</h2>
              </div>
              {activePortfolios.length === 0 ? (
                <p className="rooms-empty">참여중인 방이 없습니다.</p>
              ) : (
                <div className="room-list">{activePortfolios.map(renderPortfolioCard)}</div>
              )}
            </section>

            <section className="rooms-section">
              <div className="rooms-section-header">
                <h2>종료된 배틀</h2>
              </div>
              {endedPortfolios.length === 0 ? (
                <p className="rooms-empty">종료된 배틀이 없습니다.</p>
              ) : (
                <div className="room-list">{endedPortfolios.map(renderPortfolioCard)}</div>
              )}
            </section>
          </>
        )}
        {/* ===== 변경 끝 ===== */}
      </main>
    </>
  )
}

export default PortfolioPage
