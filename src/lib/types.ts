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

export type PortfolioSummary = {
  roomParticipantId: number
  roomId: number
  roomName: string
  roomStatus: string
  balance: number
  stockValuation: number
  totalAssetValue: number
  initialSeedMoney: number
  profitAmount: number
  profitRate: number
  holdingCount: number
}

export type PortfolioHolding = {
  stockCode: string
  stockName: string
  quantity: number
  avgPurchasePrice: number
  currentPrice: number
  evaluationAmount: number
  profitAmount: number
  profitRate: number
}

export type PortfolioDetail = PortfolioSummary & {
  holdings: PortfolioHolding[]
}

export type PortfolioHistoryPoint = {
  recordedAt: string
  totalAssetValue: number
}
