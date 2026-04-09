import type {
  VoteBallotPolicy,
  VotePaymentMode,
  VoteVisibilityMode,
} from '../types/host'

export const CANDIDATE_MANIFEST_SCHEMA = 'vestar.candidate-manifest'
export const CANDIDATE_MANIFEST_VERSION = 1 as const

export type CandidateManifestCandidate = {
  displayName: string
  groupLabel?: string | null
  candidateKey?: string
  displayOrder?: number
  imageUrl?: string | null
}

export type CandidateManifest = {
  schema: typeof CANDIDATE_MANIFEST_SCHEMA
  version: typeof CANDIDATE_MANIFEST_VERSION
  // sungje : 새 manifest는 draft가 이미 가진 시리즈/타이틀/이미지/후보키 중복값을 빼고, 필요할 때만 legacy 필드를 파싱한다.
  series?: {
    preimage?: string
    coverImageUrl?: string | null
  }
  election?: {
    title?: string
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
  category?: string | null
  seriesCoverImageUrl?: string | null
  electionCoverImageUrl?: string | null
  candidates: CandidateManifestCandidate[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeCandidate(
  candidate: CandidateManifestCandidateInput,
  fallbackOrder: number,
): CandidateManifestCandidate | null {
  const candidateKey = candidate.candidateKey?.trim() || candidate.displayName?.trim()
  if (!candidateKey) {
    return null
  }

  const displayName = candidate.displayName?.trim() || candidateKey
  const displayOrder =
    typeof candidate.displayOrder === 'number' && Number.isInteger(candidate.displayOrder)
      ? candidate.displayOrder
      : fallbackOrder

  return {
    displayName,
    candidateKey,
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
    .sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0))

  if (candidates.length === 0) {
    return null
  }

  return {
    schema: CANDIDATE_MANIFEST_SCHEMA,
    version: CANDIDATE_MANIFEST_VERSION,
    series:
      typeof value.seriesPreimage === 'string' || typeof value.coverImageUrl === 'string'
        ? {
            preimage: typeof value.seriesPreimage === 'string' ? value.seriesPreimage.trim() : '',
            coverImageUrl: typeof value.coverImageUrl === 'string' ? value.coverImageUrl : null,
          }
        : undefined,
    election:
      typeof value.title === 'string' || typeof value.coverImageUrl === 'string'
        ? {
            title: typeof value.title === 'string' ? value.title.trim() : '',
            coverImageUrl: typeof value.coverImageUrl === 'string' ? value.coverImageUrl : null,
          }
        : undefined,
    candidates,
  }
}

function isOptionalRecord(value: unknown): value is Record<string, unknown> | undefined {
  return value === undefined || isRecord(value)
}

export function parseCandidateManifest(value: unknown): CandidateManifest | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    value.schema !== CANDIDATE_MANIFEST_SCHEMA ||
    value.version !== CANDIDATE_MANIFEST_VERSION ||
    !isOptionalRecord(value.series) ||
    !isOptionalRecord(value.election) ||
    !Array.isArray(value.candidates)
  ) {
    return parseLegacyCandidateManifest(value as LegacyCandidateManifest)
  }

  const series = value.series
  const election = value.election

  const candidates = value.candidates
    .map((candidate, index) =>
      normalizeCandidate(
        (isRecord(candidate) ? candidate : {}) as CandidateManifestCandidateInput,
        index + 1,
      ),
    )
    .filter((candidate): candidate is CandidateManifestCandidate => candidate !== null)
    .sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0))

  if (candidates.length === 0) {
    return null
  }

  return {
    schema: CANDIDATE_MANIFEST_SCHEMA,
    version: CANDIDATE_MANIFEST_VERSION,
    series: series
      ? {
          preimage: typeof series.preimage === 'string' ? series.preimage.trim() : '',
          coverImageUrl: typeof series.coverImageUrl === 'string' ? series.coverImageUrl : null,
        }
      : undefined,
    election: election
      ? {
          title: typeof election.title === 'string' ? election.title.trim() : '',
          category: typeof election.category === 'string' ? election.category : null,
          coverImageUrl:
            typeof election.coverImageUrl === 'string' ? election.coverImageUrl : null,
          visibilityMode:
            election.visibilityMode === 'OPEN' || election.visibilityMode === 'PRIVATE'
              ? election.visibilityMode
              : undefined,
          paymentMode:
            election.paymentMode === 'FREE' || election.paymentMode === 'PAID'
              ? election.paymentMode
              : undefined,
          ballotPolicy:
            election.ballotPolicy === 'ONE_PER_ELECTION' ||
            election.ballotPolicy === 'ONE_PER_INTERVAL' ||
            election.ballotPolicy === 'UNLIMITED_PAID'
              ? election.ballotPolicy
              : undefined,
          allowMultipleChoice:
            typeof election.allowMultipleChoice === 'boolean'
              ? election.allowMultipleChoice
              : undefined,
          maxSelectionsPerSubmission:
            typeof election.maxSelectionsPerSubmission === 'number'
              ? election.maxSelectionsPerSubmission
              : undefined,
        }
      : undefined,
    candidates,
  }
}

export function buildCandidateManifest(args: BuildCandidateManifestArgs): CandidateManifest {
  return {
    schema: CANDIDATE_MANIFEST_SCHEMA,
    version: CANDIDATE_MANIFEST_VERSION,
    series: {
      coverImageUrl: args.seriesCoverImageUrl ?? null,
    },
    election: {
      category: args.category?.trim() ?? null,
      coverImageUrl: args.electionCoverImageUrl ?? null,
    },
    candidates: [...args.candidates]
      .sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0))
      .map((candidate) => ({
        displayName: candidate.displayName.trim(),
        groupLabel: candidate.groupLabel ?? null,
        imageUrl: candidate.imageUrl ?? null,
      })),
  }
}

export function getCandidateManifestTitle(manifest: CandidateManifest | null) {
  return manifest?.election?.title?.trim() || ''
}

export function getCandidateManifestSeriesPreimage(manifest: CandidateManifest | null) {
  return manifest?.series?.preimage?.trim() || ''
}

export function getCandidateManifestCoverImageUrl(manifest: CandidateManifest | null) {
  return manifest?.election?.coverImageUrl ?? manifest?.series?.coverImageUrl ?? null
}
