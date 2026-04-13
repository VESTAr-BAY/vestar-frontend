import { useEffect, useState } from 'react'
import { fetchCandidateManifest } from '../../api/candidateManifest'
import { fetchElections } from '../../api/elections'
import type { ApiElection } from '../../api/types'
import { HOT_VOTES } from '../../data/mockVotes'
import { applyManifestToElection, mapToHotVote } from '../../utils/electionMapper'
import { primeVoteDetailCacheFromElection } from '../../utils/voteDetailCache'
import { getViewCache, setViewCache } from '../../utils/viewCache'
import type { HotVote } from '../../types/vote'

const HOT_VOTES_CACHE_TTL_MS = 15_000

function parseVoteCount(value: string): number {
  const normalized = value.replace(/,/g, '').trim().toUpperCase()

  if (!normalized) return 0
  if (normalized.endsWith('M')) return Math.round(Number.parseFloat(normalized) * 1_000_000)
  if (normalized.endsWith('K')) return Math.round(Number.parseFloat(normalized) * 1_000)

  return Number.parseInt(normalized, 10) || 0
}

function getSubmissionCount(election: Pick<ApiElection, 'resultSummary'>): number {
  return election.resultSummary?.totalSubmissions ?? 0
}

function compareBySubmissionCount(left: ApiElection, right: ApiElection): number {
  const bySubmissionCount = getSubmissionCount(right) - getSubmissionCount(left)

  if (bySubmissionCount !== 0) {
    return bySubmissionCount
  }

  return Number(right.id) - Number(left.id)
}

function hotMockFallback(): HotVote[] {
  return [...HOT_VOTES]
    .filter((vote) => parseVoteCount(vote.count) >= 1)
    .sort((left, right) => parseVoteCount(right.count) - parseVoteCount(left.count))
    .slice(0, 4)
}

export interface UseVoteListResult {
  isLoading: boolean
  hotVotes: HotVote[]
}

/**
 * Fetches the HOT section (top ACTIVE elections) from the backend.
 * Falls back to mock data when VITE_API_BASE_URL is not configured or the request fails.
 */
export function useVoteList(): UseVoteListResult {
  const [isLoading, setIsLoading] = useState(true)
  const [hotVotes, setHotVotes] = useState<HotVote[]>([])

  useEffect(() => {
    let cancelled = false
    const cacheKey = 'vote-hot'
    const cachedHotVotes = getViewCache<HotVote[]>(cacheKey, HOT_VOTES_CACHE_TTL_MS)

    if (cachedHotVotes) {
      setHotVotes(cachedHotVotes)
      setIsLoading(false)
    }

    fetchElections({ onchainState: 'ACTIVE', sortBy: 'HOT' })
      .then((elections) => {
        if (cancelled || !elections) return
        return Promise.all(
          elections.map(async (election) => ({
              manifest: await fetchCandidateManifest(
                election.candidateManifestUri,
                election.candidateManifestHash,
              ),
              election,
            })),
        )
      })
      .then((entries) => {
        if (cancelled || !entries) return
        const elections = entries.map(({ election, manifest }) => {
          const hydratedElection = applyManifestToElection(election, manifest)
          primeVoteDetailCacheFromElection(hydratedElection, manifest)
          return hydratedElection
        })
        // sungje : HOT 리스트는 manifest 반영 후 참여자 1명 이상인 투표만 남기고 참여 수 기준으로 정렬한다.
        const hot = [...elections]
          .filter((election) => getSubmissionCount(election) >= 1)
          .sort(compareBySubmissionCount)
          .slice(0, 4)
          .map(mapToHotVote)
        setHotVotes(hot)
        setViewCache(cacheKey, hot)
      })
      .catch(() => {
        if (cancelled) return
        if (cachedHotVotes) {
          setHotVotes(cachedHotVotes)
          return
        }
        setHotVotes(hotMockFallback())
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { isLoading, hotVotes }
}
