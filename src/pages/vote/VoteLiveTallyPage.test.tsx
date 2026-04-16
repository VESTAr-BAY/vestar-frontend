import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VoteLiveTallyPage } from './VoteLiveTallyPage'

const { languageState, translations, mockNavigate, mockUseVoteLiveTally } = vi.hoisted(() => ({
  languageState: { lang: 'en' as 'en' | 'ko' },
  translations: {
    en: {
      vlt_empty_title: 'There is no live tally to display yet.',
      vlt_empty_description: 'Live rankings will appear on this screen once tally data is available.',
      vlt_back_to_detail: 'Back to Detail',
    },
    ko: {
      vlt_empty_title: '아직 표시할 실시간 집계가 없습니다.',
      vlt_empty_description: '집계 데이터가 반영되면 이 화면에서 실시간 순위를 볼 수 있습니다.',
      vlt_back_to_detail: '상세 화면으로 돌아가기',
    },
  },
  mockNavigate: vi.fn(),
  mockUseVoteLiveTally: vi.fn(),
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')

  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '111' }),
  }
})

vi.mock('../../hooks/user/useVoteLiveTally', () => ({
  useVoteLiveTally: () => mockUseVoteLiveTally(),
}))

vi.mock('../../providers/LanguageProvider', () => ({
  useLanguage: () => ({
    lang: languageState.lang,
    t: (key: string) =>
      translations[languageState.lang][key as keyof (typeof translations)['en']] ?? key,
  }),
}))

vi.mock('../user/VoteResultWinner', () => ({
  VoteResultWinner: () => <div>VoteResultWinner</div>,
}))

vi.mock('../user/VoteResultRankings', () => ({
  VoteResultRankings: () => <div>VoteResultRankings</div>,
}))

describe('VoteLiveTallyPage', () => {
  beforeEach(() => {
    languageState.lang = 'en'
    mockNavigate.mockReset()
    mockUseVoteLiveTally.mockReset()
  })

  it('renders English empty-state copy', () => {
    mockUseVoteLiveTally.mockReturnValue({
      result: null,
      isLoading: false,
      totalSubmissions: 0,
    })

    render(<VoteLiveTallyPage />)

    expect(screen.getByText('There is no live tally to display yet.')).toBeInTheDocument()
    expect(
      screen.getByText('Live rankings will appear on this screen once tally data is available.'),
    ).toBeInTheDocument()
  })

  it('renders an English back button on populated tallies', () => {
    mockUseVoteLiveTally.mockReturnValue({
      result: {
        id: 'vote-111',
        title: 'BEST FEMALE GROUP',
        org: 'MAMA 2024',
        verified: false,
        emoji: '',
        endDate: '2026.04.18 15:00',
        totalVotes: 4,
        mode: 'live',
        rankedCandidates: [
          {
            id: 'aespa',
            name: 'aespa',
            group: '',
            imageUrl: null,
            emoji: '',
            emojiColor: '#F0EDFF',
            votes: 2,
            percentage: 50,
            rank: 1,
          },
        ],
      },
      isLoading: false,
      totalSubmissions: 4,
    })

    render(<VoteLiveTallyPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Back to Detail' }))

    expect(mockNavigate).toHaveBeenCalledWith('/vote/111')
  })
})
