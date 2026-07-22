import { useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import { api, ApiError } from '../lib/apiClient'
import type { FavoriteStock, PriceSnapshot, StockInfo } from '../lib/types'
import { useAuth } from '../lib/useAuth'
import './StocksPage.css'

// 한 페이지에 보여줄 개수. 페이지를 넘길 때마다 종목 수만큼 시세 API를
// 개별 호출하므로, 한 번에 너무 많이 쏘지 않도록 20개 미만으로 유지한다.
const PAGE_SIZE = 12

function StocksPage() {
  const { me, authChecked, logout } = useAuth()
  const [stocks, setStocks] = useState<StockInfo[]>([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [prices, setPrices] = useState<Record<string, number | null>>({})
  const [favoriteStocks, setFavoriteStocks] = useState<FavoriteStock[] | null>(null)
  const [favoritePrices, setFavoritePrices] = useState<Record<string, number | null>>({})
  const [favoriteSubmittingCode, setFavoriteSubmittingCode] = useState<string | null>(null)
  const requestedPriceCodesRef = useRef(new Set<string>())
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    api
      .get<StockInfo[]>('/api/price/stocks')
      .then(setStocks)
      .catch((error) => {
        setErrorMessage(
          error instanceof ApiError ? error.message : '종목 목록을 불러오지 못했습니다.',
        )
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!authChecked) return
    if (!me) {
      setFavoriteStocks([])
      return
    }

    api
      .get<FavoriteStock[]>('/api/member/favorite-stocks')
      .then(setFavoriteStocks)
      .catch(() => setFavoriteStocks([]))
  }, [authChecked, me])

  useEffect(() => {
    if (!favoriteStocks || favoriteStocks.length === 0) return

    favoriteStocks.forEach((stock) => {
      if (favoritePrices[stock.stockCode] !== undefined) return

      api
        .get<PriceSnapshot>(`/api/price/${stock.stockCode}`)
        .then((snapshot) => {
          const price = Number(snapshot.stck_prpr)
          setFavoritePrices((current) => ({
            ...current,
            [stock.stockCode]: Number.isFinite(price) ? price : null,
          }))
        })
        .catch(() => {
          setFavoritePrices((current) => ({ ...current, [stock.stockCode]: null }))
        })
    })
  }, [favoriteStocks])

  const favoriteStockCodes = useMemo(
    () => new Set((favoriteStocks ?? []).map((stock) => stock.stockCode)),
    [favoriteStocks],
  )

  const addFavorite = async (stock: StockInfo) => {
    await api.post('/api/member/favorite-stocks', { stockCode: stock.stockCode })
    setFavoriteStocks((current) => [
      ...(current ?? []),
      { id: -1, stockCode: stock.stockCode, stockName: stock.stockName },
    ])
  }

  const removeFavorite = async (stockCode: string) => {
    await api.del(`/api/member/favorite-stocks/${stockCode}`)
    setFavoriteStocks((current) => (current ?? []).filter((item) => item.stockCode !== stockCode))
  }

  const handleToggleFavorite = async (stock: StockInfo) => {
    if (!me || favoriteSubmittingCode) return

    setFavoriteSubmittingCode(stock.stockCode)

    try {
      if (favoriteStockCodes.has(stock.stockCode)) {
        await removeFavorite(stock.stockCode)
      } else {
        await addFavorite(stock)
      }
    } catch {
      // 실패 시 조용히 무시, 별표는 그대로 다시 눌러볼 수 있음
    } finally {
      setFavoriteSubmittingCode(null)
    }
  }

  const handleRemoveFavoriteChip = async (stockCode: string) => {
    if (favoriteSubmittingCode) return

    setFavoriteSubmittingCode(stockCode)

    try {
      await removeFavorite(stockCode)
    } catch {
      // 실패 시 조용히 무시
    } finally {
      setFavoriteSubmittingCode(null)
    }
  }

  const filteredStocks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR')

    if (!normalizedQuery) return stocks

    return stocks.filter(
      (stock) =>
        stock.stockName.toLocaleLowerCase('ko-KR').includes(normalizedQuery) ||
        stock.stockCode.includes(normalizedQuery),
    )
  }, [query, stocks])

  const totalPages = Math.max(1, Math.ceil(filteredStocks.length / PAGE_SIZE))

  // 검색어가 바뀌면 결과 범위가 바뀌니 1페이지로 되돌린다.
  useEffect(() => {
    setPage(1)
  }, [query])

  // 검색 결과가 줄어들어 현재 페이지가 범위를 벗어나면 마지막 페이지로 보정한다.
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const pagedStocks = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredStocks.slice(start, start + PAGE_SIZE)
  }, [filteredStocks, page])

  useEffect(() => {
    const pendingStocks = pagedStocks.filter(
      (stock) => !requestedPriceCodesRef.current.has(stock.stockCode),
    )

    pendingStocks.forEach((stock) => requestedPriceCodesRef.current.add(stock.stockCode))

    const loadPrices = async () => {
      const batchSize = 4

      for (let index = 0; index < pendingStocks.length; index += batchSize) {
        const batch = pendingStocks.slice(index, index + batchSize)

        await Promise.all(
          batch.map(async (stock) => {
            try {
              const snapshot = await api.get<PriceSnapshot>(`/api/price/${stock.stockCode}`)
              const price = Number(snapshot.stck_prpr)

              if (mountedRef.current) {
                setPrices((current) => ({
                  ...current,
                  [stock.stockCode]: Number.isFinite(price) ? price : null,
                }))
              }
            } catch {
              if (mountedRef.current) {
                setPrices((current) => ({ ...current, [stock.stockCode]: null }))
              }
            }
          }),
        )
      }
    }

    void loadPrices()
  }, [pagedStocks])

  return (
    <>
      <Navbar me={me} authChecked={authChecked} onLogout={logout} />

      <main className="stocks-main">
        <div className="stocks-heading">
          <div>
            <span className="section-eyebrow">STOCKS</span>
            <h1>전체 종목</h1>
            <p>종목명 또는 종목코드로 원하는 주식을 찾아보세요.</p>
          </div>

          {!loading && !errorMessage && (
            <span className="stocks-count">총 {filteredStocks.length.toLocaleString('ko-KR')}개</span>
          )}
        </div>

        {authChecked && me && (
          <section className="card favorite-stocks-card" aria-label="관심종목">
            <div className="favorite-stocks-header">
              <span className="section-eyebrow">MY FAVORITES</span>
              <h2>관심종목</h2>
            </div>

            {favoriteStocks === null ? (
              <p className="favorite-stocks-empty">관심종목을 불러오는 중입니다.</p>
            ) : favoriteStocks.length === 0 ? (
              <p className="favorite-stocks-empty">
                등록된 관심종목이 없습니다. 종목 상세페이지에서 별표를 눌러 등록해 보세요.
              </p>
            ) : (
              <ul className="favorite-stocks-list">
                {favoriteStocks.map((stock) => (
                  <li key={stock.stockCode} className="favorite-stock-chip">
                    <a href={`/stocks/${stock.stockCode}`} className="favorite-stock-chip-link">
                      <span>{stock.stockName}</span>
                      <span className="favorite-stock-price">
                        {favoritePrices[stock.stockCode] === undefined
                          ? '조회 중…'
                          : favoritePrices[stock.stockCode] === null
                            ? '-'
                            : `${favoritePrices[stock.stockCode]!.toLocaleString('ko-KR')}원`}
                      </span>
                    </a>
                    <button
                      type="button"
                      className="favorite-chip-remove"
                      onClick={() => handleRemoveFavoriteChip(stock.stockCode)}
                      disabled={favoriteSubmittingCode === stock.stockCode}
                      aria-label={`${stock.stockName} 관심종목 해제`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <div className="stocks-search-wrap">
          <label htmlFor="stock-search" className="stocks-search-label">
            종목 검색
          </label>
          <input
            id="stock-search"
            type="search"
            className="input stocks-search-input"
            placeholder="종목명 또는 종목코드 입력"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </div>

        {errorMessage && <p className="alert-error">{errorMessage}</p>}

        {loading && (
          <div className="card stocks-state" role="status">
            종목 목록을 불러오는 중입니다.
          </div>
        )}

        {!loading && !errorMessage && filteredStocks.length === 0 && (
          <div className="card stocks-state">
            <strong>검색 결과가 없습니다.</strong>
            <span>다른 종목명이나 종목코드로 검색해 주세요.</span>
          </div>
        )}

        {!loading && !errorMessage && pagedStocks.length > 0 && (
          <section className="card stocks-list-card" aria-label="종목 목록">
            <div className="stocks-list-header" aria-hidden="true">
              <span>종목명</span>
              <span>현재가</span>
            </div>

            <ul className="stocks-list">
              {pagedStocks.map((stock) => {
                const currentPrice = prices[stock.stockCode]
                const isFavorite = favoriteStockCodes.has(stock.stockCode)

                return (
                  <li key={stock.stockCode} className="stock-list-row">
                    {me && (
                      <button
                        type="button"
                        className={`favorite-star-btn favorite-star-btn-list ${
                          isFavorite ? 'favorite-star-active' : ''
                        }`}
                        onClick={() => handleToggleFavorite(stock)}
                        disabled={favoriteSubmittingCode === stock.stockCode}
                        aria-label={
                          isFavorite ? `${stock.stockName} 관심종목 해제` : `${stock.stockName} 관심종목 등록`
                        }
                        aria-pressed={isFavorite}
                      >
                        {isFavorite ? '★' : '☆'}
                      </button>
                    )}

                    <a
                      href={`/stocks/${stock.stockCode}`}
                      className="stock-list-item"
                      aria-label={`${stock.stockName} 상세 보기`}
                    >
                      <span className="stock-list-name">{stock.stockName}</span>
                      <span className="stock-list-price">
                        {currentPrice === undefined
                          ? '조회 중…'
                          : currentPrice === null
                            ? '-'
                            : `${currentPrice.toLocaleString('ko-KR')}원`}
                      </span>
                      <span className="stock-list-arrow" aria-hidden="true">
                        →
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {!loading && !errorMessage && filteredStocks.length > 0 && (
          <nav className="stocks-pagination" aria-label="종목 목록 페이지">
            <button
              type="button"
              className="btn btn-default"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
            >
              이전
            </button>

            <span className="stocks-pagination-status">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              className="btn btn-default"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
            >
              다음
            </button>
          </nav>
        )}
      </main>
    </>
  )
}

export default StocksPage
