import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Navbar from '../components/Navbar'
import { api, ApiError } from '../lib/apiClient'
import { formatMoney, formatPercent } from '../lib/format'
import { usePriceStream, type PricePoint } from '../lib/priceSocket'
import type {
  PortfolioSummary,
  Room,
  StockInfo,
  TradeExecution,
  TradeHolding,
  TradeType,
} from '../lib/types'
import { useAuth } from '../lib/useAuth'
import './StockDetailPage.css'

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

function StockDetailPage({ stockCode }: { stockCode: string }) {
  const { me, authChecked, logout } = useAuth()
  const [stockName, setStockName] = useState('종목 정보')
  const [orderType, setOrderType] = useState<TradeType>('BUY')
  const [quantity, setQuantity] = useState('')
  const [holding, setHolding] = useState<TradeHolding | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [execution, setExecution] = useState<TradeExecution | null>(null)
  const [participantLoading, setParticipantLoading] = useState(false)
  const [participantError, setParticipantError] = useState<string | null>(null)

  const requestedRoomParticipantId = useMemo(() => {
    const rawValue = new URLSearchParams(window.location.search).get('roomParticipantId')
    if (!rawValue) return null

    const parsedValue = Number(rawValue)
    return Number.isSafeInteger(parsedValue) && parsedValue > 0 ? parsedValue : null
  }, [])
  const [roomParticipantId, setRoomParticipantId] = useState(requestedRoomParticipantId)

  useEffect(() => {
    if (!me || roomParticipantId) return

    let cancelled = false
    setParticipantLoading(true)
    setParticipantError(null)

    Promise.all([
      api.get<Room>('/api/rooms/default'),
      api.get<PortfolioSummary[]>('/api/portfolios'),
    ])
      .then(([defaultRoom, portfolios]) => {
        if (cancelled) return

        const defaultPortfolio = portfolios.find(
          (portfolio) => portfolio.roomId === defaultRoom.id,
        )

        if (!defaultPortfolio) {
          setParticipantError('기본 투자 계좌를 찾을 수 없습니다.')
          return
        }

        setRoomParticipantId(defaultPortfolio.roomParticipantId)
      })
      .catch((error) => {
        if (cancelled) return

        setParticipantError(
          error instanceof ApiError
            ? error.message
            : '기본 투자 계좌를 불러오지 못했습니다.',
        )
      })
      .finally(() => {
        if (!cancelled) {
          setParticipantLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [me, roomParticipantId])

  useEffect(() => {
    api
      .get<StockInfo[]>('/api/price/stocks')
      .then((stocks) => {
        const selectedStock = stocks.find((stock) => stock.stockCode === stockCode)
        setStockName(selectedStock?.stockName ?? '알 수 없는 종목')
      })
      .catch(() => setStockName('종목 정보를 불러오지 못했습니다.'))
  }, [stockCode])

  const loadHolding = () => {
    if (!me || !roomParticipantId) {
      setHolding(null)
      return
    }

    api
      .get<TradeHolding[]>(`/api/trades/holdings?roomParticipantId=${roomParticipantId}`)
      .then((holdings) => {
        setHolding(holdings.find((item) => item.stockCode === stockCode) ?? null)
      })
      .catch(() => setHolding(null))
  }

  useEffect(loadHolding, [me, roomParticipantId, stockCode])

  const { points, latestPrice, snapshot } = usePriceStream(stockCode)

  const changeAmount = snapshot ? Number(snapshot.prdy_vrss) : null
  const changeRate = snapshot ? Number(snapshot.prdy_ctrt) : null
  const isUp = snapshot?.prdy_vrss_sign === '1' || snapshot?.prdy_vrss_sign === '2'
  const isDown = snapshot?.prdy_vrss_sign === '4' || snapshot?.prdy_vrss_sign === '5'
  const trendColor = isUp ? UP_COLOR : isDown ? DOWN_COLOR : NEUTRAL_COLOR

  const parsedQuantity = Number(quantity)
  const isValidQuantity = Number.isSafeInteger(parsedQuantity) && parsedQuantity > 0
  const estimatedAmount = latestPrice !== null && isValidQuantity ? latestPrice * parsedQuantity : 0

  const handleOrderTypeChange = (nextType: TradeType) => {
    setOrderType(nextType)
    setQuantity('')
    setErrorMessage(null)
    setExecution(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage(null)
    setExecution(null)

    if (!me) {
      setErrorMessage('로그인 후 주문할 수 있습니다.')
      return
    }

    if (!roomParticipantId) {
      setErrorMessage(
        participantError ?? '기본 투자 계좌를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.',
      )
      return
    }

    if (!isValidQuantity) {
      setErrorMessage('수량은 1 이상의 정수로 입력해 주세요.')
      return
    }

    if (orderType === 'SELL' && (!holding || parsedQuantity > holding.quantity)) {
      setErrorMessage('보유 수량 안에서 매도 수량을 입력해 주세요.')
      return
    }

    setSubmitting(true)

    try {
      const result = await api.post<TradeExecution>(
        `/api/trades/${orderType === 'BUY' ? 'buy' : 'sell'}?roomParticipantId=${roomParticipantId}`,
        {
          stockCode,
          quantity: parsedQuantity,
        },
      )

      setExecution(result)
      setQuantity('')
      loadHolding()
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '주문 처리에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="stock-detail-main">
        <a href="/stocks" className="stock-detail-back">
          ← 전체 종목
        </a>

        <div className="stock-detail-grid">
          <section className="card stock-chart-panel">
            <div className="stock-detail-heading">
              <div>
                <span className="section-eyebrow">실시간 시세</span>
                <h1>{stockName}</h1>
              </div>

              {latestPrice !== null && (
                <div className="stock-detail-price-wrap">
                  <strong>{latestPrice.toLocaleString('ko-KR')}원</strong>

                  {changeAmount !== null && changeRate !== null && (isUp || isDown) && (
                    <span className={isUp ? 'stock-price-up' : 'stock-price-down'}>
                      {isUp ? '▲' : '▼'} {Math.abs(changeAmount).toLocaleString('ko-KR')}원
                      {' '}({changeRate > 0 ? '+' : ''}{changeRate}%)
                    </span>
                  )}
                </div>
              )}
            </div>

            {points.length > 0 ? (
              <div className="stock-detail-chart" aria-label={`${stockName} 실시간 가격 그래프`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={points} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="stockDetailPriceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={trendColor} stopOpacity={0.24} />
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
                      fill="url(#stockDetailPriceFill)"
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
              <div className="stock-detail-chart-placeholder">실시간 시세를 불러오는 중입니다.</div>
            )}
          </section>

          <aside className="card order-panel">
            <div className="order-tabs" role="tablist" aria-label="주문 종류">
              <button
                type="button"
                role="tab"
                aria-selected={orderType === 'BUY'}
                className={`order-tab ${orderType === 'BUY' ? 'order-tab-buy-active' : ''}`}
                onClick={() => handleOrderTypeChange('BUY')}
              >
                매수
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={orderType === 'SELL'}
                className={`order-tab ${orderType === 'SELL' ? 'order-tab-sell-active' : ''}`}
                onClick={() => handleOrderTypeChange('SELL')}
              >
                매도
              </button>
            </div>

            <form className="order-form" onSubmit={handleSubmit}>
              <div className="order-info-list">
                <div className="order-info-row">
                  <span>현재가</span>
                  <strong>{latestPrice === null ? '-' : formatMoney(latestPrice)}</strong>
                </div>

                {orderType === 'SELL' && (
                  <>
                    <div className="order-info-row">
                      <span>보유 수량</span>
                      <strong>{holding ? `${holding.quantity.toLocaleString('ko-KR')}주` : '0주'}</strong>
                    </div>
                    <div className="order-info-row">
                      <span>평균 매입가</span>
                      <strong>{holding ? formatMoney(holding.avgPrice) : '-'}</strong>
                    </div>
                    <div className="order-info-row">
                      <span>수익률</span>
                      <strong>{holding ? formatPercent(holding.profitRate) : '-'}</strong>
                    </div>
                  </>
                )}
              </div>

              <label className="field">
                <span className="field-label">{orderType === 'BUY' ? '매수' : '매도'} 수량</span>
                <div className="order-quantity-wrap">
                  <input
                    type="number"
                    className="input order-quantity-input"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    placeholder="수량 입력"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                  <span>주</span>
                </div>
              </label>

              <div className="order-estimate">
                <span>예상 주문 금액</span>
                <strong>{formatMoney(estimatedAmount)}</strong>
              </div>

              {me && participantLoading && (
                <p className="order-guide">기본 투자 계좌를 준비하는 중입니다.</p>
              )}

              {me && participantError && !participantLoading && (
                <p className="alert-error">{participantError}</p>
              )}

              {!me && authChecked && (
                <p className="order-guide">로그인하면 기본 투자 계좌로 바로 주문할 수 있습니다.</p>
              )}

              {errorMessage && <p className="alert-error">{errorMessage}</p>}

              {execution && (
                <div className="order-success" role="status">
                  <strong>{execution.type === 'BUY' ? '매수' : '매도'} 주문이 체결됐습니다.</strong>
                  <span>
                    {execution.quantity.toLocaleString('ko-KR')}주 · {formatMoney(execution.price)}
                  </span>
                </div>
              )}

              <button
                type="submit"
                className={`btn btn-block order-submit ${
                  orderType === 'BUY' ? 'order-submit-buy' : 'order-submit-sell'
                }`}
                disabled={submitting || !authChecked || (!!me && !roomParticipantId)}
              >
                {submitting
                  ? '주문 처리 중…'
                  : orderType === 'BUY'
                    ? '매수하기'
                    : '매도하기'}
              </button>
            </form>
          </aside>
        </div>
      </main>
    </>
  )
}

export default StockDetailPage
