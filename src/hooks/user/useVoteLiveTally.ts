import { useEffect, useState } from 'react'
import { fetchLiveTally, fetchResultSummaries } from '../../api/elections'
import type { RankedCandidate, VoteResultData } from '../../types/vote'
import { assignCompetitionRanks } from '../../utils/ranking'
import { useVoteDetail } from './useVoteDetail'

export interface UseVoteLiveTallyResult {
  result: VoteResultData | null
  totalSubmissions: number
  totalInvalidVotes: number
  isLoading: boolean
}

export function useVoteLiveTally(id: string): UseVoteLiveTallyResult {
  const { vote, isLoading: isVoteLoading, participantCount } = useVoteDetail(id)
  const [result, setResult] = useState<VoteResultData | null>(null)
  const [totalSubmissions, setTotalSubmissions] = useState(0)
  const [totalInvalidVotes, setTotalInvalidVotes] = useState(0)
  const [isTallyLoading, setIsTallyLoading] = useState(true)

  useEffect(() => {
    if (!vote) {
      setResult(null)
      setTotalSubmissions(0)
      setTotalInvalidVotes(0)
      setIsTallyLoading(false)
      return
    }

    let cancelled = false
    setIsTallyLoading(true)

    Promise.all([
      fetchResultSummaries(id),
      vote.visibilityMode === 'PRIVATE' ? fetchLiveTally(id) : Promise.resolve([]),
    ])
      .then(([summaries, rows]) => {
        if (cancelled) return

        const summary = summaries[0]
        const tallyMap = new Map(rows.map((row) => [row.candidateKey, row.count]))

        const nextRankedCandidates = vote.candidates
          .map((candidate) => ({
            ...candidate,
            votes:
              vote.visibilityMode === 'OPEN'
                ? (candidate.votes ?? 0)
                : (tallyMap.get(candidate.id) ?? 0),
            percentage: 0,
            rank: 0,
          }))
          .sort((left, right) => right.votes - left.votes || left.name.localeCompare(right.name))

        const nextTotalVotes =
          vote.visibilityMode === 'OPEN'
            ? nextRankedCandidates.reduce((sum, candidate) => sum + candidate.votes, 0)
            : (summary?.totalValidVotes ??
              nextRankedCandidates.reduce((sum, candidate) => sum + candidate.votes, 0))

        const rankedCandidates: RankedCandidate[] = assignCompetitionRanks(
          nextRankedCandidates.map((candidate) => ({
            ...candidate,
            percentage: nextTotalVotes > 0 ? (candidate.votes / nextTotalVotes) * 100 : 0,
            rank: 0,
          })),
        )

        setResult({
          id: vote.id,
          title: vote.title,
          org: vote.org,
          verified: vote.verified,
          emoji: vote.emoji,
          endDate: vote.endDate,
          totalVotes: nextTotalVotes,
          rankedCandidates,
          mode: 'live',
        })
        setTotalSubmissions(summary?.totalSubmissions ?? participantCount ?? nextTotalVotes)
        setTotalInvalidVotes(summary?.totalInvalidVotes ?? 0)
      })
      .catch(() => {
        if (cancelled) return
        setResult(null)
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
  }, [id, participantCount, vote])

  return {
    result,
    totalSubmissions,
    totalInvalidVotes,
    isLoading: isVoteLoading || isTallyLoading,
  }
}
