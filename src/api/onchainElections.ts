import {
  type Address,
  getAbiItem,
  getAddress,
  type Hex,
  hexToBytes,
  keccak256,
  stringToHex,
} from 'viem'
import {
  getElectionConfig,
  getElectionResultSummary,
  getElectionState,
  vestarPublicClient,
} from '../contracts/vestar/actions'
import {
  vestarContractAddresses,
  vestarElectionAbi,
  vestarElectionFactoryAbi,
} from '../contracts/vestar/generated'
import {
  VESTAR_BALLOT_POLICY,
  VESTAR_ELECTION_STATE,
  VESTAR_PAYMENT_MODE,
  VESTAR_VISIBILITY_MODE,
} from '../contracts/vestar/types'
import {
  type CandidateManifest,
  getCandidateManifestCoverImageUrl,
  getCandidateManifestSeriesPreimage,
  getCandidateManifestTitle,
  parseCandidateManifest,
} from '../utils/candidateManifest'
import { resolveIpfsUrl } from '../utils/ipfs'
import { resolveStoredLanguage } from '../utils/language'
import type {
  ApiBallotPolicy,
  ApiCandidate,
  ApiElectionDetail,
  ApiElectionListResponse,
  ApiElectionState,
  ApiPaymentMode,
  ApiVisibilityMode,
} from './types'

const FACTORY_ADDRESS = getAddress(vestarContractAddresses.electionFactory)
const LOG_BLOCK_CHUNK_SIZE = 4_000n
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000' as const
const ONCHAIN_INDEX_CACHE_KEY = `vestar:onchain:index:v1:${FACTORY_ADDRESS.toLowerCase()}`
const ONCHAIN_DETAIL_CACHE_PREFIX = `vestar:onchain:detail:v2:${FACTORY_ADDRESS.toLowerCase()}:`
const ONCHAIN_MANIFEST_CACHE_PREFIX = `vestar:onchain:manifest:v2:`
const ONCHAIN_SUBMISSION_COUNT_CACHE_PREFIX = `vestar:onchain:submission-count:v1:${FACTORY_ADDRESS.toLowerCase()}:`
const ONCHAIN_DETAIL_TTL_MS = 30_000

type FactoryElectionLog = {
  blockNumber?: bigint
  args: {
    seriesId?: Hex
    electionId?: Hex
    organizer?: Address
    electionAddress?: Address
    visibilityMode?: number
    organizerVerifiedSnapshot?: boolean
    paymentMode?: number
    costPerBallot?: bigint
  }
}

type IndexedOnchainElection = {
  seriesId: Hex
  electionId: Hex
  organizer: Address
  electionAddress: Address
  organizerVerifiedSnapshot: boolean
  visibilityMode: ApiVisibilityMode
  paymentMode: ApiPaymentMode
  costPerBallot: string
  createdBlock: string
}

type StoredOnchainIndex = {
  lastSyncedBlock: string
  elections: IndexedOnchainElection[]
}

type StoredOnchainDetail = {
  updatedAt: number
  election: ApiElectionDetail
}

type StoredOnchainSubmissionCount = {
  lastSyncedBlock: string
  totalSubmissions: number
}

const electionCreatedEvent = getAbiItem({
  abi: vestarElectionFactoryAbi,
  name: 'ElectionCreated',
})!
const openVoteSubmittedEvent = getAbiItem({
  abi: vestarElectionAbi,
  name: 'OpenVoteSubmitted',
})!
const encryptedVoteSubmittedEvent = getAbiItem({
  abi: vestarElectionAbi,
  name: 'EncryptedVoteSubmitted',
})!

const onchainListRequestCache = new Map<string, Promise<ApiElectionListResponse>>()
const onchainDetailRequestCache = new Map<string, Promise<ApiElectionDetail>>()
const onchainManifestRequestCache = new Map<string, Promise<CandidateManifest | null>>()
const onchainSubmissionCountRequestCache = new Map<string, Promise<number>>()

function readStoredItem<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const value = window.localStorage.getItem(key)
    if (!value) return null
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function writeStoredItem(key: string, value: unknown) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

function decodeBytes32Ascii(value: Hex) {
  const bytes = hexToBytes(value)
  let output = ''

  for (const byte of bytes) {
    if (byte === 0) break
    if (byte < 32 || byte > 126) {
      return null
    }

    output += String.fromCharCode(byte)
  }

  return output || null
}

