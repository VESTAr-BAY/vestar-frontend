import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchElections } from '../../api/elections'
import type { ApiElection } from '../../api/types'
import { useVoteList } from './useVoteList'

vi.mock('../../api/elections', () => ({
  fetchElections: vi.fn().mockRejectedValue(new Error('offline')),
}))

const fetchElectionsMock = vi.mocked(fetchElections)

function createElection(id: string, totalSubmissions: number): ApiElection {
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
    onchainState: 'ACTIVE',
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

describe('useVoteList', () => {
  beforeEach(() => {
    fetchElectionsMock.mockReset()
    fetchElectionsMock.mockRejectedValue(new Error('offline'))
  })

  it('keeps only active elections with at least one participant and sorts them by participation', async () => {
    fetchElectionsMock.mockResolvedValue([
      createElection('1', 0),
      createElection('2', 42),
      createElection('3', 12),
    ])

    const { result } = renderHook(() => useVoteList())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.hotVotes.map((vote) => vote.id)).toEqual(['2', '3'])
  })
})
