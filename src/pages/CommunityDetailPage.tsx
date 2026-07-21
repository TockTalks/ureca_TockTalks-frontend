import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Navbar from '../components/Navbar'
import { api, ApiError } from '../lib/apiClient'
import { useAuth } from '../lib/useAuth'
import type { CommunityComment, Page, Post } from '../lib/types'
import { formatDate } from '../lib/format'
import './CommunityPages.css'

function CommunityDetailPage({ postId }: { postId: number }) {
  const { me, authChecked, logout } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [commentInput, setCommentInput] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [isEditingPost, setIsEditingPost] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editStockCode, setEditStockCode] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editCommentContent, setEditCommentContent] = useState('')

  const loadPost = () => {
    api
      .get<Post>(`/api/posts/${postId}`)
      .then(setPost)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : '게시글을 불러오지 못했습니다.'))
  }

  const loadComments = () => {
    api
      .get<Page<CommunityComment>>(`/api/posts/${postId}/comments?size=50`)
      .then((result) => setComments(result.content))
      .catch(() => setComments([]))
  }

  useEffect(() => {
    if (!authChecked || !me) return
    loadPost()
    loadComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, authChecked, me])

  const handleToggleLike = async () => {
    if (!post) return
    try {
      const likedByMe = await api.post<boolean>(`/api/posts/${postId}/like`)
      setPost({ ...post, likedByMe, likeCount: post.likeCount + (likedByMe ? 1 : -1) })
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : '좋아요 처리에 실패했습니다.')
    }
  }

  const handleDeletePost = async () => {
    if (!window.confirm('게시글을 삭제할까요?')) return
    try {
      await api.del(`/api/posts/${postId}`)
      window.location.href = '/community'
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : '삭제에 실패했습니다.')
    }
  }

  const handleStartEditPost = () => {
    if (!post) return
    setEditContent(post.content)
    setEditStockCode(post.stockCode ?? '')
    setIsEditingPost(true)
  }

  const handleCancelEditPost = () => {
    setIsEditingPost(false)
  }

  const handleSaveEditPost = async (e: FormEvent) => {
    e.preventDefault()
    if (!editContent.trim()) return
    setBusy(true)
    setErrorMessage(null)
    try {
      const updated = await api.patch<Post>(`/api/posts/${postId}`, {
        content: editContent,
        stockCode: editStockCode.trim() || undefined,
      })
      setPost(updated)
      setIsEditingPost(false)
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : '게시글 수정에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!commentInput.trim()) return
    setBusy(true)
    setErrorMessage(null)
    try {
      await api.post(`/api/posts/${postId}/comments`, { content: commentInput })
      setCommentInput('')
      loadComments()
      setPost((prev) => (prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev))
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : '댓글 작성에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('댓글을 삭제할까요?')) return
    try {
      await api.del(`/api/posts/${postId}/comments/${commentId}`)
      loadComments()
      setPost((prev) => (prev ? { ...prev, commentCount: Math.max(0, prev.commentCount - 1) } : prev))
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : '댓글 삭제에 실패했습니다.')
    }
  }

  const handleStartEditComment = (comment: CommunityComment) => {
    setEditingCommentId(comment.id)
    setEditCommentContent(comment.content)
  }

  const handleCancelEditComment = () => {
    setEditingCommentId(null)
  }

  const handleSaveEditComment = async (commentId: number) => {
    if (!editCommentContent.trim()) return
    setBusy(true)
    setErrorMessage(null)
    try {
      const updated = await api.patch<CommunityComment>(`/api/posts/${postId}/comments/${commentId}`, {
        content: editCommentContent,
      })
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)))
      setEditingCommentId(null)
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : '댓글 수정에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const handleToggleCommentLike = async (comment: CommunityComment) => {
    try {
      const likedByMe = await api.post<boolean>(`/api/posts/${postId}/comments/${comment.id}/like`)
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id ? { ...c, likedByMe, likeCount: c.likeCount + (likedByMe ? 1 : -1) } : c,
        ),
      )
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : '좋아요 처리에 실패했습니다.')
    }
  }

  const profitPositive = (post?.profitRate ?? 0) >= 0

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="community-main">
        <a href="/community" className="community-back-link">
          ← 목록으로
        </a>

        {loadError && <p className="alert-error">{loadError}</p>}

        {authChecked && !me && (
          <p className="community-empty">
            <a href="/login">로그인</a> 후 이용할 수 있습니다.
          </p>
        )}

        {post && (
          <article className="card post-detail-card">
            <div className="post-detail-header">
              <span className="post-card-author">{me?.id === post.memberId ? '나' : `회원 ${post.memberId}`}</span>
              <span className="post-card-date">{formatDate(post.createAt)}</span>
            </div>

            {!isEditingPost && post.hasCertificate && (
              <span className={`badge ${profitPositive ? 'badge-success' : 'badge-danger'}`}>
                {post.stockCode} {profitPositive ? '+' : ''}
                {post.profitRate}%
              </span>
            )}

            {errorMessage && <p className="alert-error">{errorMessage}</p>}

            {isEditingPost ? (
              <form className="post-edit-form" onSubmit={handleSaveEditPost}>
                <textarea
                  className="input textarea"
                  rows={8}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  maxLength={2000}
                  required
                />
                <input
                  type="text"
                  className="input"
                  placeholder="종목코드 (선택)"
                  value={editStockCode}
                  onChange={(e) => setEditStockCode(e.target.value)}
                />
                <div className="post-detail-actions">
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    저장
                  </button>
                  <button type="button" className="btn btn-default" onClick={handleCancelEditPost}>
                    취소
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="post-detail-content">{post.content}</p>

                <div className="post-detail-actions">
                  <button
                    type="button"
                    className={`btn btn-default ${post.likedByMe ? 'liked' : ''}`}
                    onClick={handleToggleLike}
                  >
                    ♥ 좋아요 {post.likeCount}
                  </button>
                  {me?.id === post.memberId && (
                    <>
                      <button type="button" className="btn btn-text" onClick={handleStartEditPost}>
                        수정
                      </button>
                      <button type="button" className="btn btn-text" onClick={handleDeletePost}>
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </article>
        )}

        {post && (
          <section className="comment-section">
            <h3>댓글 {post.commentCount}개</h3>

            {me && (
              <form className="comment-form" onSubmit={handleAddComment}>
                <input
                  type="text"
                  className="input"
                  placeholder="댓글을 입력하세요"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  maxLength={500}
                />
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  등록
                </button>
              </form>
            )}

            {comments.length === 0 ? (
              <p className="community-empty">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
            ) : (
              <ul className="comment-list">
                {comments.map((comment) => (
                  <li key={comment.id} className="comment-item">
                    <div className="comment-item-header">
                      <span className="post-card-author">
                        {me?.id === comment.memberId ? '나' : `회원 ${comment.memberId}`}
                      </span>
                      <span className="post-card-date">{formatDate(comment.createdAt)}</span>
                    </div>
                    {editingCommentId === comment.id ? (
                      <div className="comment-edit-form">
                        <input
                          type="text"
                          className="input"
                          value={editCommentContent}
                          onChange={(e) => setEditCommentContent(e.target.value)}
                          maxLength={500}
                        />
                        <div className="comment-item-footer">
                          <button
                            type="button"
                            className="btn btn-text"
                            onClick={() => handleSaveEditComment(comment.id)}
                            disabled={busy}
                          >
                            저장
                          </button>
                          <button type="button" className="btn btn-text" onClick={handleCancelEditComment}>
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="comment-item-content">{comment.content}</p>
                        <div className="comment-item-footer">
                          <button
                            type="button"
                            className={`btn btn-text ${comment.likedByMe ? 'liked' : ''}`}
                            onClick={() => handleToggleCommentLike(comment)}
                          >
                            ♥ {comment.likeCount}
                          </button>
                          {me?.id === comment.memberId && (
                            <>
                              <button
                                type="button"
                                className="btn btn-text"
                                onClick={() => handleStartEditComment(comment)}
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                className="btn btn-text"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                삭제
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </>
  )
}

export default CommunityDetailPage
