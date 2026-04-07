import type { MyVoteItem } from '../../types/user'

export interface UseMyVotesResult {
  votes: MyVoteItem[]
  isLoading: boolean
}

const MOCK_MY_VOTES: MyVoteItem[] = [
  {
    id: 'mv1',
    voteId: '1',
    title: '이번 주 1위는 누구?',
    org: 'Show! Music Core × Mubeat',
    date: '2026.04.07',
    karmaEarned: 20,
    choice: 'BTS',
    choiceEmoji: '👑',
    badge: 'live',
  },
  {
    id: 'mv2',
    voteId: '2',
    title: '4월 이달의 소녀',
    org: '2026 K-pop Awards',
    date: '2026.04.05',
    karmaEarned: 50,
    choice: 'aespa',
    choiceEmoji: '🌌',
    badge: 'hot',
  },
  {
    id: 'mv3',
    voteId: '3',
    title: '봄 컴백 기대 아티스트',
    org: '멜론 팬투표',
    date: '2026.04.01',
    karmaEarned: 20,
    choice: 'NewJeans',
    choiceEmoji: '🍀',
    badge: 'end',
  },
  {
    id: 'mv4',
    voteId: '4',
    title: '3월 인기 그룹 TOP 10',
    org: 'Mnet × Idol Champ',
    date: '2026.03.28',
    karmaEarned: 30,
    choice: 'Stray Kids',
    choiceEmoji: '🔥',
    badge: 'end',
  },
  {
    id: 'mv5',
    voteId: '5',
    title: '2026 월드투어 팬 응원 투표',
    org: 'WeVerse × Universe',
    date: '2026.03.22',
    karmaEarned: 20,
    choice: 'BLACKPINK',
    choiceEmoji: '💗',
    badge: 'end',
  },
  {
    id: 'mv6',
    voteId: '6',
    title: '신보 컨셉 팬 픽',
    org: 'Mubeat',
    date: '2026.03.15',
    karmaEarned: 20,
    choice: 'IVE',
    choiceEmoji: '❄️',
    badge: 'new',
  },
]

export function useMyVotes(): UseMyVotesResult {
  return { votes: MOCK_MY_VOTES, isLoading: false }
}
