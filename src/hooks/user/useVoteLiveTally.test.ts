import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiElectionResultSummary } from '../../api/types'
import type { VoteDetailData } from '../../types/vote'
import { useVoteLiveTally } from './useVoteLiveTally'

const mockFetchResultSummaries =
  vi.fn<(electionId: string) => Promise<ApiElectionResultSummary[]>>()
const mockFetchLiveTally = vi.fn()

let mockVoteDetailState: {
  vote: VoteDetailData | null
  isLoading: boolean
  participantCount: number
  applyOptimisticSubmission: (candidateKeys: string[]) => void
}

vi.mock('../../api/elections', () => ({
  fetchResultSummaries: (electionId: string) => mockFetchResultSummaries(electionId),
  fetchLiveTally: () => mockFetchLiveTally(),
}))

vi.mock('./useVoteDetail', () => ({
  useVoteDetail: () => mockVoteDetailState,
}))

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

function buildSummary(totalSubmissions: number, totalValidVotes: number): ApiElectionResultSummary {
  return {
    id: 'summary-1',
    electionRefId: '1476',
    totalSubmissions,
    totalDecryptedBallots: totalSubmissions,
    totalValidVotes,
    totalInvalidVotes: 0,
    createdAt: '2026-04-15T00:00:00.000Z',
    updatedAt: '2026-04-15T00:00:00.000Z',
  }
}

const baseVote: VoteDetailData = {
  id: '1476',
  onchainElectionId: '0x1476',
  onchainState: 'ACTIVE',
  title: 'Live tally vote',
  org: 'VESTAr',
  host: 'host-1',
  verified: true,
  emoji: '',
  badge: 'live',
  deadlineLabel: '30m left',
  urgent: false,
  startDate: '2026.04.15 12:00',
  endDate: '2026.04.15 15:00',
  endDateISO: '2026-04-15T15:00:00.000Z',
  resultReveal: '2026.04.15 15:00',
  minKarmaTier: 0,
  maxChoices: 1,
  participantCount: 12,
  goalVotes: 0,
  voteFrequency: 'Unlimited paid',
  voteLimit: 'Up to 1 choice',
  resultPublic: true,
  visibilityMode: 'OPEN',
  candidates: [
    {
      id: 'candidate-1',
      name: 'Candidate 1',
      group: '',
      emoji: '',
      emojiColor: '#F0EDFF',
      votes: 8,
    },
    {
      id: 'candidate-2',
      name: 'Candidate 2',
      group: '',
      emoji: '',
      emojiColor: '#F0EDFF',
      votes: 4,
    },
  ],
}

describe('useVoteLiveTally', () => {
  beforeEach(() => {
    mockVoteDetailState = {
      vote: baseVote,
      isLoading: false,
      participantCount: baseVote.participantCount,
      applyOptimisticSubmission: vi.fn(),
    }
    mockFetchResultSummaries.mockReset()
    mockFetchLiveTally.mockReset()
    mockFetchLiveTally.mockResolvedValue([])
  })

  it('keeps the existing tally visible while refreshing the same vote id', async () => {
    mockFetchResultSummaries.mockResolvedValueOnce([buildSummary(12, 12)])

    const { result, rerender } = renderHook(({ id }) => useVoteLiveTally(id), {
      initialProps: { id: '1476' },
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.result?.id).toBe('1476')
    expect(result.current.totalSubmissions).toBe(12)

    const refreshDeferred = createDeferred<ApiElectionResultSummary[]>()
    mockFetchResultSummaries.mockReturnValueOnce(refreshDeferred.promise)

    mockVoteDetailState = {
      ...mockVoteDetailState,
      vote: {
        ...baseVote,
        participantCount: 13,
      },
      participantCount: 13,
    }

    await act(async () => {
      rerender({ id: '1476' })
      await Promise.resolve()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.result?.id).toBe('1476')
    expect(result.current.totalSubmissions).toBe(12)

    await act(async () => {
      refreshDeferred.resolve([buildSummary(13, 12)])
      await refreshDeferred.promise
    })

    await waitFor(() => {
      expect(result.current.totalSubmissions).toBe(13)
    })
  })

  it('shows blocking loading when the vote id changes', async () => {
    mockFetchResultSummaries.mockResolvedValueOnce([buildSummary(12, 12)])

    const { result, rerender } = renderHook(({ id }) => useVoteLiveTally(id), {
      initialProps: { id: '1476' },
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const nextVote: VoteDetailData = {
      ...baseVote,
      id: '1477',
      title: 'Another live tally vote',
      participantCount: 3,
      candidates: [
        {
          id: 'candidate-3',
          name: 'Candidate 3',
          group: '',
          emoji: '',
          emojiColor: '#F0EDFF',
          votes: 3,
        },
      ],
    }

    const nextVoteDeferred = createDeferred<ApiElectionResultSummary[]>()
    mockFetchResultSummaries.mockReturnValueOnce(nextVoteDeferred.promise)
    mockVoteDetailState = {
      vote: nextVote,
      isLoading: false,
      participantCount: 3,
      applyOptimisticSubmission: vi.fn(),
    }

    await act(async () => {
      rerender({ id: '1477' })
      await Promise.resolve()
    })

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      nextVoteDeferred.resolve([
        {
          ...buildSummary(3, 3),
          electionRefId: '1477',
        },
      ])
      await nextVoteDeferred.promise
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.result?.id).toBe('1477')
  })
})
