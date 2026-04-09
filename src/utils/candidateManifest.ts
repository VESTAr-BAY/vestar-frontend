import type {
  VoteBallotPolicy,
  VotePaymentMode,
  VoteVisibilityMode,
} from '../types/host'

export const CANDIDATE_MANIFEST_SCHEMA = 'vestar.candidate-manifest'
export const CANDIDATE_MANIFEST_VERSION = 1 as const

export type CandidateManifestCandidate = {
  candidateKey: string
  displayName: string
  groupLabel?: string | null
  displayOrder: number
  imageUrl?: string | null
}

export type CandidateManifest = {
  schema: typeof CANDIDATE_MANIFEST_SCHEMA
  version: typeof CANDIDATE_MANIFEST_VERSION
  series: {
    preimage: string
    coverImageUrl?: string | null
  }
  election: {
    title: string
    category?: string | null
    coverImageUrl?: string | null
    visibilityMode?: VoteVisibilityMode
    paymentMode?: VotePaymentMode
    ballotPolicy?: VoteBallotPolicy
    allowMultipleChoice?: boolean
    maxSelectionsPerSubmission?: number
  }
  candidates: CandidateManifestCandidate[]
}

type LegacyCandidateManifest = {
  title?: string
  seriesPreimage?: string
  coverImageUrl?: string | null
  candidates?: Array<{
    candidateKey?: string
    displayName?: string | null
    groupLabel?: string | null
    displayOrder?: number
    imageUrl?: string | null
  }>
}

type CandidateManifestCandidateInput = {
  candidateKey?: string
  displayName?: string | null
  groupLabel?: string | null
  displayOrder?: number
  imageUrl?: string | null
}

