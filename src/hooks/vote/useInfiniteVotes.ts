import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchCandidateManifest } from '../../api/candidateManifest'
import { fetchElections } from '../../api/elections'
<<<<<<< HEAD
import { VOTE_ITEMS } from '../../data/mockVotes'
import { applyManifestToElection, mapToVoteListItem } from '../../utils/electionMapper'
import { mergeOptimisticElections } from '../../utils/optimisticVotes'
import { primeVoteDetailCacheFromElection } from '../../utils/voteDetailCache'
import { getViewCache, setViewCache } from '../../utils/viewCache'
=======
>>>>>>> 22b9d7e (chore : fix redirect route)
import type { ApiElection } from '../../api/types'
import { VOTE_ITEMS } from '../../data/mockVotes'
import type { VoteListItem } from '../../types/vote'
import { applyManifestToElection, mapToVoteListItem } from '../../utils/electionMapper'

const PAGE_SIZE = 6
const VOTE_LIST_CACHE_TTL_MS = 15_000

export type VoteFilter = 'all' | 'live' | 'hot' | 'new' | 'popular'

export interface UseInfiniteVotesOptions {
  includeEnded?: boolean
}

export interface UseInfiniteVotesResult {
  allItems: VoteListItem[]
  items: VoteListItem[]
  isLoading: boolean
  isLoadingEnded: boolean
  hasMore: boolean
  isLoadingMore: boolean
  loadMore: () => void
}

const ACTIVE_FIRST_ONCHAIN_STATES = ['ACTIVE', 'SCHEDULED'] as const
const ENDED_ONCHAIN_STATES = [
  'CLOSED',
  'KEY_REVEAL_PENDING',
  'KEY_REVEALED',
  'FINALIZED',
  'CANCELLED',
] as const

/** Maps frontend filter chip to the onchain_state query param */
function filterToApiState(filter: VoteFilter): string | undefined {
  switch (filter) {
    case 'live':
    case 'hot':
      return 'ACTIVE'
    case 'new':
      return 'SCHEDULED'
    default:
      return undefined // 'all' and 'popular' fetch everything
  }
}

function parseVoteCount(value: string): number {
  const normalized = value.replace(/,/g, '').trim().toUpperCase()

  if (!normalized) return 0
  if (normalized.endsWith('M')) return Math.round(Number.parseFloat(normalized) * 1_000_000)
  if (normalized.endsWith('K')) return Math.round(Number.parseFloat(normalized) * 1_000)

  return Number.parseInt(normalized, 10) || 0
}

function getSubmissionCount(election: Pick<ApiElection, 'resultSummary'>): number {
  return election.resultSummary?.totalSubmissions ?? 0
}

function compareByNewest(left: Pick<ApiElection, 'id'>, right: Pick<ApiElection, 'id'>): number {
  return Number(right.id) - Number(left.id)
}

function compareBySubmissionCount(left: ApiElection, right: ApiElection): number {
  const bySubmissionCount = getSubmissionCount(right) - getSubmissionCount(left)

  if (bySubmissionCount !== 0) {
    return bySubmissionCount
  }

  return compareByNewest(left, right)
}

/** Client-side sort for filters that need it */
function sortElections(elections: ApiElection[], filter: VoteFilter): ApiElection[] {
  const byNewest = [...elections].sort(compareByNewest)

  if (filter === 'hot') {
    return [...elections]
      .filter((election) => getSubmissionCount(election) >= 1)
      .sort(compareBySubmissionCount)
  }

  if (filter === 'popular') {
    return [...elections].sort(compareBySubmissionCount)
  }

  return byNewest
}

function dedupeElectionsById(elections: ApiElection[]) {
  return Array.from(new Map(elections.map((election) => [election.id, election])).values())
}

async function hydrateElections(elections: ApiElection[]) {
  return Promise.all(
    elections.map(async (election) => {
      const manifest = await fetchCandidateManifest(
        election.candidateManifestUri,
        election.candidateManifestHash,
      )
      const hydratedElection = applyManifestToElection(election, manifest)
      primeVoteDetailCacheFromElection(hydratedElection, manifest)
      return hydratedElection
    }),
  )
}

function toVoteListItems(elections: ApiElection[]) {
  return elections.map((election, index) => mapToVoteListItem(election, index))
}

/**
 * Fetches a paginated + filtered list of elections.
 * Falls back to mock data when the API is unavailable.
 */
