import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfilePanel } from './ProfilePanel'

const {
  MOCK_ADDRESS,
  MOCK_MINT_AMOUNT,
  mockNavigate,
  mockAddToast,
  mockToggleLang,
  mockOpenFeePrompt,
  mockSwitchChainAsync,
  mockConnect,
  mockDisconnect,
  mockGetMockUsdtBalance,
  mockEstimateMintMockUsdtFee,
  mockMintMockUsdt,
  mockWaitForVestarTransactionReceipt,
  mockWalletClient,
} = vi.hoisted(() => {
  const mockAddress = '0x1234567890abcdef1234567890abcdef12345678'

  return {
    MOCK_ADDRESS: mockAddress,
    MOCK_MINT_AMOUNT: 1_000n * 10n ** 6n,
    mockNavigate: vi.fn(),
    mockAddToast: vi.fn(),
    mockToggleLang: vi.fn(),
    mockOpenFeePrompt: vi.fn(),
    mockSwitchChainAsync: vi.fn(),
    mockConnect: vi.fn(),
    mockDisconnect: vi.fn(),
    mockGetMockUsdtBalance: vi.fn(),
    mockEstimateMintMockUsdtFee: vi.fn(),
    mockMintMockUsdt: vi.fn(),
    mockWaitForVestarTransactionReceipt: vi.fn(),
    mockWalletClient: {
      account: { address: mockAddress },
      chain: { id: 1 },
    },
  }
})

const messages: Record<string, string> = {
  btn_close: 'Close',
  pp_not_connected: 'Not connected',
  pp_tier_stat: 'Tier',
  pp_votes_stat: 'Votes',
  pp_mock_usdt_stat: 'MockUSDT',
  pp_my_votes: 'My Votes',
  pp_host_page: 'Host Page',
  pp_verified_organizer: 'Verified Organizer',
  pp_earn_karma: 'Earn Karma',
  pp_karma_history: 'Karma History',
  pp_mint_mock_usdt: 'Mint MockUSDT',
  pp_mint_mock_usdt_loading: 'Minting...',
  mp_verification_cta: 'Verification',
  pp_language: 'Language',
  pp_disconnect: 'Disconnect',
  pp_connect_wallet_loading: 'Connecting...',
  pp_connect_wallet: 'Connect Wallet',
  btn_open_wallet: 'Open Wallet',
}

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: MOCK_ADDRESS,
    isConnected: true,
  }),
  useChainId: () => 1,
  useConnect: () => ({
    connect: mockConnect,
    connectors: [],
    isPending: false,
  }),
  useDisconnect: () => ({
    disconnect: mockDisconnect,
  }),
  useSwitchChain: () => ({
    switchChainAsync: mockSwitchChainAsync,
  }),
  useWalletClient: () => ({
    data: mockWalletClient,
  }),
}))

vi.mock('../../contracts/vestar/actions', () => ({
  estimateMintMockUsdtFee: mockEstimateMintMockUsdtFee,
  getMockUsdtBalance: mockGetMockUsdtBalance,
  mintMockUsdt: mockMintMockUsdt,
  waitForVestarTransactionReceipt: mockWaitForVestarTransactionReceipt,
}))

vi.mock('../../hooks/useStatusFeePrompt', () => ({
  useStatusFeePrompt: () => ({
    prompt: null,
    busyAction: null,
    isEstimating: false,
    openForAction: mockOpenFeePrompt,
    closePrompt: vi.fn(),
    handleRecheck: vi.fn(),
    handleProceed: vi.fn(),
  }),
}))

vi.mock('../../hooks/user/useMyKarma', () => ({
  useMyKarma: () => ({
    tier: {
      color: '#111111',
      label: 'T1',
    },
  }),
}))

vi.mock('../../hooks/user/useMyVotes', () => ({
  useMyVotes: () => ({
    votes: [],
  }),
}))

vi.mock('../../providers/LanguageProvider', () => ({
  useLanguage: () => ({
    lang: 'en',
    toggleLang: mockToggleLang,
    t: (key: string) => messages[key] ?? key,
  }),
}))

vi.mock('../../providers/ToastProvider', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}))

vi.mock('../../utils/mobileWallet', () => ({
  isMobileExternalBrowser: () => false,
}))

vi.mock('../../utils/walletConnection', () => ({
  requestWalletConnection: vi.fn(),
}))

vi.mock('../../utils/walletErrors', () => ({
  getWalletActionErrorMessage: vi.fn(() => 'wallet error'),
}))

describe('ProfilePanel', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockAddToast.mockReset()
    mockToggleLang.mockReset()
    mockOpenFeePrompt.mockReset()
    mockSwitchChainAsync.mockReset()
    mockConnect.mockReset()
    mockDisconnect.mockReset()
    mockGetMockUsdtBalance.mockReset()
    mockEstimateMintMockUsdtFee.mockReset()
    mockMintMockUsdt.mockReset()
    mockWaitForVestarTransactionReceipt.mockReset()

    mockGetMockUsdtBalance.mockImplementation(() => new Promise(() => {}))
    mockEstimateMintMockUsdtFee.mockResolvedValue({
      gasLimit: 21_000n,
      baseFeePerGas: 1n,
      priorityFeePerGas: 1n,
      maxFeePerGas: 2n,
      estimatedFee: 42_000n,
      isGasless: false,
    })
  })

  it('opens the fee prompt before minting MockUSDT', async () => {
    render(
      <MemoryRouter>
        <ProfilePanel open onClose={() => {}} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Mint MockUSDT' }))

    expect(mockOpenFeePrompt).toHaveBeenCalledTimes(1)
    expect(mockMintMockUsdt).not.toHaveBeenCalled()

    const [config] = mockOpenFeePrompt.mock.calls[0]
    expect(config.title).toBe('Fee Notice')
    expect(config.description).toContain('MockUSDT mint transaction')

    const preview = await config.estimate()

    expect(mockEstimateMintMockUsdtFee).toHaveBeenCalledWith(
      mockWalletClient,
      MOCK_ADDRESS,
      MOCK_MINT_AMOUNT,
    )
    expect(preview.transactionCount).toBe(1)
    expect(preview.totalEstimatedFee).toBe(42_000n)
    expect(preview.isGasless).toBe(false)
    expect(config.note(preview)).toBe(
      'This is the estimated network fee for the current transaction.',
    )
  })
})
