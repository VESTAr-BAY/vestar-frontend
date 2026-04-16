import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HostLiveTallyPage } from './HostLiveTallyPage'

const { languageState, translations, mockNavigate, mockUseHostLiveTally } = vi.hoisted(() => ({
  languageState: { lang: 'en' as 'en' | 'ko' },
  translations: {
    en: {
      hlt_eyebrow: 'Host Live Tally',
      hlt_title: 'Organizer live tally',
      hlt_description: 'You can monitor running totals here, even for private votes.',
      hlt_empty_title: 'No tally data yet.',
      hlt_empty_description: 'Organizer live tallies will appear here once votes start coming in.',
      hlt_back_button: 'Back to Management',
    },
    ko: {
      hlt_eyebrow: '호스트 실시간 집계',
      hlt_title: '주최자 전용 실시간 집계 화면',
      hlt_description: '비공개 투표도 진행 중 누적 집계를 확인할 수 있습니다.',
      hlt_empty_title: '아직 집계 데이터가 없습니다.',
      hlt_empty_description: '투표가 쌓이면 주최자 전용 실시간 집계가 여기에 표시됩니다.',
      hlt_back_button: '관리 화면으로 돌아가기',
    },
  },
  mockNavigate: vi.fn(),
  mockUseHostLiveTally: vi.fn(),
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')

  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1412' }),
  }
})

vi.mock('../../hooks/host/useHostLiveTally', () => ({
  useHostLiveTally: () => mockUseHostLiveTally(),
}))

vi.mock('../../providers/LanguageProvider', () => ({
  useLanguage: () => ({
    lang: languageState.lang,
    t: (key: string) =>
      translations[languageState.lang][key as keyof (typeof translations)['en']] ?? key,
  }),
}))

vi.mock('../user/VoteHero', () => ({
  VoteHero: () => <div>VoteHero</div>,
}))

vi.mock('../user/VoteInfoSection', () => ({
  VoteInfoSection: () => <div>VoteInfoSection</div>,
}))

vi.mock('../user/VoteResultRankings', () => ({
  VoteResultRankings: () => <div>VoteResultRankings</div>,
}))

describe('HostLiveTallyPage', () => {
  beforeEach(() => {
    languageState.lang = 'en'
    mockNavigate.mockReset()
    mockUseHostLiveTally.mockReset()
  })

  it('renders localized English empty-state copy', () => {
    mockUseHostLiveTally.mockReturnValue({
      vote: {
        id: '1412',
      },
      rankedCandidates: [],
      totalSubmissions: 0,
      isLoading: false,
    })

    render(<HostLiveTallyPage />)

    expect(screen.getByText('Host Live Tally')).toBeInTheDocument()
    expect(screen.getByText('Organizer live tally')).toBeInTheDocument()
    expect(screen.getByText('No tally data yet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back to Management' })).toBeInTheDocument()
  })

  it('renders localized Korean empty-state copy', () => {
    languageState.lang = 'ko'

    mockUseHostLiveTally.mockReturnValue({
      vote: {
        id: '1412',
      },
      rankedCandidates: [],
      totalSubmissions: 0,
      isLoading: false,
    })

    render(<HostLiveTallyPage />)

    expect(screen.getByText('호스트 실시간 집계')).toBeInTheDocument()
    expect(screen.getByText('주최자 전용 실시간 집계 화면')).toBeInTheDocument()
    expect(screen.getByText('아직 집계 데이터가 없습니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '관리 화면으로 돌아가기' })).toBeInTheDocument()
  })
})
