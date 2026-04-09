import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { fetchElections } from '../../api/elections'
import { formatVoteDate, mapApiStateToBadge } from '../../utils/electionMapper'

export interface HostVoteCardData {
  id: string
  title: string
  badge: 'live' | 'hot' | 'new' | 'end'
  participantCount: number
  endDate: string
  emoji: string
}

export interface UseHostVotesResult {
  votes: HostVoteCardData[]
  activeCount: number
  completedCount: number
  totalVotes: number
  isLoading: boolean
}

export function useHostVotes(): UseHostVotesResult {
  const { address, isConnected } = useAccount()
  const [votes, setVotes] = useState<HostVoteCardData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isConnected || !address) {
      setVotes([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    fetchElections({ organizerWalletAddress: address })
      .then((elections) => {
        if (cancelled) return

        const mapped = elections.map(
          (election, index) =>
            ({
              id: election.id,
              title: election.title ?? 'Untitled election',
              badge: mapApiStateToBadge(election.onchainState),
              participantCount: election.resultSummary?.totalSubmissions ?? 0,
              endDate: formatVoteDate(election.endAt),
              emoji: ['🎤', '🏆', '💜', '🎧', '⭐', '🔥'][index % 6],
            }) satisfies HostVoteCardData,
        )

        setVotes(mapped)
      })
      .catch(() => {
        if (cancelled) return
        setVotes([])
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [address, isConnected])

  const activeCount = votes.filter((vote) => vote.badge === 'live').length
  const completedCount = votes.filter((vote) => vote.badge === 'end').length
  const totalVotes = votes.reduce((sum, vote) => sum + vote.participantCount, 0)

  return {
    votes,
    activeCount,
    completedCount,
    totalVotes,
    isLoading,
  }
}
