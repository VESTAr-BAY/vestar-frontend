import { useEffect, useState } from 'react'
import { fetchLiveTally, fetchResultSummaries } from '../../api/elections'
import type { RankedCandidate, VoteDetailData } from '../../types/vote'
import { useVoteDetail } from '../user/useVoteDetail'

export interface HostLiveTallyData {
  vote: VoteDetailData | null
  rankedCandidates: RankedCandidate[]
  totalVotes: number
  totalSubmissions: number
  totalInvalidVotes: number
  isLoading: boolean
}

export function useHostLiveTally(id: string): HostLiveTallyData {
  const { vote, isLoading: isVoteLoading } = useVoteDetail(id)
  const [rankedCandidates, setRankedCandidates] = useState<RankedCandidate[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [totalSubmissions, setTotalSubmissions] = useState(0)
  const [totalInvalidVotes, setTotalInvalidVotes] = useState(0)
  const [isTallyLoading, setIsTallyLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsTallyLoading(true)

    Promise.all([fetchLiveTally(id), fetchResultSummaries(id)])
      .then(([rows, summaries]) => {
        if (cancelled) return

        const tallyMap = new Map(rows.map((row) => [row.candidateKey, row.count]))
        const nextTotalVotes =
          summaries[0]?.totalValidVotes ?? rows.reduce((sum, row) => sum + row.count, 0)
        const nextTotalSubmissions = summaries[0]?.totalSubmissions ?? nextTotalVotes
        const nextTotalInvalidVotes = summaries[0]?.totalInvalidVotes ?? 0

        const nextRankedCandidates = (vote?.candidates ?? [])
          .map((candidate) => {
            const votes = tallyMap.get(candidate.id) ?? 0
            const percentage = nextTotalVotes > 0 ? (votes / nextTotalVotes) * 100 : 0

            return {
              ...candidate,
              votes,
              percentage,
              rank: 0,
            }
          })
          .sort((left, right) => right.votes - left.votes || left.name.localeCompare(right.name))
          .map((candidate, index) => ({
            ...candidate,
            rank: index + 1,
          }))

        setRankedCandidates(nextRankedCandidates)
        setTotalVotes(nextTotalVotes)
        setTotalSubmissions(nextTotalSubmissions)
        setTotalInvalidVotes(nextTotalInvalidVotes)
      })
      .catch(() => {
        if (cancelled) return
        setRankedCandidates([])
        setTotalVotes(0)
        setTotalSubmissions(0)
        setTotalInvalidVotes(0)
      })
      .finally(() => {
        if (!cancelled) {
          setIsTallyLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [id, vote?.candidates])

  return {
    vote,
    rankedCandidates,
    totalVotes,
    totalSubmissions,
    totalInvalidVotes,
    isLoading: isVoteLoading || isTallyLoading,
  }
}
