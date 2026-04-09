import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useInfiniteVotes } from './useInfiniteVotes'

vi.mock('../../api/elections', () => ({
  fetchElections: vi.fn().mockRejectedValue(new Error('offline')),
}))

describe('useInfiniteVotes', () => {
  it('starts with exactly 6 items', async () => {
    const { result } = renderHook(() => useInfiniteVotes())
    await waitFor(() => expect(result.current.items).toHaveLength(6))
  })

  it('hasMore is true when more items are available', async () => {
    const { result } = renderHook(() => useInfiniteVotes())
    await waitFor(() => expect(result.current.hasMore).toBe(true))
  })

  it('isLoadingMore starts false', async () => {
    const { result } = renderHook(() => useInfiniteVotes())
    await waitFor(() => expect(result.current.items).toHaveLength(6))
    expect(result.current.isLoadingMore).toBe(false)
  })

  it('loadMore adds 6 more items', async () => {
    const { result } = renderHook(() => useInfiniteVotes())
    await waitFor(() => expect(result.current.items).toHaveLength(6))

    act(() => {
      result.current.loadMore()
    })

    await waitFor(() => expect(result.current.items).toHaveLength(12))
  })

  it('isLoadingMore becomes true during load, then false', async () => {
    const { result } = renderHook(() => useInfiniteVotes())
    await waitFor(() => expect(result.current.items).toHaveLength(6))

    act(() => {
      result.current.loadMore()
    })

    expect(result.current.isLoadingMore).toBe(true)
    await waitFor(() => expect(result.current.isLoadingMore).toBe(false))
  })

  it('hasMore becomes false when all items are loaded', async () => {
    const { result } = renderHook(() => useInfiniteVotes())
    await waitFor(() => expect(result.current.items).toHaveLength(6))

    // Load all pages
    for (let i = 0; i < 10; i++) {
      if (!result.current.hasMore) break
      await act(async () => {
        result.current.loadMore()
      })
      await waitFor(() => expect(result.current.isLoadingMore).toBe(false))
    }

    expect(result.current.hasMore).toBe(false)
  })

  it('loadMore is a no-op when hasMore is false', async () => {
    const { result } = renderHook(() => useInfiniteVotes())
    await waitFor(() => expect(result.current.items).toHaveLength(6))

    for (let i = 0; i < 10; i++) {
      if (!result.current.hasMore) break
      await act(async () => {
        result.current.loadMore()
      })
      await waitFor(() => expect(result.current.isLoadingMore).toBe(false))
    }

    const countAtEnd = result.current.items.length

    await act(async () => {
      result.current.loadMore()
    })

    expect(result.current.items).toHaveLength(countAtEnd)
  })
})
