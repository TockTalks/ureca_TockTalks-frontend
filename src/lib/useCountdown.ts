import { useEffect, useState } from 'react'

// target까지 남은 ms를 1초 간격으로 갱신해서 반환한다.
// target이 없으면 null(타이머 없음), 이미 지났으면 0을 반환한다.
export function useCountdown(targetIso: string | null): number | null {
  const [remainingMs, setRemainingMs] = useState<number | null>(null)

  useEffect(() => {
    if (!targetIso) {
      setRemainingMs(null)
      return
    }

    const targetTime = new Date(targetIso).getTime()
    if (!Number.isFinite(targetTime)) {
      setRemainingMs(null)
      return
    }

    const tick = () => {
      setRemainingMs(Math.max(0, targetTime - Date.now()))
    }

    tick()
    const intervalId = window.setInterval(tick, 1000)
    return () => window.clearInterval(intervalId)
  }, [targetIso])

  return remainingMs
}
