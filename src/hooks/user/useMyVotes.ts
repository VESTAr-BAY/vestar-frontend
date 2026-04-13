import { useCallback, useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { fetchCandidateManifest } from '../../api/candidateManifest'
import { fetchElectionDetail, fetchMoreVoteHistory, fetchVoteHistory } from '../../api/elections'
import type { ApiElectionState, ApiVoteHistoryCursor, ApiVoteHistoryItem } from '../../api/types'
import { useLanguage } from '../../providers/LanguageProvider'
import type { MyVoteItem } from '../../types/user'
import {
  getCandidateManifestCoverImageUrl,
  getCandidateManifestSeriesPreimage,
  getCandidateManifestTitle,
} from '../../utils/candidateManifest'
import {
  formatVoteHistoryDate,
  mergeOptimisticVoteHistory,
} from '../../utils/optimisticVotes'
import { formatBallotCostLabel } from '../../utils/paymentDisplay'
import { getViewCache, setViewCache } from '../../utils/viewCache'

export interface UseMyVotesResult {
  votes: MyVoteItem[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  loadMore: () => void
}

type MyVotesCacheValue = {
  hasMore: boolean
  nextCursor: ApiVoteHistoryCursor | null
  votes: MyVoteItem[]
}

const MY_VOTES_CACHE_TTL_MS = 15_000

const electionDetailRequestCache = new Map<
  string,
  Promise<Awaited<ReturnType<typeof fetchElectionDetail>> | null>
>()

function resolveVoteBadge(params: {
  status: MyVoteItem['status']
  latestState: ApiElectionState
}): MyVoteItem['badge'] {
  if (params.status === 'ended') {
    return 'end'
  }

  if (params.latestState === 'SCHEDULED') {
    return 'new'
  }

  return 'live'
}

function mapStatus(state: ApiElectionState): MyVoteItem['status'] {
  switch (state) {
    case 'ACTIVE':
    case 'SCHEDULED':
      return 'active'
    case 'FINALIZED':
    case 'CLOSED':
    case 'KEY_REVEAL_PENDING':
    case 'KEY_REVEALED':
    case 'CANCELLED':
    default:
      return 'ended'
  }
}

function getLatestElectionDetail(electionId: string) {
  const cached = electionDetailRequestCache.get(electionId)
  if (cached) {
    return cached
  }

  const request = fetchElectionDetail(electionId).catch(() => null)
  electionDetailRequestCache.set(electionId, request)
  return request
}

function resolveVoteStatus(params: {
  latestEndAt?: string | null
  fallbackState: ApiElectionState
}): MyVoteItem['status'] {
  if (params.latestEndAt) {
    const endTime = Date.parse(params.latestEndAt)
    if (Number.isFinite(endTime)) {
      return endTime <= Date.now() ? 'ended' : 'active'
    }
  }

  return mapStatus(params.fallbackState)
}

function mapChoiceLabel(item: ApiVoteHistoryItem, lang: 'en' | 'ko'): string {
  if (item.selection.isPending) {
    return lang === 'ko' ? '집계 대기 중' : 'Awaiting tally'
  }

  if (item.selection.isValid === false) {
    return lang === 'ko' ? '무효 처리됨' : 'Marked invalid'
  }

  if (item.selection.candidateKeys.length === 0) {
    return lang === 'ko' ? '선택 정보 없음' : 'No selection info'
  }

  return item.selection.candidateKeys.join(', ')
}

function mapSubmissionStatus(item: ApiVoteHistoryItem): MyVoteItem['submissionStatus'] {
  if (item.selection.isPending) {
    return 'pending'
  }

  if (item.selection.isValid === false) {
    return 'invalid'
  }

  return 'confirmed'
}

function resolveSpentLabel(
  lang: 'en' | 'ko',
  paymentMode?: 'FREE' | 'PAID',
  costPerBallot?: string | null,
) {
  if (paymentMode !== 'PAID') {
    return null
  }

  const label = formatBallotCostLabel(costPerBallot ?? '0', lang)
  return label === '무료' || label === 'Free' ? null : `-${label}`
}

async function mapToMyVoteItem(item: ApiVoteHistoryItem, lang: 'en' | 'ko'): Promise<MyVoteItem> {
  const latestElection = item.onchainElection?.id
    ? await getLatestElectionDetail(item.onchainElection.id)
    : null
  const latestState =
    latestElection?.onchainState ?? item.onchainElection?.onchainState ?? 'FINALIZED'
  const status = resolveVoteStatus({
    latestEndAt: latestElection?.endAt ?? null,
    fallbackState: latestState,
  })
  const manifest = await fetchCandidateManifest(
    item.onchainElection?.candidateManifestUri,
    item.onchainElection?.candidateManifestHash,
  )
  const submissionStatus = mapSubmissionStatus(item)

  return {
    id: item.id,
    txHash: item.onchainTxHash,
    voteId: item.onchainElection?.id ?? item.id,
    title: getCandidateManifestTitle(manifest) || 'Untitled vote',
    org: getCandidateManifestSeriesPreimage(manifest) || 'Unknown series',
    imageUrl: getCandidateManifestCoverImageUrl(manifest),
    date: formatVoteHistoryDate(item.blockTimestamp),
    status,
    submissionStatus,
    spentLabel: resolveSpentLabel(lang, latestElection?.paymentMode, latestElection?.costPerBallot),
    choice: mapChoiceLabel(item, lang),
    invalidReason:
      item.selection.isValid === false
        ? item.selection.invalidReason?.reasonDetail ||
          item.selection.invalidReason?.reasonCode ||
          null
        : null,
    selectedCandidateKeys: item.selection.candidateKeys,
    badge: resolveVoteBadge({ status, latestState }),
  }
}

export function useMyVotes(): UseMyVotesResult {
  const { address, isConnected } = useAccount()
  const { lang } = useLanguage()
  const [votes, setVotes] = useState<MyVoteItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<ApiVoteHistoryCursor | null>(null)
  const cacheKey = address ? `my-votes:${address.toLowerCase()}:${lang}` : null

  useEffect(() => {
    if (!isConnected || !address) {
      setVotes([])
      setIsLoading(false)
      setIsLoadingMore(false)
      setHasMore(false)
      setNextCursor(null)
      return
    }

    let cancelled = false
    const cached = cacheKey ? getViewCache<MyVotesCacheValue>(cacheKey, MY_VOTES_CACHE_TTL_MS) : null
    const optimisticVotes = mergeOptimisticVoteHistory(address, cached?.votes ?? [], lang)

    if (optimisticVotes.length > 0 || cached) {
      setVotes(optimisticVotes)
      setHasMore(cached?.hasMore ?? false)
      setNextCursor(cached?.nextCursor ?? null)
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }

    fetchVoteHistory(address)
      .then(async (history) => {
        if (cancelled) return
        const mapped = await Promise.all(history.items.map((item) => mapToMyVoteItem(item, lang)))
        if (cancelled) return
        const merged = mergeOptimisticVoteHistory(address, mapped, lang)
        setVotes(merged)
        setHasMore(history.hasMore)
        setNextCursor(history.nextCursor)
        if (cacheKey) {
          setViewCache(cacheKey, {
            votes: mapped,
            hasMore: history.hasMore,
            nextCursor: history.nextCursor,
          })
        }
      })
      .catch(() => {
        if (cancelled) return
        setVotes(mergeOptimisticVoteHistory(address, [], lang))
        setHasMore(false)
        setNextCursor(null)
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [address, cacheKey, isConnected, lang])

  const loadMore = useCallback(() => {
    if (!address || !isConnected || !nextCursor || !hasMore || isLoadingMore) {
      return
    }

    setIsLoadingMore(true)

    fetchMoreVoteHistory(address, nextCursor)
      .then(async (history) => {
        const mapped = await Promise.all(history.items.map((item) => mapToMyVoteItem(item, lang)))
        setVotes((current) => {
          const currentByTxHash = new Set(
            current
              .map((vote) => vote.txHash?.toLowerCase())
              .filter((txHash): txHash is string => Boolean(txHash)),
          )
          const nextVotes = [
            ...current,
            ...mapped.filter((vote) => {
              if (!vote.txHash) {
                return true
              }

              const normalizedTxHash = vote.txHash.toLowerCase()
              if (currentByTxHash.has(normalizedTxHash)) {
                return false
              }

              currentByTxHash.add(normalizedTxHash)
              return true
            }),
          ]

          return nextVotes
        })
        setHasMore(history.hasMore)
        setNextCursor(history.nextCursor)
      })
      .catch(() => {
        setHasMore(false)
      })
      .finally(() => {
        setIsLoadingMore(false)
      })
  }, [address, hasMore, isConnected, isLoadingMore, lang, nextCursor])

  return { votes, isLoading, isLoadingMore, hasMore, loadMore }
}
