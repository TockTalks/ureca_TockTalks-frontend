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

export type RoomRanking = {
  rank: number
  memberId: number
  nickname: string
  balance: number
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

export type StockInfo = {
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

export type TradeType = 'BUY' | 'SELL'

export type TradeExecution = {
  transactionId: number
  roomParticipantId: number
  stockCode: string
  stockName: string
  type: TradeType
  quantity: number
  price: number
  tradeAmount: number
  balance: number
  profitAmount: number | null
  profitRate: number | null
  executedAt: string
}

export type TradeHolding = {
  holdingId: number
  roomParticipantId: number
  stockCode: string
  stockName: string
  quantity: number
  avgPrice: number
  currentPrice: number
  valuationAmount: number
  profitLoss: number
  profitRate: number
  updatedAt: string
}

export type Post = {
  id: number
  memberId: number
  content: string
  stockCode: string | null
  transactionId: number | null
  profitAmount: number | null
  profitRate: number | null
  hasCertificate: boolean
  likeCount: number
  commentCount: number
  likedByMe: boolean
  createAt: string
  updateAt: string
}

export type CommunityComment = {
  id: number
  postId: number
  memberId: number
  content: string
  likeCount: number
  likedByMe: boolean
  edited: boolean
  createdAt: string
  updatedAt: string
}

export type Page<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}