function truncateAddress(address: Address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function toIsoDate(value: bigint) {
  return new Date(Number(value) * 1000).toISOString()
}

function mapContractState(state: number): ApiElectionState {
  switch (state) {
    case VESTAR_ELECTION_STATE.SCHEDULED:
      return 'SCHEDULED'
    case VESTAR_ELECTION_STATE.ACTIVE:
      return 'ACTIVE'
    case VESTAR_ELECTION_STATE.CLOSED:
      return 'CLOSED'
    case VESTAR_ELECTION_STATE.KEY_REVEAL_PENDING:
      return 'KEY_REVEAL_PENDING'
    case VESTAR_ELECTION_STATE.KEY_REVEALED:
      return 'KEY_REVEALED'
    case VESTAR_ELECTION_STATE.FINALIZED:
      return 'FINALIZED'
    default:
      return 'CANCELLED'
  }
}

function mapContractVisibilityMode(mode: number): ApiVisibilityMode {
  return mode === VESTAR_VISIBILITY_MODE.PRIVATE ? 'PRIVATE' : 'OPEN'
}

function mapContractPaymentMode(mode: number): ApiPaymentMode {
  return mode === VESTAR_PAYMENT_MODE.PAID ? 'PAID' : 'FREE'
}

function mapContractBallotPolicy(policy: number): ApiBallotPolicy {
  switch (policy) {
    case VESTAR_BALLOT_POLICY.ONE_PER_INTERVAL:
      return 'ONE_PER_INTERVAL'
    case VESTAR_BALLOT_POLICY.UNLIMITED_PAID:
      return 'UNLIMITED_PAID'
    default:
      return 'ONE_PER_ELECTION'
  }
}

async function getLogsChunked<TLog>({
  address,
  event,
  fromBlock,
  toBlock,
}: {
  address: Address
  event: unknown
  fromBlock: bigint | 'earliest'
  toBlock: bigint | 'latest'
}) {
  if (fromBlock === 'earliest') {
    return (await vestarPublicClient.getLogs({
      address,
      event: event as never,
      fromBlock,
      toBlock,
    })) as TLog[]
  }

  const latestBlock = toBlock === 'latest' ? await vestarPublicClient.getBlockNumber() : toBlock
  if (fromBlock > latestBlock) {
    return [] as TLog[]
  }

  const logs: TLog[] = []
  let cursor = fromBlock

  while (cursor <= latestBlock) {
    const chunkEnd =
      cursor + LOG_BLOCK_CHUNK_SIZE > latestBlock ? latestBlock : cursor + LOG_BLOCK_CHUNK_SIZE
    const chunkLogs = (await vestarPublicClient.getLogs({
      address,
      event: event as never,
      fromBlock: cursor,
      toBlock: chunkEnd,
    })) as TLog[]

    logs.push(...chunkLogs)
    cursor = chunkEnd + 1n
  }

  return logs
}

async function syncOnchainElectionIndex() {
  const cached = readStoredItem<StoredOnchainIndex>(ONCHAIN_INDEX_CACHE_KEY)
  const latestBlock = await vestarPublicClient.getBlockNumber()
  const fromBlock = cached ? BigInt(cached.lastSyncedBlock) + 1n : 'earliest'
  const logs =
    fromBlock !== 'earliest' && fromBlock > latestBlock
      ? []
      : await getLogsChunked<FactoryElectionLog>({
          address: FACTORY_ADDRESS,
          event: electionCreatedEvent,
          fromBlock,
          toBlock: 'latest',
        })

  const byAddress = new Map(
    (cached?.elections ?? []).map((entry) => [entry.electionAddress.toLowerCase(), entry] as const),
  )

  logs.forEach((log) => {
    const electionAddress = log.args.electionAddress
    const electionId = log.args.electionId
    const organizer = log.args.organizer
    const seriesId = log.args.seriesId

    if (!electionAddress || !electionId || !organizer || !seriesId) {
      return
    }

    byAddress.set(electionAddress.toLowerCase(), {
      seriesId,
      electionId,
      organizer,
      electionAddress,
      organizerVerifiedSnapshot: Boolean(log.args.organizerVerifiedSnapshot),
      visibilityMode: mapContractVisibilityMode(log.args.visibilityMode ?? 0),
      paymentMode: mapContractPaymentMode(log.args.paymentMode ?? 0),
      costPerBallot: (log.args.costPerBallot ?? 0n).toString(),
      createdBlock: `${log.blockNumber ?? 0n}`,
    })
  })

  const elections = [...byAddress.values()].sort((left, right) =>
    BigInt(left.createdBlock) > BigInt(right.createdBlock) ? -1 : 1,
  )

  writeStoredItem(ONCHAIN_INDEX_CACHE_KEY, {
    elections,
    lastSyncedBlock: `${latestBlock}`,
  } satisfies StoredOnchainIndex)

  return elections
}

function parseManifestBody(body: string) {
  try {
    return parseCandidateManifest(JSON.parse(body))
  } catch {
    return null
  }
}

async function readCandidateManifest(uri: string, expectedHash: Hex) {
  if (!uri) {
    return null
  }

  const manifestCacheKey = `${ONCHAIN_MANIFEST_CACHE_PREFIX}${expectedHash}:${uri}`
  const requestCacheKey = `${expectedHash}:${uri}`
  const cached = readStoredItem<string>(manifestCacheKey)

  if (cached) {
    const parsed = parseManifestBody(cached)
    if (parsed) {
      return parsed
    }
  }

  if (onchainManifestRequestCache.has(requestCacheKey)) {
    return onchainManifestRequestCache.get(requestCacheKey) ?? null
  }

  const pending = (async () => {
    try {
      const response = await fetch(resolveIpfsUrl(uri))
      if (!response.ok) {
        return null
      }

      const body = await response.text()
      const parsed = parseManifestBody(body)
      if (!parsed) {
        return null
      }

      writeStoredItem(manifestCacheKey, body)

      if (expectedHash === ZERO_HASH || keccak256(stringToHex(body)) === expectedHash) {
        return parsed
      }

      // sungje : 이미지/설명 같은 UI 메타가 섞여 canonical hash와 달라도 candidateKey 배열이 유효하면 화면 fallback 허용
      return parsed
    } catch {
      return null
    }
  })()

  onchainManifestRequestCache.set(requestCacheKey, pending)
  const resolved = await pending
  if (resolved === null) {
    onchainManifestRequestCache.delete(requestCacheKey)
  }

  return resolved
}

function buildFallbackTitle(electionId: Hex, electionAddress: Address) {
  const lang = resolveStoredLanguage()

  return (
    decodeBytes32Ascii(electionId) ??
    (lang === 'ko'
      ? `투표 ${truncateAddress(electionAddress)}`
      : `Vote ${truncateAddress(electionAddress)}`)
  )
}

function buildFallbackSeries(entry: IndexedOnchainElection) {
  return decodeBytes32Ascii(entry.seriesId) ?? truncateAddress(entry.organizer)
}

function mapManifestCandidates(manifest: CandidateManifest | null): ApiCandidate[] {
  return [...(manifest?.candidates ?? [])]
    .map((candidate, index) => ({
      candidate_key: candidate.candidateKey ?? candidate.displayName ?? '',
      display_name: candidate.displayName ?? null,
      group_label: candidate.groupLabel ?? null,
      image_url: candidate.imageUrl ?? null,
      display_order: candidate.displayOrder ?? index + 1,
    }))
    .sort((left, right) => left.display_order - right.display_order)
}

function readFreshDetailCache(electionAddress: Address) {
  const cached = readStoredItem<StoredOnchainDetail>(
    `${ONCHAIN_DETAIL_CACHE_PREFIX}${electionAddress.toLowerCase()}`,
  )

  if (!cached) {
    return null
  }

  if (Date.now() - cached.updatedAt > ONCHAIN_DETAIL_TTL_MS) {
    return null
  }

  return cached.election
}

export async function fetchOnchainElectionSubmissionCount(
  electionAddress: Address,
): Promise<number> {
  const normalizedAddress = electionAddress.toLowerCase()
  const cached = readStoredItem<StoredOnchainSubmissionCount>(
    `${ONCHAIN_SUBMISSION_COUNT_CACHE_PREFIX}${normalizedAddress}`,
  )
  const latestBlock = await vestarPublicClient.getBlockNumber()
  const fromBlock = cached ? BigInt(cached.lastSyncedBlock) + 1n : 'earliest'

  if (fromBlock !== 'earliest' && fromBlock > latestBlock) {
    return cached?.totalSubmissions ?? 0
  }

  const requestCacheKey = normalizedAddress
  if (onchainSubmissionCountRequestCache.has(requestCacheKey)) {
    return onchainSubmissionCountRequestCache.get(requestCacheKey) as Promise<number>
  }

  const pending = (async () => {
    const [openLogs, encryptedLogs] = await Promise.all([
      getLogsChunked({
        address: electionAddress,
        event: openVoteSubmittedEvent,
        fromBlock,
        toBlock: 'latest',
      }),
      getLogsChunked({
        address: electionAddress,
        event: encryptedVoteSubmittedEvent,
        fromBlock,
        toBlock: 'latest',
      }),
    ])

    const totalSubmissions =
      (cached?.totalSubmissions ?? 0) + openLogs.length + encryptedLogs.length

    writeStoredItem(`${ONCHAIN_SUBMISSION_COUNT_CACHE_PREFIX}${normalizedAddress}`, {
      lastSyncedBlock: `${latestBlock}`,
      totalSubmissions,
    } satisfies StoredOnchainSubmissionCount)

    return totalSubmissions
  })()

  onchainSubmissionCountRequestCache.set(requestCacheKey, pending)
  try {
    return await pending
  } finally {
    onchainSubmissionCountRequestCache.delete(requestCacheKey)
  }
}

export async function fetchOnchainElectionDetail(id: string): Promise<ApiElectionDetail> {
  const index = await syncOnchainElectionIndex()
  const normalizedId = id.toLowerCase()
  const entry =
    index.find((item) => item.electionAddress.toLowerCase() === normalizedId) ??
    index.find((item) => item.electionId.toLowerCase() === normalizedId)

  if (!entry) {
    throw new Error(`On-chain election ${id} not found`)
  }

  const requestCacheKey = entry.electionAddress.toLowerCase()
  const cached = readFreshDetailCache(entry.electionAddress)
  if (cached) {
    return cached
  }

  if (onchainDetailRequestCache.has(requestCacheKey)) {
    return onchainDetailRequestCache.get(requestCacheKey) as Promise<ApiElectionDetail>
  }

  const pending = (async () => {
    const [config, state, resultSummary, liveSubmissionCount] = await Promise.all([
      getElectionConfig(entry.electionAddress),
      getElectionState(entry.electionAddress),
      getElectionResultSummary(entry.electionAddress),
      fetchOnchainElectionSubmissionCount(entry.electionAddress),
    ])
    const manifest = await readCandidateManifest(
      config.candidateManifestURI,
      config.candidateManifestHash,
    )
    // sungje : finalize 전 getResultSummary().totalSubmissions 는 0일 수 있어서 제출 이벤트 개수로 live 참여수 보강
    const totalSubmissions = Math.max(Number(resultSummary.totalSubmissions), liveSubmissionCount)

    const election: ApiElectionDetail = {
      id: entry.electionAddress,
      onchain_election_id: entry.electionId,
      onchain_election_address: entry.electionAddress,
      onchain_state: mapContractState(state),
      title:
        getCandidateManifestTitle(manifest) ||
        buildFallbackTitle(entry.electionId, entry.electionAddress),
      cover_image_url: getCandidateManifestCoverImageUrl(manifest),
      series_preimage: getCandidateManifestSeriesPreimage(manifest) || buildFallbackSeries(entry),
      organizer_wallet_address: entry.organizer,
      organizer_verified_snapshot: entry.organizerVerifiedSnapshot,
      start_at: toIsoDate(config.startAt),
      end_at: toIsoDate(config.endAt),
      result_reveal_at: toIsoDate(config.resultRevealAt),
      visibility_mode: mapContractVisibilityMode(config.visibilityMode),
      payment_mode: mapContractPaymentMode(config.paymentMode),
      ballot_policy: mapContractBallotPolicy(config.ballotPolicy),
      allow_multiple_choice: config.allowMultipleChoice,
      max_selections_per_submission: Number(config.maxSelectionsPerSubmission),
      cost_per_ballot: config.costPerBallot.toString(),
      total_submissions: totalSubmissions,
      candidates: mapManifestCandidates(manifest),
    }

    writeStoredItem(`${ONCHAIN_DETAIL_CACHE_PREFIX}${entry.electionAddress.toLowerCase()}`, {
      updatedAt: Date.now(),
      election,
    } satisfies StoredOnchainDetail)

    return election
  })()

  onchainDetailRequestCache.set(requestCacheKey, pending)
  try {
    return await pending
  } finally {
    onchainDetailRequestCache.delete(requestCacheKey)
  }
}

export async function fetchOnchainElectionList(
  params: { state?: string; page?: number; pageSize?: number } = {},
): Promise<ApiElectionListResponse> {
  const requestCacheKey = JSON.stringify({
    state: params.state ?? 'ALL',
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 100,
  })

  if (onchainListRequestCache.has(requestCacheKey)) {
    return onchainListRequestCache.get(requestCacheKey) as Promise<ApiElectionListResponse>
  }

  const pending = (async () => {
    const index = await syncOnchainElectionIndex()
    const detailResults = await Promise.allSettled(
      index.map((entry) => fetchOnchainElectionDetail(entry.electionAddress)),
    )

    const elections = detailResults
      .map((result) => (result.status === 'fulfilled' ? result.value : null))
      .filter((election): election is ApiElectionDetail => election !== null)
      .filter((election) => !params.state || election.onchain_state === params.state)

    const page = params.page ?? 1
    const pageSize = params.pageSize ?? elections.length
    const start = Math.max(0, (page - 1) * pageSize)
    const end = start + pageSize

    return {
      elections: elections.slice(start, end),
      total: elections.length,
      page,
      page_size: pageSize,
    }
  })()

  onchainListRequestCache.set(requestCacheKey, pending)
  try {
    return await pending
  } finally {
    onchainListRequestCache.delete(requestCacheKey)
  }
}
