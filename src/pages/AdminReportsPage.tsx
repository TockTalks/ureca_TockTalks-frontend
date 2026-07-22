import { useEffect } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../lib/useAuth'
import './AdminPage.css'

function AdminReportsPage() {
  const { me, authChecked, logout } = useAuth()

  useEffect(() => {
    if (!authChecked) return
    if (!me) {
      window.location.replace('/login?next=/admin/reports')
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
        <h2>신고 관리</h2>
        <p className="admin-placeholder">준비 중입니다.</p>
      </main>
    </>
  )
}

export default AdminReportsPage
