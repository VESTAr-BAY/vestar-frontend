import { VESTAR_ELECTION_STATE } from '../contracts/vestar/types'
import type { ApiElection, ApiElectionState } from '../api/types'
import type { BadgeVariant, Candidate, HotVote, VoteDetailData, VoteListItem } from '../types/vote'
import type { CandidateManifest } from './candidateManifest'
import {
  findLocalOpenElectionMetadata,
  type LocalOpenElectionMetadata,
} from './localOpenElectionMetadata'
import { getCandidateManifestSeriesPreimage, getCandidateManifestTitle } from './candidateManifest'

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

  if (Number.isNaN(date.getTime())) {
    return iso
  }

  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const valueByType = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${valueByType.year}.${valueByType.month}.${valueByType.day} ${valueByType.hour}:${valueByType.minute}`
}

export function deadlineLabel(endAt: string): string {
  const diff = new Date(endAt).getTime() - Date.now()

  if (diff <= 0) return ''

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
const HOT_EMOJIS = ['', '', '', '', '', '']
const EMOJI_COLORS: Record<number, string> = {
  0: '#e8f0ff',
  1: '#fce7f3',
  2: '#ede9fe',
  3: '#e0f2fe',
  4: '#dcfce7',
  5: '#fff1f2',
  6: '#fef3c7',
}

function toLocalElectionCandidates(local: LocalOpenElectionMetadata) {
  return local.electionCandidates.map((candidate, index) => ({
    id: `local-${local.onchainElectionId}-${index + 1}`,
    candidateKey: candidate.candidateKey,
    imageUrl: candidate.imageUrl ?? null,
    displayOrder: candidate.displayOrder,
  }))
}

function findLocalMetadata(
  election: Pick<ApiElection, 'onchainElectionId' | 'onchainElectionAddress'>,
) {
  return findLocalOpenElectionMetadata({
    onchainElectionId: election.onchainElectionId,
    onchainElectionAddress: election.onchainElectionAddress,
  })
}

export function resolveElectionCandidates(
  election: Pick<ApiElection, 'onchainElectionId' | 'onchainElectionAddress'>,
  manifest: CandidateManifest | null,
) {
  if (manifest?.candidates.length) {
    return manifest.candidates.map((candidate, index) => ({
      id: `${election.onchainElectionId}-${index + 1}`,
      candidateKey: candidate.candidateKey,
      imageUrl: candidate.imageUrl ?? null,
      displayOrder: candidate.displayOrder,
    }))
  }

  const local = findLocalMetadata(election)
  if (local) {
    return toLocalElectionCandidates(local)
  }

  return []
}

function withLocalOpenMetadata(election: ApiElection) {
  if (election.title && election.series) {
    return election
  }

  const local = findLocalMetadata(election)

  if (!local) {
    // sungje : draft/로컬 메타데이터가 없어도 manifest에서 채운 후보 목록은 그대로 유지해야 한다.
    return election
  }

  return {
    ...election,
    coverImageUrl: election.coverImageUrl ?? local.coverImageUrl ?? null,
    electionCandidates: toLocalElectionCandidates(local),
  }
}

export function applyManifestToElection(
  rawElection: ApiElection,
  manifest: CandidateManifest | null,
): ApiElection {
  const manifestTitle = getCandidateManifestTitle(manifest)
  const manifestSeriesPreimage = getCandidateManifestSeriesPreimage(manifest)

  return {
    ...rawElection,
    title: manifestTitle || null,
    category: manifest?.election?.category ?? rawElection.category ?? null,
    coverImageUrl: manifest?.election?.coverImageUrl ?? rawElection.coverImageUrl,
    series:
      manifestSeriesPreimage || manifest?.series?.coverImageUrl
        ? {
            ...(rawElection.series ?? {}),
            id: rawElection.series?.id ?? `manifest-${rawElection.onchainElectionId}`,
            onchainSeriesId: rawElection.series?.onchainSeriesId ?? rawElection.onchainSeriesId,
            seriesPreimage: manifestSeriesPreimage || 'Unknown series',
            coverImageUrl: manifest?.series?.coverImageUrl ?? null,
          }
        : null,
    electionCandidates: resolveElectionCandidates(rawElection, manifest),
  }
}

export function mapToHotVote(rawElection: ApiElection, index: number): HotVote {
  const election = withLocalOpenMetadata(rawElection)

  return {
    id: election.id,
    category: election.category ?? undefined,
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
    category: election.category ?? undefined,
    seriesKey,
    sortKey: Number.isFinite(parsedId) ? parsedId : 0,
    seriesImageUrl: election.series?.coverImageUrl ?? election.coverImageUrl ?? undefined,
    visibilityMode: election.visibilityMode,
    paymentMode: election.paymentMode,
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
  manifest?: CandidateManifest | null,
): VoteDetailData {
  const election = withLocalOpenMetadata(applyManifestToElection(rawElection, manifest ?? null))
  const badge =
    contractState !== undefined
      ? mapContractStateToBadge(contractState)
      : mapApiStateToBadge(election.onchainState)

  const backendParticipantCount = election.resultSummary?.totalSubmissions ?? 0
  const participantCount =
    contractTotalSubmissions !== undefined
      ? Math.max(Number(contractTotalSubmissions), backendParticipantCount)
      : backendParticipantCount

  const candidates: Candidate[] = election.electionCandidates
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((candidate): Candidate => {
      const manifestCandidate = manifest?.candidates.find(
        (item) => item.candidateKey === candidate.candidateKey,
      )

      return {
        id: candidate.candidateKey,
        name: manifestCandidate?.displayName ?? candidate.candidateKey,
        group: manifestCandidate?.groupLabel ?? '',
        emoji: '',
        emojiColor: '#F0EDFF',
        imageUrl: candidate.imageUrl ?? undefined,
        votes:
          candidateVotes && candidateVotes.has(candidate.candidateKey)
            ? Number(candidateVotes.get(candidate.candidateKey))
            : undefined,
      }
    })

  return {
    id: election.id,
    onchainElectionId: election.onchainElectionId,
    onchainState: election.onchainState,
    title: election.title ?? 'Untitled election',
    org: election.series?.seriesPreimage ?? 'Unknown series',
    host: election.organizer?.organizationName ?? election.organizerWalletAddress,
    verified: Boolean(election.organizer),
    emoji: '',
    badge,
    deadlineLabel: deadlineLabel(election.endAt),
    urgent: isUrgent(election.endAt),
    startDate: formatVoteDate(election.startAt),
    endDate: formatVoteDate(election.endAt),
    endDateISO: election.endAt,
    resultReveal: formatVoteDate(election.resultRevealAt),
    minKarmaTier: election.minKarmaTier,
    maxChoices: election.maxSelectionsPerSubmission,
    participantCount,
    goalVotes: 0,
    ballotPolicy: election.ballotPolicy,
    resetIntervalSeconds: election.resetIntervalSeconds,
    timezoneWindowOffset: election.timezoneWindowOffset,
    voteFrequency: mapBallotPolicyLabel(election.ballotPolicy),
    voteLimit: election.allowMultipleChoice ? 'Multiple choices' : '1 vote per ballot',
    resultPublic: election.visibilityMode === 'OPEN',
    paymentMode: election.paymentMode,
    paymentToken: election.paymentToken,
    costPerBallot: election.costPerBallot,
    candidates,
    electionAddress: election.onchainElectionAddress ?? undefined,
    visibilityMode: election.visibilityMode,
    publicKeyPem: election.electionKey?.publicKey,
    imageUrl: election.coverImageUrl ?? undefined,
  }
}
