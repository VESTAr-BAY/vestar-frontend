import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { RankedCandidate, VoteResultData } from '../../types/vote'
import { VoteResultWinner } from './VoteResultWinner'

let mockLang: 'en' | 'ko' = 'ko'

vi.mock('../../providers/LanguageProvider', () => ({
  useLanguage: () => ({
    lang: mockLang,
    t: (key: string) =>
      (
        ({
          vr_results: mockLang === 'ko' ? '결과 발표' : 'Results',
          vr_ended: mockLang === 'ko' ? '종료' : 'Ended',
          vr_1st_place: mockLang === 'ko' ? '1위' : '1st Place',
        }) as const
      )[key] ?? key,
  }),
}))

const baseWinner: RankedCandidate = {
  id: 'candidate-1',
  name: '금복식당',
  group: '',
  emoji: '',
  emojiColor: '#F0EDFF',
  votes: 2,
  percentage: 40,
  rank: 1,
}

const baseResult: VoteResultData = {
  id: 'vote-1',
  title: '월요일 저녁메뉴는?',
  org: '2026/04/13 월 저녁 메뉴',
  verified: false,
  emoji: '',
  endDate: '2026.04.13 18:30',
  totalVotes: 5,
  rankedCandidates: [baseWinner],
  mode: 'live',
}

describe('VoteResultWinner', () => {
  it('uses total vote wording by default', () => {
    mockLang = 'ko'
    render(<VoteResultWinner result={baseResult} winner={baseWinner} />)

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('총 표 수')).toBeInTheDocument()
  })

  it('can render participant wording when a submission count is provided', () => {
    mockLang = 'ko'
    render(
      <VoteResultWinner
        result={baseResult}
        winner={baseWinner}
        mode="live"
        summaryCount={3}
        summaryKind="participants"
      />,
    )

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('명 참여 중')).toBeInTheDocument()
  })

  it('renders live tally labels in English when the locale is English', () => {
    mockLang = 'en'
    render(<VoteResultWinner result={baseResult} winner={baseWinner} mode="live" />)

    expect(screen.getByText('Live Tally')).toBeInTheDocument()
    expect(screen.getByText('Current Leader')).toBeInTheDocument()
    expect(screen.getByText('total votes')).toBeInTheDocument()
    expect(screen.getByText('(2 votes)')).toBeInTheDocument()
  })
})
