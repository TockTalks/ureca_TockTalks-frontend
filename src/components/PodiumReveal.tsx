import type { FinalRanking } from '../lib/types'
import { formatPercent, profitTextClass } from '../lib/format'

// 화면 배치는 2등-1등-3등(포디움 모양), 등장 순서는 CSS에서 3등->2등->1등으로 지연시켜 극적으로 연출한다.
const DISPLAY_ORDER: Array<1 | 2 | 3> = [2, 1, 3]

function PodiumReveal({ entries }: { entries: FinalRanking[] }) {
  const byRank = new Map(entries.filter((entry) => entry.finalRank <= 3).map((entry) => [entry.finalRank, entry]))

  return (
    <div className="podium-reveal-overlay">
      <div className="podium-reveal-card">
        <span className="podium-reveal-title">방 종료</span>
        <div className="podium-stands">
          {DISPLAY_ORDER.map((place) => {
            const entry = byRank.get(place)
            if (!entry) return null
            return (
              <div key={place} className={`podium-stand podium-stand-${place}`}>
                <div className="podium-stand-info">
                  <span className="podium-stand-nickname">{entry.nickname}</span>
                  <span className={profitTextClass(entry.finalReturnRate)}>{formatPercent(entry.finalReturnRate)}</span>
                </div>
                <div className="podium-stand-block">{place}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PodiumReveal
