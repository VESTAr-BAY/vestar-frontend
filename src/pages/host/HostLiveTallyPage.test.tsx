import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HostLiveTallyPage } from './HostLiveTallyPage'

const { languageState, mockNavigate, mockUseHostLiveTally } = vi.hoisted(() => ({
  languageState: { lang: 'en' as 'en' | 'ko' },
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
})
