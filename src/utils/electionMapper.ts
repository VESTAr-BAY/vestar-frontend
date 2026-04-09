import { VESTAR_ELECTION_STATE } from '../contracts/vestar/types'
import type { ApiElection, ApiElectionState } from '../api/types'
import type { BadgeVariant, Candidate, HotVote, VoteDetailData, VoteListItem } from '../types/vote'
import { findLocalOpenElectionMetadata } from './localOpenElectionMetadata'

export function mapApiStateToBadge(state: ApiElectionState): BadgeVariant {
  switch (state) {
    case 'ACTIVE':
      return 'live'
    case 'SCHEDULED':
      return 'new'
    default:
      return 'end'
  }
}

export function mapContractStateToBadge(state: number): BadgeVariant {
  if (state === VESTAR_ELECTION_STATE.ACTIVE) return 'live'
  if (state === VESTAR_ELECTION_STATE.SCHEDULED) return 'new'
  return 'end'
}

export function formatVoteDate(iso: string): string {
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function deadlineLabel(endAt: string): string {
  const diff = new Date(endAt).getTime() - Date.now()

  if (diff <= 0) return 'Ended'

  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)

  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${minutes}m left`
  return `${minutes}m left`
}

export function isUrgent(endAt: string): boolean {
  const diff = new Date(endAt).getTime() - Date.now()
  return diff > 0 && diff < 86_400_000
}

export function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString()
}

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

const HOT_GRADIENTS = [
  'linear-gradient(135deg,#1a1035,#2d1b6e)',
  'linear-gradient(135deg,#0a1a35,#1a2d6e)',
  'linear-gradient(135deg,#1a0a35,#3d1a6e)',
  'linear-gradient(135deg,#0d1a2e,#1a3d5e)',
]
const HOT_EMOJIS = ['🎤', '🏆', '💜', '🎧', '⭐', '🔥']
const EMOJI_COLORS: Record<number, string> = {
  0: '#e8f0ff',
  1: '#fce7f3',
  2: '#ede9fe',
  3: '#e0f2fe',
  4: '#dcfce7',
  5: '#fff1f2',
  6: '#fef3c7',
}

function withLocalOpenMetadata(election: ApiElection) {
  if (election.title && election.series && election.electionCandidates.length > 0) {
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
    series:
      election.series ??
      ({
        id: `local-${local.seriesId}`,
        seriesPreimage: local.series.seriesPreimage,
        onchainSeriesId: local.seriesId,
        coverImageUrl: local.series.coverImageUrl ?? null,
      } as ApiElection['series']),
    electionCandidates:
      election.electionCandidates.length > 0 ? election.electionCandidates : local.electionCandidates,
  }
}

export function mapToHotVote(rawElection: ApiElection, index: number): HotVote {
  const election = withLocalOpenMetadata(rawElection)

  return {
    id: election.id,
    emoji: HOT_EMOJIS[index % HOT_EMOJIS.length],
    gradient: HOT_GRADIENTS[index % HOT_GRADIENTS.length],
    org: election.series?.seriesPreimage ?? 'Unknown series',
    name: election.title ?? 'Untitled election',
    count: `${formatCount(election.resultSummary?.totalSubmissions ?? 0)}`,
    badge: mapApiStateToBadge(election.onchainState),
    imageUrl: election.coverImageUrl ?? undefined,
  }
}

export function mapToVoteListItem(rawElection: ApiElection, index = 0): VoteListItem {
  const election = withLocalOpenMetadata(rawElection)
  const seriesKey =
    election.series?.onchainSeriesId ??
    election.series?.id ??
    election.onchainSeriesId ??
    `series:${election.series?.seriesPreimage ?? 'unknown'}`
  const parsedId = Number(election.id)

  return {
    id: election.id,
    seriesKey,
    sortKey: Number.isFinite(parsedId) ? parsedId : 0,
    emoji: HOT_EMOJIS[index % HOT_EMOJIS.length],
    emojiColor: EMOJI_COLORS[index % 7],
    org: election.series?.seriesPreimage ?? 'Unknown series',
    name: election.title ?? 'Untitled election',
    host: election.organizer?.organizationName ?? undefined,
    count: formatCount(election.resultSummary?.totalSubmissions ?? 0),
    badge: mapApiStateToBadge(election.onchainState),
    deadline: deadlineLabel(election.endAt),
    urgent: isUrgent(election.endAt),
    verified: Boolean(election.organizer),
    imageUrl: election.coverImageUrl ?? undefined,
  }
}

export function mapToVoteDetail(
  rawElection: ApiElection,
  contractState?: number,
  contractTotalSubmissions?: bigint,
  candidateVotes?: Map<string, bigint>,
): VoteDetailData {
  const election = withLocalOpenMetadata(rawElection)
  const badge =
    contractState !== undefined
      ? mapContractStateToBadge(contractState)
      : mapApiStateToBadge(election.onchainState)

  const participantCount =
    contractTotalSubmissions !== undefined
      ? Number(contractTotalSubmissions)
      : (election.resultSummary?.totalSubmissions ?? 0)

  const candidates: Candidate[] = election.electionCandidates
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((candidate): Candidate => ({
      id: candidate.candidateKey,
      name: candidate.candidateKey,
      group: '',
      emoji: '🎤',
      emojiColor: '#F0EDFF',
      imageUrl: candidate.imageUrl ?? undefined,
      votes:
        candidateVotes && candidateVotes.has(candidate.candidateKey)
          ? Number(candidateVotes.get(candidate.candidateKey))
          : undefined,
    }))

  return {
    id: election.id,
    onchainElectionId: election.onchainElectionId,
    title: election.title ?? 'Untitled election',
    org: election.series?.seriesPreimage ?? 'Unknown series',
    host: election.organizer?.organizationName ?? election.organizerWalletAddress,
    verified: Boolean(election.organizer),
    emoji: '🎤',
    badge,
    deadlineLabel: deadlineLabel(election.endAt),
    urgent: isUrgent(election.endAt),
    startDate: formatVoteDate(election.startAt),
    endDate: formatVoteDate(election.endAt),
    endDateISO: election.endAt,
    resultReveal: formatVoteDate(election.resultRevealAt),
    maxChoices: election.maxSelectionsPerSubmission,
    participantCount,
    goalVotes: 0,
    voteFrequency: mapBallotPolicyLabel(election.ballotPolicy),
    voteLimit: election.allowMultipleChoice ? 'Multiple choices' : '1 vote per ballot',
    resultPublic: election.visibilityMode === 'OPEN',
    paymentMode: election.paymentMode,
    costPerBallot: election.costPerBallot,
    candidates,
    electionAddress: election.onchainElectionAddress ?? undefined,
    visibilityMode: election.visibilityMode,
    publicKeyPem: election.electionKey?.publicKey,
    imageUrl: election.coverImageUrl ?? undefined,
  }
}
