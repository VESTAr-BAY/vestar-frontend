import type { Hex } from 'viem'
import {
  getCandidateManifestCoverImageUrl,
  getCandidateManifestSeriesPreimage,
  getCandidateManifestTitle,
} from '../../../utils/candidateManifest'
import {
  isDetailFresh,
  normalizeElectionSummary,
  parseStoredBlock,
  readCachedVerificationElectionDetail,
  readCachedVerificationElectionSummaries,
  readStoredIndexCache,
  sortElectionSummaries,
  writeStoredItem,
} from './cache'
import { getLogsChunked } from './chain'
import {
  DETAIL_CACHE_PREFIX,
  electionCreatedEvent,
  electionReadAbi,
  encryptedVoteEvent,
  FINALIZED_STATE,
  INDEX_CACHE_KEY,
  KEY_REVEALED_STATE,
  openVoteEvent,
  publicClient,
  resultFinalizedEvent,
  STATUS_EXPLORER_URL,
  VERIFICATION_FACTORY,
  ZERO_HASH,
} from './constants'
import { resolveVerificationLanguage } from './language'
import { readCandidateManifest, readResultManifest } from './manifests'
import { mapWithConcurrency, scheduleVerificationRpc } from './rpc'
import {
  buildOpenCandidates,
  buildPrivateCandidates,
  loadOpenReceipts,
  loadPrivateReceipts,
} from './receipts'
import type {
  DetailRefreshOptions,
  ElectionConfig,
  FactoryElectionLog,
  OpenReceiptLog,
  PrivateReceiptLog,
  ResultFinalizedLog,
  ResultSummary,
  StoredIndexCache,
  VerificationElectionDetail,
  VerificationElectionSummary,
} from './types'
import {
  formatCandidateName,
  formatDate,
  formatElectionDescription,
  formatElectionId,
  formatElectionTitle,
  formatHostBadge,
  formatModeLabel,
  formatStateLabel,
  hasResolvedElectionTitle,
  makeExplorerUrl,
  pickEmoji,
  toVisibilityMode,
  truncateAddress,
} from './utils'

export { readCachedVerificationElectionDetail, readCachedVerificationElectionSummaries }

const VERIFICATION_SUMMARY_CONCURRENCY = 2

export async function syncVerificationElectionSummaries() {
  const lang = resolveVerificationLanguage()
  const cached = readStoredIndexCache()
  const cachedMap = new Map(
    (cached?.elections ?? []).map(
      (entry) => [entry.address.toLowerCase(), normalizeElectionSummary(entry)] as const,
    ),
  )
  const latestBlock = await scheduleVerificationRpc(() => publicClient.getBlockNumber())
  const createdFromBlock = cached ? BigInt(cached.lastSyncedBlock) + 1n : undefined
  const createdLogs =
    createdFromBlock !== undefined && createdFromBlock > latestBlock
      ? []
      : await getLogsChunked<FactoryElectionLog>({
          address: VERIFICATION_FACTORY,
          event: electionCreatedEvent,
          fromBlock: createdFromBlock ?? 'earliest',
          toBlock: 'latest',
        })

  const logMap = new Map<string, FactoryElectionLog>()
  createdLogs.forEach((log) => {
    const electionAddress = log.args.electionAddress
    if (!electionAddress) return
    logMap.set(electionAddress.toLowerCase(), log as FactoryElectionLog)
  })

  for (const log of createdLogs) {
    const electionAddress = log.args.electionAddress
    const organizer = log.args.organizer

    if (!electionAddress || !organizer || cachedMap.has(electionAddress.toLowerCase())) {
      continue
    }

    cachedMap.set(electionAddress.toLowerCase(), {
      id: truncateAddress(electionAddress),
      chainSeriesId: '0x' as Hex,
      mode: log.args.visibilityMode === 1 ? 'PRIVATE' : 'OPEN',
      modeLabel: formatModeLabel(log.args.visibilityMode === 1 ? 'PRIVATE' : 'OPEN', lang),
      state: 0,
      stateLabel: lang === 'ko' ? '상태 확인 중' : 'Checking status',
      isFinalized: false,
      seriesTitle: null,
      title: lang === 'ko' ? '불러오는 중' : 'Loading',
      description:
        lang === 'ko'
          ? '체인에서 선거 정보를 확인하고 있어요.'
          : 'Reading election data from the chain.',
      hostName: truncateAddress(organizer),
      hostVerified: Boolean(log.args.organizerVerifiedSnapshot),
      hostBadge: formatHostBadge(Boolean(log.args.organizerVerifiedSnapshot), lang),
      address: electionAddress,
      addressExplorerUrl: makeExplorerUrl('address', electionAddress),
      resultRevealAtLabel: '',
      finalizeTransactionHash: lang === 'ko' ? '아직 없음' : 'Not available yet',
      finalizeExplorerUrl: STATUS_EXPLORER_URL,
      resultSummaryNote: null,
      totalSubmissions: 0,
      validVotes: 0,
      invalidVotes: 0,
      receiptCount: 0,
      publicKey: null,
      privateKeyCommitmentHash: null,
      revealedPrivateKey: null,
      keySchemeVersion: null,
      canDecrypt: false,
      topCandidate: null,
      chainElectionId: log.args.electionId ?? ('0x' as Hex),
      candidateManifestHash: ZERO_HASH,
      candidateManifestURI: '',
      category: null,
      coverImageUrl: null,
      resultManifestHash: ZERO_HASH,
      resultManifestURI: '',
      createdBlock: `${log.blockNumber ?? 0n}`,
      sortBlock: `${log.blockNumber ?? 0n}`,
    })
  }

  const nextSummaries = await mapWithConcurrency(
    [...cachedMap.values()],
    VERIFICATION_SUMMARY_CONCURRENCY,
    (entry) =>
      loadElectionSummary(entry, {
        fromBlock: cached ? BigInt(cached.lastSyncedBlock) + 1n : undefined,
        log: logMap.get(entry.address.toLowerCase()),
      }),
  )

  const trackedElections = await hydrateFallbackElectionSummaries(
    sortElectionSummaries(
      nextSummaries.filter((entry): entry is VerificationElectionSummary => entry !== null),
    ),
  )
  const elections = trackedElections.filter((entry) => entry.receiptCount > 0)
  const nextCache: StoredIndexCache = {
    elections: trackedElections,
    lastSyncedAt: Date.now(),
    lastSyncedBlock: `${latestBlock}`,
  }

  writeStoredItem(INDEX_CACHE_KEY, nextCache)
  return {
    elections,
    lastSyncedAt: new Date(nextCache.lastSyncedAt),
    lastSyncedBlock: latestBlock,
  }
}

