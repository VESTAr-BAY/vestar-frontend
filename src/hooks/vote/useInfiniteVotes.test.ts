import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useInfiniteVotes } from './useInfiniteVotes'

describe('useInfiniteVotes', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('starts with exactly 6 items', () => {
    const { result } = renderHook(() => useInfiniteVotes())
    expect(result.current.items).toHaveLength(6)
  })

  it('hasMore is true when more items are available', () => {
    const { result } = renderHook(() => useInfiniteVotes())
    expect(result.current.hasMore).toBe(true)
  })

  it('isLoadingMore starts false', () => {
    const { result } = renderHook(() => useInfiniteVotes())
    expect(result.current.isLoadingMore).toBe(false)
  })

  it('loadMore adds 6 more items', async () => {
    const { result } = renderHook(() => useInfiniteVotes())
    await act(async () => {
      result.current.loadMore()
      vi.advanceTimersByTime(600)
    })
    expect(result.current.items).toHaveLength(12)
  })

  it('isLoadingMore becomes true during load, then false', async () => {
    const { result } = renderHook(() => useInfiniteVotes())
    act(() => {
      result.current.loadMore()
    })
    expect(result.current.isLoadingMore).toBe(true)
    await act(async () => {
      vi.advanceTimersByTime(600)
    })
    expect(result.current.isLoadingMore).toBe(false)
  })

  it('hasMore becomes false when all items are loaded', async () => {
    const { result } = renderHook(() => useInfiniteVotes())
    // Load all pages
    for (let i = 0; i < 10; i++) {
      if (!result.current.hasMore) break
      await act(async () => {
        result.current.loadMore()
        vi.advanceTimersByTime(600)
      })
    }
    expect(result.current.hasMore).toBe(false)
  })

  it('loadMore is a no-op when hasMore is false', async () => {
    const { result } = renderHook(() => useInfiniteVotes())
    for (let i = 0; i < 10; i++) {
      if (!result.current.hasMore) break
      await act(async () => {
        result.current.loadMore()
        vi.advanceTimersByTime(600)
      })
    }
    const countAtEnd = result.current.items.length
    await act(async () => {
      result.current.loadMore()
      vi.advanceTimersByTime(600)
    })
    expect(result.current.items).toHaveLength(countAtEnd)
  })
})
