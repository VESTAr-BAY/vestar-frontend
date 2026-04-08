import type { Address, Hex } from "viem";

export type IntegerLike = bigint | number;
export type TimestampInput = Date | bigint | number;

export const VESTAR_VISIBILITY_MODE = {
  OPEN: 0,
  PRIVATE: 1,
} as const;

export const VESTAR_ELECTION_STATE = {
  SCHEDULED: 0,
  ACTIVE: 1,
  CLOSED: 2,
  KEY_REVEAL_PENDING: 3,
  KEY_REVEALED: 4,
  FINALIZED: 5,
  CANCELLED: 6,
} as const;

export const VESTAR_PAYMENT_MODE = {
  FREE: 0,
  PAID: 1,
} as const;

export const VESTAR_BALLOT_POLICY = {
  ONE_PER_ELECTION: 0,
  ONE_PER_INTERVAL: 1,
  UNLIMITED_PAID: 2,
} as const;

export const VESTAR_ORGANIZER_CREATION_STATUS = {
  VERIFIED_ELIGIBLE: 0,
  UNVERIFIED_ELIGIBLE: 1,
  UNVERIFIED_INELIGIBLE: 2,
} as const;

export type VestarVisibilityMode =
  (typeof VESTAR_VISIBILITY_MODE)[keyof typeof VESTAR_VISIBILITY_MODE];
export type VestarElectionState =
  (typeof VESTAR_ELECTION_STATE)[keyof typeof VESTAR_ELECTION_STATE];
export type VestarPaymentMode = (typeof VESTAR_PAYMENT_MODE)[keyof typeof VESTAR_PAYMENT_MODE];
export type VestarBallotPolicy = (typeof VESTAR_BALLOT_POLICY)[keyof typeof VESTAR_BALLOT_POLICY];
export type VestarOrganizerCreationStatus =
  (typeof VESTAR_ORGANIZER_CREATION_STATUS)[keyof typeof VESTAR_ORGANIZER_CREATION_STATUS];

export interface OrganizerProfile {
  organizer: Address;
  displayNameHash: Hex;
  verified: boolean;
  verificationEffectiveTime: bigint;
  verificationRevokedTime: bigint;
  brandMetadataURI: string;
}

export interface ElectionConfigInput {
  seriesId: Hex;
  visibilityMode: VestarVisibilityMode;
  titleHash: Hex;
  candidateManifestHash: Hex;
  candidateManifestURI: string;
  startAt: IntegerLike;
  endAt: IntegerLike;
  resultRevealAt: IntegerLike;
  minKarmaTier: number;
  ballotPolicy: VestarBallotPolicy;
  resetInterval: IntegerLike;
  paymentMode: VestarPaymentMode;
  costPerBallot: IntegerLike;
  allowMultipleChoice: boolean;
  maxSelectionsPerSubmission: number;
  timezoneWindowOffset: number;
  paymentToken: Address;
  electionPublicKey: Hex;
  privateKeyCommitmentHash: Hex;
  keySchemeVersion: number;
}

export interface ElectionConfig extends ElectionConfigInput {
  startAt: bigint;
  endAt: bigint;
  resultRevealAt: bigint;
  resetInterval: bigint;
  costPerBallot: bigint;
}

export interface ResultSummaryInput {
  resultManifestHash: Hex;
  resultManifestURI: string;
  totalSubmissions: IntegerLike;
  totalValidVotes: IntegerLike;
  totalInvalidVotes: IntegerLike;
}

export interface ResultSummary extends ResultSummaryInput {
  totalSubmissions: bigint;
  totalValidVotes: bigint;
  totalInvalidVotes: bigint;
}

export interface SettlementSummary {
  paymentToken: Address;
  platformTreasury: Address;
  totalRevenueAmount: bigint;
  platformRevenueAmount: bigint;
  organizerRevenueAmount: bigint;
  settled: boolean;
}

export interface CancellationSummary {
  cancelledBy: Address;
  cancelledAt: bigint;
  previousState: VestarElectionState;
}

export interface RefundSummary {
  paymentToken: Address;
  totalRefundableAmount: bigint;
  totalRefundedAmount: bigint;
  refundsEnabledAt: bigint;
  refundsEnabledBy: Address;
  refundsEnabled: boolean;
}

export interface GroupDefinitionInput {
  groupKeyHash: Hex;
  metadataHash: Hex;
  metadataURI: string;
  enabled: boolean;
}

export interface CandidateGroupBindingInput {
  candidateHash: Hex;
  groupKeyHash: Hex;
}

export interface GroupDefinition extends GroupDefinitionInput {}

export interface OrganizerSnapshot {
  organizerAddress: Address;
  profile: OrganizerProfile;
  karmaTier: number;
  karmaBalance: bigint;
  creationStatus: VestarOrganizerCreationStatus;
  canCreateElection: boolean;
}

export interface ElectionSnapshot {
  address: Address;
  config: ElectionConfig;
  state: VestarElectionState;
  visibilityMode: VestarVisibilityMode;
  paymentMode: VestarPaymentMode;
  resultSummary: ResultSummary;
  cancellationSummary: CancellationSummary;
  settlementSummary: SettlementSummary;
  refundSummary: RefundSummary;
}

export interface ElectionVoterSnapshot {
  voter: Address;
  timestamp: bigint;
  canSubmitBallot: boolean;
  remainingBallots: number;
}
