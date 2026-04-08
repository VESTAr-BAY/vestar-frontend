import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchElectionList } from '../../api/elections'
import { VOTE_ITEMS } from '../../data/mockVotes'
import { mapToVoteListItem } from '../../utils/electionMapper'
import type { ApiElection } from '../../api/types'
import type { VoteListItem } from '../../types/vote'

const PAGE_SIZE = 6

export type VoteFilter = 'all' | 'live' | 'hot' | 'new' | 'popular'

export interface UseInfiniteVotesResult {
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

/** Client-side sort for filters that need it */
function sortElections(elections: ApiElection[], filter: VoteFilter): ApiElection[] {
  if (filter === 'popular') {
    return [...elections].sort((a, b) => (b.total_submissions ?? 0) - (a.total_submissions ?? 0))
  }
  // 'hot' = ACTIVE sorted by submissions desc (most popular active)
  if (filter === 'hot') {
    return [...elections].sort((a, b) => (b.total_submissions ?? 0) - (a.total_submissions ?? 0))
  }
  return elections
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

  // Fetch all elections for the current filter from the API
  useEffect(() => {
    let cancelled = false
    const state = filterToApiState(filter)

    setIsLoading(true)
    fetchElectionList({ state, pageSize: 100 })
      .then((res) => {
        if (cancelled) return
        const sorted = sortElections(res.elections, filter)
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

  return { items, isLoading, hasMore, isLoadingMore, loadMore }
}

// ── Mock fallback filter (mirrors old applyFilter) ────────────────────────────

function applyMockFilter(items: VoteListItem[], filter: VoteFilter): VoteListItem[] {
  switch (filter) {
    case 'live':
      return items.filter((v) => v.badge === 'live')
    case 'hot':
      return items.filter((v) => v.badge === 'hot')
    case 'new':
      return items.filter((v) => v.badge === 'new')
    case 'popular':
      return [...items].sort(
        (a, b) =>
          Number.parseInt(b.count.replace(/,/g, ''), 10) -
          Number.parseInt(a.count.replace(/,/g, ''), 10),
      )
    default:
      return items
  }
}
