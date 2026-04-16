import { type Address, decodeFunctionData, type Hex } from 'viem'
import { getLogsChunked } from './chain'
import { electionWriteAbi, encryptedVoteEvent, openVoteEvent, publicClient } from './constants'
import { decryptCanonicalBallotPayload, decryptDemoPrivateSelectionIndex } from './crypto'
import { resolveVerificationLanguage } from './language'
import { mapWithConcurrency, scheduleVerificationRpc } from './rpc'
import type {
  CandidateManifest,
  OpenReceiptLog,
  PrivateReceiptLog,
  ReceiptSelection,
  VerificationReceipt,
} from './types'
import { assignCompetitionRanks } from '../../../utils/ranking'
import {
  formatCandidateName,
  formatDateTime,
  makeExplorerUrl,
  pickEmoji,
  truncateAddress,
} from './utils'

const RECEIPT_RPC_CONCURRENCY = 3

export async function loadOpenReceipts(
  electionAddress: Address,
  fromBlock: bigint,
  blockCache: Map<string, bigint>,
  candidateManifest: CandidateManifest | null,
): Promise<VerificationReceipt[]> {
  const receiptLogs = await getLogsChunked<OpenReceiptLog>({
    address: electionAddress,
    event: openVoteEvent,
    fromBlock,
    toBlock: 'latest',
  })

  const receipts = await mapWithConcurrency(
    receiptLogs,
    RECEIPT_RPC_CONCURRENCY,
    async (log, index): Promise<VerificationReceipt | null> => {
      if (!log.transactionHash || !log.args.voter) {
        return null
      }

      const transactionHash = log.transactionHash
      const submittedAtLabel = await readBlockTimestampLabel(blockCache, log.blockNumber)
      const transaction = await scheduleVerificationRpc(() =>
        publicClient.getTransaction({ hash: transactionHash }),
      )
      const selections = decodeOpenSelections(transaction.input, candidateManifest)

      return {
        id: `${transactionHash}-${index}`,
        transactionHash,
        transactionExplorerUrl: makeExplorerUrl('tx', transactionHash),
        walletAddress: log.args.voter,
        walletLabel: truncateAddress(log.args.voter),
        walletExplorerUrl: makeExplorerUrl('address', log.args.voter),
        submittedAtLabel,
        selections,
        encryptedBallot: null,
      }
    },
  )

  return receipts.filter((receipt): receipt is VerificationReceipt => receipt !== null)
}

export async function loadPrivateReceipts(
  electionId: Hex,
  electionAddress: Address,
  fromBlock: bigint,
  revealedPrivateKey: Hex,
  blockCache: Map<string, bigint>,
  candidateManifest: CandidateManifest | null,
): Promise<VerificationReceipt[]> {
  const receiptLogs = await getLogsChunked<PrivateReceiptLog>({
    address: electionAddress,
    event: encryptedVoteEvent,
    fromBlock,
    toBlock: 'latest',
  })

  const receipts = await mapWithConcurrency(
    receiptLogs,
    RECEIPT_RPC_CONCURRENCY,
    async (log, index): Promise<VerificationReceipt | null> => {
      if (!log.transactionHash || !log.args.voter) {
        return null
      }

      const transactionHash = log.transactionHash
      const submittedAtLabel = await readBlockTimestampLabel(blockCache, log.blockNumber)
      const transaction = await scheduleVerificationRpc(() =>
        publicClient.getTransaction({ hash: transactionHash }),
      )
      const encryptedBallot = decodeEncryptedBallot(transaction.input)
      const selections = await decryptPrivateSelections(
        electionId,
        electionAddress,
        log.args.voter,
        encryptedBallot,
        revealedPrivateKey,
        candidateManifest,
      )

      return {
        id: `${transactionHash}-${index}`,
        transactionHash,
        transactionExplorerUrl: makeExplorerUrl('tx', transactionHash),
        walletAddress: log.args.voter,
        walletLabel: truncateAddress(log.args.voter),
        walletExplorerUrl: makeExplorerUrl('address', log.args.voter),
        submittedAtLabel,
        selections,
        encryptedBallot,
      }
    },
  )

  return receipts.filter((receipt): receipt is VerificationReceipt => receipt !== null)
}

