import type { VoteResultData } from '../../types/vote'

const MOCK_RESULTS: Record<string, VoteResultData> = {
  '1': {
    id: '1',
    title: '이번 주 1위는 누구?',
    org: 'Show! Music Core × Mubeat',
    verified: true,
    emoji: '🎤',
    endDate: '2025.04.03 11:00',
    totalVotes: 24891,
    rankedCandidates: [
      {
        id: '5',
        name: 'NewJeans',
        group: '어도어',
        emoji: '🍀',
        emojiColor: '#dcfce7',
        votes: 8934,
        percentage: 35.9,
        rank: 1,
      },
      {
        id: '1',
        name: 'BTS',
        group: '빅히트 뮤직',
        emoji: '👑',
        emojiColor: '#fef3c7',
        votes: 6721,
        percentage: 27.0,
        rank: 2,
      },
      {
        id: '3',
        name: 'aespa',
        group: 'SM 엔터테인먼트',
        emoji: '🌌',
        emojiColor: '#ede9fe',
        votes: 4203,
        percentage: 16.9,
        rank: 3,
      },
      {
        id: '6',
        name: 'Stray Kids',
        group: 'JYP 엔터테인먼트',
        emoji: '🔥',
        emojiColor: '#fff1f2',
        votes: 2891,
        percentage: 11.6,
        rank: 4,
      },
      {
        id: '2',
        name: 'BLACKPINK',
        group: 'YG 엔터테인먼트',
        emoji: '💗',
        emojiColor: '#fce7f3',
        votes: 1547,
        percentage: 6.2,
        rank: 5,
      },
      {
        id: '4',
        name: 'IVE',
        group: '스타쉽 엔터테인먼트',
        emoji: '❄️',
        emojiColor: '#e0f2fe',
        votes: 595,
        percentage: 2.4,
        rank: 6,
      },
    ],
  },
}

const FALLBACK_RESULT = (id: string): VoteResultData => ({
  ...MOCK_RESULTS['1'],
  id,
  title: '투표 결과',
})

export interface UseVoteResultResult {
  result: VoteResultData | null
  isLoading: boolean
}

export function useVoteResult(id: string): UseVoteResultResult {
  const result = MOCK_RESULTS[id] ?? FALLBACK_RESULT(id)
  return { result, isLoading: false }
}
