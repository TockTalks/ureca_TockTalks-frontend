import { useEffect, useRef, useState } from 'react' // ===== 추가 =====
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
  // ===== 추가: 관리자 기능 토글 드롭다운 =====
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const adminMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!adminMenuOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) {
        setAdminMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [adminMenuOpen])
  // ===== 추가 끝 =====

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
            {/* ===== 추가: 관리자 전용 - 신고/통계 이동 드롭다운 ===== */}
            {me.role === 'admin' && (
              <div className="navbar-admin-menu" ref={adminMenuRef}>
                <button
                  type="button"
                  className="navbar-admin-toggle"
                  onClick={() => setAdminMenuOpen((open) => !open)}
                  aria-expanded={adminMenuOpen}
                >
                  관리자 ▾
                </button>
                {adminMenuOpen && (
                  <div className="navbar-admin-dropdown">
                    <a href="/admin/reports" className="navbar-admin-dropdown-item">
                      신고
                    </a>
                    <a href="/admin/members" className="navbar-admin-dropdown-item">
                      회원 관리
                    </a>
                    <a href="/admin/stats" className="navbar-admin-dropdown-item">
                      통계
                    </a>
                  </div>
                )}
              </div>
            )}
            {/* ===== 추가 끝 ===== */}

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
