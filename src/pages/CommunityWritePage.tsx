import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Navbar from '../components/Navbar'
import { api, ApiError } from '../lib/apiClient'
import { useAuth } from '../lib/useAuth'
import type { Post } from '../lib/types'
import './CommunityPages.css'

function CommunityWritePage() {
  const { me, authChecked, logout } = useAuth()

  useEffect(() => {
    if (authChecked && !me) {
      window.location.replace('/login')
    }
  }, [authChecked, me])

  const [content, setContent] = useState('')
  const [stockCode, setStockCode] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!content.trim()) {
      setErrorMessage('내용을 입력해주세요.')
      return
    }

    setSubmitting(true)
    try {
      const post = await api.post<Post>('/api/posts', {
        content,
        stockCode: stockCode.trim() || undefined,
      })
      window.location.href = `/community/${post.id}`
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : '게시글 작성에 실패했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="community-main">
        <h2>글쓰기</h2>

        <form className="card post-write-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">내용</span>
            <textarea
              className="input textarea"
              rows={10}
              placeholder="첫 줄은 목록에서 제목처럼 크게 보여집니다."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={2000}
              required
            />
          </label>

          <label className="field">
            <span className="field-label">종목코드 (선택)</span>
            <input
              type="text"
              className="input"
              placeholder="예: 005930"
              value={stockCode}
              onChange={(e) => setStockCode(e.target.value)}
            />
          </label>

          {errorMessage && <p className="alert-error">{errorMessage}</p>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '등록 중…' : '등록'}
            </button>
            <a href="/community" className="btn btn-default">
              취소
            </a>
          </div>
        </form>
      </main>
    </>
  )
}

export default CommunityWritePage
