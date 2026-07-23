import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { api, ApiError } from '../lib/apiClient'
import { useAuth } from '../lib/useAuth'
import type { AdminMember, Page, Report, ReportTargetType } from '../lib/types'
import { formatReportDate, reportStatusBadgeClass, reportStatusLabel, targetTypeLabel } from '../lib/format'
import './AdminPage.css'

const REPORT_PAGE_SIZE = 10
const MEMBER_PAGE_SIZE = 10

type ReportTab = 'pending' | 'history'
type TypeFilter = 'ALL' | ReportTargetType

const TYPE_FILTERS: TypeFilter[] = ['ALL', 'POST', 'COMMENT']

function AdminReportsPage() {
  const { me, authChecked, logout } = useAuth()
  const isAdmin = authChecked && me?.role === 'admin'

  const [tab, setTab] = useState<ReportTab>('pending')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [reports, setReports] = useState<Report[]>([])
  const [reportPage, setReportPage] = useState(0)
  const [reportTotalPages, setReportTotalPages] = useState(0)
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [actionBusyId, setActionBusyId] = useState<number | null>(null)

  const [members, setMembers] = useState<AdminMember[]>([])
  const [memberPage, setMemberPage] = useState(0)
  const [memberTotalPages, setMemberTotalPages] = useState(0)
  const [membersLoading, setMembersLoading] = useState(false)
  const [memberError, setMemberError] = useState<string | null>(null)
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set())
  const [blockBusy, setBlockBusy] = useState(false)

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

  const loadReports = (targetTab: ReportTab, filter: TypeFilter, page: number) => {
    setReportsLoading(true)
    setReportError(null)
    const path = targetTab === 'pending' ? '/api/admin/reports' : '/api/admin/reports/history'
    const params = new URLSearchParams({ page: String(page), size: String(REPORT_PAGE_SIZE) })
    if (filter !== 'ALL') params.set('targetType', filter)

    api
      .get<Page<Report>>(`${path}?${params.toString()}`)
      .then((result) => {
        setReports(result.content)
        setReportTotalPages(result.totalPages)
        setReportPage(result.number)
        setExpandedId(null)
      })
      .catch((err) => setReportError(err instanceof ApiError ? err.message : '신고 목록을 불러오지 못했습니다.'))
      .finally(() => setReportsLoading(false))
  }

  const loadMembers = (page: number) => {
    setMembersLoading(true)
    setMemberError(null)
    api
      .get<Page<AdminMember>>(`/api/admin/members/reported?page=${page}&size=${MEMBER_PAGE_SIZE}`)
      .then((result) => {
        setMembers(result.content)
        setMemberTotalPages(result.totalPages)
        setMemberPage(result.number)
      })
      .catch((err) => setMemberError(err instanceof ApiError ? err.message : '회원 목록을 불러오지 못했습니다.'))
      .finally(() => setMembersLoading(false))
  }

  useEffect(() => {
    if (!isAdmin) return
    loadReports(tab, typeFilter, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, tab, typeFilter])

  useEffect(() => {
    if (!isAdmin) return
    loadMembers(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  const handleToggleExpand = (reportId: number) => {
    setExpandedId((prev) => (prev === reportId ? null : reportId))
  }

  const handleReject = async (report: Report) => {
    if (!window.confirm('이 신고를 반려할까요? 신고 누적 횟수에는 반영되지 않습니다.')) return
    setActionBusyId(report.id)
    try {
      await api.patch(`/api/admin/reports/${report.id}/reject`)
      setReports((prev) => prev.filter((r) => r.id !== report.id))
    } catch (err) {
      setReportError(err instanceof ApiError ? err.message : '반려 처리에 실패했습니다.')
    } finally {
      setActionBusyId(null)
    }
  }

  const handleDelete = async (report: Report) => {
    const confirmed = window.confirm(
      '이 신고를 삭제 처리할까요? 커뮤니티에서 해당 게시글/댓글이 삭제되고, 작성자의 신고 누적 횟수가 1 증가합니다.',
    )
    if (!confirmed) return
    setActionBusyId(report.id)
    try {
      await api.del(`/api/admin/reports/${report.id}`)
      setReports((prev) => prev.filter((r) => r.id !== report.id))
      loadMembers(memberPage)
    } catch (err) {
      setReportError(err instanceof ApiError ? err.message : '삭제 처리에 실패했습니다.')
    } finally {
      setActionBusyId(null)
    }
  }

  const toggleSelectMember = (memberId: number) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) {
        next.delete(memberId)
      } else {
        next.add(memberId)
      }
      return next
    })
  }

  const handleBlockOne = async (memberId: number) => {
    if (!window.confirm(`회원 ${memberId}을(를) 차단할까요?`)) return
    setBlockBusy(true)
    setMemberError(null)
    try {
      await api.post(`/api/admin/members/${memberId}/block`)
      setSelectedMemberIds((prev) => {
        const next = new Set(prev)
        next.delete(memberId)
        return next
      })
      loadMembers(memberPage)
    } catch (err) {
      setMemberError(err instanceof ApiError ? err.message : '차단 처리에 실패했습니다.')
    } finally {
      setBlockBusy(false)
    }
  }

  const handleBlockSelected = async () => {
    if (selectedMemberIds.size === 0) return
    if (!window.confirm(`선택한 ${selectedMemberIds.size}명을 차단할까요?`)) return
    setBlockBusy(true)
    setMemberError(null)
    try {
      await Promise.all([...selectedMemberIds].map((id) => api.post(`/api/admin/members/${id}/block`)))
      setSelectedMemberIds(new Set())
      loadMembers(memberPage)
    } catch (err) {
      setMemberError(err instanceof ApiError ? err.message : '차단 처리에 실패했습니다.')
    } finally {
      setBlockBusy(false)
    }
  }

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="admin-main admin-reports-main">
        <h2>신고 관리</h2>

        {isAdmin && (
          <div className="admin-reports-layout">
            <section className="admin-reports-panel">
              <div className="admin-reports-tabs">
                <button
                  type="button"
                  className={`admin-tab-btn ${tab === 'pending' ? 'admin-tab-btn-active' : ''}`}
                  onClick={() => setTab('pending')}
                >
                  신고
                </button>
                <button
                  type="button"
                  className={`admin-tab-btn ${tab === 'history' ? 'admin-tab-btn-active' : ''}`}
                  onClick={() => setTab('history')}
                >
                  내역
                </button>
              </div>

              <div className="admin-reports-filters">
                {TYPE_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={`admin-filter-chip ${typeFilter === filter ? 'admin-filter-chip-active' : ''}`}
                    onClick={() => setTypeFilter(filter)}
                  >
                    {filter === 'ALL' ? '전체' : targetTypeLabel(filter)}
                  </button>
                ))}
              </div>

              {reportError && <p className="alert-error">{reportError}</p>}

              {!reportsLoading && reports.length === 0 ? (
                <p className="admin-placeholder">
                  {tab === 'pending' ? '처리할 신고가 없습니다.' : '처리 내역이 없습니다.'}
                </p>
              ) : (
                <ul className="admin-report-list">
                  {reports.map((report) => (
                    <li key={report.id} className="admin-report-item">
                      <button
                        type="button"
                        className="admin-report-row"
                        onClick={() => handleToggleExpand(report.id)}
                        aria-expanded={expandedId === report.id}
                      >
                        <span className="badge badge-info">{targetTypeLabel(report.targetType)}</span>
                        <span className="admin-report-reason">{report.reason}</span>
                        <span className="admin-report-target">작성자 {report.targetMemberId}</span>
                        <span className="post-card-date">{formatReportDate(report.createdAt)}</span>
                        {tab === 'history' && (
                          <span className={`badge ${reportStatusBadgeClass(report.status)}`}>
                            {reportStatusLabel(report.status)}
                          </span>
                        )}
                      </button>

                      {expandedId === report.id && (
                        <div className="admin-report-detail">
                          <p className="admin-report-content">
                            {report.targetContent ?? '(원문을 불러올 수 없습니다)'}
                          </p>

                          {tab === 'pending' && (
                            <div className="admin-report-actions">
                              <button
                                type="button"
                                className="btn btn-default"
                                disabled={actionBusyId === report.id}
                                onClick={() => handleReject(report)}
                              >
                                반려
                              </button>
                              <button
                                type="button"
                                className="btn btn-report"
                                disabled={actionBusyId === report.id}
                                onClick={() => handleDelete(report)}
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <Pager
                page={reportPage}
                totalPages={reportTotalPages}
                onChange={(p) => loadReports(tab, typeFilter, p)}
              />
            </section>

            <aside className="admin-members-panel">
              <div className="admin-members-header">
                <h3>신고 누적 회원</h3>
                <button
                  type="button"
                  className="btn btn-default"
                  disabled={selectedMemberIds.size === 0 || blockBusy}
                  onClick={handleBlockSelected}
                >
                  선택 차단
                </button>
              </div>

              {memberError && <p className="alert-error">{memberError}</p>}

              {!membersLoading && members.length === 0 ? (
                <p className="admin-placeholder">신고 누적 회원이 없습니다.</p>
              ) : (
                <table className="admin-member-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>회원 ID</th>
                      <th>신고 누적</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className={member.status === 'blocked' ? 'admin-member-row-blocked' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedMemberIds.has(member.id)}
                            onChange={() => toggleSelectMember(member.id)}
                            disabled={member.status === 'blocked'}
                            aria-label={`회원 ${member.id} 선택`}
                          />
                        </td>
                        <td>{member.id}</td>
                        <td>{member.reportedCount}</td>
                        <td>
                          {member.status === 'blocked' ? (
                            <span className="badge badge-default">차단됨</span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-text admin-block-btn"
                              disabled={blockBusy}
                              onClick={() => handleBlockOne(member.id)}
                            >
                              차단
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <Pager page={memberPage} totalPages={memberTotalPages} onChange={loadMembers} />
            </aside>
          </div>
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

export default AdminReportsPage
