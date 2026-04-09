import { useEffect, useState } from 'react'
import { fetchElections } from '../../api/elections'
import { HOT_VOTES } from '../../data/mockVotes'
import { mapToHotVote } from '../../utils/electionMapper'
import type { HotVote } from '../../types/vote'

function hotMockFallback(): HotVote[] {
  return HOT_VOTES.slice(0, 4)
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

    fetchElections({ onchainState: 'ACTIVE', sortBy: 'HOT' })
      .then((elections) => {
        if (cancelled) return
        const hot = elections
          .sort(
            (left, right) =>
              (right.resultSummary?.totalSubmissions ?? 0) -
              (left.resultSummary?.totalSubmissions ?? 0),
          )
          .slice(0, 4)
          .map(mapToHotVote)
        setHotVotes(hot.length > 0 ? hot : hotMockFallback())
      })
      .catch(() => {
        if (cancelled) return
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
