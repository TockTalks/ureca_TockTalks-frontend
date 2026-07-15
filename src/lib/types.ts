export type Room = {
  id: number
  name: string
  isDefault: boolean
  isPublic: boolean
  seedMoney: number
  inviteCode: string | null
  maxParticipants: number | null
  startAt: string | null
  endAt: string | null
  status: string
  participantCount: number
}

export type RoomParticipant = {
  id: number
  roomId: number
  memberId: number
  balance: number
  initialSeedMoney: number
  status: string
  joinedAt: string
  endedAt: string | null
}
