import { describe, expect, it } from 'vitest'
import type { VoteDetailData } from '../types/vote'
import {
  getVoteSubmissionBlockButtonLabel,
  getVoteSubmissionBlockErrorMessage,
  resolveVoteSubmissionBlockReason,
} from './voteEligibility'

const baseVote: VoteDetailData = {
  id: 'vote-1',
  title: 'Vote title',
  org: 'Vote org',
  host: '0xhost',
  verified: false,
  emoji: '🗳️',
  badge: 'live',
  deadlineLabel: '1h left',
  urgent: false,
  startDate: '2026.04.13 12:00',
  endDate: '2026.04.13 18:00',
  endDateISO: '2026-04-13T18:00:00.000Z',
  resultReveal: '2026.04.13 18:00',
  minKarmaTier: 2,
  maxChoices: 1,
  participantCount: 0,
  goalVotes: 0,
  voteFrequency: '1 per election',
  voteLimit: '1 vote per ballot',
  resultPublic: true,
  candidates: [],
}

describe('resolveVoteSubmissionBlockReason', () => {
  it('returns tier when the connected tier is lower than the vote requirement', () => {
    expect(
      resolveVoteSubmissionBlockReason({
        vote: baseVote,
        canSubmitBallot: false,
        remainingBallots: 1,
        currentTierId: 1,
      }),
    ).toBe('tier')
  })

  it('returns ballots when the user has no remaining ballots', () => {
    expect(
      resolveVoteSubmissionBlockReason({
        vote: baseVote,
        canSubmitBallot: false,
        remainingBallots: 0,
        currentTierId: 4,
      }),
    ).toBe('ballots')
  })
})

describe('vote eligibility messages', () => {
  it('renders a tier-specific error message', () => {
    expect(getVoteSubmissionBlockErrorMessage('tier', 'ko', baseVote)).toContain(
      '티어 2 · Newbie 이상',
    )
    expect(getVoteSubmissionBlockErrorMessage('tier', 'en', baseVote)).toContain(
      'Tier 2 · Newbie or higher',
    )
  })

  it('renders distinct button labels for each blocked reason', () => {
    expect(getVoteSubmissionBlockButtonLabel('tier', 'ko')).toBe(
      '티어가 낮아서 참여할 수 없어요.',
    )
    expect(getVoteSubmissionBlockButtonLabel('ballots', 'ko')).toBe(
      '투표권을 모두 사용했어요.',
    )
  })
})
