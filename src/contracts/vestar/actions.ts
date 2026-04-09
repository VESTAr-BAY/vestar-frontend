import {
  type Abi,
  type Address,
  createPublicClient,
  type Hash,
  type Hex,
  http,
  keccak256,
  type TransactionReceipt,
  toHex,
  type WalletClient,
} from 'viem'
import { vestarStatusTestnetChain } from './chain'
import {
  mockUsdtAbi,
  vestarContractAddresses,
  vestarElectionAbi,
  vestarElectionFactoryAbi,
  vestarKarmaRegistryAbi,
  vestarOrganizerRegistryAbi,
  vestarStatusTestnet,
} from './generated'
import type {
  CancellationSummary,
  CandidateGroupBindingInput,
  CreateElectionInput,
  ElectionConfig,
  ElectionConfigInput,
  ElectionSnapshot,
  ElectionVoterSnapshot,
  GroupDefinition,
  GroupDefinitionInput,
  OrganizerProfile,
  OrganizerSnapshot,
  RefundSummary,
  ResultSummary,
  ResultSummaryInput,
  SettlementSummary,
  TimestampInput,
  VestarElectionState,
  VestarOrganizerCreationStatus,
  VestarPaymentMode,
  VestarVisibilityMode,
} from './types'

interface ReadContractOptions {
  abi: Abi
  address: Address
  functionName: string
  args?: readonly unknown[]
}

interface WriteContractOptions extends ReadContractOptions {
  walletClient: WalletClient
}

/**
 * Shared public client for Status Network Testnet reads.
 */
export const vestarPublicClient = createPublicClient({
  chain: vestarStatusTestnetChain,
  transport: http(vestarStatusTestnet.rpcUrl),
})

export function isVestarStatusTestnetChain(chainId?: number): boolean {
  return chainId === vestarStatusTestnetChain.id
}

/**
 * Use for candidate keys, group keys, display labels, etc. whenever the contract expects bytes32 hashes.
 */
export function hashVestarText(value: string): Hex {
  return keccak256(toHex(value))
}

/**
 * Normalizes JS dates or numbers into unix seconds for uint64 contract parameters.
 */
export function toVestarUnixTime(value: TimestampInput = Date.now()): bigint {
  if (value instanceof Date) {
    return BigInt(Math.floor(value.getTime() / 1000))
  }

  if (typeof value === 'bigint') {
    return value
  }

  // JS callers often pass Date.now() in milliseconds. Normalize large numbers to unix seconds.
  if (value > 1_000_000_000_000) {
    return BigInt(Math.floor(value / 1000))
  }

  return BigInt(Math.floor(value))
}

export async function waitForVestarTransactionReceipt(hash: Hash): Promise<TransactionReceipt> {
  return vestarPublicClient.waitForTransactionReceipt({ hash })
}

async function readVestarContract<TResult>({
  abi,
  address,
  functionName,
  args,
}: ReadContractOptions): Promise<TResult> {
  return vestarPublicClient.readContract({
    abi,
    address,
    functionName: functionName as never,
    args: (args ?? []) as never,
  }) as Promise<TResult>
}

function getWalletAccount(walletClient: WalletClient) {
  if (!walletClient.account) {
    throw new Error(
      "walletClient.account is missing. Pass the result of wagmi's useWalletClient() or a connected viem WalletClient.",
    )
  }

  if (walletClient.chain && walletClient.chain.id !== vestarStatusTestnetChain.id) {
    throw new Error(
      `VESTAr contracts are deployed on Status Network Testnet (${vestarStatusTestnetChain.id}).`,
    )
  }

  return walletClient.account
}

async function writeVestarContract({
  walletClient,
  abi,
  address,
  functionName,
  args,
}: WriteContractOptions): Promise<Hash> {
  const account = getWalletAccount(walletClient)
  const { request } = await vestarPublicClient.simulateContract({
    abi,
    account,
    address,
    chain: vestarStatusTestnetChain,
    functionName: functionName as never,
    args: (args ?? []) as never,
  })

  return walletClient.writeContract(request)
}

export async function getOrganizerProfile(organizerAddress: Address): Promise<OrganizerProfile> {
  return readVestarContract<OrganizerProfile>({
    abi: vestarOrganizerRegistryAbi,
    address: vestarContractAddresses.organizerRegistry,
    functionName: 'getOrganizerProfile',
    args: [organizerAddress],
  })
}