export function useInfiniteVotes(
  filter: VoteFilter = 'all',
  options: UseInfiniteVotesOptions = {},
): UseInfiniteVotesResult {
  const includeEnded = options.includeEnded ?? true
  const [allItems, setAllItems] = useState<VoteListItem[]>([])
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingEnded, setIsLoadingEnded] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Reset to page 1 whenever the filter changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: resets page on filter change
  useEffect(() => {
    setPage(1)
  }, [filter])

  useEffect(() => {
    let cancelled = false
    const onchainState = filterToApiState(filter)
    const cacheKey = `vote-list:${filter}`
    const cachedItems = getViewCache<VoteListItem[]>(cacheKey, VOTE_LIST_CACHE_TTL_MS)
    const optimisticItems = sortElections(mergeOptimisticElections([], { onchainState }), filter).map(
      (election, index) => mapToVoteListItem(election, index),
    )

    if (cachedItems) {
      setAllItems(cachedItems)
      setIsLoading(false)
    } else if (optimisticItems.length > 0) {
      setAllItems(optimisticItems)
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }

    if (filter === 'all') {
      setIsLoadingEnded(includeEnded)

      const loadAllVotes = async () => {
        let priorityElections: ApiElection[] = []

        try {
          const priorityRaw = dedupeElectionsById(
            (
              await Promise.all(
                ACTIVE_FIRST_ONCHAIN_STATES.map((state) => fetchElections({ onchainState: state })),
              )
            ).flat(),
          )

          if (cancelled) return

          priorityElections = await hydrateElections(priorityRaw)
          if (cancelled) return

          const priorityItems = toVoteListItems(sortElections(priorityElections, filter))
          setAllItems(priorityItems)
          setViewCache(cacheKey, priorityItems)
          setIsLoading(false)

          if (!includeEnded) {
            setIsLoadingEnded(false)
            return
          }
        } catch {
          if (cancelled) return
          if (cachedItems) {
            setAllItems(cachedItems)
          } else {
            const mockFiltered =
              optimisticItems.length > 0 ? optimisticItems : applyMockFilter(VOTE_ITEMS, filter)
            setAllItems(mockFiltered)
          }
          setIsLoading(false)
          setIsLoadingEnded(false)
          return
        }

        try {
          const endedRaw = dedupeElectionsById(
            (
              await Promise.all(
                ENDED_ONCHAIN_STATES.map((state) => fetchElections({ onchainState: state })),
              )
            ).flat(),
          )

          if (cancelled) return

          const endedElections = await hydrateElections(endedRaw)
          if (cancelled) return

          const nextItems = toVoteListItems(
            sortElections(dedupeElectionsById([...priorityElections, ...endedElections]), filter),
          )
          setAllItems(nextItems)
          setViewCache(cacheKey, nextItems)
        } catch {
          if (cancelled) return
        } finally {
          if (!cancelled) {
            setIsLoadingEnded(false)
          }
        }
      }

      void loadAllVotes()
    } else {
      setIsLoadingEnded(false)
      fetchElections({ onchainState })
        .then((elections) => hydrateElections(elections))
        .then((elections) => {
          if (cancelled) return
          const sorted = sortElections(elections, filter)
          const nextItems = toVoteListItems(sorted)
          setAllItems(nextItems)
          setViewCache(cacheKey, nextItems)
        })
        .catch(() => {
          if (cancelled) return
          if (cachedItems) {
            setAllItems(cachedItems)
            return
          }
          const mockFiltered =
            optimisticItems.length > 0 ? optimisticItems : applyMockFilter(VOTE_ITEMS, filter)
          setAllItems(mockFiltered)
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false)
        })
    }

    return () => {
      cancelled = true
    }
  }, [filter, includeEnded])

  const items = useMemo(() => allItems.slice(0, page * PAGE_SIZE), [allItems, page])
  const hasMore = items.length < allItems.length

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return
    setIsLoadingMore(true)
    setTimeout(() => {
      setPage((p) => p + 1)
      setIsLoadingMore(false)
    }, 300)
  }, [hasMore, isLoadingMore])

  return { allItems, items, isLoading, isLoadingEnded, hasMore, isLoadingMore, loadMore }
}

// ── Mock fallback filter (mirrors old applyFilter) ────────────────────────────

function applyMockFilter(items: VoteListItem[], filter: VoteFilter): VoteListItem[] {
  switch (filter) {
    case 'live':
      return items.filter((v) => v.badge === 'live')
    case 'hot':
      return [...items]
        .filter((vote) => vote.badge === 'live' && parseVoteCount(vote.count) >= 1)
        .sort((left, right) => parseVoteCount(right.count) - parseVoteCount(left.count))
    case 'new':
      return items.filter((v) => v.badge === 'new')
    case 'popular':
      return [...items].sort(
        (left, right) => parseVoteCount(right.count) - parseVoteCount(left.count),
      )
    default:
      return items
  }
}
