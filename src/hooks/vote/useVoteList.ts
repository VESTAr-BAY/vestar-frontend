import { useEffect, useState } from 'react'
import { HOT_VOTES, VOTE_ITEMS } from '../../data/mockVotes'
import type { HotVote, VoteListItem } from '../../types/vote'

export interface UseVoteListResult {
  isLoading: boolean
  hotVotes: HotVote[]
  items: VoteListItem[]
}

export function useVoteList(): UseVoteListResult {
  const [isLoading, setIsLoading] = useState(true)
  const [hotVotes, setHotVotes] = useState<HotVote[]>([])
  const [items, setItems] = useState<VoteListItem[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setHotVotes(HOT_VOTES)
      setItems(VOTE_ITEMS)
      setIsLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  return { isLoading, hotVotes, items }
}
