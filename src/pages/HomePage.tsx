import { useEffect, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Navbar from '../components/Navbar'
import { api } from '../lib/apiClient'
import { usePriceStream, type PricePoint } from '../lib/priceSocket'
import { useAuth } from '../lib/useAuth'
import type { FavoriteStock } from '../lib/types'
import './HomePage.css'

const DEFAULT_STOCK_CODE = '005930'
const DEFAULT_STOCK_NAME = '삼성전자'

const UP_COLOR = '#ff4d4f'
const DOWN_COLOR = '#1677ff'
const NEUTRAL_COLOR = '#00000073'

type PriceTooltipProps = {
  active?: boolean
  payload?: Array<{ payload: PricePoint }>
}

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
  const [stockCode, setStockCode] = useState(DEFAULT_STOCK_CODE)
  const [stockName, setStockName] = useState(DEFAULT_STOCK_NAME)

  useEffect(() => {
    if (!authChecked || !me) return
    api
      .get<FavoriteStock[]>('/api/member/favorite-stocks')
      .then((favorites) => {
        if (favorites.length > 0) {
          setStockCode(favorites[0].stockCode)
          setStockName(favorites[0].stockName)
        }
      })
      .catch(() => {})
  }, [authChecked, me])

  const { points, latestPrice, snapshot } = usePriceStream(stockCode)

  const changeAmount = snapshot ? Number(snapshot.prdy_vrss) : null
  const changeRate = snapshot ? Number(snapshot.prdy_ctrt) : null
  const isUp = snapshot?.prdy_vrss_sign === '1' || snapshot?.prdy_vrss_sign === '2'
  const isDown = snapshot?.prdy_vrss_sign === '4' || snapshot?.prdy_vrss_sign === '5'
  const trendColor = isUp ? UP_COLOR : isDown ? DOWN_COLOR : NEUTRAL_COLOR

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="home-main">
        <div className="home-grid">
          <section className="card chart-panel">
            <h2>실시간 시세</h2>

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
              <div className="chart-container">
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
                        <PriceTooltip active={props.active} payload={props.payload as unknown as PriceTooltipProps['payload']} />
                      )}
                    />
                    <Area
                      type="natural"
                      dataKey="price"
                      stroke={trendColor}
                      strokeWidth={2}
                      fill="url(#priceFill)"
                      dot={false}
                      activeDot={{ r: 4, stroke: trendColor, strokeWidth: 2, fill: 'var(--color-bg-container)' }}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="chart-placeholder">시세 불러오는 중...</div>
            )}
          </section>

          <aside className="card ranking-panel">
            <h2>랭킹</h2>
            <p className="ranking-empty">랭킹 데이터가 아직 없습니다.</p>
          </aside>
        </div>
      </main>
    </>
  )
}

export default HomePage
