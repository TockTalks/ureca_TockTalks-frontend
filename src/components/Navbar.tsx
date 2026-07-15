import type { Me } from '../lib/useAuth'
import './Navbar.css'

type NavbarProps = {
  me: Me | null
  authChecked: boolean
  onLogout: () => void
}

function Navbar({ me, authChecked, onLogout }: NavbarProps) {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <a href="/" className="navbar-brand">
          톡톡스
        </a>
        <a href="/rooms" className="navbar-link">
          방 목록
        </a>
      </div>

      <nav className="navbar-actions">
        {!authChecked && <div className="navbar-skeleton" aria-hidden="true" />}

        {authChecked && me && (
          <>
            <span className="navbar-nickname">{me.nickname}님</span>
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
      </nav>
    </header>
  )
}

export default Navbar
