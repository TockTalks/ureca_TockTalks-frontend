import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Navbar from '../components/Navbar'
import TradeCertificateCard from '../components/TradeCertificateCard'
import { api, ApiError } from '../lib/apiClient'
import { useAuth } from '../lib/useAuth'
import type { Post } from '../lib/types'
import { postCertificateLabel } from '../lib/format'
import './CommunityPages.css'

// 포트폴리오 자산 변동 히스토리의 '공유' 버튼에서 넘어온 매도 내역 정보
type SharedTrade = {
  transactionId: number
  stockCode: string | null
  stockName: string | null
  quantity: number | null
  profitAmount: number | null
  profitRate: number | null
}

function readSharedTrade(): SharedTrade | null {
  const params = new URLSearchParams(window.location.search)
  const transactionId = params.get('transactionId')
  if (!transactionId) return null

  return {
    transactionId: Number(transactionId),
    stockCode: params.get('stockCode'),
    stockName: params.get('stockName'),
    quantity: params.get('quantity') ? Number(params.get('quantity')) : null,
    profitAmount: params.get('profitAmount') ? Number(params.get('profitAmount')) : null,
    profitRate: params.get('profitRate') ? Number(params.get('profitRate')) : null,
  }
}

function CommunityWritePage() {
  const { me, authChecked, logout } = useAuth()

  useEffect(() => {
    if (authChecked && !me) {
      window.location.replace('/login')
    }
  }, [authChecked, me])

  const [sharedTrade, setSharedTrade] = useState<SharedTrade | null>(() => readSharedTrade())
  const [content, setContent] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleDetachSharedTrade = () => {
    setSharedTrade(null)
    window.history.replaceState(null, '', '/community/new')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!content.trim()) {
      setErrorMessage('내용을 입력해주세요.')
      return
    }

    setSubmitting(true)
    try {
      const post = await api.post<Post>(
        '/api/posts',
        sharedTrade ? { content, transactionId: sharedTrade.transactionId } : { content },
      )
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
        <h2>{sharedTrade ? '투자 인증 글쓰기' : '글쓰기'}</h2>

        <form className="card post-write-form" onSubmit={handleSubmit}>
          {sharedTrade && (
            <div className="field">
              <span className="field-label">첨부된 {sharedTrade.profitRate != null ? '매도' : '매수'} 내역</span>
              <div className="post-write-shared-trade">
                <TradeCertificateCard
                  label={postCertificateLabel(sharedTrade)}
                  rate={sharedTrade.profitRate}
                  amount={sharedTrade.profitAmount}
                />
                <button type="button" className="btn btn-text" onClick={handleDetachSharedTrade}>
                  해제
                </button>
              </div>
            </div>
          )}

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