export async function getOrganizerCreationStatus(
  organizerAddress: Address,
  karmaTier: number,
): Promise<VestarOrganizerCreationStatus> {
  return readVestarContract<VestarOrganizerCreationStatus>({
    abi: vestarOrganizerRegistryAbi,
    address: vestarContractAddresses.organizerRegistry,
    functionName: 'getOrganizerCreationStatus',
    args: [organizerAddress, karmaTier],
  })
}

export async function canCreateElection(
  organizerAddress: Address,
  karmaTier: number,
): Promise<boolean> {
  return readVestarContract<boolean>({
    abi: vestarOrganizerRegistryAbi,
    address: vestarContractAddresses.organizerRegistry,
    functionName: 'canCreateElection',
    args: [organizerAddress, karmaTier],
  })
}

export async function isOrganizerVerified(organizerAddress: Address): Promise<boolean> {
  return readVestarContract<boolean>({
    abi: vestarOrganizerRegistryAbi,
    address: vestarContractAddresses.organizerRegistry,
    functionName: 'isVerified',
    args: [organizerAddress],
  })
}

export async function upsertOrganizerProfile(
  walletClient: WalletClient,
  params: {
    displayNameHash: Hex
    brandMetadataURI: string
  },
): Promise<Hash> {
  return writeVestarContract({
    walletClient,
    abi: vestarOrganizerRegistryAbi,
    address: vestarContractAddresses.organizerRegistry,
    functionName: 'upsertOrganizerProfile',
    args: [params.displayNameHash, params.brandMetadataURI],
  })
}

export async function getKarmaTier(account: Address): Promise<number> {
  return readVestarContract<number>({
    abi: vestarKarmaRegistryAbi,
    address: vestarContractAddresses.karmaRegistry,
    functionName: 'tierIdOf',
    args: [account],
  })
}

export async function getKarmaBalance(account: Address): Promise<bigint> {
  return readVestarContract<bigint>({
    abi: vestarKarmaRegistryAbi,
    address: vestarContractAddresses.karmaRegistry,
    functionName: 'karmaBalanceOf',
    args: [account],
  })
}

export async function getMockUsdtBalance(account: Address): Promise<bigint> {
  return readVestarContract<bigint>({
    abi: mockUsdtAbi,
    address: vestarContractAddresses.mockUsdt,
    functionName: 'balanceOf',
    args: [account],
  })
}

export async function isKarmaEligible(account: Address, minTier: number): Promise<boolean> {
  return readVestarContract<boolean>({
    abi: vestarKarmaRegistryAbi,
    address: vestarContractAddresses.karmaRegistry,
    functionName: 'isEligible',
    args: [account, minTier],
  })
}

export async function getOrganizerSnapshot(organizerAddress: Address): Promise<OrganizerSnapshot> {
  const [profile, karmaTier, karmaBalance] = await Promise.all([
    getOrganizerProfile(organizerAddress),
    getKarmaTier(organizerAddress),
    getKarmaBalance(organizerAddress),
  ])
  const [creationStatus, canCreateElectionFlag] = await Promise.all([
    getOrganizerCreationStatus(organizerAddress, karmaTier),
    canCreateElection(organizerAddress, karmaTier),
  ])

  return {
    organizerAddress,
    profile,
    karmaTier,
    karmaBalance,
    creationStatus,
    canCreateElection: canCreateElectionFlag,
  }
}

export async function createElection(
  walletClient: WalletClient,
  input: CreateElectionInput,
): Promise<Hash>
export async function createElection(
  walletClient: WalletClient,
  config: ElectionConfigInput,
  initialCandidateHashes: readonly Hex[],
): Promise<Hash>
export async function createElection(
  walletClient: WalletClient,
  inputOrConfig: CreateElectionInput | ElectionConfigInput,
  maybeInitialCandidateHashes?: readonly Hex[],
): Promise<Hash> {
  const input: CreateElectionInput =
    maybeInitialCandidateHashes === undefined
      ? (inputOrConfig as CreateElectionInput)
      : {
          config: inputOrConfig as ElectionConfigInput,
          initialCandidateHashes: [...maybeInitialCandidateHashes],
        }

  return writeVestarContract({
    walletClient,
    abi: vestarElectionFactoryAbi,
    address: vestarContractAddresses.electionFactory,
    functionName: 'createElection',
    args: [input.config, input.initialCandidateHashes],
  })
}

export async function getElectionAddress(electionId: Hex): Promise<Address> {
  return readVestarContract<Address>({
    abi: vestarElectionFactoryAbi,
    address: vestarContractAddresses.electionFactory,
    functionName: 'getElection',
    args: [electionId],
  })
}

export async function getElectionId(electionAddress: Address): Promise<Hex> {
  return readVestarContract<Hex>({
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'electionId',
  })
}

