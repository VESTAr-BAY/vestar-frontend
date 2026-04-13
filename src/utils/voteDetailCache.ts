import type { ApiElection } from '../api/types'
import type { VoteDetailData } from '../types/vote'
import type { CandidateManifest } from './candidateManifest'
import { mapToVoteDetail } from './electionMapper'
import { getViewCache, setViewCache } from './viewCache'

export type VoteDetailCacheValue = {
  participantCount: number
  vote: VoteDetailData
}

export const VOTE_DETAIL_CACHE_TTL_MS = 15_000

function getVoteDetailCacheKey(id: string) {
  return `vote-detail:${id}`
}

export function getCachedVoteDetail(id: string) {
  return getViewCache<VoteDetailCacheValue>(getVoteDetailCacheKey(id), VOTE_DETAIL_CACHE_TTL_MS)
}

export function setCachedVoteDetail(id: string, value: VoteDetailCacheValue) {
  setViewCache(getVoteDetailCacheKey(id), value)
}

export function primeVoteDetailCacheFromElection(
  election: ApiElection,
  manifest?: CandidateManifest | null,
) {
  const vote = mapToVoteDetail(election, undefined, undefined, undefined, manifest)
  const value: VoteDetailCacheValue = {
    vote,
    participantCount: vote.participantCount,
  }

  setCachedVoteDetail(election.id, value)
  return value
}
