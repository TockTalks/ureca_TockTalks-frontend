import type { RoomRanking } from './types'

// 거래를 한 번도 안 한 참가자는 순위를 매기지 않고("-") 맨 아래로 내린다.
export type RankedEntry = Omit<RoomRanking, 'rank'> & { rank: number | null }

export function toRankedEntries(list: RoomRanking[]): RankedEntry[] {
  const traded = [...list.filter((entry) => entry.hasTraded)].sort((a, b) => b.balance - a.balance)
  const untraded = [...list.filter((entry) => !entry.hasTraded)].sort((a, b) => b.balance - a.balance)

  // ===== 변경: balance가 같으면 동순위(1,1,3...), 다르면 순번대로 등수 매기기 =====
  const rankedTraded: RankedEntry[] = []
  let rank = 1
  traded.forEach((entry, index) => {
    if (index > 0 && traded[index - 1].balance !== entry.balance) {
      rank = index + 1
    }
    rankedTraded.push({ ...entry, rank })
  })
  // ===== 변경 끝 =====

  return [
    ...rankedTraded,
    ...untraded.map((entry) => ({ ...entry, rank: null })),
  ]
}
