import { useEffect, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Navbar from '../components/Navbar'
import { api } from '../lib/apiClient'
import { usePriceStream } from '../lib/priceSocket'
import { useAuth } from '../lib/useAuth'
import type { FavoriteStock } from '../lib/types'
import './HomePage.css'

const DEFAULT_STOCK_CODE = '005930'
const DEFAULT_STOCK_NAME = '삼성전자'

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
                  {changeAmount !== null && changeRate !== null && (
                    <span className={`price-change ${isUp ? 'price-up' : isDown ? 'price-down' : ''}`}>
                      {isUp ? '▲' : isDown ? '▼' : ''} {Math.abs(changeAmount).toLocaleString('ko-KR')} (
                      {changeRate > 0 ? '+' : ''}
                      {changeRate}%)
                    </span>
                  )}
                </>
              )}
            </div>

            {points.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={points}>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString('ko-KR')}원`, '가격']} />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#d92b2b"
                      dot={false}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </LineChart>
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
