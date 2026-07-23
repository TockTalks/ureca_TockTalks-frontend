import './PortfolioCompositionChart.css'
import type { PortfolioHolding } from '../lib/types'
import { formatMoney, formatPercent } from '../lib/format'
import { buildCompositionSegments } from '../lib/portfolioComposition' // ===== 변경: 세그먼트 계산 로직 공용 헬퍼로 분리 =====

const GAP_DEG = 2

type PortfolioCompositionChartProps = {
  holdings: PortfolioHolding[]
  balance: number
  profitRate: number
  size?: number
  showLegend?: boolean // ===== 추가: 목록 화면 컴팩트 카드에서는 범례를 이 컴포넌트 밖에서 따로 그리기 위함 =====
}

function PortfolioCompositionChart({ holdings, balance, profitRate, size = 160, showLegend = true }: PortfolioCompositionChartProps) {
  const strokeWidth = size * 0.16
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const segments = buildCompositionSegments(holdings, balance) // ===== 변경 =====

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

      {/* ===== 변경: showLegend가 false면 범례 생략 ===== */}
      {showLegend && (
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
      )}
      {/* ===== 변경 끝 ===== */}
    </div>
  )
}

export default PortfolioCompositionChart
