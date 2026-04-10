export type ApiElectionState =
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'CLOSED'
  | 'KEY_REVEAL_PENDING'
  | 'KEY_REVEALED'
  | 'FINALIZED'
  | 'CANCELLED'

export type ApiVisibilityMode = 'OPEN' | 'PRIVATE'
export type ApiPaymentMode = 'FREE' | 'PAID'
export type ApiBallotPolicy = 'ONE_PER_ELECTION' | 'ONE_PER_INTERVAL' | 'UNLIMITED_PAID'
export type ApiElectionSyncState = 'PREPARED' | 'INDEXED' | 'FINALIZED'

export interface ApiElectionSeries {
  id: string
  seriesPreimage: string
  onchainSeriesId: string | null
  coverImageUrl: string | null
}

export interface ApiElectionKey {
  publicKey: string
}

export interface ApiElectionCandidate {
  id: string
  candidateKey: string
  imageUrl: string | null
  displayOrder: number
}

export interface ApiCandidateManifestPreimage {
  candidates: Array<{
    candidateKey: string
    displayName?: string | null
    displayOrder: number
    imageUrl?: string | null
  }>
}

export interface ApiElectionResultSummary {
  id: string
  electionRefId: string
  totalSubmissions: number
  totalDecryptedBallots: number
  totalValidVotes: number
  totalInvalidVotes: number
  createdAt: string
  updatedAt: string
}

export interface ApiElection {
  id: string
  draftId: string | null
  onchainSeriesId: string | null
  onchainElectionId: string
  onchainElectionAddress: `0x${string}` | null
  candidateManifestHash: string | null
  candidateManifestUri: string | null
  organizerWalletAddress: `0x${string}`
  organizerVerifiedSnapshot: boolean
  organizer: {
    walletAddress: `0x${string}`
    organizationName: string
  } | null
  visibilityMode: ApiVisibilityMode
  paymentMode: ApiPaymentMode
  ballotPolicy: ApiBallotPolicy
  startAt: string
  endAt: string
  resultRevealAt: string
  minKarmaTier: number
  resetIntervalSeconds: number
  allowMultipleChoice: boolean
  maxSelectionsPerSubmission: number
  timezoneWindowOffset: number
  paymentToken: `0x${string}` | null
  costPerBallot: string
  onchainState: ApiElectionState
  title: string | null
  category?: string | null
  coverImageUrl: string | null
  syncState: ApiElectionSyncState | null
  series: ApiElectionSeries | null
  electionKey: ApiElectionKey | null
  electionCandidates: ApiElectionCandidate[]
  validDecryptedBallotCount: number
  resultSummary: ApiElectionResultSummary | null
}

export interface ApiElectionMetadata {
  id: string
  draftId: string | null
  onchainSeriesId: string | null
  onchainElectionId: string
  onchainElectionAddress: `0x${string}` | null
  candidateManifestHash: string | null
  candidateManifestUri: string | null
  organizer: {
    walletAddress: `0x${string}`
    organizationName: string
  } | null
  title: string | null
  category?: string | null
  coverImageUrl: string | null
  series: ApiElectionSeries | null
  electionKey: ApiElectionKey | null
  electionCandidates: ApiElectionCandidate[]
}

// Legacy compatibility aliases used by the on-chain fallback data module.
export type ApiCandidate = {
  candidate_key: string
  display_name: string | null
  group_label: string | null
  image_url: string | null
  display_order: number
}

export type ApiElectionDetail = {
  id: string
  onchain_election_id: string
  onchain_election_address: `0x${string}`
  onchain_state: ApiElectionState
  title: string
  cover_image_url: string | null
  series_preimage: string
  organizer_wallet_address: `0x${string}`
  organizer_verified_snapshot: boolean
  start_at: string
  end_at: string
  result_reveal_at: string
  visibility_mode: ApiVisibilityMode
  payment_mode: ApiPaymentMode
  ballot_policy: ApiBallotPolicy
  allow_multiple_choice: boolean
  max_selections_per_submission: number
  cost_per_ballot: string
  total_submissions: number
  candidates: ApiCandidate[]
}

export type ApiElectionListResponse = {
  elections: ApiElectionDetail[]
  total: number
  page: number
  page_size: number
}

export interface ApiLiveTallyRow {
  id: string
  electionRefId: string
  candidateKey: string
  count: number
  createdAt: string
  updatedAt: string
}

export interface ApiFinalizedTallyRow {
  id: string
  electionRefId: string
  candidateKey: string
  count: number
  voteRatio: number
  finalizedAt: string
  createdAt: string
  updatedAt: string
}

export interface ApiVoteSubmissionStatus {
  id: string
  onchainTxHash: string
  voterAddress: `0x${string}`
  blockNumber: number
  blockTimestamp: string
  onchainElection: {
    id: string
    onchainElectionId: string
    onchainElectionAddress: `0x${string}`
    onchainState: ApiElectionState
    draft: {
      id: string
      title: string
      series: {
        id: string
        seriesPreimage: string
      } | null
    } | null
  }
  decryptedBallot: {
    id: string
    candidateKeys: string[]
    nonce: string
    isValid: boolean
    validatedAt: string | null
    createdAt: string
  } | null
  invalidBallots: Array<{
    id: string
    reasonCode: string
    reasonDetail: string | null
    createdAt: string
  }>
}

export interface ApiVoteHistoryItem {
  id: string
  type: 'OPEN' | 'PRIVATE'
  onchainTxHash: string
  voterAddress: `0x${string}`
  blockNumber: number
  blockTimestamp: string
  onchainElection: {
    id: string
    onchainElectionId: string
    onchainElectionAddress: `0x${string}` | null
    onchainState: ApiElectionState
    draft: {
      id: string
      title: string
      series: {
        id: string
        seriesPreimage: string
      } | null
    } | null
  } | null
  selection: {
    candidateKeys: string[]
    isPending: boolean
    isValid: boolean | null
  }
}

export interface PreparePrivateElectionRequest {
  seriesPreimage: string
  seriesCoverImageUrl?: string | null
  title: string
  coverImageUrl?: string | null
}

export interface PreparePrivateElectionResponse {
  publicKey: {
    format: 'pem'
    algorithm: 'ECDH-P256'
    value: string
  }
  privateKeyCommitmentHash: `0x${string}`
}
