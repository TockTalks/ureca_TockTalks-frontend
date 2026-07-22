import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import HomePage from './pages/HomePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import SignupPage from './pages/SignupPage.tsx'
import KakaoCallback from './pages/KakaoCallback.tsx'
import RoomsPage from './pages/RoomsPage.tsx'
import CreateRoomPage from './pages/CreateRoomPage.tsx'
import RoomDetailPage from './pages/RoomDetailPage.tsx'
import PortfolioPage from './pages/PortfolioPage.tsx'
import PortfolioDetailPage from './pages/PortfolioDetailPage.tsx'
import StocksPage from './pages/StocksPage.tsx'
import StockDetailPage from './pages/StockDetailPage.tsx'
import CommunityPage from './pages/CommunityPage.tsx'
import CommunityWritePage from './pages/CommunityWritePage.tsx'
import CommunityDetailPage from './pages/CommunityDetailPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import RankingPage from './pages/RankingPage.tsx'

// 라우터 없는 스캐폴드라 경로별로 pathname으로 분기
function resolvePage() {
  const path = window.location.pathname

  switch (path) {
    case '/login':
      return <LoginPage />
    case '/signup':
      return <SignupPage />
    case '/oauth/callback/kakao':
      return <KakaoCallback />
    case '/rooms':
      return <RoomsPage />
    case '/rooms/new':
      return <CreateRoomPage />
    case '/portfolio':
      return <PortfolioPage />
    case '/stocks':
      return <StocksPage />
    case '/community':
      return <CommunityPage />
    case '/community/new':
      return <CommunityWritePage />
    case '/profile':
      return <ProfilePage />
    case '/ranking':
      return <RankingPage />
  }

  const roomDetailMatch = path.match(/^\/rooms\/(\d+)$/)
  if (roomDetailMatch) {
    return <RoomDetailPage roomId={Number(roomDetailMatch[1])} />
  }

  const portfolioDetailMatch = path.match(/^\/portfolio\/(\d+)$/)
  if (portfolioDetailMatch) {
    return <PortfolioDetailPage roomParticipantId={Number(portfolioDetailMatch[1])} />
  }

  const stockDetailMatch = path.match(/^\/stocks\/(\d{6})$/)
  if (stockDetailMatch) {
    return <StockDetailPage stockCode={stockDetailMatch[1]} />
  }

  const communityDetailMatch = path.match(/^\/community\/(\d+)$/)
  if (communityDetailMatch) {
    return <CommunityDetailPage postId={Number(communityDetailMatch[1])} />
  }

  return <HomePage />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{resolvePage()}</StrictMode>,
)
