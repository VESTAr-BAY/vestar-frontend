import { useEffect, useRef, useState } from 'react'
import type { Address } from 'viem'
import { fetchElectionDetail } from '../../api/elections'
import {
  getElectionResultSummary,
  getElectionState,
  getTotalVotesForCandidate,
  hashVestarText,
} from '../../contracts/vestar/actions'
import { mapToVoteDetail } from '../../utils/electionMapper'
import type { VoteDetailData } from '../../types/vote'

// ── Mock fallback ─────────────────────────────────────────────────────────────
// Kept intact so the app works without VITE_API_BASE_URL.

const MOCK_VOTES: Record<string, VoteDetailData> = {
  '2': {
    id: '2',
    title: '2026 MAMA 대상',
    org: 'Mnet × MAMA Awards',
    verified: true,
    emoji: '🏆',
    badge: 'live',
    deadlineLabel: '3d 11h left',
    urgent: false,
    startDate: '2026.04.07 00:00',
    endDate: '2026.04.10 23:59',
    endDateISO: '2026-04-10T23:59:00+09:00',
    resultReveal: '2026.04.11 00:00',
    maxChoices: 1,
    participantCount: 142308,
    goalVotes: 500000,
    voteFrequency: '1 vote total',
    voteLimit: '1 vote per ballot',
    resultPublic: false,
    candidates: [],
    sections: [
      {
        id: 's1',
        name: '남자 그룹',
        candidates: [
          { id: 's1c1', name: 'BTS', group: '빅히트 뮤직', emoji: '👑', emojiColor: '#fef3c7' },
          { id: 's1c2', name: 'Stray Kids', group: 'JYP 엔터테인먼트', emoji: '🔥', emojiColor: '#fff1f2' },
          { id: 's1c3', name: 'SEVENTEEN', group: '플레디스 엔터테인먼트', emoji: '💎', emojiColor: '#e0f2fe' },
          { id: 's1c4', name: 'EXO', group: 'SM 엔터테인먼트', emoji: '⭐', emojiColor: '#fef3c7' },
        ],
      },
      {
        id: 's2',
        name: '여자 그룹',
        candidates: [
          { id: 's2c1', name: 'BLACKPINK', group: 'YG 엔터테인먼트', emoji: '💗', emojiColor: '#fce7f3' },
          { id: 's2c2', name: 'aespa', group: 'SM 엔터테인먼트', emoji: '🌌', emojiColor: '#ede9fe' },
          { id: 's2c3', name: 'IVE', group: '스타쉽 엔터테인먼트', emoji: '❄️', emojiColor: '#e0f2fe' },
          { id: 's2c4', name: 'NewJeans', group: '어도어', emoji: '🍀', emojiColor: '#dcfce7' },
        ],
      },
      {
        id: 's3',
        name: '솔로 아티스트',
        candidates: [
          { id: 's3c1', name: 'IU', group: 'EDAM 엔터테인먼트', emoji: '🎀', emojiColor: '#fce7f3' },
          { id: 's3c2', name: 'G-Dragon', group: 'YG 엔터테인먼트', emoji: '🦋', emojiColor: '#F0EDFF' },
          { id: 's3c3', name: '태연', group: 'SM 엔터테인먼트', emoji: '🌙', emojiColor: '#e8f0ff' },
        ],
      },
    ],
  },
  '1': {
    id: '1',
    title: '이번 주 1위는 누구?',
    org: 'Show! Music Core × Mubeat',
    verified: true,
    emoji: '🎤',
    badge: 'live',
    deadlineLabel: '2h 14m left',
    urgent: true,
    startDate: '2025.04.01 18:00',
    endDate: '2026.04.08 11:00',
    endDateISO: '2026-04-08T11:00:00+09:00',
    resultReveal: '2026.04.08 12:00',
    maxChoices: 1,
    participantCount: 24891,
    goalVotes: 50000,
    voteFrequency: '1 vote total',
    voteLimit: '1 vote per ballot',
    resultPublic: false,
    candidates: [
      { id: '1', name: 'BTS', group: '빅히트 뮤직', emoji: '👑', emojiColor: '#fef3c7', votePreviewPct: 28 },
      { id: '2', name: 'BLACKPINK', group: 'YG 엔터테인먼트', emoji: '💗', emojiColor: '#fce7f3', votePreviewPct: 12 },
      { id: '3', name: 'aespa', group: 'SM 엔터테인먼트', emoji: '🌌', emojiColor: '#ede9fe', votePreviewPct: 22 },
      { id: '4', name: 'IVE', group: '스타쉽 엔터테인먼트', emoji: '❄️', emojiColor: '#e0f2fe', votePreviewPct: 8 },
      { id: '5', name: 'NewJeans', group: '어도어', emoji: '🍀', emojiColor: '#dcfce7', votePreviewPct: 19 },
      { id: '6', name: 'Stray Kids', group: 'JYP 엔터테인먼트', emoji: '🔥', emojiColor: '#fff1f2', votePreviewPct: 11 },
    ],
  },
}