export async function getFactoryElectionCount(): Promise<bigint> {
  return readVestarContract<bigint>({
    abi: vestarElectionFactoryAbi,
    address: vestarContractAddresses.electionFactory,
    functionName: 'totalElections',
  })
}

export async function getElectionConfig(electionAddress: Address): Promise<ElectionConfig> {
  return readVestarContract<ElectionConfig>({
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'getElectionConfig',
  })
}

export async function getElectionState(electionAddress: Address): Promise<VestarElectionState> {
  return readVestarContract<VestarElectionState>({
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'state',
  })
}

export async function getElectionVisibilityMode(
  electionAddress: Address,
): Promise<VestarVisibilityMode> {
  return readVestarContract<VestarVisibilityMode>({
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'visibilityMode',
  })
}

export async function getElectionPaymentMode(electionAddress: Address): Promise<VestarPaymentMode> {
  return readVestarContract<VestarPaymentMode>({
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'paymentMode',
  })
}

export async function getElectionResultSummary(electionAddress: Address): Promise<ResultSummary> {
  return readVestarContract<ResultSummary>({
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'getResultSummary',
  })
}

export async function getElectionSettlementSummary(
  electionAddress: Address,
): Promise<SettlementSummary> {
  return readVestarContract<SettlementSummary>({
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'getSettlementSummary',
  })
}

export async function getElectionCancellationSummary(
  electionAddress: Address,
): Promise<CancellationSummary> {
  return readVestarContract<CancellationSummary>({
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'getCancellationSummary',
  })
}

export async function getElectionRefundSummary(electionAddress: Address): Promise<RefundSummary> {
  return readVestarContract<RefundSummary>({
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'getRefundSummary',
  })
}

export async function getElectionRefundsEnabled(electionAddress: Address): Promise<boolean> {
  return readVestarContract<boolean>({
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'refundsEnabled',
  })
}

export async function getElectionRefundableAmount(
  electionAddress: Address,
  voter: Address,
): Promise<bigint> {
  return readVestarContract<bigint>({
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'refundableAmountOf',
    args: [voter],
  })
}

export async function getElectionRemainingBallots(
  electionAddress: Address,
  voter: Address,
  timestamp: TimestampInput = Date.now(),
): Promise<number> {
  return readVestarContract<number>({
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'remainingBallots',
    args: [voter, toVestarUnixTime(timestamp)],
  })
}

export async function canAccountSubmitBallot(
  electionAddress: Address,
  voter: Address,
  timestamp: TimestampInput = Date.now(),
): Promise<boolean> {
  return readVestarContract<boolean>({
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'canSubmitBallot',
    args: [voter, toVestarUnixTime(timestamp)],
  })
}

export async function quoteElectionPayment(
  electionAddress: Address,
  ballotCount: bigint | number,
): Promise<bigint> {
  return readVestarContract<bigint>({
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'quotePayment',
    args: [ballotCount],
  })
}

export async function getTotalVotesForCandidate(
  electionAddress: Address,
  candidateKey: string,
): Promise<bigint> {
  return readVestarContract<bigint>({
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'totalVotesForCandidate',
    args: [candidateKey],
  })
}

export async function getGroupDefinition(
  electionAddress: Address,
  groupKeyHash: Hex,
): Promise<GroupDefinition> {
  return readVestarContract<GroupDefinition>({
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'getGroupDefinition',
    args: [groupKeyHash],
  })
}

export async function getCandidateGroup(
  electionAddress: Address,
  candidateHash: Hex,
): Promise<Hex> {
  return readVestarContract<Hex>({
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'candidateGroupOf',
    args: [candidateHash],
  })
}

export async function getElectionSnapshot(electionAddress: Address): Promise<ElectionSnapshot> {
  const [
    electionId,
    config,
    state,
    visibilityMode,
    paymentMode,
    resultSummary,
    cancellationSummary,
    settlementSummary,
    refundSummary,
  ] = await Promise.all([
    getElectionId(electionAddress),
    getElectionConfig(electionAddress),
    getElectionState(electionAddress),
    getElectionVisibilityMode(electionAddress),
    getElectionPaymentMode(electionAddress),
    getElectionResultSummary(electionAddress),
    getElectionCancellationSummary(electionAddress),
    getElectionSettlementSummary(electionAddress),
    getElectionRefundSummary(electionAddress),
  ])

  return {
    address: electionAddress,
    electionId,
    config,
    state,
    visibilityMode,
    paymentMode,
    resultSummary,
    cancellationSummary,
    settlementSummary,
    refundSummary,
  }
}

