import type { Address, Hex } from 'viem'
import type { CandidateManifest as SharedCandidateManifest } from '../../../utils/candidateManifest'

export type VisibilityMode = 'OPEN' | 'PRIVATE'

export type ElectionConfig = {
  seriesId: Hex
  visibilityMode: number
  titleHash: Hex
  candidateManifestHash: Hex
  candidateManifestURI: string
  startAt: bigint
  endAt: bigint
  resultRevealAt: bigint
  minKarmaTier: number
  ballotPolicy: number
  resetInterval: bigint
  paymentMode: number
  costPerBallot: bigint
  allowMultipleChoice: boolean
  maxSelectionsPerSubmission: number
  timezoneWindowOffset: number
  paymentToken: Address
  electionPublicKey: Hex
  privateKeyCommitmentHash: Hex
  keySchemeVersion: number
}

export type ResultSummary = {
  resultManifestHash: Hex
  resultManifestURI: string
  totalSubmissions: bigint
  totalValidVotes: bigint
  totalInvalidVotes: bigint
}

export type CandidateManifest = SharedCandidateManifest

export type ResultManifest = {
  schemaVersion?: number
  electionId?: string
  summary?: string
  totalSubmissions?: number
  totalValidVotes?: number
  totalInvalidVotes?: number
  results?: Array<{
    candidateKey: string
    displayName?: string
    votes: number
  }>
}

export type CanonicalBallotPayloadV1 = {
  schemaVersion?: number
  electionId?: string
  chainId?: number
  electionAddress?: string
  voterAddress?: string
  candidateKeys?: string[]
  nonce?: string
}

export type RsaOaepAes256GcmEnvelope = {
  algorithm: 'rsa-oaep-aes-256-gcm'
  encryptedKey: string
  iv: string
  authTag: string
  ciphertext: string
}

export type EcdhP256Aes256GcmEnvelope = {
  algorithm: 'ecdh-p256-aes-256-gcm'
  ephemeralPublicKey: string
  iv: string
  authTag: string
  ciphertext: string
}

export type EncryptedBallotEnvelope = RsaOaepAes256GcmEnvelope | EcdhP256Aes256GcmEnvelope

export type ReceiptSelection = {
  key: string
  name: string
  emoji: string
  imageUrl?: string | null
  index?: number
}

export type VerificationReceipt = {
  id: string
  transactionHash: Hex
  transactionExplorerUrl: string
  walletAddress: Address
  walletLabel: string
  walletExplorerUrl: string
  submittedAtLabel: string
  selections: ReceiptSelection[]
  encryptedBallot: Hex | null
}

export type VerificationCandidate = {
  rank: number
  key: string
  name: string
  emoji: string
  imageUrl?: string | null
  subtitle: string
  votes: number
  percentage: number
}

export type VerificationElectionSummary = {
  id: string
  chainSeriesId: Hex
  mode: VisibilityMode
  modeLabel: string
  state: number
  stateLabel: string
  isFinalized: boolean
  seriesTitle: string | null
  title: string
  description: string
  hostName: string
  hostVerified: boolean
  hostBadge: string
  address: Address
  addressExplorerUrl: string
  resultRevealAtLabel: string
  finalizeTransactionHash: string
  finalizeExplorerUrl: string
  resultSummaryNote: string | null
  totalSubmissions: number
  validVotes: number
  invalidVotes: number
  receiptCount: number
  publicKey: Hex | null
  privateKeyCommitmentHash: Hex | null
  revealedPrivateKey: Hex | null
  keySchemeVersion: number | null
  canDecrypt: boolean
  topCandidate: VerificationCandidate | null
  chainElectionId: Hex
  candidateManifestHash: Hex
  candidateManifestURI: string
  category: string | null
  coverImageUrl: string | null
  resultManifestHash: Hex
  resultManifestURI: string
  createdBlock: string
  sortBlock: string
}

export type VerificationElectionDetail = VerificationElectionSummary & {
  receipts: VerificationReceipt[]
  candidates: VerificationCandidate[]
}

export type FactoryElectionLog = {
  blockNumber?: bigint
  args: {
    electionId?: Hex
    organizer?: Address
    organizerVerifiedSnapshot?: boolean
    electionAddress?: Address
    visibilityMode?: number
  }
}

export type ResultFinalizedLog = {
  transactionHash?: Hex
  blockNumber?: bigint
}

export type OpenReceiptLog = {
  transactionHash?: Hex
  blockNumber: bigint
  args: {
    voter?: Address
  }
}

export type PrivateReceiptLog = {
  transactionHash?: Hex
  blockNumber: bigint
  args: {
    voter?: Address
  }
}

export type StoredIndexCache = {
  lastSyncedAt: number
  lastSyncedBlock: string
  elections: VerificationElectionSummary[]
}

export type DetailRefreshOptions = {
  force?: boolean
}
