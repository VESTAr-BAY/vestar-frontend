import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VoteDetailData } from '../../types/vote'
import { VoteManagePage } from './VoteManagePage'

let mockLang: 'en' | 'ko' = 'ko'
let mockVoteValue: VoteDetailData | null = null
let mockLiveVoteValue: VoteDetailData | null = null
let mockSettlementSettled = false

const mockAddToast = vi.fn()

const baseVote: VoteDetailData = {
  id: '1476',
  onchainElectionId: '0x1476',
  onchainState: 'ACTIVE',
  title: 'Mock Host Vote',
  org: 'VESTAr',
  host: 'host-1',
  verified: true,
  emoji: '',
  badge: 'end',
  deadlineLabel: '',
  urgent: false,
  startDate: '2026.04.15 15:00',
  endDate: '2026.04.15 16:00',
  endDateISO: '2026-04-15T16:00:00.000Z',
  resultReveal: '2026.04.15 16:00',
  minKarmaTier: 0,
  maxChoices: 1,
  participantCount: 12,
  goalVotes: 0,
  voteFrequency: 'Unlimited paid',
  voteLimit: 'Up to 1 choice',
  resultPublic: true,
  paymentMode: 'FREE',
  candidates: [
    {
      id: 'candidate-1',
      name: 'Candidate 1',
      group: '',
      emoji: '',
      emojiColor: '#F0EDFF',
      votes: 12,
    },
  ],
  electionAddress: '0x0000000000000000000000000000000000001476',
  visibilityMode: 'OPEN',
}

vi.mock('../../hooks/host/useVoteManage', () => ({
  useVoteManage: () => ({
    vote: mockVoteValue,
    isLoading: false,
    isUpdating: false,
    updateEndDate: vi.fn(),
  }),
}))

vi.mock('../../hooks/host/useHostLiveTally', () => ({
  useHostLiveTally: () => ({
    vote: mockLiveVoteValue,
    rankedCandidates: [],
    totalVotes: 12,
    totalSubmissions: 12,
    totalInvalidVotes: 0,
    isLoading: false,
  }),
}))

vi.mock('../../providers/LanguageProvider', () => ({
  useLanguage: () => ({
    lang: mockLang,
  }),
}))

vi.mock('../../providers/ToastProvider', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}))

vi.mock('../../contracts/vestar/actions', () => ({
  getElectionSnapshot: vi.fn(async () => ({
    settlementSummary: { settled: mockSettlementSettled },
  })),
}))

vi.mock('../user/VoteHero', () => ({
  VoteHero: () => <div>Vote Hero</div>,
}))

vi.mock('../user/VoteInfoSection', () => ({
  VoteInfoSection: () => <div>Vote Info</div>,
}))

vi.mock('../user/VoteResultRankings', () => ({
  VoteResultRankings: () => <div>Vote Rankings</div>,
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/host/manage/1476']}>
      <Routes>
        <Route path="/host/manage/:id" element={<VoteManagePage />} />
        <Route path="/host/:id/result" element={<div>Result Route</div>} />
        <Route path="/host/:id/settlement" element={<div>Settlement Route</div>} />
        <Route path="/host/:id/live" element={<div>Live Route</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('VoteManagePage', () => {
  beforeEach(() => {
    mockLang = 'ko'
    mockVoteValue = baseVote
    mockLiveVoteValue = baseVote
    mockSettlementSettled = false
    mockAddToast.mockReset()
  })

  it('uses the updated Korean host-management title and explains free-vote finalization', async () => {
    renderPage()

    expect(screen.getByText('주최자 전용 관리 화면')).toBeInTheDocument()
    expect(screen.getByText('진행 중')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'finalize를 왜 해야하나요?' }))

    expect(
      screen.getByText(/정산 단계는 없지만, 결과를 최종 상태로 고정하려면 finalize가 필요합니다\./),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Vote Rankings')).toBeInTheDocument()
    })
  })

  it('shows finalized English copy and sends free finalized votes to the result page', async () => {
    mockLang = 'en'
    mockVoteValue = {
      ...baseVote,
      onchainState: 'FINALIZED',
      paymentMode: 'FREE',
    }
    mockLiveVoteValue = {
      ...baseVote,
      onchainState: 'FINALIZED',
      paymentMode: 'FREE',
    }

    renderPage()

    expect(screen.getByText('Host Management')).toBeInTheDocument()
    expect(screen.getByText('Finalized')).toBeInTheDocument()
    expect(screen.getByText('This vote has already been finalized.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'View Finalized Result' }))

    await waitFor(() => {
      expect(screen.getByText('Result Route')).toBeInTheDocument()
    })
  })
})
