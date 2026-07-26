import { useLayoutEffect, useRef } from 'react'

const DURATION_MS = 400

// 리스트 순서가 바뀔 때 각 행을 "이전 위치 -> 새 위치"로 이동한 것처럼 보이게 하는 FLIP 애니메이션 훅.
// keys는 매 렌더마다 최신 순서로 넘겨준다.
export function useFlipRows<K extends string | number>(keys: K[]) {
  const elements = useRef(new Map<K, HTMLElement>())
  const prevRects = useRef(new Map<K, DOMRect>())

  useLayoutEffect(() => {
    const nextRects = new Map<K, DOMRect>()
    elements.current.forEach((el, key) => {
      nextRects.set(key, el.getBoundingClientRect())
    })

    keys.forEach((key) => {
      const el = elements.current.get(key)
      const prev = prevRects.current.get(key)
      const next = nextRects.get(key)
      if (!el || !prev || !next) return

      const deltaY = prev.top - next.top
      if (deltaY === 0) return

      el.style.transition = 'none'
      el.style.transform = `translateY(${deltaY}px)`

      requestAnimationFrame(() => {
        el.style.transition = `transform ${DURATION_MS}ms ease-out`
        el.style.transform = ''
      })
    })

    prevRects.current = nextRects
  })

  return (key: K) => (el: HTMLElement | null) => {
    if (el) elements.current.set(key, el)
    else elements.current.delete(key)
  }
}
