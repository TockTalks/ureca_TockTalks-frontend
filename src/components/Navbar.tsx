import type { Me } from '../lib/useAuth'
import './Navbar.css'

type NavbarProps = {
  me: Me | null
  authChecked: boolean
  onLogout: () => void
}

const navigationItems = [
  { href: '/stocks', label: '종목' },
  { href: '/portfolio', label: '포트폴리오' },
  { href: '/community', label: '커뮤니티' },
  { href: '/rooms', label: '방 목록' },
  { href: '/ranking', label: '랭킹' },
]

function Navbar({ me, authChecked, onLogout }: NavbarProps) {
  return (
    <header className="navbar">
      <a href="/" className="navbar-brand">
        톡톡스
      </a>

      <nav className="navbar-menu" aria-label="주요 메뉴">
        {navigationItems.map((item) => (
          <a key={item.href} href={item.href} className="navbar-link">
            {item.label}
          </a>
        ))}
      </nav>

      <div className="navbar-actions">
        {!authChecked && <div className="navbar-skeleton" aria-hidden="true" />}

        {authChecked && me && (
          <>
            <a href="/profile" className="navbar-nickname">
              {me.nickname}님
            </a>
            <button type="button" className="btn btn-default" onClick={onLogout}>
              로그아웃
            </button>
          </>
        )}

        {authChecked && !me && (
          <>
            <a href="/login" className="btn btn-text">
              로그인
            </a>
            <a href="/signup" className="btn btn-primary">
              회원가입
            </a>
          </>
        )}
      </div>
    </header>
  )
}

export default Navbar
