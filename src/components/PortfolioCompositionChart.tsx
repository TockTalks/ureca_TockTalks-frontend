import './PortfolioCompositionChart.css'
import type { PortfolioHolding } from '../lib/types'
import { formatMoney, formatPercent } from '../lib/format'

// 검증된 카테고리컬 팔레트(고정 순서) — validate_palette.js 통과, 색맹 대비 확보
const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']
const CASH_COLOR = '#c3c2b7'
const GAP_DEG = 2

type Segment = {
  key: string
  label: string
  value: number
  purchaseAmount: number | null
  color: string
}

type PortfolioCompositionChartProps = {
  holdings: PortfolioHolding[]
  balance: number
  profitRate: number
  size?: number
}

function PortfolioCompositionChart({ holdings, balance, profitRate, size = 160 }: PortfolioCompositionChartProps) {
  const strokeWidth = size * 0.16
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const stockSegments: Segment[] = holdings
    .filter((h) => h.evaluationAmount > 0)
    .map((h, i) => ({
      key: h.stockCode,
      label: h.stockName,
      value: h.evaluationAmount,
      purchaseAmount: h.avgPurchasePrice * h.quantity,
      color: SERIES_COLORS[i % SERIES_COLORS.length],
    }))

  const segments: Segment[] =
    balance > 0 ? [...stockSegments, { key: '__cash', label: '현금', value: balance, purchaseAmount: null, color: CASH_COLOR }] : stockSegments

  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1
  const gapLength = (GAP_DEG / 360) * circumference

  let cumulative = 0
  const arcs = segments.map((s) => {
    const rawLength = (s.value / total) * circumference
    const length = Math.max(rawLength - gapLength, 0)
    const offset = -cumulative
    cumulative += rawLength
    return { ...s, length, offset }
  })

  const profitColor = profitRate > 0 ? 'var(--color-rise)' : profitRate < 0 ? 'var(--color-fall)' : 'var(--color-text-disabled)'

  return (
    <div className="portfolio-composition">
      <div className="portfolio-composition-chart" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          {arcs.map((a) => (
            <circle
              key={a.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={a.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${a.length} ${circumference - a.length}`}
              strokeDashoffset={a.offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          ))}
        </svg>
        <div className="portfolio-composition-label" style={{ color: profitColor, fontSize: size * 0.14 }}>
          {formatPercent(profitRate)}
        </div>
      </div>

      <ul className="portfolio-composition-legend">
        {segments.map((s) => (
          <li key={s.key}>
            <span className="portfolio-composition-swatch" style={{ background: s.color }} />
            <span className="portfolio-composition-legend-label">{s.label}</span>
            <span className="portfolio-composition-legend-value">
              {s.purchaseAmount != null ? `매입 ${formatMoney(s.purchaseAmount)} · 평가 ${formatMoney(s.value)}` : formatMoney(s.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PortfolioCompositionChart
