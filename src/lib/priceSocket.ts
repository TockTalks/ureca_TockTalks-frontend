import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import { api } from './apiClient'
import type { DailyPrice, PriceSnapshot } from './types'

export type PricePoint = {
  time: string
  price: number
}

const MAX_POINTS = 90
const POINT_INTERVAL_MS = 1500
const HISTORY_DAYS = 30
const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws'

export function usePriceStream(stockCode: string) {
  const [points, setPoints] = useState<PricePoint[]>([])
  const [latestPrice, setLatestPrice] = useState<number | null>(null)
  const [snapshot, setSnapshot] = useState<PriceSnapshot | null>(null)
  const lastPointAtRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    lastPointAtRef.current = 0
    setPoints([])
    setLatestPrice(null)
    setSnapshot(null)

    const appendPoint = (price: number, label?: string) => {
      const now = Date.now()
      if (!label && now - lastPointAtRef.current < POINT_INTERVAL_MS) return
      lastPointAtRef.current = now

      setPoints((prev) => {
        const next = [...prev, { time: label ?? new Date(now).toLocaleTimeString('ko-KR'), price }]
        return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next
      })
    }

    const loadInitialData = async () => {
      try {
        const history = await api.get<DailyPrice[]>(`/api/price/${stockCode}/history?days=${HISTORY_DAYS}`)
        if (cancelled) return
        if (history.length > 0) {
          setPoints(history.map((day) => ({ time: day.date, price: day.closePrice })))
        }
      } catch {
        // 과거 시세 조회 실패 시 실시간 데이터만으로 그래프를 그립니다.
      }

      try {
        const data = await api.get<PriceSnapshot>(`/api/price/${stockCode}`)
        if (cancelled) return
        setSnapshot(data)
        const price = Number(data.stck_prpr)
        setLatestPrice(price)
        appendPoint(price, '현재가')
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

        setLatestPrice(price)
        appendPoint(price)
      })
    }

    client.activate()

    return () => {
      cancelled = true
      client.deactivate()
    }
  }, [stockCode])

  return { points, latestPrice, snapshot }
}