import { beforeEach, describe, expect, it } from 'vitest'
import type { ApiElection } from '../api/types'
import type { CandidateManifest } from './candidateManifest'
import { applyManifestToElection, mapToVoteDetail } from './electionMapper'

function createElection(overrides: Partial<ApiElection> = {}): ApiElection {
  return {
    id: '378',
    draftId: null,
    onchainSeriesId: '0xseries',
    onchainElectionId: '0x417fb1753dc71e38a79e24bc15ce9a277928157d644f9cea31cbf328af6c6e86',
    onchainElectionAddress: '0x1111111111111111111111111111111111111111',
    candidateManifestHash: '0x00cceb192418ffe8b5cd8091475d8e0ca976e3906da2fc4744b0c4a469c70a18',
    candidateManifestUri: 'ipfs://bafkreidvxdvtpk6rpjdkdydagic4tfowapkyrkzb27iue6kncj36oepzuq',
    organizerWalletAddress: '0x0000000000000000000000000000000000000001',
    organizerVerifiedSnapshot: false,
    organizer: null,
    visibilityMode: 'PRIVATE',
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
    title: null,
    coverImageUrl: null,
    syncState: null,
    series: null,
    electionKey: null,
    electionCandidates: [],
    validDecryptedBallotCount: 0,
    resultSummary: null,
    ...overrides,
  }
}

describe('electionMapper', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('keeps manifest candidates even when draft and local metadata are missing', () => {
    const manifest: CandidateManifest = {
      schema: 'vestar.candidate-manifest',
      version: 1,
      election: {
        category: '음악방송',
      },
      candidates: [
        {
          candidateKey: '아임영',
          displayName: '아임영',
          displayOrder: 1,
          groupLabel: null,
          imageUrl: 'ipfs://candidate-1',
        },
        {
          candidateKey: '김하온',
          displayName: '김하온',
          displayOrder: 2,
          groupLabel: null,
          imageUrl: 'ipfs://candidate-2',
        },
      ],
    }

    const mapped = mapToVoteDetail(createElection(), undefined, undefined, undefined, manifest)

    expect(mapped.candidates).toHaveLength(2)
    expect(mapped.candidates.map((candidate) => candidate.name)).toEqual(['아임영', '김하온'])
    expect(mapped.candidates.map((candidate) => candidate.imageUrl)).toEqual([
      'ipfs://candidate-1',
      'ipfs://candidate-2',
    ])
  })

  it('applies legacy manifest title and series preimage when db metadata is missing', () => {
    const manifest: CandidateManifest = {
      schema: 'vestar.candidate-manifest',
      version: 1,
      series: {
        preimage: 'MAMA 2026',
        coverImageUrl: 'ipfs://series-cover',
      },
      election: {
        title: 'Best Male Solo',
        coverImageUrl: 'ipfs://vote-cover',
      },
      candidates: [
        {
          candidateKey: 'candidate-1',
          displayName: 'Candidate 1',
          displayOrder: 1,
          groupLabel: null,
          imageUrl: null,
        },
      ],
    }

    const applied = applyManifestToElection(createElection(), manifest)

    expect(applied.title).toBe('Best Male Solo')
    expect(applied.series).toMatchObject({
      seriesPreimage: 'MAMA 2026',
      coverImageUrl: 'ipfs://series-cover',
    })
    expect(applied.coverImageUrl).toBe('ipfs://vote-cover')
  })
})
