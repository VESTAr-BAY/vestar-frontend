import { useCallback, useState } from 'react'
import { VOTE_ITEMS } from '../../data/mockVotes'
import type { VoteListItem } from '../../types/vote'

const PAGE_SIZE = 6

export interface UseInfiniteVotesResult {
  items: VoteListItem[]
  hasMore: boolean
  isLoadingMore: boolean
  loadMore: () => void
}

export function useInfiniteVotes(): UseInfiniteVotesResult {
  const [page, setPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const items = VOTE_ITEMS.slice(0, page * PAGE_SIZE)
  const hasMore = items.length < VOTE_ITEMS.length

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return
    setIsLoadingMore(true)
    setTimeout(() => {
      setPage((p) => p + 1)
      setIsLoadingMore(false)
    }, 500)
  }, [hasMore, isLoadingMore])

  return { items, hasMore, isLoadingMore, loadMore }
}