async function hydrateFallbackElectionSummaries(
  elections: VerificationElectionSummary[],
): Promise<VerificationElectionSummary[]> {
  return Promise.all(
    elections.map(async (election) => {
      if (hasResolvedElectionTitle(election) && election.seriesTitle) {
        return election
      }

      if (!election.candidateManifestURI || election.candidateManifestHash === ZERO_HASH) {
        return election
      }

      const candidateManifest = await readCandidateManifest(
        election.candidateManifestURI,
        election.candidateManifestHash,
      )

      if (!candidateManifest) {
        return election
      }

      return {
        ...election,
        seriesTitle: getCandidateManifestSeriesPreimage(candidateManifest) || election.seriesTitle,
        title: getCandidateManifestTitle(candidateManifest) || election.title,
        category: candidateManifest.election?.category ?? election.category,
        coverImageUrl:
          getCandidateManifestCoverImageUrl(candidateManifest) ?? election.coverImageUrl,
      }
    }),
  )
}

export async function getVerificationElectionDetail(
  summary: VerificationElectionSummary,
  options: DetailRefreshOptions = {},
): Promise<VerificationElectionDetail> {
  const cached = readCachedVerificationElectionDetail(summary.address)
  if (!options.force && cached && isDetailFresh(cached, summary)) {
    return cached
  }

  const blockCache = new Map<string, bigint>()
  const [candidateManifest, resultManifest] = await Promise.all([
    readCandidateManifest(summary.candidateManifestURI, summary.candidateManifestHash),
    readResultManifest(summary.resultManifestURI, summary.resultManifestHash),
  ])

  const receipts =
    summary.mode === 'OPEN'
      ? await loadOpenReceipts(
          summary.address,
          parseStoredBlock(summary.createdBlock, summary.sortBlock),
          blockCache,
          candidateManifest,
        )
      : await loadPrivateReceipts(
          summary.chainElectionId,
          summary.address,
          parseStoredBlock(summary.createdBlock, summary.sortBlock),
          summary.revealedPrivateKey ?? '0x',
          blockCache,
          candidateManifest,
        )

  const candidates =
    summary.mode === 'OPEN'
      ? buildOpenCandidates(receipts, candidateManifest)
      : buildPrivateCandidates(receipts, candidateManifest)

  const totalSubmissions = summary.isFinalized
    ? summary.totalSubmissions
    : Math.max(summary.totalSubmissions, receipts.length)
  const validVotes = summary.isFinalized ? summary.validVotes : receipts.length
  const hasRevealedPrivateKey =
    summary.mode === 'PRIVATE' &&
    summary.state >= KEY_REVEALED_STATE &&
    summary.revealedPrivateKey !== null
  const canDecrypt = hasRevealedPrivateKey && receipts.length > 0

  const detail: VerificationElectionDetail = {
    ...summary,
    description: resultManifest?.summary ?? summary.description,
    resultSummaryNote: resultManifest?.summary ?? summary.resultSummaryNote,
    totalSubmissions,
    validVotes,
    receiptCount: receipts.length,
    canDecrypt,
    receipts,
    candidates,
    topCandidate: candidates[0] ?? summary.topCandidate,
  }

  writeStoredItem(`${DETAIL_CACHE_PREFIX}${summary.address.toLowerCase()}`, detail)
  return detail
}

