import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { fetchCandidateManifest } from '../../api/candidateManifest'
import { fetchElections } from '../../api/elections'
import {
  applyManifestToElection,
  formatVoteDate,
  mapApiStateToBadge,
} from '../../utils/electionMapper'
import { mergeOptimisticElections } from '../../utils/optimisticVotes'
import { getViewCache, setViewCache } from '../../utils/viewCache'

export interface HostVoteCardData {
  id: string
  title: string
  badge: 'live' | 'hot' | 'new' | 'end'
  participantCount: number
  endDate: string
  emoji: string
  imageUrl?: string
}

export interface UseHostVotesResult {
  votes: HostVoteCardData[]
  activeCount: number
  completedCount: number
  totalVotes: number
  isLoading: boolean
}

const HOST_VOTES_CACHE_TTL_MS = 15_000

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
    const cacheKey = `host-votes:${address.toLowerCase()}`
    const cachedVotes = getViewCache<HostVoteCardData[]>(cacheKey, HOST_VOTES_CACHE_TTL_MS)
    const optimisticVotes = mergeOptimisticElections([], {
      organizerWalletAddress: address,
    }).map(
      (election) =>
        ({
          id: election.id,
          title: election.title ?? 'Untitled election',
          badge: mapApiStateToBadge(election.onchainState),
          participantCount: election.resultSummary?.totalSubmissions ?? 0,
          endDate: formatVoteDate(election.endAt),
          emoji: '',
          imageUrl: election.coverImageUrl ?? undefined,
        }) satisfies HostVoteCardData,
    )

    if (cachedVotes) {
      setVotes(cachedVotes)
      setIsLoading(false)
    } else if (optimisticVotes.length > 0) {
      setVotes(optimisticVotes)
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }

    fetchElections({ organizerWalletAddress: address })
      .then(async (elections) => {
        if (cancelled) return

        const electionsWithManifest = await Promise.all(
          elections.map(async (election) => {
            const manifest = await fetchCandidateManifest(
              election.candidateManifestUri,
              election.candidateManifestHash,
            )

            return applyManifestToElection(election, manifest)
          }),
        )

        if (cancelled) return

        const mappedWithManifest = electionsWithManifest.map(
          (election) =>
            ({
              id: election.id,
              title: election.title ?? 'Untitled election',
              badge: mapApiStateToBadge(election.onchainState),
              participantCount: election.resultSummary?.totalSubmissions ?? 0,
              endDate: formatVoteDate(election.endAt),
              emoji: '',
              imageUrl: election.coverImageUrl ?? undefined,
            }) satisfies HostVoteCardData,
        )

        setVotes(mappedWithManifest)
        setViewCache(cacheKey, mappedWithManifest)
      })
      .catch(() => {
        if (cancelled) return
        setVotes(optimisticVotes)
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
