import {
  canAccountSubmitBallot,
  canCreateElection,
  cancelElection,
  cancelElectionBeforeStart,
  claimElectionRefund,
  closeElection,
  createElection,
  enableElectionRefunds,
  finalizeElectionResults,
  getCandidateGroup,
  getElectionAddress,
  getElectionCancellationSummary,
  getElectionConfig,
  getElectionId,
  getElectionPaymentMode,
  getElectionRefundableAmount,
  getElectionRefundSummary,
  getElectionRefundsEnabled,
  getElectionRemainingBallots,
  getElectionResultSummary,
  getElectionSettlementSummary,
  getElectionSnapshot,
  getElectionState,
  getElectionVisibilityMode,
  getElectionVoterSnapshot,
  getFactoryElectionCount,
  getGroupDefinition,
  getKarmaBalance,
  getKarmaTier,
  getOrganizerCreationStatus,
  getOrganizerProfile,
  getOrganizerSnapshot,
  getTotalVotesForCandidate,
  hashVestarText,
  isKarmaEligible,
  isOrganizerVerified,
  isVestarStatusTestnetChain,
  quoteElectionPayment,
  revealElectionPrivateKey,
  setCandidateAllowlist,
  setCandidateGroups,
  setGroupDefinitions,
  setRevealManager,
  settleElectionRevenue,
  submitEncryptedVote,
  submitOpenVote,
  toVestarUnixTime,
  upsertOrganizerProfile,
  waitForVestarTransactionReceipt,
} from './actions'
import { vestarStatusTestnetChain } from './chain'
import { vestarContractAddresses } from './generated'

/**
 * Stable frontend-facing contract surface.
 * Prefer importing from this file (or `src/contracts/vestar`) instead of using
 * generated ABIs or low-level action helpers directly in page components.
 */
export const vestarContracts = {
  chain: vestarStatusTestnetChain,
  addresses: vestarContractAddresses,
} as const

export const vestarUtils = {
  hashText: hashVestarText,
  isStatusTestnetChain: isVestarStatusTestnetChain,
  toUnixTime: toVestarUnixTime,
  waitForReceipt: waitForVestarTransactionReceipt,
} as const

export const vestarOrganizer = {
  getProfile: getOrganizerProfile,
  getSnapshot: getOrganizerSnapshot,
  getKarmaTier,
  getKarmaBalance,
  getCreationStatus: getOrganizerCreationStatus,
  canCreateElection,
  isVerified: isOrganizerVerified,
  isKarmaEligible,
  upsertProfile: upsertOrganizerProfile,
} as const

export const vestarFactory = {
  createElection,
  getElectionAddress,
  getElectionCount: getFactoryElectionCount,
} as const

export const vestarElection = {
  getElectionId,
  getConfig: getElectionConfig,
  getState: getElectionState,
  getVisibilityMode: getElectionVisibilityMode,
  getPaymentMode: getElectionPaymentMode,
  getResultSummary: getElectionResultSummary,
  getCancellationSummary: getElectionCancellationSummary,
  getSettlementSummary: getElectionSettlementSummary,
  getRefundSummary: getElectionRefundSummary,
  getRefundableAmount: getElectionRefundableAmount,
  refundsEnabled: getElectionRefundsEnabled,
  getSnapshot: getElectionSnapshot,
  getVoterSnapshot: getElectionVoterSnapshot,
  getRemainingBallots: getElectionRemainingBallots,
  canSubmitBallot: canAccountSubmitBallot,
  getCandidateVotes: getTotalVotesForCandidate,
  quotePayment: quoteElectionPayment,
  getGroupDefinition,
  getCandidateGroup,
} as const

export const vestarVoting = {
  submitOpenVote,
  submitEncryptedVote,
} as const

export const vestarElectionAdmin = {
  close: closeElection,
  cancel: cancelElection,
  cancelBeforeStart: cancelElectionBeforeStart,
  settleRevenue: settleElectionRevenue,
  enableRefunds: enableElectionRefunds,
  claimRefund: claimElectionRefund,
  finalizeResults: finalizeElectionResults,
  setCandidateAllowlist,
  setGroupDefinitions,
  setCandidateGroups,
  setRevealManager,
  revealPrivateKey: revealElectionPrivateKey,
} as const

export const vestar = {
  contracts: vestarContracts,
  utils: vestarUtils,
  organizer: vestarOrganizer,
  factory: vestarFactory,
  election: vestarElection,
  voting: vestarVoting,
  admin: vestarElectionAdmin,
} as const
