import { useEffect, useRef, useState } from 'react'
import type { Address } from 'viem'
import { fetchCandidateManifest } from '../../api/candidateManifest'
import { fetchElectionDetail } from '../../api/elections'
import {
  getElectionResultSummary,
  getElectionState,
  getTotalVotesForCandidate,
} from '../../contracts/vestar/actions'
import { mapToVoteDetail, resolveElectionCandidates } from '../../utils/electionMapper'
import { findOptimisticElection } from '../../utils/optimisticVotes'
import type { VoteDetailData } from '../../types/vote'
import {
  getCachedVoteDetail,
  setCachedVoteDetail,
} from '../../utils/voteDetailCache'

async function fetchContractState(electionAddress: Address) {
  try {
    const [state, summary] = await Promise.all([
      getElectionState(electionAddress),
      getElectionResultSummary(electionAddress),
    ])

    return { state, totalSubmissions: summary.totalSubmissions }
  } catch {
    return { state: undefined, totalSubmissions: undefined }
  }
}

async function fetchCandidateVotes(electionAddress: Address, candidateKeys: string[]) {
  const results = await Promise.allSettled(
    candidateKeys.map((candidateKey) => getTotalVotesForCandidate(electionAddress, candidateKey)),
  )

  const map = new Map<string, bigint>()
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      map.set(candidateKeys[index], result.value)
    }
  })

  return map
}

export interface UseVoteDetailResult {
  vote: VoteDetailData | null
  isLoading: boolean
  participantCount: number
}

export function useVoteDetail(id: string): UseVoteDetailResult {
  const [vote, setVote] = useState<VoteDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [participantCount, setParticipantCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let cancelled = false
    const cached = getCachedVoteDetail(id)
    const optimisticElection = findOptimisticElection(id)

    if (cached) {
      setVote(cached.vote)
      setParticipantCount(cached.participantCount)
      setIsLoading(false)
    } else if (optimisticElection) {
      const optimisticVote = mapToVoteDetail(optimisticElection)
      setVote(optimisticVote)
      setParticipantCount(optimisticVote.participantCount)
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }

    fetchElectionDetail(id)
      .then(async (election) => {
        if (cancelled) return

        if (!cached && !optimisticElection) {
          const previewVote = mapToVoteDetail(election)
          setVote(previewVote)
          setParticipantCount(previewVote.participantCount)
          setCachedVoteDetail(id, {
            vote: previewVote,
            participantCount: previewVote.participantCount,
          })
          setIsLoading(false)
        }

        let contractState: number | undefined
        let contractTotalSubmissions: bigint | undefined
        let candidateVotes: Map<string, bigint> | undefined
        const manifestPromise = fetchCandidateManifest(
          election.candidateManifestUri,
          election.candidateManifestHash,
        )

        if (election.onchainElectionAddress) {
          const address = election.onchainElectionAddress as Address
          const contractDataPromise = fetchContractState(address)
          const manifestForCandidates = await manifestPromise
          if (cancelled) return

          const resolvedCandidates = resolveElectionCandidates(election, manifestForCandidates)
          const candidateVotesPromise =
            election.visibilityMode === 'OPEN'
              ? fetchCandidateVotes(
                  address,
                  resolvedCandidates
                    .map((candidate) => candidate.candidateKey)
                    .filter((candidateKey): candidateKey is string => Boolean(candidateKey)),
                )
              : Promise.resolve(undefined)

          const [contractData, resolvedVotes] = await Promise.all([
            contractDataPromise,
            candidateVotesPromise,
          ])

          contractState = contractData.state
          contractTotalSubmissions = contractData.totalSubmissions
          candidateVotes = resolvedVotes
        }

        if (cancelled) return

        const manifest = await manifestPromise

        const mapped = mapToVoteDetail(
          election,
          contractState,
          contractTotalSubmissions,
          candidateVotes,
          manifest,
        )
        setVote(mapped)
        setParticipantCount(mapped.participantCount)
        setCachedVoteDetail(id, {
          vote: mapped,
          participantCount: mapped.participantCount,
        })
      })
      .catch(() => {
        if (cancelled) return
        if (cached || optimisticElection) {
          return
        }
        setVote(null)
        setParticipantCount(0)
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!vote || vote.badge === 'end' || !vote.electionAddress) {
      return
    }

    const refresh = () => {
      getElectionResultSummary(vote.electionAddress as Address)
        .then((summary) => {
          const nextParticipantCount = Number(summary.totalSubmissions)
          setParticipantCount(nextParticipantCount)
          setCachedVoteDetail(vote.id, {
            vote,
            participantCount: nextParticipantCount,
          })
        })
        .catch(() => {})
    }

    intervalRef.current = setInterval(refresh, 30_000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [vote])

  return { vote, isLoading, participantCount }
}