function assignVerificationRanks<T extends { votes: number }>(items: T[]) {
  return assignCompetitionRanks(
    items.map((item, originalOrder) => ({
      ...item,
      originalOrder,
    })),
  )
    .sort((left, right) => {
      if (left.rank !== right.rank) return left.rank - right.rank
      return left.originalOrder - right.originalOrder
    })
    .map(({ originalOrder: _, ...item }) => item)
}

export function buildOpenCandidates(
  receipts: VerificationReceipt[],
  candidateManifest: CandidateManifest | null,
) {
  const lang = resolveVerificationLanguage()
  const totalVotes = receipts.reduce((sum, receipt) => sum + receipt.selections.length, 0)
  const tallies = new Map<
    string,
    {
      key: string
      name: string
      emoji: string
      imageUrl: string | null
      subtitle: string
      votes: number
    }
  >()

  getOrderedManifestCandidates(candidateManifest).forEach((candidate) => {
    tallies.set(candidate.candidateKey, {
      key: candidate.candidateKey,
      name: candidate.displayName ?? formatCandidateName(candidate.candidateKey),
      emoji: pickEmoji(candidate.candidateKey),
      imageUrl: candidate.imageUrl ?? null,
      subtitle: lang === 'ko' ? '공개 후보' : 'Public candidate',
      votes: 0,
    })
  })

  receipts.forEach((receipt) => {
    receipt.selections.forEach((selection) => {
      const current = tallies.get(selection.key) ?? {
        key: selection.key,
        name: selection.name,
        emoji: selection.emoji,
        imageUrl: selection.imageUrl ?? null,
        subtitle: lang === 'ko' ? '공개 후보' : 'Public candidate',
        votes: 0,
      }
      current.votes += 1
      tallies.set(selection.key, current)
    })
  })

  return assignVerificationRanks(
    [...tallies.values()]
      .map((candidate) => ({
        rank: 0,
        ...candidate,
        subtitle: candidate.subtitle,
        percentage: totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0,
      }))
      .sort((left, right) => right.votes - left.votes),
  )
}

export function buildPrivateCandidates(
  receipts: VerificationReceipt[],
  candidateManifest: CandidateManifest | null,
) {
  const lang = resolveVerificationLanguage()
  const totalVotes = receipts.reduce((sum, receipt) => sum + receipt.selections.length, 0)
  const tallies = new Map<
    string,
    {
      key: string
      name: string
      emoji: string
      imageUrl: string | null
      subtitle: string
      votes: number
      index: number
    }
  >()

  getOrderedManifestCandidates(candidateManifest).forEach((candidate, index) => {
    tallies.set(candidate.candidateKey, {
      key: candidate.candidateKey,
      name: candidate.displayName ?? formatCandidateName(candidate.candidateKey),
      emoji: '🔐',
      imageUrl: candidate.imageUrl ?? null,
      subtitle: lang === 'ko' ? '비공개 후보' : 'Private candidate',
      votes: 0,
      index,
    })
  })

  receipts.forEach((receipt) => {
    receipt.selections.forEach((selection) => {
      const index = selection.index ?? 0
      const current = tallies.get(selection.key) ?? {
        key: selection.key,
        name: selection.name,
        emoji: selection.emoji,
        imageUrl: selection.imageUrl ?? null,
        subtitle: lang === 'ko' ? '비공개 후보' : 'Private candidate',
        votes: 0,
        index,
      }
      current.votes += 1
      tallies.set(selection.key, current)
    })
  })

  return assignVerificationRanks(
    [...tallies.values()]
      .map((candidate) => ({
        rank: 0,
        key: candidate.key,
        name: candidate.name,
        emoji: candidate.emoji,
        imageUrl: candidate.imageUrl,
        subtitle: candidate.subtitle,
        votes: candidate.votes,
        percentage: totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0,
        index: candidate.index,
      }))
      .sort((left, right) => {
        if (right.votes !== left.votes) return right.votes - left.votes
        return left.index - right.index
      }),
  ).map(({ index: _, ...candidate }) => candidate)
}

