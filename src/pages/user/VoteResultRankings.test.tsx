import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { RankedCandidate } from '../../types/vote'
import { VoteResultRankings } from './VoteResultRankings'

let mockLang: 'en' | 'ko' = 'en'

vi.mock('../../providers/LanguageProvider', () => ({
  useLanguage: () => ({
    lang: mockLang,
    t: (key: string) =>
      (
        ({
          vr_rankings: mockLang === 'ko' ? '전체 순위' : 'Rankings',
        }) as const
      )[key] ?? key,
  }),
}))

const rankedCandidates: RankedCandidate[] = [
  {
    id: 'candidate-1',
    name: 'Park Hyo Shin',
    group: 'Solo',
    emoji: '',
    emojiColor: '#F0EDFF',
    votes: 1234,
    percentage: 55.5,
    rank: 1,
  },
]

describe('VoteResultRankings', () => {
  it('shows English live tally labels and vote suffixes', () => {
    mockLang = 'en'
    render(<VoteResultRankings rankedCandidates={rankedCandidates} mode="live" />)

    expect(screen.getByText('Live Tally')).toBeInTheDocument()
    expect(screen.getByText('1,234 votes')).toBeInTheDocument()
  })

  it('keeps Korean vote suffixes for Korean locale', () => {
    mockLang = 'ko'
    render(<VoteResultRankings rankedCandidates={rankedCandidates} mode="live" />)

    expect(screen.getByText('실시간 집계')).toBeInTheDocument()
    expect(screen.getByText('1,234표')).toBeInTheDocument()
  })
})
