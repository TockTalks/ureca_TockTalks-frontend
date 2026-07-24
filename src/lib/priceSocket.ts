import { useEffect, useMemo, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import { api } from './apiClient'
import type { DailyPrice, PriceSnapshot } from './types'

export type PricePoint = {
  position: number // 0~100: 0~HISTORY_ZONE_END는 지난 30일, HISTORY_ZONE_END~100은 오늘 실시간
  label: string
  price: number
}

export type AxisTick = {
  position: number
  label: string
}

const HISTORY_DAYS = 30
export const HISTORY_ZONE_END = 75
const LIVE_ZONE_WIDTH = 100 - HISTORY_ZONE_END
const MARKET_OPEN_MIN = 9 * 60
const MARKET_CLOSE_MIN = 15 * 60 + 30
const SESSION_MINUTES = MARKET_CLOSE_MIN - MARKET_OPEN_MIN
const LIVE_POINT_INTERVAL_MS = 1500
const LIVE_POINT_CAP = 300
const HISTORY_TICK_STEP_DAYS = 7
const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws'

const LIVE_SESSION_MARKS: Array<{ minutes: number; label: string }> = [
  { minutes: MARKET_OPEN_MIN, label: '09:00' },
  { minutes: 11 * 60, label: '11:00' },
  { minutes: 13 * 60, label: '13:00' },
  { minutes: MARKET_CLOSE_MIN, label: '15:30' },
]

const LIVE_AXIS_TICKS: AxisTick[] = LIVE_SESSION_MARKS.map(({ minutes, label }) => ({
  position: HISTORY_ZONE_END + ((minutes - MARKET_OPEN_MIN) / SESSION_MINUTES) * LIVE_ZONE_WIDTH,
  label,
}))

function historyPosition(index: number, total: number): number {
  if (total <= 1) return 0
  return (index / (total - 1)) * HISTORY_ZONE_END
}

function livePosition(at: Date): number {
  const minutesSinceMidnight = at.getHours() * 60 + at.getMinutes() + at.getSeconds() / 60
  const clamped = Math.min(Math.max(minutesSinceMidnight, MARKET_OPEN_MIN), MARKET_CLOSE_MIN)
  const fraction = (clamped - MARKET_OPEN_MIN) / SESSION_MINUTES
  return HISTORY_ZONE_END + fraction * LIVE_ZONE_WIDTH
}

function formatShortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-')
  return `${Number(month)}/${Number(day)}`
}

function buildHistoryAxisTicks(historyPoints: PricePoint[]): AxisTick[] {
  if (historyPoints.length === 0) return []

  const indices: number[] = []
  for (let i = 0; i < historyPoints.length; i += HISTORY_TICK_STEP_DAYS) indices.push(i)
  const lastIndex = historyPoints.length - 1
  if (indices[indices.length - 1] !== lastIndex) indices.push(lastIndex)

  return indices.map((i) => ({
    position: historyPoints[i].position,
    label: formatShortDate(historyPoints[i].label),
  }))
}

export function usePriceStream(stockCode: string) {
  const [historyPoints, setHistoryPoints] = useState<PricePoint[]>([])
  const [livePoints, setLivePoints] = useState<PricePoint[]>([])
  const [latestPrice, setLatestPrice] = useState<number | null>(null)
  const [snapshot, setSnapshot] = useState<PriceSnapshot | null>(null)
  const lastPointAtRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    lastPointAtRef.current = 0
    setHistoryPoints([])
    setLivePoints([])
    setLatestPrice(null)
    setSnapshot(null)

    const appendLivePoint = (price: number, at: Date = new Date()) => {
      const now = Date.now()
      if (now - lastPointAtRef.current < LIVE_POINT_INTERVAL_MS) return
      lastPointAtRef.current = now

      // 화면에 크게 보이는 현재가도 차트 점과 같은 주기로만 갱신한다.
      // 틱마다(초당 3~4회) 그대로 반영하면 숫자가 너무 빨리 바뀌어 읽을 수가 없다.
      setLatestPrice(price)

      const point: PricePoint = {
        position: livePosition(at),
        label: at.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        price,
      }

      setLivePoints((prev) => {
        const next = [...prev, point]
        if (next.length <= LIVE_POINT_CAP) return next
        return next.filter((_, i) => i % 2 === (next.length - 1) % 2)
      })
    }

    const loadInitialData = async () => {
      try {
        const history = await api.get<DailyPrice[]>(`/api/price/${stockCode}/history?days=${HISTORY_DAYS}`)
        if (cancelled) return
        if (history.length > 0) {
          setHistoryPoints(
            history.map((day, index) => ({
              position: historyPosition(index, history.length),
              label: day.date,
              price: day.closePrice,
            })),
          )
        }
      } catch {
        // 과거 시세 조회 실패 시 실시간 데이터만으로 그래프를 그립니다.
      }

      try {
        const data = await api.get<PriceSnapshot>(`/api/price/${stockCode}`)
        if (cancelled) return
        setSnapshot(data)
        const price = Number(data.stck_prpr)
        appendLivePoint(price)
      } catch {
        // 현재가 조회 실패는 무시하고 실시간 스트림에 맡깁니다.
      }
    }

    loadInitialData()
    api.get(`/api/price/subscribe/${stockCode}`).catch(() => {})

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 3000,
    })

    client.onConnect = () => {
      client.subscribe(`/topic/price/${stockCode}`, (message) => {
        const price = Number(message.body)
        if (Number.isNaN(price)) return

        appendLivePoint(price)
      })
    }

    client.activate()

    return () => {
      cancelled = true
      client.deactivate()
    }
  }, [stockCode])

  const points = useMemo(() => [...historyPoints, ...livePoints], [historyPoints, livePoints])
  const xAxisTicks = useMemo(
    () => [...buildHistoryAxisTicks(historyPoints), ...LIVE_AXIS_TICKS],
    [historyPoints],
  )

  return { points, latestPrice, snapshot, xAxisTicks }
}