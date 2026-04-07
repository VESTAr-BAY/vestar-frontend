import { useEffect, useRef, useState } from 'react'
import type { VoteDetailData } from '../../types/vote'

const MOCK_VOTES: Record<string, VoteDetailData> = {
  '2': {
    id: '2',
    title: '2026 MAMA 대상',
    org: 'Mnet × MAMA Awards',
    verified: true,
    emoji: '🏆',
    badge: 'live',
    deadlineLabel: '3d 11h 남음',
    urgent: false,
    startDate: '2026.04.07 00:00',
    endDate: '2026.04.10 23:59',
    endDateISO: '2026-04-10T23:59:00+09:00',
    resultReveal: '종료 후 공개',
    maxChoices: 1,
    participantCount: 142308,
    goalVotes: 500000,
    voteFrequency: '매일 갱신',
    voteLimit: '1인 1표',
    resultPublic: false,
    candidates: [],
    sections: [
      {
        id: 's1',
        name: '남자 그룹',
        candidates: [
          { id: 's1c1', name: 'BTS', group: '빅히트 뮤직', emoji: '👑', emojiColor: '#fef3c7' },
          {
            id: 's1c2',
            name: 'Stray Kids',
            group: 'JYP 엔터테인먼트',
            emoji: '🔥',
            emojiColor: '#fff1f2',
          },
          {
            id: 's1c3',
            name: 'SEVENTEEN',
            group: '플레디스 엔터테인먼트',
            emoji: '💎',
            emojiColor: '#e0f2fe',
          },
          { id: 's1c4', name: 'EXO', group: 'SM 엔터테인먼트', emoji: '⭐', emojiColor: '#fef3c7' },
        ],
      },
      {
        id: 's2',
        name: '여자 그룹',
        candidates: [
          {
            id: 's2c1',
            name: 'BLACKPINK',
            group: 'YG 엔터테인먼트',
            emoji: '💗',
            emojiColor: '#fce7f3',
          },
          {
            id: 's2c2',
            name: 'aespa',
            group: 'SM 엔터테인먼트',
            emoji: '🌌',
            emojiColor: '#ede9fe',
          },
          {
            id: 's2c3',
            name: 'IVE',
            group: '스타쉽 엔터테인먼트',
            emoji: '❄️',
            emojiColor: '#e0f2fe',
          },
          { id: 's2c4', name: 'NewJeans', group: '어도어', emoji: '🍀', emojiColor: '#dcfce7' },
        ],
      },
      {
        id: 's3',
        name: '솔로 아티스트',
        candidates: [
          {
            id: 's3c1',
            name: 'IU',
            group: 'EDAM 엔터테인먼트',
            emoji: '🎀',
            emojiColor: '#fce7f3',
          },
          {
            id: 's3c2',
            name: 'G-Dragon',
            group: 'YG 엔터테인먼트',
            emoji: '🦋',
            emojiColor: '#F0EDFF',
          },
          {
            id: 's3c3',
            name: '태연',
            group: 'SM 엔터테인먼트',
            emoji: '🌙',
            emojiColor: '#e8f0ff',
          },
        ],
      },
    ],
  },
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
    endDateISO: '2026-04-08T11:00:00+09:00',
    resultReveal: '종료 후 공개',
    maxChoices: 1,
    participantCount: 24891,
    goalVotes: 50000,
    voteFrequency: '매일 갱신',
    voteLimit: '1인 1표',
    resultPublic: false,
    candidates: [
      {
        id: '1',
        name: 'BTS',
        group: '빅히트 뮤직',
        emoji: '👑',
        emojiColor: '#fef3c7',
        votePreviewPct: 28,
      },
      {
        id: '2',
        name: 'BLACKPINK',
        group: 'YG 엔터테인먼트',
        emoji: '💗',
        emojiColor: '#fce7f3',
        votePreviewPct: 12,
      },
      {
        id: '3',
        name: 'aespa',
        group: 'SM 엔터테인먼트',
        emoji: '🌌',
        emojiColor: '#ede9fe',
        votePreviewPct: 22,
      },
      {
        id: '4',
        name: 'IVE',
        group: '스타쉽 엔터테인먼트',
        emoji: '❄️',
        emojiColor: '#e0f2fe',
        votePreviewPct: 8,
      },
      {
        id: '5',
        name: 'NewJeans',
        group: '어도어',
        emoji: '🍀',
        emojiColor: '#dcfce7',
        votePreviewPct: 19,
      },
      {
        id: '6',
        name: 'Stray Kids',
        group: 'JYP 엔터테인먼트',
        emoji: '🔥',
        emojiColor: '#fff1f2',
        votePreviewPct: 11,
      },
    ],
  },
}

export interface UseVoteDetailResult {
  vote: VoteDetailData | null
  isLoading: boolean
  participantCount: number
}

export function useVoteDetail(id: string): UseVoteDetailResult {
  const base = MOCK_VOTES[id] ?? { ...MOCK_VOTES['1'], id, title: '투표 상세' }
  const [participantCount, setParticipantCount] = useState(base.participantCount)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (base.badge === 'end') return
    intervalRef.current = setInterval(() => {
      setParticipantCount((prev) => prev + Math.floor(Math.random() * 3) + 1)
    }, 4000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [base.badge])

  return { vote: base, isLoading: false, participantCount }
}
