import { useEffect } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../lib/useAuth'
import './AdminPage.css'

function AdminStatsPage() {
  const { me, authChecked, logout } = useAuth()

  useEffect(() => {
    if (!authChecked) return
    if (!me) {
      window.location.replace('/login?next=/admin/stats')
      return
    }
    if (me.role !== 'admin') {
      window.location.replace('/')
    }
  }, [authChecked, me])

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="admin-main">
        <h2>통계</h2>
        <p className="admin-placeholder">준비 중입니다.</p>
      </main>
    </>
  )
}

export default AdminStatsPage
