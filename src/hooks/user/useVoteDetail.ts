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
import type { VoteDetailData } from '../../types/vote'

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
    setIsLoading(true)

    fetchElectionDetail(id)
      .then(async (election) => {
        if (cancelled) return

        let contractState: number | undefined
        let contractTotalSubmissions: bigint | undefined
        let candidateVotes: Map<string, bigint> | undefined
        const manifest = await fetchCandidateManifest(
          election.candidateManifestUri,
          election.candidateManifestHash,
        )

        if (election.onchainElectionAddress) {
          const address = election.onchainElectionAddress as Address
          const resolvedCandidates = resolveElectionCandidates(election, manifest)
          const contractDataPromise = fetchContractState(address)
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

        const mapped = mapToVoteDetail(
          election,
          contractState,
          contractTotalSubmissions,
          candidateVotes,
          manifest,
        )
        setVote(mapped)
        setParticipantCount(mapped.participantCount)
      })
      .catch(() => {
        if (cancelled) return
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
        .then((summary) => setParticipantCount(Number(summary.totalSubmissions)))
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