type BuildCandidateManifestArgs = {
  seriesPreimage: string
  seriesCoverImageUrl?: string | null
  electionTitle: string
  category?: string | null
  electionCoverImageUrl?: string | null
  visibilityMode: VoteVisibilityMode
  paymentMode: VotePaymentMode
  ballotPolicy: VoteBallotPolicy
  allowMultipleChoice: boolean
  maxSelectionsPerSubmission: number
  candidates: CandidateManifestCandidate[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeCandidate(
  candidate: CandidateManifestCandidateInput,
  fallbackOrder: number,
): CandidateManifestCandidate | null {
  const candidateKey = candidate.candidateKey?.trim()
  if (!candidateKey) {
    return null
  }

  const displayName = candidate.displayName?.trim() || candidateKey
  const displayOrder =
    typeof candidate.displayOrder === 'number' && Number.isInteger(candidate.displayOrder)
      ? candidate.displayOrder
      : fallbackOrder

  return {
    candidateKey,
    displayName,
    groupLabel: candidate.groupLabel ?? null,
    displayOrder,
    imageUrl: candidate.imageUrl ?? null,
  }
}

function parseLegacyCandidateManifest(value: LegacyCandidateManifest): CandidateManifest | null {
  if (!Array.isArray(value.candidates)) {
    return null
  }

  const candidates = value.candidates
    .map((candidate, index) =>
      normalizeCandidate(
        (isRecord(candidate) ? candidate : {}) as CandidateManifestCandidateInput,
        index + 1,
      ),
    )
    .filter((candidate): candidate is CandidateManifestCandidate => candidate !== null)
    .sort((left, right) => left.displayOrder - right.displayOrder)

  if (candidates.length === 0) {
    return null
  }

  return {
    schema: CANDIDATE_MANIFEST_SCHEMA,
    version: CANDIDATE_MANIFEST_VERSION,
    series: {
      preimage: typeof value.seriesPreimage === 'string' ? value.seriesPreimage.trim() : '',
      coverImageUrl: typeof value.coverImageUrl === 'string' ? value.coverImageUrl : null,
    },
    election: {
      title: typeof value.title === 'string' ? value.title.trim() : '',
      coverImageUrl: typeof value.coverImageUrl === 'string' ? value.coverImageUrl : null,
    },
    candidates,
  }
}

export function parseCandidateManifest(value: unknown): CandidateManifest | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    value.schema !== CANDIDATE_MANIFEST_SCHEMA ||
    value.version !== CANDIDATE_MANIFEST_VERSION ||
    !isRecord(value.series) ||
    !isRecord(value.election) ||
    !Array.isArray(value.candidates)
  ) {
    return parseLegacyCandidateManifest(value as LegacyCandidateManifest)
  }

  const candidates = value.candidates
    .map((candidate, index) =>
      normalizeCandidate(
        (isRecord(candidate) ? candidate : {}) as CandidateManifestCandidateInput,
        index + 1,
      ),
    )
    .filter((candidate): candidate is CandidateManifestCandidate => candidate !== null)
    .sort((left, right) => left.displayOrder - right.displayOrder)

  if (candidates.length === 0) {
    return null
  }

  return {
    schema: CANDIDATE_MANIFEST_SCHEMA,
    version: CANDIDATE_MANIFEST_VERSION,
    series: {
      preimage: typeof value.series.preimage === 'string' ? value.series.preimage.trim() : '',
      coverImageUrl:
        typeof value.series.coverImageUrl === 'string' ? value.series.coverImageUrl : null,
    },
    election: {
      title: typeof value.election.title === 'string' ? value.election.title.trim() : '',
      category: typeof value.election.category === 'string' ? value.election.category : null,
      coverImageUrl:
        typeof value.election.coverImageUrl === 'string' ? value.election.coverImageUrl : null,
      visibilityMode:
        value.election.visibilityMode === 'OPEN' || value.election.visibilityMode === 'PRIVATE'
          ? value.election.visibilityMode
          : undefined,
      paymentMode:
        value.election.paymentMode === 'FREE' || value.election.paymentMode === 'PAID'
          ? value.election.paymentMode
          : undefined,
      ballotPolicy:
        value.election.ballotPolicy === 'ONE_PER_ELECTION' ||
        value.election.ballotPolicy === 'ONE_PER_INTERVAL' ||
        value.election.ballotPolicy === 'UNLIMITED_PAID'
          ? value.election.ballotPolicy
          : undefined,
      allowMultipleChoice:
        typeof value.election.allowMultipleChoice === 'boolean'
          ? value.election.allowMultipleChoice
          : undefined,
      maxSelectionsPerSubmission:
        typeof value.election.maxSelectionsPerSubmission === 'number'
          ? value.election.maxSelectionsPerSubmission
          : undefined,
    },
    candidates,
  }
}

export function buildCandidateManifest(args: BuildCandidateManifestArgs): CandidateManifest {
  return {
    schema: CANDIDATE_MANIFEST_SCHEMA,
    version: CANDIDATE_MANIFEST_VERSION,
    series: {
      preimage: args.seriesPreimage.trim(),
      coverImageUrl: args.seriesCoverImageUrl ?? null,
    },
    election: {
      title: args.electionTitle.trim(),
      category: args.category?.trim() ?? null,
      coverImageUrl: args.electionCoverImageUrl ?? null,
      visibilityMode: args.visibilityMode,
      paymentMode: args.paymentMode,
      ballotPolicy: args.ballotPolicy,
      allowMultipleChoice: args.allowMultipleChoice,
      maxSelectionsPerSubmission: args.maxSelectionsPerSubmission,
    },
    candidates: [...args.candidates].sort((left, right) => left.displayOrder - right.displayOrder),
  }
}

export function getCandidateManifestTitle(manifest: CandidateManifest | null) {
  return manifest?.election.title?.trim() || ''
}

export function getCandidateManifestSeriesPreimage(manifest: CandidateManifest | null) {
  return manifest?.series.preimage?.trim() || ''
}

export function getCandidateManifestCoverImageUrl(manifest: CandidateManifest | null) {
  return manifest?.election.coverImageUrl ?? manifest?.series.coverImageUrl ?? null
}
