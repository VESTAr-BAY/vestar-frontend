import type { VoteDetailData } from '../../types/vote'

const MOCK_VOTES: Record<string, VoteDetailData> = {
  '1': {
    id: '1',
    title: '이번 주 1위는 누구?',
    org: 'Show! Music Core × Mubeat',
    verified: true,
    emoji: '🎤',
    badge: 'live',
    deadlineLabel: '2h 14m 남음',
    urgent: true,
    startDate: '2025.04.01 18:00',
    endDate: '2025.04.03 11:00',
    resultReveal: '종료 후 공개',
    maxChoices: 1,
    participantCount: 24891,
    voteFrequency: '매일 갱신',
    voteLimit: '1인 1표',
    resultPublic: false,
    candidates: [
      { id: '1', name: 'BTS', group: '빅히트 뮤직', emoji: '👑', emojiColor: '#fef3c7' },
      { id: '2', name: 'BLACKPINK', group: 'YG 엔터테인먼트', emoji: '💗', emojiColor: '#fce7f3' },
      { id: '3', name: 'aespa', group: 'SM 엔터테인먼트', emoji: '🌌', emojiColor: '#ede9fe' },
      {
        id: '4',
        name: 'IVE',
        group: '스타쉽 엔터테인먼트',
        emoji: '❄️',
        emojiColor: '#e0f2fe',
      },
      { id: '5', name: 'NewJeans', group: '어도어', emoji: '🍀', emojiColor: '#dcfce7' },
      {
        id: '6',
        name: 'Stray Kids',
        group: 'JYP 엔터테인먼트',
        emoji: '🔥',
        emojiColor: '#fff1f2',
      },
    ],
  },
}

export interface UseVoteDetailResult {
  vote: VoteDetailData | null
  isLoading: boolean
}

export function useVoteDetail(id: string): UseVoteDetailResult {
  // Return mock data immediately — no loading for now
  const vote = MOCK_VOTES[id] ?? { ...MOCK_VOTES['1'], id, title: '투표 상세' }
  return { vote, isLoading: false }
}
