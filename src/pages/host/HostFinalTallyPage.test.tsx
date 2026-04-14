import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VoteDetailData, VoteResultData } from '../../types/vote'
import { HostFinalTallyPage } from './HostFinalTallyPage'

let mockVoteLoading = true
let mockResultLoading = true
let mockVoteValue: VoteDetailData | null = null
let mockResultValue: VoteResultData | null = null

const mockVote: VoteDetailData = {
  id: '1412',
  onchainElectionId: '0x1412',
  onchainState: 'ACTIVE',
  title: 'Mock Election',
  org: 'VESTAr',
  host: 'host-1',
  verified: true,
  emoji: 'V',
  badge: 'end',
  deadlineLabel: '30m left',
  urgent: false,
  startDate: '2026.04.14 00:00',
  endDate: '2026.04.14 01:00',
  endDateISO: '2026-04-14T01:00:00.000Z',
  resultReveal: '2026.04.14 01:00',
  minKarmaTier: 1,
  maxChoices: 1,
  participantCount: 7,
  goalVotes: 0,
  voteFrequency: 'Unlimited paid',
  voteLimit: 'Up to 1 choice',
  resultPublic: true,
  candidates: [
    {
      id: 'candidate-1',
      name: 'Candidate 1',
      group: '',
      emoji: '',
      emojiColor: '#F0EDFF',
      votes: 7,
    },
  ],
  electionAddress: '0x0000000000000000000000000000000000001412',
  visibilityMode: 'OPEN',
}

const mockResult: VoteResultData = {
  id: '1412',
  title: 'Mock Election',
  org: 'VESTAr',
  verified: true,
  emoji: 'V',
  endDate: '2026.04.14 01:00',
  totalVotes: 7,
  rankedCandidates: [
    {
      id: 'candidate-1',
      name: 'Candidate 1',
      group: '',
      emoji: '',
      emojiColor: '#F0EDFF',
      votes: 7,
      percentage: 100,
      rank: 1,
    },
  ],
  mode: 'live',
}

vi.mock('../../hooks/user/useVoteDetail', () => ({
  useVoteDetail: () => ({
    vote: mockVoteValue,
    isLoading: mockVoteLoading,
    participantCount: mockVoteValue?.participantCount ?? 0,
    applyOptimisticSubmission: vi.fn(),
  }),
}))

vi.mock('../../hooks/user/useVoteLiveTally', () => ({
  useVoteLiveTally: () => ({
    result: mockResultValue,
    totalSubmissions: mockResultValue ? 7 : 0,
    totalInvalidVotes: 0,
    isLoading: mockResultLoading,
  }),
}))

vi.mock('../../providers/LanguageProvider', () => ({
  useLanguage: () => ({
    lang: 'en' as const,
  }),
}))

vi.mock('../../providers/ToastProvider', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}))

vi.mock('../../hooks/useStatusFeePrompt', () => ({
  useStatusFeePrompt: () => ({
    prompt: null,
    busyAction: null,
    openForAction: vi.fn(),
    closePrompt: vi.fn(),
    handleRecheck: vi.fn(),
    handleProceed: vi.fn(),
  }),
}))

vi.mock('wagmi', () => ({
  useChainId: () => 1660990954,
  useSwitchChain: () => ({
    switchChainAsync: vi.fn(),
  }),
  useWalletClient: () => ({
    data: null,
  }),
}))

vi.mock('../../contracts/vestar/actions', () => ({
  estimateFinalizeElectionResultsFee: vi.fn(),
  finalizeElectionResults: vi.fn(),
  getElectionSnapshot: vi.fn(async () => ({
    settlementSummary: { settled: false },
  })),
  waitForVestarTransactionReceipt: vi.fn(),
}))

vi.mock('../../contracts/vestar/chain', () => ({
  vestarStatusTestnetChain: {
    id: 1660990954,
  },
}))

vi.mock('../../utils/statusFee', () => ({
  buildStatusFeePreview: vi.fn(),
  getStatusFeeTransactionNote: vi.fn(),
}))

vi.mock('../../utils/walletErrors', () => ({
  getWalletActionErrorMessage: vi.fn(() => 'fee error'),
}))

vi.mock('../../components/shared/StatusFeePromptModal', () => ({
  StatusFeePromptModal: () => null,
}))

vi.mock('../user/VoteResultWinner', () => ({
  VoteResultWinner: () => <div>Winner</div>,
}))

vi.mock('../user/VoteResultRankings', () => ({
  VoteResultRankings: () => <div>Rankings</div>,
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/host/1412/result']}>
      <Routes>
        <Route path="/host/:id/result" element={<HostFinalTallyPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('HostFinalTallyPage', () => {
  beforeEach(() => {
    mockVoteLoading = true
    mockResultLoading = true
    mockVoteValue = null
    mockResultValue = null
  })

  it('keeps hook order stable when loading state resolves', async () => {
    const { rerender } = renderPage()

    mockVoteLoading = false
    mockResultLoading = false
    mockVoteValue = mockVote
    mockResultValue = mockResult

    expect(() =>
      rerender(
        <MemoryRouter initialEntries={['/host/1412/result']}>
          <Routes>
            <Route path="/host/:id/result" element={<HostFinalTallyPage />} />
          </Routes>
        </MemoryRouter>,
      ),
    ).not.toThrow()

    await waitFor(() => {
      expect(screen.getByText('Finalize Results')).toBeInTheDocument()
    })
  })

  it('keeps the existing tally visible during background refresh', () => {
    mockVoteLoading = false
    mockResultLoading = false
    mockVoteValue = mockVote
    mockResultValue = mockResult

    const { rerender } = renderPage()

    expect(screen.getByText('Finalize Results')).toBeInTheDocument()

    mockVoteLoading = true
    mockResultLoading = true

    rerender(
      <MemoryRouter initialEntries={['/host/1412/result']}>
        <Routes>
          <Route path="/host/:id/result" element={<HostFinalTallyPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Finalize Results')).toBeInTheDocument()
  })
})
