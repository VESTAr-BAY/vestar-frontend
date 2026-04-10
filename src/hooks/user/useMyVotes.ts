import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { fetchVoteHistory } from '../../api/elections'
import type { ApiElectionState, ApiVoteHistoryItem } from '../../api/types'
import { useLanguage } from '../../providers/LanguageProvider'
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

function mapToMyVoteItem(item: ApiVoteHistoryItem, lang: 'en' | 'ko'): MyVoteItem {
  return {
    id: item.id,
    voteId: item.onchainElection?.id ?? item.id,
    title: item.onchainElection?.draft?.title ?? 'Untitled vote',
    org: item.onchainElection?.draft?.series?.seriesPreimage ?? 'Unknown series',
    date: formatDate(item.blockTimestamp),
    karmaEarned: 0,
    choice: mapChoiceLabel(item, lang),
    selectedCandidateKeys: item.selection.candidateKeys,
    badge: mapBadge(item.onchainElection?.onchainState ?? 'FINALIZED'),
  }
}

export function useMyVotes(): UseMyVotesResult {
  const { address, isConnected } = useAccount()
  const { lang } = useLanguage()
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
        setVotes(history.map((item) => mapToMyVoteItem(item, lang)))
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
  }, [address, isConnected, lang])

  return { votes, isLoading }
}
