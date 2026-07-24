import { useEffect, useState } from 'react'
import { Client } from '@stomp/stompjs'
import { api } from './apiClient'
import type { Room, RoomRanking } from './types'
import { toRankedEntries, type RankedEntry } from './ranking'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws'

type RoomRankingUpdateEvent = {
  ranking: RoomRanking[]
}

export type { RankedEntry }

export function useDefaultRoomRanking() {
  const [ranking, setRanking] = useState<RankedEntry[]>([])
  const [roomName, setRoomName] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false
    let client: Client | null = null

    const connect = async () => {
      try {
        const room = await api.get<Room>('/api/rooms/default')
        if (cancelled) return
        setRoomName(room.name)

        const list = await api.get<RoomRanking[]>(`/api/rooms/${room.id}/ranking`)
        if (cancelled) return
        setRanking(toRankedEntries(list))

        client = new Client({
          brokerURL: WS_URL,
          reconnectDelay: 3000,
        })

        client.onConnect = () => {
          client!.subscribe(`/topic/room-ranking/${room.id}`, (message) => {
            try {
              const event = JSON.parse(message.body) as RoomRankingUpdateEvent
              setRanking(toRankedEntries(event.ranking))
            } catch {
              // 갱신 이벤트 파싱 실패는 무시하고 다음 이벤트를 기다립니다.
            }
          })
        }

        client.activate()
      } catch {
        if (!cancelled) setLoadError(true)
      }
    }

    connect()

    return () => {
      cancelled = true
      client?.deactivate()
    }
  }, [])

  return { ranking, roomName, loadError }
}
