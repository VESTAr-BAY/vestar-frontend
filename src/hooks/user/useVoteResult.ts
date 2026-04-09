import { useEffect, useState } from 'react'
import { fetchCandidateManifest } from '../../api/candidateManifest'
import {
  fetchElectionDetail,
  fetchFinalizedTally,
  fetchLiveTally,
  fetchResultSummaries,
} from '../../api/elections'
import type { ApiElection, ApiFinalizedTallyRow, ApiLiveTallyRow } from '../../api/types'
import {
  applyManifestToElection,
  formatVoteDate,
  resolveElectionCandidates,
} from '../../utils/electionMapper'
import { findLocalOpenElectionMetadata } from '../../utils/localOpenElectionMetadata'
import type { CandidateManifest } from '../../utils/candidateManifest'
import type { RankedCandidate, VoteResultData } from '../../types/vote'

type TallyRow = ApiLiveTallyRow | ApiFinalizedTallyRow

function mergeLocalMetadata(election: ApiElection): ApiElection {
  if (election.title && election.series) {
    return election
  }

  const local = findLocalOpenElectionMetadata({
    onchainElectionId: election.onchainElectionId,
    onchainElectionAddress: election.onchainElectionAddress,
  })

  if (!local) {
    return election
  }

  return {
    ...election,
    title: election.title ?? local.title,
    coverImageUrl: election.coverImageUrl ?? local.coverImageUrl ?? null,
    series: election.series ?? {
      id: `local-${local.seriesId}`,
      seriesPreimage: local.series.seriesPreimage,
      onchainSeriesId: local.seriesId,
      coverImageUrl: local.series.coverImageUrl ?? null,
    },
    electionCandidates: local.electionCandidates.map((candidate, index) => ({
      id: `local-${election.id}-${index + 1}`,
      candidateKey: candidate.candidateKey,
      imageUrl: candidate.imageUrl ?? null,
      displayOrder: candidate.displayOrder,
    })),
  }
}

function toVoteResultData(
  election: ApiElection,
  tally: TallyRow[],
  totalVotes: number,
  manifest: CandidateManifest | null,
): VoteResultData {
  const tallyMap = new Map(tally.map((row) => [row.candidateKey, row]))
  const candidates = resolveElectionCandidates(election, manifest)

  const rankedCandidates: RankedCandidate[] = candidates
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((candidate) => {
      const tallyRow = tallyMap.get(candidate.candidateKey)
      const votes = tallyRow?.count ?? 0
      const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0

      return {
        id: candidate.candidateKey,
        name:
          manifest?.candidates.find(
            (manifestCandidate) => manifestCandidate.candidateKey === candidate.candidateKey,
          )?.displayName ?? candidate.candidateKey,
        group:
          manifest?.candidates.find(
            (manifestCandidate) => manifestCandidate.candidateKey === candidate.candidateKey,
          )?.groupLabel ?? '',
        emoji: '🎤',
        emojiColor: '#F0EDFF',
        imageUrl: candidate.imageUrl ?? undefined,
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

  return {
    id: election.id,
    title: election.title ?? '투표 결과',
    org: election.series?.seriesPreimage ?? 'Unknown series',
    verified: Boolean(election.organizer),
    emoji: '🎤',
    endDate: formatVoteDate(election.endAt),
    totalVotes,
    rankedCandidates,
  }
}

export interface UseVoteResultResult {
  result: VoteResultData | null
  isLoading: boolean
}

export function useVoteResult(id: string): UseVoteResultResult {
  const [result, setResult] = useState<VoteResultData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    fetchElectionDetail(id)
      .then(async (rawElection) => {
        if (cancelled) return

        const manifest = await fetchCandidateManifest(
          rawElection.candidateManifestUri,
          rawElection.candidateManifestHash,
        )
        const election = mergeLocalMetadata(applyManifestToElection(rawElection, manifest))
        const [summaries, tally] = await Promise.all([
          fetchResultSummaries(id),
          election.onchainState === 'FINALIZED'
            ? fetchFinalizedTally(id)
            : election.visibilityMode === 'OPEN'
              ? fetchLiveTally(id)
              : Promise.resolve([]),
        ])

        if (cancelled) return

        const totalVotes =
          summaries[0]?.totalValidVotes ?? tally.reduce((sum, row) => sum + row.count, 0)

        setResult(toVoteResultData(election, tally, totalVotes, manifest))
      })
      .catch(() => {
        if (!cancelled) {
          setResult(null)
        }
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

  return { result, isLoading }
}
