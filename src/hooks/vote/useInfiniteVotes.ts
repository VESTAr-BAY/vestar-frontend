import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchCandidateManifest } from '../../api/candidateManifest'
import { fetchElections } from '../../api/elections'
import { VOTE_ITEMS } from '../../data/mockVotes'
import { applyManifestToElection, mapToVoteListItem } from '../../utils/electionMapper'
import type { ApiElection } from '../../api/types'
import type { VoteListItem } from '../../types/vote'

const PAGE_SIZE = 6

export type VoteFilter = 'all' | 'live' | 'hot' | 'new' | 'popular'

export interface UseInfiniteVotesResult {
  allItems: VoteListItem[]
  items: VoteListItem[]
  isLoading: boolean
  hasMore: boolean
  isLoadingMore: boolean
  loadMore: () => void
}

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

/**
 * Fetches a paginated + filtered list of elections.
 * Falls back to mock data when the API is unavailable.
 */
export function useInfiniteVotes(filter: VoteFilter = 'all'): UseInfiniteVotesResult {
  const [allItems, setAllItems] = useState<VoteListItem[]>([])
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Reset to page 1 whenever the filter changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: resets page on filter change
  useEffect(() => {
    setPage(1)
  }, [filter])

  useEffect(() => {
    let cancelled = false
    const onchainState = filterToApiState(filter)

    setIsLoading(true)
    fetchElections({ onchainState })
      .then((elections) =>
        Promise.all(
          elections.map(async (election) =>
            applyManifestToElection(
              election,
              await fetchCandidateManifest(
                election.candidateManifestUri,
                election.candidateManifestHash,
              ),
            ),
          ),
        ),
      )
      .then((elections) => {
        if (cancelled) return
        const sorted = sortElections(elections, filter)
        setAllItems(sorted.map((e, i) => mapToVoteListItem(e, i)))
      })
      .catch(() => {
        if (cancelled) return
        const mockFiltered = applyMockFilter(VOTE_ITEMS, filter)
        setAllItems(mockFiltered)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filter])

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

  return { allItems, items, isLoading, hasMore, isLoadingMore, loadMore }
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