async function readBlockTimestampLabel(blockCache: Map<string, bigint>, blockNumber: bigint) {
  const cacheKey = `${blockNumber}`
  let timestamp = blockCache.get(cacheKey)

  if (timestamp === undefined) {
    const block = await scheduleVerificationRpc(() => publicClient.getBlock({ blockNumber }))
    timestamp = block.timestamp
    blockCache.set(cacheKey, timestamp)
  }

  return formatDateTime(timestamp)
}

function decodeOpenSelections(data: Hex, candidateManifest: CandidateManifest | null) {
  try {
    const decoded = decodeFunctionData({
      abi: electionWriteAbi,
      data,
    })

    if (decoded.functionName !== 'submitOpenVote') {
      return []
    }

    const keys = decoded.args[0] as string[]
    return keys.map((key) => makeOpenSelection(key, candidateManifest))
  } catch {
    return []
  }
}

function decodeEncryptedBallot(data: Hex): Hex | null {
  try {
    const decoded = decodeFunctionData({
      abi: electionWriteAbi,
      data,
    })

    if (decoded.functionName !== 'submitEncryptedVote') {
      return null
    }

    return decoded.args[0] as Hex
  } catch {
    return null
  }
}

async function decryptPrivateSelections(
  electionId: Hex,
  electionAddress: Address,
  voterAddress: Address,
  encryptedBallot: Hex | null,
  revealedPrivateKey: Hex,
  candidateManifest: CandidateManifest | null,
): Promise<ReceiptSelection[]> {
  const demoIndex = decryptDemoPrivateSelectionIndex(
    electionId,
    voterAddress,
    encryptedBallot,
    revealedPrivateKey,
  )

  if (demoIndex !== null) {
    return [makePrivateSelectionByIndex(demoIndex, candidateManifest)]
  }

  const payload = await decryptCanonicalBallotPayload(
    electionId,
    electionAddress,
    voterAddress,
    encryptedBallot,
    revealedPrivateKey,
  )

  if (!payload) {
    return []
  }

  const candidateKeys = payload.candidateKeys ?? []
  return candidateKeys.map((candidateKey) =>
    makePrivateSelectionByKey(candidateKey, candidateManifest),
  )
}

function makeOpenSelection(
  key: string,
  candidateManifest: CandidateManifest | null,
): ReceiptSelection {
  const normalizedKey = key.trim() || 'candidate'
  const manifestCandidate = getOrderedManifestCandidates(candidateManifest).find(
    (candidate) => candidate.candidateKey === normalizedKey,
  )

  return {
    key: normalizedKey,
    name: manifestCandidate?.displayName ?? formatCandidateName(normalizedKey),
    emoji: pickEmoji(normalizedKey),
    imageUrl: manifestCandidate?.imageUrl ?? null,
  }
}

function makePrivateSelectionByIndex(
  index: number,
  candidateManifest: CandidateManifest | null,
): ReceiptSelection {
  const manifestCandidate = getOrderedManifestCandidates(candidateManifest)[index]
  const lang = resolveVerificationLanguage()

  return {
    key: manifestCandidate?.candidateKey ?? `private-candidate-${index + 1}`,
    name:
      manifestCandidate?.displayName ??
      (lang === 'ko' ? `후보 ${index + 1}` : `Candidate ${index + 1}`),
    emoji: '🔐',
    imageUrl: manifestCandidate?.imageUrl ?? null,
    index,
  }
}

function makePrivateSelectionByKey(
  key: string,
  candidateManifest: CandidateManifest | null,
): ReceiptSelection {
  const normalizedKey = key.trim() || 'private-candidate'
  const manifestCandidate = getOrderedManifestCandidates(candidateManifest).find(
    (candidate) => candidate.candidateKey === normalizedKey,
  )

  return {
    key: normalizedKey,
    name: manifestCandidate?.displayName ?? formatCandidateName(normalizedKey),
    emoji: '🔐',
    imageUrl: manifestCandidate?.imageUrl ?? null,
  }
}

function getOrderedManifestCandidates(candidateManifest: CandidateManifest | null) {
  return [...(candidateManifest?.candidates ?? [])].sort(
    (left, right) =>
      (left.displayOrder ?? Number.MAX_SAFE_INTEGER) -
      (right.displayOrder ?? Number.MAX_SAFE_INTEGER),
  )
}
