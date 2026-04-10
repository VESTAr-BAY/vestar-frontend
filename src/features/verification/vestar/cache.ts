import type { Address } from 'viem'
import { DETAIL_CACHE_PREFIX, INDEX_CACHE_KEY } from './constants'
import type {
  StoredIndexCache,
  VerificationElectionDetail,
  VerificationElectionSummary,
} from './types'
import {
  formatElectionDescription,
  formatElectionTitle,
  formatHostBadge,
  formatModeLabel,
  formatStateLabel,
  hasResolvedElectionTitle,
} from './utils'
import { resolveVerificationLanguage } from './language'

export function readCachedVerificationElectionSummaries() {
  const cache = readStoredIndexCache()
  return {
    elections: sortElectionSummaries((cache?.elections ?? []).map(normalizeElectionSummary)).filter(
      (election) => election.receiptCount > 0,
    ),
    lastSyncedAt: cache ? new Date(cache.lastSyncedAt) : null,
    lastSyncedBlock: cache ? BigInt(cache.lastSyncedBlock) : null,
  }
}

export function readCachedVerificationElectionDetail(address: Address) {
  const stored = readStoredItem<VerificationElectionDetail>(
    `${DETAIL_CACHE_PREFIX}${address.toLowerCase()}`,
  )
  if (!stored) {
    return null
  }

  return {
    ...normalizeElectionSummary(stored),
    receipts: stored.receipts,
    candidates: stored.candidates,
  }
}

export function sortElectionSummaries(elections: VerificationElectionSummary[]) {
  return [...elections].sort((left, right) =>
    BigInt(left.sortBlock) > BigInt(right.sortBlock) ? -1 : 1,
  )
}

export function normalizeElectionSummary(election: VerificationElectionSummary) {
  const lang = resolveVerificationLanguage()
  const hostVerified =
    election.hostVerified ??
    (election.hostBadge === '인증 주최자' || election.hostBadge === 'Verified organizer')
  const localizedTitle = hasResolvedElectionTitle(election)
    ? election.title
    : formatElectionTitle(election.chainElectionId, election.address, lang)
  const fallbackDescriptions = new Set([
    '체인에서 선거 정보를 확인하고 있어요.',
    'Reading election data from the chain.',
    formatElectionDescription(election.mode, election.isFinalized, election.canDecrypt, 'ko'),
    formatElectionDescription(election.mode, election.isFinalized, election.canDecrypt, 'en'),
  ])

  return {
    ...election,
    modeLabel: formatModeLabel(election.mode, lang),
    stateLabel: formatStateLabel(election.state, lang),
    title: localizedTitle,
    description: fallbackDescriptions.has(election.description)
      ? formatElectionDescription(election.mode, election.isFinalized, election.canDecrypt, lang)
      : election.description,
    hostVerified,
    hostBadge: formatHostBadge(hostVerified, lang),
    createdBlock: election.createdBlock ?? election.sortBlock,
  }
}

export function parseStoredBlock(value: string | undefined, fallback: string) {
  return BigInt(value ?? fallback)
}

export function isDetailFresh(
  detail: VerificationElectionDetail,
  summary: Pick<
    VerificationElectionSummary,
    | 'receiptCount'
    | 'state'
    | 'finalizeTransactionHash'
    | 'resultManifestURI'
    | 'resultManifestHash'
    | 'publicKey'
    | 'revealedPrivateKey'
    | 'keySchemeVersion'
  >,
) {
  return (
    detail.receiptCount === summary.receiptCount &&
    detail.state === summary.state &&
    detail.finalizeTransactionHash === summary.finalizeTransactionHash &&
    detail.resultManifestURI === summary.resultManifestURI &&
    detail.resultManifestHash === summary.resultManifestHash &&
    detail.publicKey === summary.publicKey &&
    detail.revealedPrivateKey === summary.revealedPrivateKey &&
    detail.keySchemeVersion === summary.keySchemeVersion
  )
}

export function readStoredIndexCache() {
  return readStoredItem<StoredIndexCache>(INDEX_CACHE_KEY)
}

export function readStoredItem<T>(key: string): T | null {
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

export function writeStoredItem(key: string, value: unknown) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

export function removeStoredItem(key: string) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(key)
  } catch {
    return
  }
}
