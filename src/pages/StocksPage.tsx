import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import { api, ApiError } from '../lib/apiClient'
import type { PriceSnapshot, StockInfo } from '../lib/types'
import { useAuth } from '../lib/useAuth'
import './StocksPage.css'

const PAGE_SIZE = 20
const PRICE_BATCH_SIZE = 4
const PRICE_BATCH_DELAY_MS = 250

type PriceLoadProgress = {
  completed: number
  total: number
}

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds))

function StocksPage() {
  const { me, authChecked, logout } = useAuth()
  const [stocks, setStocks] = useState<StockInfo[]>([])
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [prices, setPrices] = useState<Record<string, number | null>>({})
  const [priceSortDirection, setPriceSortDirection] = useState<'desc' | 'asc' | null>(null)
  const [isLoadingAllPrices, setIsLoadingAllPrices] = useState(false)
  const [priceLoadProgress, setPriceLoadProgress] = useState<PriceLoadProgress>({
    completed: 0,
    total: 0,
  })
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const requestedPriceCodesRef = useRef(new Set<string>())
  const allPricesLoadedRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

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

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [query])

  const sortedStocks = useMemo(() => {
    if (priceSortDirection === null) {
      return filteredStocks
    }

    return [...filteredStocks].sort((firstStock, secondStock) => {
      const firstPrice = prices[firstStock.stockCode]
      const secondPrice = prices[secondStock.stockCode]

      if (typeof firstPrice !== 'number' && typeof secondPrice !== 'number') {
        return firstStock.stockName.localeCompare(secondStock.stockName, 'ko-KR')
      }

      if (typeof firstPrice !== 'number') {
        return 1
      }

      if (typeof secondPrice !== 'number') {
        return -1
      }

      if (firstPrice === secondPrice) {
        return firstStock.stockName.localeCompare(secondStock.stockName, 'ko-KR')
      }

      return priceSortDirection === 'desc'
        ? secondPrice - firstPrice
        : firstPrice - secondPrice
    })
  }, [filteredStocks, prices, priceSortDirection])

  const visibleStocks = useMemo(
    () => sortedStocks.slice(0, visibleCount),
    [sortedStocks, visibleCount],
  )
  const hasMore = visibleCount < sortedStocks.length

  const loadPrices = useCallback(
    async (
      targetStocks: StockInfo[],
      onProgress?: (progress: PriceLoadProgress) => void,
    ) => {
      const pendingStocks = targetStocks.filter(
        (stock) => !requestedPriceCodesRef.current.has(stock.stockCode),
      )
      let completed = targetStocks.length - pendingStocks.length

      pendingStocks.forEach((stock) => requestedPriceCodesRef.current.add(stock.stockCode))
      onProgress?.({ completed, total: targetStocks.length })

      for (let index = 0; index < pendingStocks.length; index += PRICE_BATCH_SIZE) {
        const batch = pendingStocks.slice(index, index + PRICE_BATCH_SIZE)

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

        completed += batch.length
        onProgress?.({ completed, total: targetStocks.length })

        if (index + PRICE_BATCH_SIZE < pendingStocks.length) {
          await wait(PRICE_BATCH_DELAY_MS)
        }
      }
    },
    [],
  )

  const togglePriceSort = async () => {
    if (isLoadingAllPrices) return

    if (!allPricesLoadedRef.current) {
      setIsLoadingAllPrices(true)
      setPriceLoadProgress({ completed: 0, total: stocks.length })

      try {
        await loadPrices(stocks, (progress) => {
          if (mountedRef.current) {
            setPriceLoadProgress(progress)
          }
        })

        allPricesLoadedRef.current = true

        if (mountedRef.current) {
          setPriceSortDirection('desc')
        }
      } finally {
        if (mountedRef.current) {
          setIsLoadingAllPrices(false)
        }
      }

      return
    }

    setPriceSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))
  }

  useEffect(() => {
    void loadPrices(visibleStocks)
  }, [visibleStocks, loadPrices])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || !hasMore) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return

        setVisibleCount((current) =>
          Math.min(current + PAGE_SIZE, filteredStocks.length),
        )
      },
      { rootMargin: '160px 0px' },
    )

    observer.observe(target)

    return () => observer.disconnect()
  }, [filteredStocks.length, hasMore])

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

        {!loading && !errorMessage && visibleStocks.length > 0 && (
          <section className="card stocks-list-card" aria-label="종목 목록">
            <div className="stocks-list-header">
              <span>종목명</span>
              <button
                type="button"
                className="stock-price-sort-button"
                onClick={() => void togglePriceSort()}
                disabled={isLoadingAllPrices}
                aria-label={
                  isLoadingAllPrices
                    ? `전체 종목 시세 불러오는 중 ${priceLoadProgress.completed}/${priceLoadProgress.total}`
                    : priceSortDirection === 'desc'
                    ? '현재가 낮은 순으로 정렬'
                    : '현재가 높은 순으로 정렬'
                }
              >
                <span>
                  {isLoadingAllPrices
                    ? `${priceLoadProgress.completed}/${priceLoadProgress.total}`
                    : '현재가'}
                </span>
                <span className="stock-price-sort-icon" aria-hidden="true">
                  {isLoadingAllPrices
                    ? '…'
                    : priceSortDirection === 'desc'
                    ? '↓'
                    : priceSortDirection === 'asc'
                      ? '↑'
                      : '↕'}
                </span>
              </button>
              <span aria-hidden="true" />
            </div>

            <ul className="stocks-list">
              {visibleStocks.map((stock) => {
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
          <div ref={loadMoreRef} className="stocks-load-more" aria-live="polite">
            {hasMore
              ? `아래로 스크롤하면 ${Math.min(PAGE_SIZE, filteredStocks.length - visibleCount)}개를 더 불러옵니다.`
              : `전체 ${filteredStocks.length.toLocaleString('ko-KR')}개 종목을 모두 표시했습니다.`}
          </div>
        )}
      </main>
    </>
  )
}

export default StocksPage
