import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import HomePage from './pages/HomePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import SignupPage from './pages/SignupPage.tsx'
import KakaoCallback from './pages/KakaoCallback.tsx'

// 라우터 없는 스캐폴드라 경로별로 pathname으로 분기
function resolvePage() {
  switch (window.location.pathname) {
    case '/login':
      return <LoginPage />
    case '/signup':
      return <SignupPage />
    case '/oauth/callback/kakao':
      return <KakaoCallback />
    default:
      return <HomePage />
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{resolvePage()}</StrictMode>,
)
