import type { KarmaEvent } from '../../types/user'

export interface UseMyKarmaResult {
  events: KarmaEvent[]
  total: number
  isLoading: boolean
}

const MOCK_KARMA_EVENTS: KarmaEvent[] = [
  {
    id: 'ke1',
    type: 'vote',
    label: '투표 참여 — 이번 주 1위는 누구?',
    karma: 20,
    date: '2026.04.07',
    icon: '🗳️',
  },
  {
    id: 'ke2',
    type: 'streak',
    label: '3일 연속 투표 보너스',
    karma: 50,
    date: '2026.04.05',
    icon: '🔥',
  },
  {
    id: 'ke3',
    type: 'vote',
    label: '투표 참여 — 4월 이달의 소녀',
    karma: 50,
    date: '2026.04.05',
    icon: '🗳️',
  },
  {
    id: 'ke4',
    type: 'vote',
    label: '투표 참여 — 봄 컴백 기대 아티스트',
    karma: 20,
    date: '2026.04.01',
    icon: '🗳️',
  },
  {
    id: 'ke5',
    type: 'referral',
    label: '친구 초대 보너스',
    karma: 100,
    date: '2026.03.30',
    icon: '🎁',
  },
  {
    id: 'ke6',
    type: 'vote',
    label: '투표 참여 — 3월 인기 그룹 TOP 10',
    karma: 30,
    date: '2026.03.28',
    icon: '🗳️',
  },
  {
    id: 'ke7',
    type: 'bonus',
    label: '첫 투표 참여 기념 보너스',
    karma: 200,
    date: '2026.03.22',
    icon: '🎉',
  },
  {
    id: 'ke8',
    type: 'vote',
    label: '투표 참여 — 2026 월드투어 팬 응원 투표',
    karma: 20,
    date: '2026.03.22',
    icon: '🗳️',
  },
]

export function useMyKarma(): UseMyKarmaResult {
  const total = MOCK_KARMA_EVENTS.reduce((sum, e) => sum + e.karma, 0)
  return { events: MOCK_KARMA_EVENTS, total, isLoading: false }
}
