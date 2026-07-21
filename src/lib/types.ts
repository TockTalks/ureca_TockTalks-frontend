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

export type FavoriteStock = {
  id: number
  stockCode: string
  stockName: string
}

export type PriceSnapshot = {
  stck_prpr: string
  prdy_vrss: string
  prdy_vrss_sign: string
  prdy_ctrt: string
  acml_vol: string
  stck_oprc: string
  stck_hgpr: string
  stck_lwpr: string
}
