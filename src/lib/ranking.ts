import type { RoomRanking } from './types'
import { formatMoney } from './format'

// 거래를 한 번도 안 한 참가자는 순위를 매기지 않고("-") 맨 아래로 내린다.
export type RankedEntry = Omit<RoomRanking, 'rank'> & { rank: number | null }

export function toRankedEntries(list: RoomRanking[]): RankedEntry[] {
  const traded = [...list.filter((entry) => entry.hasTraded)].sort((a, b) => b.balance - a.balance)
  const untraded = [...list.filter((entry) => !entry.hasTraded)].sort((a, b) => b.balance - a.balance)

  return [
    ...traded.map((entry, index) => ({ ...entry, rank: index + 1 })),
    ...untraded.map((entry) => ({ ...entry, rank: null })),
  ]
}

// 거래 이력이 없는 참가자는 시드머니 그대로 보여주면 실제로 번 돈처럼 오해되니 "-"로 표시한다.
export function formatRankingBalance(entry: Pick<RankedEntry, 'hasTraded' | 'balance'>): string {
  return entry.hasTraded ? formatMoney(entry.balance) : '-'
}
