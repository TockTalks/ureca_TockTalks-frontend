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

export type FinalRanking = {
  memberId: number
  nickname: string
  finalAsset: number
  finalReturnRate: number
  finalRank: number
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

export type PortfolioBalance = {
  roomParticipantId: number
  balance: number
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
  isDefault: boolean 
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
  // ===== 변경: 이 스냅샷을 발생시킨 거래 정보 (변경 전 기록은 null) =====
  transactionId: number | null
  stockCode: string | null
  stockName: string | null
  quantity: number | null
  tradeType: 'BUY' | 'SELL' | null
  price: number | null
  profitAmount: number | null
  profitRate: number | null
  // ===== 변경 끝 =====
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

export type DailyPrice = {
  date: string
  openPrice: number
  highPrice: number
  lowPrice: number
  closePrice: number
  volume: number
}

export type ReportTargetType = 'POST' | 'COMMENT' | 'ROOM'
export type ReportStatus = 'pending' | 'rejected' | 'deleted'

export type Report = {
  id: number
  reporterId: number
  targetType: ReportTargetType
  targetId: number
  targetMemberId: number
  reason: string
  targetContent: string | null
  status: ReportStatus
  createdAt: string
}

export type AdminMember = {
  id: number
  email: string
  nickname: string
  provider: string
  role: string
  // 회원탈퇴 상태를 관리자 화면에서 정상·차단 상태와 구분한다.
  status: 'active' | 'blocked' | 'withdrawn'
  reportedCount: number
  createdAt: string
}

export type DashboardSummaryResponse = {
  totalMemberCount: number
  dailyActiveUserCount: number
  weeklyActiveUserCount: number
  totalRoomCount: number
  recruitingRoomCount: number
  ongoingRoomCount: number
  closedRoomCount: number
  currentOnlineCount: number
}

export type DailyMemberTradeTrend = {
  date: string
  newMemberCount: number
  transactionCount: number
}

export type PopularStockResponse = {
  stockCode: string
  stockName: string
  tradeCount: number
}

export type DashboardMembersTradesResponse = {
  dailyTrend: DailyMemberTradeTrend[]
  popularStocks: PopularStockResponse[]
}

export type ReturnRateDistributionBucket = {
  label: string
  count: number
}

export type TopUserResponse = {
  memberId: number
  nickname: string
  roomId: number
  returnRate: number
}

export type DashboardRoomsRanksResponse = {
  totalRoomCount: number
  recruitingRoomCount: number
  ongoingRoomCount: number
  closedRoomCount: number
  totalParticipantCount: number
  activeParticipantCount: number
  returnRateDistribution: ReturnRateDistributionBucket[]
  topUsers: TopUserResponse[]
}

export type DailyCommunityTrend = {
  date: string
  newPostCount: number
  newCommentCount: number
}

export type PopularPostResponse = {
  postId: number
  content: string
  likeCount: number
  commentCount: number
}

export type ReportStatusCount = {
  status: ReportStatus
  count: number
}

export type DashboardCommunityResponse = {
  dailyTrend: DailyCommunityTrend[]
  popularPosts: PopularPostResponse[]
  reportStatusCounts: ReportStatusCount[]
}
