import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { api, ApiError } from '../lib/apiClient'
import { useAuth } from '../lib/useAuth'
import type { Page, Post } from '../lib/types'
import { formatShortDate, splitPostTitle } from '../lib/format'
import './CommunityPages.css'

const PAGE_SIZE = 10

function CommunityPage() {
  const { me, authChecked, logout } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadPage = (pageNumber: number, append: boolean) => {
    setLoading(true)
    api
      .get<Page<Post>>(`/api/posts?page=${pageNumber}&size=${PAGE_SIZE}`)
      .then((result) => {
        setPosts((prev) => (append ? [...prev, ...result.content] : result.content))
        setHasMore(!result.last)
        setPage(pageNumber)
      })
      .catch((err) => setErrorMessage(err instanceof ApiError ? err.message : '게시글을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (authChecked && me) {
      loadPage(0, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, me])

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="community-main">
        <div className="community-header">
          <h2>커뮤니티</h2>
          {me && (
            <a href="/community/new" className="btn btn-primary">
              글쓰기
            </a>
          )}
        </div>

        {errorMessage && <p className="alert-error">{errorMessage}</p>}

        {authChecked && !me ? (
          <p className="community-empty">
            <a href="/login">로그인</a> 후 커뮤니티를 이용할 수 있습니다.
          </p>
        ) : (
          <>
            {posts.length === 0 && !loading ? (
              <p className="community-empty">아직 작성된 글이 없습니다.</p>
            ) : (
              <div className="post-list">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} isMe={me?.id === post.memberId} />
                ))}
              </div>
            )}

            {hasMore && (
              <div className="community-load-more">
                <button
                  type="button"
                  className="btn btn-default"
                  disabled={loading}
                  onClick={() => loadPage(page + 1, true)}
                >
                  {loading ? '불러오는 중…' : '더보기'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}

function PostCard({ post, isMe }: { post: Post; isMe: boolean }) {
  const { title, body } = splitPostTitle(post.content)
  const profitPositive = (post.profitRate ?? 0) >= 0

  return (
    <a href={`/community/${post.id}`} className="card post-card">
      <div className="post-card-header">
        <span className="post-card-author">{isMe ? '나' : `회원 ${post.memberId}`}</span>
        <span className="post-card-date">{formatShortDate(post.createAt)}</span>
      </div>

      <h3 className="post-card-title">{title || '(내용 없음)'}</h3>
      {body && <p className="post-card-body">{body}</p>}

      {post.hasCertificate && (
        <span className={`badge ${profitPositive ? 'badge-success' : 'badge-danger'}`}>
          {post.stockCode} {profitPositive ? '+' : ''}
          {post.profitRate}%
        </span>
      )}

      <div className="post-card-footer">
        <span>💬 {post.commentCount}</span>
        <span className={post.likedByMe ? 'liked' : ''}>♥ {post.likeCount}</span>
      </div>
    </a>
  )
}

export default CommunityPage
