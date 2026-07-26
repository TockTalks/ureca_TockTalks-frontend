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

// 방 랭킹을 최초 1회 조회한 뒤, STOMP로 해당 방의 실시간 갱신을 구독한다.
// roomId가 null이면 구독하지 않는다(참가 중이 아니거나 진행중이 아닌 방 등).
export function useRoomLiveRanking(roomId: number | null) {
  const [ranking, setRanking] = useState<RankedEntry[]>([])
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (roomId == null) {
      setRanking([])
      setLoadError(false)
      return
    }

    let cancelled = false
    let client: Client | null = null

    const connect = async () => {
      try {
        const list = await api.get<RoomRanking[]>(`/api/rooms/${roomId}/ranking`)
        if (cancelled) return
        setRanking(toRankedEntries(list))

        client = new Client({
          brokerURL: WS_URL,
          reconnectDelay: 3000,
        })

        client.onConnect = () => {
          client!.subscribe(`/topic/room-ranking/${roomId}`, (message) => {
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
  }, [roomId])

  return { ranking, loadError }
}

export function useDefaultRoomRanking() {
  const [roomId, setRoomId] = useState<number | null>(null)
  const [roomName, setRoomName] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false

    api
      .get<Room>('/api/rooms/default')
      .then((room) => {
        if (cancelled) return
        setRoomName(room.name)
        setRoomId(room.id)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const { ranking, loadError: rankingLoadError } = useRoomLiveRanking(roomId)

  return { ranking, roomName, loadError: loadError || rankingLoadError }
}