// ── Contract enrichment helpers ───────────────────────────────────────────────

/**
 * Fetches live state and total submissions from the contract.
 * Returns undefined fields if the call fails.
 */
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

/**
 * Fetches per-candidate vote counts from the contract.
 * Silently ignores individual call failures.
 */
async function fetchCandidateVotes(
  electionAddress: Address,
  candidateKeys: string[],
): Promise<Map<string, bigint>> {
  const results = await Promise.allSettled(
    candidateKeys.map((key) =>
      getTotalVotesForCandidate(electionAddress, hashVestarText(key)),
    ),
  )

  const map = new Map<string, bigint>()
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      map.set(candidateKeys[i], result.value)
    }
  })
  return map
}

// ── Hook ──────────────────────────────────────────────────────────────────────

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

  // ── Initial fetch: API metadata → contract augmentation ──────────────────
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    fetchElectionDetail(id)
      .then(async (election) => {
        if (cancelled) return

        let contractState: number | undefined
        let contractTotalSubmissions: bigint | undefined
        let candidateVotes: Map<string, bigint> | undefined

        if (election.onchain_election_address) {
          const addr = election.onchain_election_address as Address
          const [contractData, votes] = await Promise.all([
            fetchContractState(addr),
            fetchCandidateVotes(
              addr,
              election.candidates.map((c) => c.candidate_key),
            ),
          ])
          contractState = contractData.state
          contractTotalSubmissions = contractData.totalSubmissions
          candidateVotes = votes
        }

        if (cancelled) return

        const voteData = mapToVoteDetail(
          election,
          contractState,
          contractTotalSubmissions,
          candidateVotes,
        )
        setVote(voteData)
        setParticipantCount(voteData.participantCount)
      })
      .catch(() => {
        if (cancelled) return
        // Fall back to mock
        const mock = MOCK_VOTES[id] ?? { ...MOCK_VOTES['1'], id, title: '투표 상세' }
        setVote(mock)
        setParticipantCount(mock.participantCount)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  // ── Live refresh: poll contract every 30 s for active elections ───────────
  useEffect(() => {
    if (!vote || vote.badge === 'end') return
    if (!vote.electionAddress) {
      // No contract → simulate ticking count (mock / dev mode)
      intervalRef.current = setInterval(() => {
        setParticipantCount((prev) => prev + Math.floor(Math.random() * 3) + 1)
      }, 4000)
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }

    const addr = vote.electionAddress as Address

    const refresh = () => {
      getElectionResultSummary(addr)
        .then((s) => setParticipantCount(Number(s.totalSubmissions)))
        .catch(() => {})
    }

    intervalRef.current = setInterval(refresh, 30_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [vote])

  return { vote, isLoading, participantCount }
}
