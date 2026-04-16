import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HostDashboardPage } from './HostDashboardPage'

const { languageState, translations, mockNavigate, mockUseHostVotes } = vi.hoisted(() => ({
  languageState: { lang: 'en' as 'en' | 'ko' },
  translations: {
    en: {
      filter_all: 'All',
      hd_active: 'Active',
      hd_scheduled: 'Scheduled',
      hd_completed: 'Completed',
      hd_title: 'Manage My Votes',
      hd_eyebrow: 'Host Dashboard',
      hd_sub: 'Create votes and check results',
      hd_create_btn: 'Create New Vote',
      hd_my_votes: 'My Votes',
      hd_loading: 'Loading votes...',
      hd_empty_all: 'No votes created yet.',
      hd_empty_filtered: 'No votes match the selected status.',
    },
    ko: {
      filter_all: '전체',
      hd_active: '진행 중',
      hd_scheduled: '예정',
      hd_completed: '완료된 투표',
      hd_title: '내 투표 관리',
      hd_eyebrow: '호스트 대시보드',
      hd_sub: '투표를 만들고 결과를 확인하세요',
      hd_create_btn: '새 투표 만들기',
      hd_my_votes: '내 투표 목록',
      hd_loading: '불러오는 중...',
      hd_empty_all: '아직 생성한 투표가 없습니다.',
      hd_empty_filtered: '선택한 상태의 투표가 없습니다.',
    },
  },
  mockNavigate: vi.fn(),
  mockUseHostVotes: vi.fn(),
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../hooks/host/useHostVotes', () => ({
  useHostVotes: () => mockUseHostVotes(),
}))

vi.mock('../../providers/LanguageProvider', () => ({
  useLanguage: () => ({
    lang: languageState.lang,
    t: (key: string) =>
      translations[languageState.lang][key as keyof (typeof translations)['en']] ?? key,
  }),
}))

describe('HostDashboardPage', () => {
  beforeEach(() => {
    languageState.lang = 'en'
    mockNavigate.mockReset()
    mockUseHostVotes.mockReset()
    mockUseHostVotes.mockReturnValue({
      votes: [],
      activeCount: 0,
      completedCount: 0,
      isLoading: false,
    })
  })

  it('shows the empty dashboard copy in English', () => {
    render(
      <MemoryRouter>
        <HostDashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Host Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Manage My Votes')).toBeInTheDocument()
    expect(screen.getByText('No votes created yet.')).toBeInTheDocument()
  })

  it('shows the filtered empty state in Korean', () => {
    languageState.lang = 'ko'

    render(
      <MemoryRouter>
        <HostDashboardPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /진행 중/ }))

    expect(screen.getByText('호스트 대시보드')).toBeInTheDocument()
    expect(screen.getByText('선택한 상태의 투표가 없습니다.')).toBeInTheDocument()
  })
})
