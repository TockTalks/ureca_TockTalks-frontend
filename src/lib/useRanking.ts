import { useEffect, useState } from 'react'
import { api } from './apiClient'
import type { Room, RoomRanking } from './types'

const POLL_INTERVAL_MS = 10000

export function useDefaultRoomRanking() {
  const [ranking, setRanking] = useState<RoomRanking[]>([])
  const [roomName, setRoomName] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false
    let roomId: number | null = null

    const loadRanking = async () => {
      try {
        if (roomId === null) {
          const room = await api.get<Room>('/api/rooms/default')
          if (cancelled) return
          roomId = room.id
          setRoomName(room.name)
        }

        const list = await api.get<RoomRanking[]>(`/api/rooms/${roomId}/ranking`)
        if (!cancelled) setRanking(list)
      } catch {
        if (!cancelled) setLoadError(true)
      }
    }

    loadRanking()
    const timer = setInterval(loadRanking, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return { ranking, roomName, loadError }
}
