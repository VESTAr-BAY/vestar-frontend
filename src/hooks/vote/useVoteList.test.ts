import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useVoteList } from './useVoteList'

describe('useVoteList', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('starts with isLoading: true and empty data', () => {
    const { result } = renderHook(() => useVoteList())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.hotVotes).toHaveLength(0)
    expect(result.current.items).toHaveLength(0)
  })

  it('sets isLoading: false after delay', async () => {
    const { result } = renderHook(() => useVoteList())
    await act(async () => {
      vi.advanceTimersByTime(700)
    })
    expect(result.current.isLoading).toBe(false)
  })

  it('provides hotVotes after loading', async () => {
    const { result } = renderHook(() => useVoteList())
    await act(async () => {
      vi.advanceTimersByTime(700)
    })
    expect(result.current.hotVotes.length).toBeGreaterThan(0)
  })

  it('provides items after loading', async () => {
    const { result } = renderHook(() => useVoteList())
    await act(async () => {
      vi.advanceTimersByTime(700)
    })
    expect(result.current.items.length).toBeGreaterThan(0)
  })
})