export async function getElectionVoterSnapshot(
  electionAddress: Address,
  voter: Address,
  timestamp: TimestampInput = Date.now(),
): Promise<ElectionVoterSnapshot> {
  const resolvedTimestamp = toVestarUnixTime(timestamp)
  const [canSubmitBallot, remainingBallots] = await Promise.all([
    canAccountSubmitBallot(electionAddress, voter, resolvedTimestamp),
    getElectionRemainingBallots(electionAddress, voter, resolvedTimestamp),
  ])

  return {
    voter,
    timestamp: resolvedTimestamp,
    canSubmitBallot,
    remainingBallots,
  }
}

/**
 * For React callers, pass `walletClient` from `useWalletClient({ chainId: vestarStatusTestnetChain.id })`.
 */
export async function submitOpenVote(
  walletClient: WalletClient,
  electionAddress: Address,
  candidateKeys: string[],
): Promise<Hash> {
  return writeVestarContract({
    walletClient,
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'submitOpenVote',
    args: [candidateKeys],
  })
}

export async function submitEncryptedVote(
  walletClient: WalletClient,
  electionAddress: Address,
  encryptedBallot: Hex,
): Promise<Hash> {
  return writeVestarContract({
    walletClient,
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'submitEncryptedVote',
    args: [encryptedBallot],
  })
}

export async function mintMockUsdt(
  walletClient: WalletClient,
  to: Address,
  amount: bigint,
): Promise<Hash> {
  return writeVestarContract({
    walletClient,
    abi: mockUsdtAbi,
    address: vestarContractAddresses.mockUsdt,
    functionName: 'mint',
    args: [to, amount],
  })
}

export async function closeElection(
  walletClient: WalletClient,
  electionAddress: Address,
): Promise<Hash> {
  return writeVestarContract({
    walletClient,
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'closeElection',
  })
}

export async function cancelElection(
  walletClient: WalletClient,
  electionAddress: Address,
): Promise<Hash> {
  return writeVestarContract({
    walletClient,
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'cancelElection',
  })
}

export async function cancelElectionBeforeStart(
  walletClient: WalletClient,
  electionAddress: Address,
): Promise<Hash> {
  return cancelElection(walletClient, electionAddress)
}

export async function settleElectionRevenue(
  walletClient: WalletClient,
  electionAddress: Address,
): Promise<Hash> {
  return writeVestarContract({
    walletClient,
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'settleRevenue',
  })
}

export async function enableElectionRefunds(
  walletClient: WalletClient,
  electionAddress: Address,
): Promise<Hash> {
  return writeVestarContract({
    walletClient,
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'enableRefunds',
  })
}

export async function claimElectionRefund(
  walletClient: WalletClient,
  electionAddress: Address,
): Promise<Hash> {
  return writeVestarContract({
    walletClient,
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'claimRefund',
  })
}

export async function finalizeElectionResults(
  walletClient: WalletClient,
  electionAddress: Address,
  resultSummary: ResultSummaryInput,
): Promise<Hash> {
  return writeVestarContract({
    walletClient,
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'finalizeResults',
    args: [resultSummary],
  })
}

export async function setCandidateAllowlist(
  walletClient: WalletClient,
  electionAddress: Address,
  candidateHashes: Hex[],
  allowed: boolean,
): Promise<Hash> {
  return writeVestarContract({
    walletClient,
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'setCandidateAllowlist',
    args: [candidateHashes, allowed],
  })
}

export async function setGroupDefinitions(
  walletClient: WalletClient,
  electionAddress: Address,
  groupDefinitions: GroupDefinitionInput[],
): Promise<Hash> {
  return writeVestarContract({
    walletClient,
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'setGroupDefinitions',
    args: [groupDefinitions],
  })
}

export async function setCandidateGroups(
  walletClient: WalletClient,
  electionAddress: Address,
  bindings: CandidateGroupBindingInput[],
): Promise<Hash> {
  return writeVestarContract({
    walletClient,
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'setCandidateGroups',
    args: [bindings],
  })
}

export async function setRevealManager(
  walletClient: WalletClient,
  electionAddress: Address,
  manager: Address,
  allowed: boolean,
): Promise<Hash> {
  return writeVestarContract({
    walletClient,
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'setRevealManager',
    args: [manager, allowed],
  })
}

export async function revealElectionPrivateKey(
  walletClient: WalletClient,
  electionAddress: Address,
  privateKeyData: Hex,
): Promise<Hash> {
  return writeVestarContract({
    walletClient,
    abi: vestarElectionAbi,
    address: electionAddress,
    functionName: 'revealPrivateKey',
    args: [privateKeyData],
  })
}
