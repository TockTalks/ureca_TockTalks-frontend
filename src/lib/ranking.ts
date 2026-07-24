import type { RoomRanking } from './types'

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
