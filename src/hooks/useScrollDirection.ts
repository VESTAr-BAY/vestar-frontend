import { useCallback, useRef, useState } from 'react'

export type ScrollState = 'default' | 'hidden' | 'floating'

export function useScrollDirection(threshold = 4) {
  const [scrollState, setScrollState] = useState<ScrollState>('default')
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  const onScroll = useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      if (ticking.current) return
      const el = e.currentTarget
      ticking.current = true
      requestAnimationFrame(() => {
        const currentY = el.scrollTop
        const diff = currentY - lastScrollY.current
        if (currentY < 10) {
          setScrollState('default')
        } else if (diff > threshold) {
          setScrollState('hidden')
        } else if (diff < -threshold) {
          setScrollState('floating')
        }
        lastScrollY.current = currentY
        ticking.current = false
      })
    },
    [threshold],
  )

  return { scrollState, onScroll }
}