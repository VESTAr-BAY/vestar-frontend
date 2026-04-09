import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchElections } from '../../api/elections'
import type { ApiElection, ApiElectionState } from '../../api/types'
import { useInfiniteVotes } from './useInfiniteVotes'

vi.mock('../../api/elections', () => ({
  fetchElections: vi.fn().mockRejectedValue(new Error('offline')),
}))

const fetchElectionsMock = vi.mocked(fetchElections)

function createElection({
  id,
  onchainState = 'ACTIVE',
  totalSubmissions = 0,
}: {
  id: string
  onchainState?: ApiElectionState
  totalSubmissions?: number
}): ApiElection {
  return {
    id,
    draftId: null,
    onchainSeriesId: null,
    onchainElectionId: `election-${id}`,
    onchainElectionAddress: null,
    candidateManifestHash: null,
    candidateManifestUri: null,
    organizerWalletAddress: '0x0000000000000000000000000000000000000001',
    organizerVerifiedSnapshot: false,
    organizer: null,
    visibilityMode: 'OPEN',
    paymentMode: 'FREE',
    ballotPolicy: 'ONE_PER_ELECTION',
    startAt: '2026-04-09T00:00:00.000Z',
    endAt: '2026-04-10T00:00:00.000Z',
    resultRevealAt: '2026-04-10T00:00:00.000Z',
    minKarmaTier: 0,
    resetIntervalSeconds: 0,
    allowMultipleChoice: false,
    maxSelectionsPerSubmission: 1,
    timezoneWindowOffset: 0,
    paymentToken: null,
    costPerBallot: '0',
    onchainState,
    title: `Vote ${id}`,
    coverImageUrl: null,
    syncState: null,
    series: null,
    electionKey: null,
    electionCandidates: [],
    validDecryptedBallotCount: 0,
    resultSummary: {
      id: `summary-${id}`,
      electionRefId: id,
      totalSubmissions,
      totalDecryptedBallots: 0,
      totalValidVotes: 0,
      totalInvalidVotes: 0,
      createdAt: '2026-04-09T00:00:00.000Z',
      updatedAt: '2026-04-09T00:00:00.000Z',
    },
  }
}

describe('useInfiniteVotes', () => {
  beforeEach(() => {
    fetchElectionsMock.mockReset()
    fetchElectionsMock.mockRejectedValue(new Error('offline'))
  })

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

  it('sorts hot votes by participation and excludes zero-submission elections', async () => {
    fetchElectionsMock.mockResolvedValue([
      createElection({ id: '1', totalSubmissions: 0 }),
      createElection({ id: '2', totalSubmissions: 12 }),
      createElection({ id: '3', totalSubmissions: 7 }),
    ])

    const { result } = renderHook(() => useInfiniteVotes('hot'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.allItems.map((item) => item.id)).toEqual(['2', '3'])
  })
})
