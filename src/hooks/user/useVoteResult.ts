import { useEffect, useState } from 'react'
import { fetchCandidateManifest } from '../../api/candidateManifest'
import { fetchElectionDetail, fetchFinalizedTally, fetchResultSummaries } from '../../api/elections'
import type { ApiElection, ApiFinalizedTallyRow } from '../../api/types'
import {
  applyManifestToElection,
  formatVoteDate,
  resolveElectionCandidates,
} from '../../utils/electionMapper'
import type { CandidateManifest } from '../../utils/candidateManifest'
import type { RankedCandidate, VoteResultData } from '../../types/vote'
import { useLanguage } from '../../providers/LanguageProvider'
import { assignCompetitionRanks } from '../../utils/ranking'

function toVoteResultData(
  election: ApiElection,
  tally: ApiFinalizedTallyRow[],
  totalVotes: number,
  manifest: CandidateManifest | null,
  lang: 'en' | 'ko',
): VoteResultData {
  const tallyMap = new Map(tally.map((row) => [row.candidateKey, row]))
  const candidates = resolveElectionCandidates(election, manifest)

  const rankedCandidates: RankedCandidate[] = candidates
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((candidate) => {
      const tallyRow = tallyMap.get(candidate.candidateKey)
      const manifestCandidate = manifest?.candidates.find(
        (item) => item.candidateKey === candidate.candidateKey,
      )
      const votes = tallyRow?.count ?? 0
      const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0

      return {
        id: candidate.candidateKey,
        name: manifestCandidate?.displayName ?? candidate.candidateKey,
        group: manifestCandidate?.groupLabel ?? '',
        emoji: '',
        emojiColor: '#F0EDFF',
        imageUrl: candidate.imageUrl ?? undefined,
        votes,
        percentage,
        rank: 0,
      }
    })
    .sort((left, right) => right.votes - left.votes || left.name.localeCompare(right.name))

  const candidatesWithRanks = assignCompetitionRanks(rankedCandidates)

  return {
    id: election.id,
    title: election.title ?? (lang === 'ko' ? '투표 결과' : 'Vote results'),
    org: election.series?.seriesPreimage ?? (lang === 'ko' ? '시리즈 정보 없음' : 'Unknown series'),
    verified: Boolean(election.organizer),
    emoji: '',
    endDate: formatVoteDate(election.endAt),
    totalVotes,
    rankedCandidates: candidatesWithRanks,
    mode: 'finalized',
  }
}

export interface UseVoteResultResult {
  result: VoteResultData | null
  isLoading: boolean
}

export function useVoteResult(id: string): UseVoteResultResult {
  const { lang } = useLanguage()
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
        const election = applyManifestToElection(rawElection, manifest)

        if (election.onchainState !== 'FINALIZED') {
          setResult(null)
          return
        }

        const [summaries, tally] = await Promise.all([
          fetchResultSummaries(id),
          fetchFinalizedTally(id),
        ])

        if (cancelled) return

        const totalVotes =
          summaries[0]?.totalValidVotes ?? tally.reduce((sum, row) => sum + row.count, 0)

        setResult(toVoteResultData(election, tally, totalVotes, manifest, lang))
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
  }, [id, lang])

  return { result, isLoading }
}
