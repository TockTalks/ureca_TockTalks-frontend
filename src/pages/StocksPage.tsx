import { useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import { api, ApiError } from '../lib/apiClient'
import type { PriceSnapshot, StockInfo } from '../lib/types'
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

                return (
                  <li key={stock.stockCode}>
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
