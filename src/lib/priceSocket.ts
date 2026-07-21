import { useEffect, useState } from 'react'
import { Client } from '@stomp/stompjs'
import { api } from './apiClient'
import type { PriceSnapshot } from './types'

export type PricePoint = {
  time: string
  price: number
}

const MAX_POINTS = 60
const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws'

export function usePriceStream(stockCode: string) {
  const [points, setPoints] = useState<PricePoint[]>([])
  const [latestPrice, setLatestPrice] = useState<number | null>(null)
  const [snapshot, setSnapshot] = useState<PriceSnapshot | null>(null)

  useEffect(() => {
    let cancelled = false
    setPoints([])
    setLatestPrice(null)
    setSnapshot(null)

    api
      .get<PriceSnapshot>(`/api/price/${stockCode}`)
      .then((data) => {
        if (cancelled) return
        setSnapshot(data)
        const price = Number(data.stck_prpr)
        setLatestPrice(price)
        setPoints([{ time: new Date().toLocaleTimeString('ko-KR'), price }])
      })
      .catch(() => {})

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
        setPoints((prev) => {
          const next = [...prev, { time: new Date().toLocaleTimeString('ko-KR'), price }]
          return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next
        })
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
