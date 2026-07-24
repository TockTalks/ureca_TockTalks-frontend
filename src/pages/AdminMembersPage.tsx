import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { api, ApiError } from '../lib/apiClient'
import { useAuth } from '../lib/useAuth'
import type { AdminMember, Page } from '../lib/types'
import { formatReportDate } from '../lib/format'
import './AdminPage.css'

const MEMBER_PAGE_SIZE = 20

function AdminMembersPage() {
  const { me, authChecked, logout } = useAuth()
  const isAdmin = authChecked && me?.role === 'admin'

  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [members, setMembers] = useState<AdminMember[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetBusyId, setResetBusyId] = useState<number | null>(null)
  const [resetDoneIds, setResetDoneIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!authChecked) return
    if (!me) {
      window.location.replace('/login?next=/admin/members')
      return
    }
    if (me.role !== 'admin') {
      window.location.replace('/')
    }
  }, [authChecked, me])

  const loadMembers = (targetPage: number, targetKeyword: string) => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ page: String(targetPage), size: String(MEMBER_PAGE_SIZE) })
    if (targetKeyword.trim()) params.set('keyword', targetKeyword.trim())

    api
      .get<Page<AdminMember>>(`/api/admin/members?${params.toString()}`)
      .then((result) => {
        setMembers(result.content)
        setTotalPages(result.totalPages)
        setPage(result.number)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : '회원 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!isAdmin) return
    loadMembers(0, keyword)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, keyword])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setKeyword(searchInput.trim())
  }

  const handleReset = async (member: AdminMember) => {
    const confirmed = window.confirm(
      `${member.nickname}(${member.email})님의 기본방(로비) 시드머니와 거래 내역을 초기화할까요?\n이 작업은 되돌릴 수 없습니다.`,
    )
    if (!confirmed) return

    setResetBusyId(member.id)
    setError(null)
    try {
      await api.post(`/api/admin/members/${member.id}/reset-default-room`)
      setResetDoneIds((prev) => new Set(prev).add(member.id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '초기화 처리에 실패했습니다.')
    } finally {
      setResetBusyId(null)
    }
  }

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="admin-main admin-members-main">
        <h2>회원 관리</h2>

        {isAdmin && (
          <>
            <form className="admin-members-search" onSubmit={handleSearch}>
              <input
                type="text"
                className="input"
                placeholder="닉네임 또는 이메일로 검색"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                검색
              </button>
            </form>

            {error && <p className="alert-error">{error}</p>}

            {!loading && members.length === 0 ? (
              <p className="admin-placeholder">회원이 없습니다.</p>
            ) : (
              <table className="admin-member-table admin-members-full-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>닉네임</th>
                    <th>이메일</th>
                    <th>가입일</th>
                    <th>상태</th>
                    <th>신고 누적</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className={member.status !== 'active' ? 'admin-member-row-blocked' : ''}>
                      <td>{member.id}</td>
                      <td>{member.nickname}</td>
                      <td>{member.email}</td>
                      <td>{formatReportDate(member.createdAt)}</td>
                      <td>
                        {/* 회원탈퇴 상태를 정상 회원으로 표시하지 않는다. */}
                        {member.status === 'blocked' ? (
                          <span className="badge badge-default">차단됨</span>
                        ) : member.status === 'withdrawn' ? (
                          <span className="badge badge-default">탈퇴함</span>
                        ) : (
                          '정상'
                        )}
                      </td>
                      <td>{member.reportedCount}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-text admin-reset-btn"
                          disabled={resetBusyId === member.id || member.status !== 'active'}
                          onClick={() => handleReset(member)}
                        >
                          {resetDoneIds.has(member.id) ? '초기화됨' : '기본방 초기화'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <Pager page={page} totalPages={totalPages} onChange={(p) => loadMembers(p, keyword)} />
          </>
        )}
      </main>
    </>
  )
}

function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  return (
    <div className="admin-pager">
      <button type="button" className="btn btn-text" disabled={page <= 0} onClick={() => onChange(page - 1)}>
        이전
      </button>
      <span className="admin-pager-info">
        {page + 1} / {totalPages}
      </span>
      <button
        type="button"
        className="btn btn-text"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        다음
      </button>
    </div>
  )
}

export default AdminMembersPage
