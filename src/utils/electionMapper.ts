/**
 * Maps vestar-backend API responses to frontend display types.
 *
 * Data split:
 *   Backend API   → titles, org names, candidate metadata, image URLs, cached state
 *   Smart contract → live onchain_state, per-candidate vote counts, resultSummary
 *
 * Contract state always wins over the cached API state when both are available.
 */

import { hashVestarText } from '../contracts/vestar/actions'
import { VESTAR_ELECTION_STATE } from '../contracts/vestar/types'
import type { ApiElection, ApiElectionDetail, ApiElectionState } from '../api/types'
import type { BadgeVariant, Candidate, HotVote, VoteDetailData, VoteListItem } from '../types/vote'

// ── State mapping ─────────────────────────────────────────────────────────────

/** Maps DB onchain_state string → frontend BadgeVariant */
export function mapApiStateToBadge(state: ApiElectionState): BadgeVariant {
  switch (state) {
    case 'ACTIVE':
      return 'live'
    case 'SCHEDULED':
      return 'new'
    default:
      // CLOSED | KEY_REVEAL_PENDING | KEY_REVEALED | FINALIZED | CANCELLED
      return 'end'
  }
}

/**
 * Maps the numeric contract ElectionState → BadgeVariant.
 * This overrides the cached DB state when available.
 */
export function mapContractStateToBadge(state: number): BadgeVariant {
  if (state === VESTAR_ELECTION_STATE.ACTIVE) return 'live'
  if (state === VESTAR_ELECTION_STATE.SCHEDULED) return 'new'
  return 'end'
}

// ── Date / time helpers ───────────────────────────────────────────────────────

/** Formats an ISO datetime string as "YYYY.MM.DD HH:mm" */
export function formatVoteDate(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Returns a human-readable countdown string from an end date ISO string */
export function deadlineLabel(endAt: string): string {
  const diff = new Date(endAt).getTime() - Date.now()
  if (diff <= 0) return 'Ended'
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const mins = Math.floor((diff % 3_600_000) / 60_000)
  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${mins}m left`
  return `${mins}m left`
}

/** True when voting ends within the next 24 hours */
export function isUrgent(endAt: string): boolean {
  const diff = new Date(endAt).getTime() - Date.now()
  return diff > 0 && diff < 86_400_000
}

/** Formats a participation count as a compact string */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

// ── Ballot policy label ───────────────────────────────────────────────────────

export function mapBallotPolicyLabel(policy: string): string {
  switch (policy) {
    case 'ONE_PER_ELECTION':
      return '1 vote total'
    case 'ONE_PER_INTERVAL':
      return 'Once per interval'
    case 'UNLIMITED_PAID':
      return 'Unlimited (paid)'
    default:
      return policy
  }
}

// ── Hot vote card ─────────────────────────────────────────────────────────────

const HOT_GRADIENTS = [
  'linear-gradient(135deg,#1a1035,#2d1b6e)',
  'linear-gradient(135deg,#0a1a35,#1a2d6e)',
  'linear-gradient(135deg,#1a0a35,#3d1a6e)',
  'linear-gradient(135deg,#0d1a2e,#1a3d5e)',
]
const HOT_EMOJIS = ['🎤', '🏆', '💜', '🎧', '⭐', '🔥']

export function mapToHotVote(election: ApiElection, index: number): HotVote {
  return {
    id: election.id,
    emoji: HOT_EMOJIS[index % HOT_EMOJIS.length],
    gradient: HOT_GRADIENTS[index % HOT_GRADIENTS.length],
    org: election.series_preimage,
    name: election.title,
    count: `${formatCount(election.total_submissions ?? 0)}`,
    badge: mapApiStateToBadge(election.onchain_state),
    imageUrl: election.cover_image_url ?? undefined,
  }
}

// ── Vote list item ────────────────────────────────────────────────────────────

const EMOJI_COLORS: Record<number, string> = {
  0: '#e8f0ff',
  1: '#fce7f3',
  2: '#ede9fe',
  3: '#e0f2fe',
  4: '#dcfce7',
  5: '#fff1f2',
  6: '#fef3c7',
}

export function mapToVoteListItem(election: ApiElection, index = 0): VoteListItem {
  return {
    id: election.id,
    emoji: HOT_EMOJIS[index % HOT_EMOJIS.length],
    emojiColor: EMOJI_COLORS[index % 7],
    org: election.series_preimage,
    name: election.title,
    count: formatCount(election.total_submissions ?? 0),
    badge: mapApiStateToBadge(election.onchain_state),
    deadline: deadlineLabel(election.end_at),
    urgent: isUrgent(election.end_at),
    verified: election.organizer_verified_snapshot,
    imageUrl: election.cover_image_url ?? undefined,
  }
}

// ── Vote detail ───────────────────────────────────────────────────────────────

/**
 * Maps an ApiElectionDetail to VoteDetailData.
 *
 * @param contractState  - live contract ElectionState number (overrides cached DB state)
 * @param contractTotalSubmissions - live totalSubmissions from contract ResultSummary
 * @param candidateVotes - map of candidate_key → bigint vote count from contract
 */
export function mapToVoteDetail(
  election: ApiElectionDetail,
  contractState?: number,
  contractTotalSubmissions?: bigint,
  candidateVotes?: Map<string, bigint>,
): VoteDetailData {
  const badge =
    contractState !== undefined
      ? mapContractStateToBadge(contractState)
      : mapApiStateToBadge(election.onchain_state)

  const participantCount =
    contractTotalSubmissions !== undefined
      ? Number(contractTotalSubmissions)
      : (election.total_submissions ?? 0)

  const candidates: Candidate[] = election.candidates
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((c): Candidate => {
      const contractVotes = candidateVotes?.get(c.candidate_key)
      return {
        // id = keccak256(toHex(candidate_key)) — matches what submitOpenVote expects
        id: hashVestarText(c.candidate_key),
        name: c.candidate_key,
        group: '',
        emoji: '🎤',
        emojiColor: '#F0EDFF',
        imageUrl: c.image_url ?? undefined,
        votes: contractVotes !== undefined ? Number(contractVotes) : undefined,
      }
    })

  return {
    id: election.id,
    title: election.title,
    org: election.series_preimage,
    verified: election.organizer_verified_snapshot,
    emoji: '🎤',
    badge,
    deadlineLabel: deadlineLabel(election.end_at),
    urgent: isUrgent(election.end_at),
    startDate: formatVoteDate(election.start_at),
    endDate: formatVoteDate(election.end_at),
    endDateISO: election.end_at,
    resultReveal: formatVoteDate(election.result_reveal_at),
    maxChoices: election.max_selections_per_submission,
    participantCount,
    goalVotes: 0,
    voteFrequency: mapBallotPolicyLabel(election.ballot_policy),
    voteLimit: election.allow_multiple_choice ? 'Multiple choices' : '1 vote per ballot',
    resultPublic: election.visibility_mode === 'OPEN',
    candidates,
    electionAddress: election.onchain_election_address ?? undefined,
    imageUrl: election.cover_image_url ?? undefined,
  }
}
