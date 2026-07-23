import './PortfolioCompositionChart.css'
import type { PortfolioHolding } from '../lib/types'
import { buildCompositionSegments } from '../lib/portfolioComposition'

type PortfolioCompositionLegendCompactProps = {
  holdings: PortfolioHolding[]
  balance: number
}

// 목록 화면 컴팩트 카드용 - 색상/종목명만 가로로 나열 (매입/평가 금액 생략, 줄바꿈 시 여러 줄로 흐름)
function PortfolioCompositionLegendCompact({ holdings, balance }: PortfolioCompositionLegendCompactProps) {
  const segments = buildCompositionSegments(holdings, balance)

  return (
    <ul className="portfolio-composition-legend-compact">
      {segments.map((s) => (
        <li key={s.key}>
          <span className="portfolio-composition-swatch" style={{ background: s.color }} />
          <span>{s.label}</span>
        </li>
      ))}
    </ul>
  )
}

export default PortfolioCompositionLegendCompact
