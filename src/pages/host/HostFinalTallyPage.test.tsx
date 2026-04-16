import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VoteDetailData, VoteResultData } from '../../types/vote'
import { HostFinalTallyPage } from './HostFinalTallyPage'

let mockLang: 'en' | 'ko' = 'en'
let mockVoteLoading = true
let mockResultLoading = true
let mockVoteValue: VoteDetailData | null = null
let mockResultValue: VoteResultData | null = null
let mockSettlementSettled = false

const mockAddToast = vi.fn()
const mockOpenFeePrompt = vi.fn()
const mockSwitchChainAsync = vi.fn()
const mockFinalizeElectionResults = vi.fn()
const mockWaitForReceipt = vi.fn()
const mockEstimateFinalizeElectionResultsFee = vi.fn()

let mockWalletClientData: { account: { address: `0x${string}` } } | null = null
let capturedFeePromptConfig: {
  title: string
  description: string
  estimate: () => Promise<unknown>
  note: (preview: { transactionCount: number }) => string
  proceed: () => Promise<void>
} | null = null

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
  paymentMode: 'PAID',
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
    lang: mockLang,
  }),
}))

vi.mock('../../providers/ToastProvider', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}))

vi.mock('../../hooks/useStatusFeePrompt', () => ({
  useStatusFeePrompt: () => ({
    prompt: null,
    busyAction: null,
    openForAction: (config: typeof capturedFeePromptConfig) => {
      capturedFeePromptConfig = config
      mockOpenFeePrompt(config)
    },
    closePrompt: vi.fn(),
    handleRecheck: vi.fn(),
    handleProceed: vi.fn(),
  }),
}))

vi.mock('wagmi', () => ({
  useChainId: () => 374,
  useSwitchChain: () => ({
    switchChainAsync: mockSwitchChainAsync,
  }),
  useWalletClient: () => ({
    data: mockWalletClientData,
  }),
}))

vi.mock('../../contracts/vestar/actions', () => ({
  estimateFinalizeElectionResultsFee: (
    ...args: Parameters<typeof mockEstimateFinalizeElectionResultsFee>
  ) => mockEstimateFinalizeElectionResultsFee(...args),
  finalizeElectionResults: (...args: Parameters<typeof mockFinalizeElectionResults>) =>
    mockFinalizeElectionResults(...args),
  getElectionSnapshot: vi.fn(async () => ({
    settlementSummary: { settled: mockSettlementSettled },
  })),
  waitForVestarTransactionReceipt: (...args: Parameters<typeof mockWaitForReceipt>) =>
    mockWaitForReceipt(...args),
}))

vi.mock('../../contracts/vestar/chain', () => ({
  vestarStatusTestnetChain: {
    id: 374,
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
        <Route path="/host/:id/settlement" element={<div>Settlement Route</div>} />
        <Route path="/host/manage/:id" element={<div>Management Route</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('HostFinalTallyPage', () => {
  beforeEach(() => {
    mockLang = 'en'
    mockVoteLoading = true
    mockResultLoading = true
    mockVoteValue = null
    mockResultValue = null
    mockSettlementSettled = false
    mockWalletClientData = null
    capturedFeePromptConfig = null
    mockAddToast.mockReset()
    mockOpenFeePrompt.mockReset()
    mockSwitchChainAsync.mockReset()
    mockFinalizeElectionResults.mockReset()
    mockFinalizeElectionResults.mockResolvedValue('0xhash')
    mockWaitForReceipt.mockReset()
    mockWaitForReceipt.mockResolvedValue(undefined)
    mockEstimateFinalizeElectionResultsFee.mockReset()
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
            <Route path="/host/:id/settlement" element={<div>Settlement Route</div>} />
            <Route path="/host/manage/:id" element={<div>Management Route</div>} />
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
          <Route path="/host/:id/settlement" element={<div>Settlement Route</div>} />
          <Route path="/host/manage/:id" element={<div>Management Route</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Finalize Results')).toBeInTheDocument()
  })

  it('explains free-vote finalization in English and returns to management after success', async () => {
    mockVoteLoading = false
    mockResultLoading = false
    mockVoteValue = {
      ...mockVote,
      paymentMode: 'FREE',
    }
    mockResultValue = mockResult
    mockWalletClientData = {
      account: {
        address: '0x0000000000000000000000000000000000001412',
      },
    }

    renderPage()

    expect(
      screen.getByText(
        'Review the current tally and finalize the on-chain result when it is ready.',
      ),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Finalize Guide' }))

    expect(
      screen.getByText(
        /Free votes still need finalization to lock the final result on-chain after voting ends\./,
      ),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Run Finalize' }))

    await waitFor(() => {
      expect(capturedFeePromptConfig).not.toBeNull()
    })

    await act(async () => {
      await capturedFeePromptConfig?.proceed()
    })

    await waitFor(() => {
      expect(screen.getByText('Management Route')).toBeInTheDocument()
    })
  })

  it('keeps paid votes on the settlement flow after finalize succeeds', async () => {
    mockVoteLoading = false
    mockResultLoading = false
    mockVoteValue = {
      ...mockVote,
      paymentMode: 'PAID',
    }
    mockResultValue = mockResult
    mockWalletClientData = {
      account: {
        address: '0x0000000000000000000000000000000000001412',
      },
    }

    renderPage()

    expect(
      screen.getByText(
        'Review the current tally and finalize the on-chain result when it is ready.',
      ),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Finalize Guide' }))

    expect(
      screen.getByText(/Settlement becomes available only after finalization\./),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Run Finalize' }))

    await waitFor(() => {
      expect(capturedFeePromptConfig).not.toBeNull()
    })

    await act(async () => {
      await capturedFeePromptConfig?.proceed()
    })

    await waitFor(() => {
      expect(screen.getByText('Settlement Route')).toBeInTheDocument()
    })
  })
})
