import type { PortfolioHolding } from './types'

// 검증된 카테고리컬 팔레트(고정 순서) — validate_palette.js 통과, 색맹 대비 확보
export const COMPOSITION_SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']
export const COMPOSITION_CASH_COLOR = '#c3c2b7'

export type CompositionSegment = {
  key: string
  label: string
  value: number
  purchaseAmount: number | null
  color: string
}

// 도넛 차트/범례가 항상 같은 색-종목 매핑을 쓰도록 세그먼트 계산 로직을 공용화
export function buildCompositionSegments(holdings: PortfolioHolding[], balance: number): CompositionSegment[] {
  const stockSegments: CompositionSegment[] = holdings
    .filter((h) => h.evaluationAmount > 0)
    .map((h, i) => ({
      key: h.stockCode,
      label: h.stockName,
      value: h.evaluationAmount,
      purchaseAmount: h.avgPurchasePrice * h.quantity,
      color: COMPOSITION_SERIES_COLORS[i % COMPOSITION_SERIES_COLORS.length],
    }))

  return balance > 0
    ? [...stockSegments, { key: '__cash', label: '현금', value: balance, purchaseAmount: null, color: COMPOSITION_CASH_COLOR }]
    : stockSegments
}
