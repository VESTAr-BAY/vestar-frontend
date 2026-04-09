import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { fetchVoteHistory } from '../../api/elections'
import type { ApiElectionState, ApiVoteHistoryItem } from '../../api/types'
import type { MyVoteItem } from '../../types/user'

export interface UseMyVotesResult {
  votes: MyVoteItem[]
  isLoading: boolean
}

function formatDate(dateValue: string): string {
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}.${month}.${day}`
}

function mapBadge(state: ApiElectionState): MyVoteItem['badge'] {
  switch (state) {
    case 'ACTIVE':
      return 'live'
    case 'FINALIZED':
    case 'CLOSED':
    case 'KEY_REVEAL_PENDING':
    case 'KEY_REVEALED':
    case 'CANCELLED':
      return 'end'
    case 'SCHEDULED':
      return 'new'
    default:
      return 'hot'
  }
}

function mapChoiceLabel(item: ApiVoteHistoryItem): string {
  if (item.selection.isPending) {
    return '집계 대기 중'
  }

  if (item.selection.isValid === false) {
    return '무효 처리됨'
  }

  if (item.selection.candidateKeys.length === 0) {
    return '선택 정보 없음'
  }

  return item.selection.candidateKeys.join(', ')
}

function mapToMyVoteItem(item: ApiVoteHistoryItem): MyVoteItem {
  return {
    id: item.id,
    voteId: item.onchainElection?.id ?? item.id,
    title: item.onchainElection?.draft?.title ?? 'Untitled vote',
    org: item.onchainElection?.draft?.series?.seriesPreimage ?? 'Unknown series',
    date: formatDate(item.blockTimestamp),
    karmaEarned: 0,
    choice: mapChoiceLabel(item),
    choiceEmoji: item.type === 'PRIVATE' ? '🔐' : '🗳️',
    badge: mapBadge(item.onchainElection?.onchainState ?? 'FINALIZED'),
  }
}

export function useMyVotes(): UseMyVotesResult {
  const { address, isConnected } = useAccount()
  const [votes, setVotes] = useState<MyVoteItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isConnected || !address) {
      setVotes([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    fetchVoteHistory(address)
      .then((history) => {
        if (cancelled) return
        setVotes(history.map(mapToMyVoteItem))
      })
      .catch(() => {
        if (cancelled) return
        setVotes([])
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [address, isConnected])

  return { votes, isLoading }
}
