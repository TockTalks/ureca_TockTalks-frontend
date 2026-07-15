import Navbar from '../components/Navbar'
import { useAuth } from '../lib/useAuth'
import './HomePage.css'

function HomePage() {
  const { me, authChecked, logout } = useAuth()

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="home-main">
        <div className="home-grid">
          <section className="card chart-panel">
            <h2>실시간 시세</h2>
            <div className="chart-placeholder">차트 영역 준비 중</div>
          </section>

          <aside className="card ranking-panel">
            <h2>랭킹</h2>
            <p className="ranking-empty">랭킹 데이터가 아직 없습니다.</p>
          </aside>
        </div>
      </main>
    </>
  )
}

export default HomePage
