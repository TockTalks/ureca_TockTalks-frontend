import { useEffect, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Navbar from '../components/Navbar'
import { api } from '../lib/apiClient'
import { formatMoney, formatPercent } from '../lib/format'
import { usePriceStream, type PricePoint } from '../lib/priceSocket'
import type {
  FavoriteStock,
  PortfolioDetail,
  PortfolioHolding,
  PortfolioSummary,
} from '../lib/types'
import { useAuth } from '../lib/useAuth'
import './HomePage.css'

type FeaturedStock = {
  stockCode: string
  stockName: string
}

type PriceTooltipProps = {
  active?: boolean
  payload?: Array<{ payload: PricePoint }>
}

type HomeHolding = PortfolioHolding & {
  roomName: string
  roomParticipantId: number
}

type PortfolioOverview = {
  totalAssetValue: number
  totalProfitAmount: number
  totalHoldingCount: number
  topHoldings: HomeHolding[]
}

const DEFAULT_FEATURED_STOCKS: FeaturedStock[] = [
  { stockCode: '005930', stockName: '삼성전자' },
  { stockCode: '000660', stockName: 'SK하이닉스' },
]

const QUICK_LINKS = [
  {
    href: '/stocks',
    title: '종목',
    description: '전체 종목을 검색하고 실시간 시세를 확인합니다.',
  },
  {
    href: '/portfolio',
    title: '포트폴리오',
    description: '내 자산과 보유 종목 현황을 확인합니다.',
  },
  {
    href: '/community',
    title: '커뮤니티',
    description: '다른 투자자들과 투자 정보를 공유합니다.',
  },
  {
    href: '/rooms',
    title: '방 목록',
    description: '모의투자 대결방을 찾거나 새로운 방에 참가합니다.',
  },
]

const UP_COLOR = '#ff4d4f'
const DOWN_COLOR = '#1677ff'
const NEUTRAL_COLOR = '#00000073'

function PriceTooltip({ active, payload }: PriceTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const point = payload[0].payload

  return (
    <div className="price-tooltip">
      <span className="price-tooltip-time">{point.time}</span>
      <span className="price-tooltip-value">{point.price.toLocaleString('ko-KR')}원</span>
    </div>
  )
}

function HomePage() {
  const { me, authChecked, logout } = useAuth()
  const [featuredStocks, setFeaturedStocks] = useState<FeaturedStock[]>(DEFAULT_FEATURED_STOCKS)
  const [stockCode, setStockCode] = useState(DEFAULT_FEATURED_STOCKS[0].stockCode)
  const [stockName, setStockName] = useState(DEFAULT_FEATURED_STOCKS[0].stockName)
  const [portfolioOverview, setPortfolioOverview] = useState<PortfolioOverview | null>(null)
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioError, setPortfolioError] = useState(false)

  useEffect(() => {
    if (!authChecked || !me) return

    api
      .get<FavoriteStock[]>('/api/member/favorite-stocks')
      .then((favorites) => {
        if (favorites.length === 0) return

        const favoriteStocks = favorites.map((favorite) => ({
          stockCode: favorite.stockCode,
          stockName: favorite.stockName,
        }))

        const mergedStocks = [...favoriteStocks, ...DEFAULT_FEATURED_STOCKS].filter(
          (stock, index, stocks) =>
            stocks.findIndex((candidate) => candidate.stockCode === stock.stockCode) === index,
        )

        setFeaturedStocks(mergedStocks.slice(0, 5))
        setStockCode(favoriteStocks[0].stockCode)
        setStockName(favoriteStocks[0].stockName)
      })
      .catch(() => {
        // 관심 종목 조회 실패 시 기본 대표 종목을 그대로 사용합니다.
      })
  }, [authChecked, me])

  useEffect(() => {
    if (!authChecked || !me) {
      setPortfolioOverview(null)
      setPortfolioLoading(false)
      setPortfolioError(false)
      return
    }

    let cancelled = false
    setPortfolioLoading(true)
    setPortfolioError(false)

    api
      .get<PortfolioSummary[]>('/api/portfolios')
      .then(async (portfolios) => {
        const detailResults = await Promise.allSettled(
          portfolios
            .filter((portfolio) => portfolio.holdingCount > 0)
            .map((portfolio) =>
              api.get<PortfolioDetail>(`/api/portfolios/${portfolio.roomParticipantId}`),
            ),
        )

        if (cancelled) return

        const holdings = detailResults.flatMap((result) => {
          if (result.status !== 'fulfilled') return []

          return result.value.holdings.map((holding) => ({
            ...holding,
            roomName: result.value.roomName,
            roomParticipantId: result.value.roomParticipantId,
          }))
        })

        setPortfolioOverview({
          totalAssetValue: portfolios.reduce(
            (total, portfolio) => total + portfolio.totalAssetValue,
            0,
          ),
          totalProfitAmount: portfolios.reduce(
            (total, portfolio) => total + portfolio.profitAmount,
            0,
          ),
          totalHoldingCount: portfolios.reduce(
            (total, portfolio) => total + portfolio.holdingCount,
            0,
          ),
          topHoldings: holdings
            .sort((left, right) => right.evaluationAmount - left.evaluationAmount)
            .slice(0, 3),
        })
      })
      .catch(() => {
        if (!cancelled) {
          setPortfolioOverview(null)
          setPortfolioError(true)
        }
      })
      .finally(() => {
        if (!cancelled) setPortfolioLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [authChecked, me])

  const { points, latestPrice, snapshot } = usePriceStream(stockCode)

  const changeAmount = snapshot ? Number(snapshot.prdy_vrss) : null
  const changeRate = snapshot ? Number(snapshot.prdy_ctrt) : null
  const isUp = snapshot?.prdy_vrss_sign === '1' || snapshot?.prdy_vrss_sign === '2'
  const isDown = snapshot?.prdy_vrss_sign === '4' || snapshot?.prdy_vrss_sign === '5'
  const trendColor = isUp ? UP_COLOR : isDown ? DOWN_COLOR : NEUTRAL_COLOR

  const handleStockChange = (stock: FeaturedStock) => {
    setStockCode(stock.stockCode)
    setStockName(stock.stockName)
  }

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="home-main">
        <section className="home-hero">
          <div className="card market-panel">
            <div className="section-title-row">
              <div>
                <span className="section-eyebrow">실시간 시장</span>
                <h1 className="home-section-title">주요 종목 시세</h1>
              </div>

              <a href="/stocks" className="section-more-link">
                전체 종목 보기
              </a>
            </div>

            <div className="stock-switcher" aria-label="대표 종목 선택">
              {featuredStocks.map((stock) => {
                const selected = stock.stockCode === stockCode

                return (
                  <button
                    key={stock.stockCode}
                    type="button"
                    className={`stock-chip ${selected ? 'stock-chip-active' : ''}`}
                    aria-pressed={selected}
                    onClick={() => handleStockChange(stock)}
                  >
                    {stock.stockName}
                  </button>
                )
              })}
            </div>

            <div className="price-header">
              <span className="price-stock-name">{stockName}</span>

              {latestPrice !== null && (
                <>
                  <span className="price-current">{latestPrice.toLocaleString('ko-KR')}원</span>

                  {changeAmount !== null && changeRate !== null && (isUp || isDown) && (
                    <span className={`price-change-badge ${isUp ? 'price-up' : 'price-down'}`}>
                      {isUp ? '▲' : '▼'} {Math.abs(changeAmount).toLocaleString('ko-KR')}
                      <span className="price-change-rate">
                        ({changeRate > 0 ? '+' : ''}
                        {changeRate}%)
                      </span>
                    </span>
                  )}
                </>
              )}
            </div>

            {points.length > 0 ? (
              <div className="chart-container" aria-label={`${stockName} 실시간 가격 그래프`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={trendColor} stopOpacity={0.22} />
                        <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip
                      content={(props) => (
                        <PriceTooltip
                          active={props.active}
                          payload={props.payload as unknown as PriceTooltipProps['payload']}
                        />
                      )}
                    />
                    <Area
                      type="natural"
                      dataKey="price"
                      stroke={trendColor}
                      strokeWidth={2}
                      fill="url(#priceFill)"
                      dot={false}
                      activeDot={{
                        r: 4,
                        stroke: trendColor,
                        strokeWidth: 2,
                        fill: 'var(--color-bg-container)',
                      }}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="chart-placeholder">실시간 시세를 불러오는 중입니다.</div>
            )}
          </div>

          <aside className="card investment-panel">
            <div>
              <span className="section-eyebrow">MY ASSET</span>
              <h2>내 투자 현황</h2>
            </div>

            {!authChecked && <div className="investment-message">사용자 정보를 확인하고 있습니다.</div>}

            {authChecked && me && (
              <>
                <div className="investment-user">
                  <strong>{me.nickname}</strong>님의 포트폴리오
                </div>

                {portfolioLoading && (
                  <div className="investment-message" role="status">
                    자산 정보를 불러오는 중입니다.
                  </div>
                )}

                {!portfolioLoading && portfolioError && (
                  <div className="investment-message">
                    포트폴리오 정보를 불러오지 못했습니다.
                  </div>
                )}

                {!portfolioLoading && !portfolioError && portfolioOverview && (
                  <div className="investment-preview">
                    <div className="investment-total">
                      <span>총자산</span>
                      <strong>{formatMoney(portfolioOverview.totalAssetValue)}</strong>
                      <small
                        className={
                          portfolioOverview.totalProfitAmount > 0
                            ? 'investment-profit-rise'
                            : portfolioOverview.totalProfitAmount < 0
                              ? 'investment-profit-fall'
                              : ''
                        }
                      >
                        총 수익 {formatMoney(portfolioOverview.totalProfitAmount)}
                      </small>
                    </div>

                    <div className="investment-holdings-heading">
                      <strong>보유 종목 TOP 3</strong>
                      <span>{portfolioOverview.totalHoldingCount.toLocaleString('ko-KR')}개</span>
                    </div>

                    {portfolioOverview.topHoldings.length > 0 ? (
                      <ul className="investment-holdings">
                        {portfolioOverview.topHoldings.map((holding) => (
                          <li key={`${holding.roomParticipantId}-${holding.stockCode}`}>
                            <a
                              href={`/stocks/${holding.stockCode}?roomParticipantId=${holding.roomParticipantId}`}
                            >
                              <span className="investment-holding-name">
                                <strong>{holding.stockName}</strong>
                                <small>{holding.roomName}</small>
                              </span>
                              <span className="investment-holding-value">
                                <strong>{formatMoney(holding.evaluationAmount)}</strong>
                                <small
                                  className={
                                    holding.profitAmount > 0
                                      ? 'investment-profit-rise'
                                      : holding.profitAmount < 0
                                        ? 'investment-profit-fall'
                                        : ''
                                  }
                                >
                                  {formatPercent(holding.profitRate)}
                                </small>
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="investment-empty">아직 보유한 종목이 없습니다.</div>
                    )}
                  </div>
                )}

                <a href="/portfolio" className="btn btn-primary btn-block investment-button">
                  포트폴리오 보기
                </a>
              </>
            )}

            {authChecked && !me && (
              <>
                <div className="investment-message">
                  로그인하면 내 자산과 보유 종목을 확인할 수 있습니다.
                </div>
                <a href="/login" className="btn btn-primary btn-block investment-button">
                  로그인
                </a>
              </>
            )}
          </aside>
        </section>

        <section className="home-section">
          <div className="section-title-row">
            <div>
              <span className="section-eyebrow">바로가기</span>
              <h2 className="home-section-title">톡톡스 둘러보기</h2>
            </div>
          </div>

          <div className="quick-link-grid">
            {QUICK_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="card quick-link-card">
                <span className="quick-link-title">
                  {link.title}
                  <span aria-hidden="true">→</span>
                </span>
                <span className="quick-link-description">{link.description}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="card ranking-preview">
          <div className="ranking-preview-content">
            <div>
              <span className="section-eyebrow">RANKING</span>
              <h2>투자 대결 랭킹</h2>
              <p>투자방에 참가하고 다른 투자자들과 수익률을 겨뤄보세요.</p>
            </div>

            <a href="/rooms" className="btn btn-default">
              방 목록에서 확인
            </a>
          </div>
        </section>
      </main>
    </>
  )
}

export default HomePage