async function loadElectionSummary(
  previous: VerificationElectionSummary,
  context: {
    fromBlock?: bigint
    log?: FactoryElectionLog
  },
): Promise<VerificationElectionSummary | null> {
  const electionAddress = previous.address
  const visibilityHint = context.log?.args.visibilityMode ?? (previous.mode === 'PRIVATE' ? 1 : 0)
  const createdBlock =
    context.log?.blockNumber ?? parseStoredBlock(previous.createdBlock, previous.sortBlock)
  const eventFromBlock = context.fromBlock ?? createdBlock
  const shouldReadFinalizeLogs =
    previous.finalizeTransactionHash ===
      (resolveVerificationLanguage() === 'ko' ? '아직 없음' : 'Not available yet') ||
    context.fromBlock !== undefined

  const [readResults, resultLogs, receiptLogs] = await Promise.all([
    scheduleVerificationRpc(() =>
      publicClient.multicall({
        allowFailure: false,
        contracts: [
          {
            address: electionAddress,
            abi: electionReadAbi,
            functionName: 'state',
          },
          {
            address: electionAddress,
            abi: electionReadAbi,
            functionName: 'electionId',
          },
          {
            address: electionAddress,
            abi: electionReadAbi,
            functionName: 'getElectionConfig',
          },
          {
            address: electionAddress,
            abi: electionReadAbi,
            functionName: 'getResultSummary',
          },
          {
            address: electionAddress,
            abi: electionReadAbi,
            functionName: 'revealedPrivateKey',
          },
        ],
      }),
    ) as Promise<[number, Hex, ElectionConfig, ResultSummary, Hex]>,
    shouldReadFinalizeLogs
      ? getLogsChunked<ResultFinalizedLog>({
          address: electionAddress,
          event: resultFinalizedEvent,
          fromBlock: eventFromBlock,
          toBlock: 'latest',
        })
      : Promise.resolve([]),
    getLogsChunked<OpenReceiptLog | PrivateReceiptLog>({
      address: electionAddress,
      event: visibilityHint === 1 ? encryptedVoteEvent : openVoteEvent,
      fromBlock: eventFromBlock,
      toBlock: 'latest',
    }),
  ])
  const [state, electionId, config, result, revealedPrivateKey] = readResults

  const mode = toVisibilityMode(config.visibilityMode)
  const isFinalized = Number(state) === FINALIZED_STATE
  const previousManifestChanged =
    previous.candidateManifestURI !== config.candidateManifestURI ||
    previous.candidateManifestHash !== config.candidateManifestHash
  const previousResultChanged =
    previous.resultManifestURI !== result.resultManifestURI ||
    previous.resultManifestHash !== result.resultManifestHash
  const candidateManifest =
    hasResolvedElectionTitle(previous) && previous.seriesTitle && !previousManifestChanged
      ? null
      : await readCandidateManifest(config.candidateManifestURI, config.candidateManifestHash)
  const resultManifest =
    previous.resultSummaryNote !== null && !previousResultChanged
      ? null
      : await readResultManifest(result.resultManifestURI, result.resultManifestHash)

  const totalReceipts =
    context.fromBlock === undefined
      ? receiptLogs.length
      : previous.receiptCount + receiptLogs.length
  const finalizeLog = resultLogs[resultLogs.length - 1]
  const totalSubmissions = Math.max(totalReceipts, Number(result.totalSubmissions))
  const validVotes = isFinalized ? Number(result.totalValidVotes) : totalReceipts
  const invalidVotes = isFinalized ? Number(result.totalInvalidVotes) : 0
  const hasRevealedPrivateKey =
    mode === 'PRIVATE' && Number(state) >= KEY_REVEALED_STATE && revealedPrivateKey !== '0x'
  const canDecrypt = hasRevealedPrivateKey && totalReceipts > 0
  const previousTitle = hasResolvedElectionTitle(previous) ? previous.title : null
  const previousDescription =
    previous.description !==
    (resolveVerificationLanguage() === 'ko'
      ? '체인에서 선거 정보를 확인하고 있어요.'
      : 'Reading election data from the chain.')
      ? previous.description
      : null
  const cachedDetail = readCachedVerificationElectionDetail(electionAddress)
  const detailTopCandidate =
    cachedDetail &&
    isDetailFresh(cachedDetail, {
      ...previous,
      receiptCount: totalReceipts,
      state: Number(state),
      finalizeTransactionHash: finalizeLog?.transactionHash ?? previous.finalizeTransactionHash,
      resultManifestURI: result.resultManifestURI,
      resultManifestHash: result.resultManifestHash,
    })
      ? (cachedDetail.candidates[0] ?? cachedDetail.topCandidate)
      : null
  const resultLeader = resultManifest?.results?.[0]
  const topCandidate = resultLeader
    ? {
        rank: 1,
        key: resultLeader.candidateKey,
        name: resultLeader.displayName ?? formatCandidateName(resultLeader.candidateKey),
        emoji: pickEmoji(resultLeader.candidateKey),
        imageUrl:
          candidateManifest?.candidates.find(
            (candidate) => candidate.candidateKey === resultLeader.candidateKey,
          )?.imageUrl ?? null,
        subtitle:
          mode === 'OPEN'
            ? resolveVerificationLanguage() === 'ko'
              ? '공개 후보'
              : 'Public candidate'
            : resolveVerificationLanguage() === 'ko'
              ? '비공개 후보'
              : 'Private candidate',
        votes: resultLeader.votes,
        percentage: validVotes > 0 ? (resultLeader.votes / validVotes) * 100 : 0,
      }
    : totalReceipts === previous.receiptCount
      ? previous.topCandidate
      : detailTopCandidate
  const manifestTitle = candidateManifest ? getCandidateManifestTitle(candidateManifest) : ''
  const manifestSeriesTitle = candidateManifest
    ? getCandidateManifestSeriesPreimage(candidateManifest)
    : ''
  const manifestCoverImageUrl = candidateManifest
    ? getCandidateManifestCoverImageUrl(candidateManifest)
    : null
  const manifestCategory = candidateManifest?.election?.category ?? null

  return {
    ...previous,
    id: formatElectionId(electionId, electionAddress),
    chainSeriesId: config.seriesId,
    mode,
    modeLabel: formatModeLabel(mode),
    state: Number(state),
    stateLabel: formatStateLabel(Number(state)),
    isFinalized,
    seriesTitle: manifestSeriesTitle || previous.seriesTitle,
    title: manifestTitle || previousTitle || formatElectionTitle(electionId, electionAddress),
    description:
      resultManifest?.summary ??
      previousDescription ??
      formatElectionDescription(mode, isFinalized, canDecrypt),
    hostName: previous.hostName,
    hostVerified:
      context.log?.args.organizerVerifiedSnapshot !== undefined
        ? Boolean(context.log.args.organizerVerifiedSnapshot)
        : previous.hostVerified,
    hostBadge:
      context.log?.args.organizerVerifiedSnapshot !== undefined
        ? formatHostBadge(Boolean(context.log.args.organizerVerifiedSnapshot))
        : previous.hostBadge,
    address: electionAddress,
    addressExplorerUrl: makeExplorerUrl('address', electionAddress),
    resultRevealAtLabel: formatDate(config.resultRevealAt),
    finalizeTransactionHash: finalizeLog?.transactionHash ?? previous.finalizeTransactionHash,
    finalizeExplorerUrl: finalizeLog?.transactionHash
      ? makeExplorerUrl('tx', finalizeLog.transactionHash)
      : previous.finalizeExplorerUrl,
    resultSummaryNote: resultManifest?.summary ?? previous.resultSummaryNote,
    totalSubmissions,
    validVotes,
    invalidVotes,
    receiptCount: totalReceipts,
    publicKey: mode === 'PRIVATE' ? config.electionPublicKey : null,
    privateKeyCommitmentHash: mode === 'PRIVATE' ? config.privateKeyCommitmentHash : null,
    revealedPrivateKey: hasRevealedPrivateKey ? revealedPrivateKey : null,
    keySchemeVersion: mode === 'PRIVATE' ? config.keySchemeVersion : null,
    canDecrypt,
    topCandidate: topCandidate ?? null,
    chainElectionId: electionId,
    candidateManifestHash: config.candidateManifestHash,
    candidateManifestURI: config.candidateManifestURI,
    category: manifestCategory ?? previous.category,
    coverImageUrl: manifestCoverImageUrl ?? previous.coverImageUrl,
    resultManifestHash: result.resultManifestHash,
    resultManifestURI: result.resultManifestURI,
    createdBlock: `${createdBlock}`,
    sortBlock: `${finalizeLog?.blockNumber ?? context.log?.blockNumber ?? BigInt(previous.sortBlock)}`,
  }
}
