import './ProfitRateGauge.css'
import { formatPercent } from '../lib/format'

type ProfitRateGaugeProps = {
  rate: number
  size?: number
  cap?: number
}

function ProfitRateGauge({ rate, size = 96, cap = 30 }: ProfitRateGaugeProps) {
  const strokeWidth = size * 0.17
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(-cap, Math.min(cap, rate))
  const fillRatio = Math.min(Math.abs(clamped) / cap, 1)
  const dashOffset = circumference * (1 - fillRatio)
  const color = rate > 0 ? 'var(--color-rise)' : rate < 0 ? 'var(--color-fall)' : 'var(--color-text-disabled)'

  return (
    <div className="profit-gauge" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="profit-gauge-label" style={{ color, fontSize: size * 0.15 }}>
        {formatPercent(rate)}
      </div>
    </div>
  )
}

export default ProfitRateGauge
