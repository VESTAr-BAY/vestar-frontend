import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetMyKarmaCacheForTests, useMyKarma } from './useMyKarma'

const TEST_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678' as const
const SECOND_TEST_ADDRESS = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as const

const mockUseAccount = vi.fn<() => { address: string | undefined; isConnected: boolean }>()

vi.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
}))

const mockGetKarmaBalance = vi.fn<(address: string) => Promise<bigint>>()
const mockGetKarmaTier = vi.fn<(address: string) => Promise<number>>()

vi.mock('../../contracts/vestar/actions', () => ({
  getKarmaBalance: (address: string) => mockGetKarmaBalance(address),
  getKarmaTier: (address: string) => mockGetKarmaTier(address),
}))

describe('useMyKarma', () => {
  beforeEach(() => {
    __resetMyKarmaCacheForTests()
    window.localStorage.clear()
    mockUseAccount.mockReturnValue({ address: undefined, isConnected: false })
    mockGetKarmaBalance.mockReset()
    mockGetKarmaTier.mockReset()
    mockGetKarmaBalance.mockResolvedValue(0n)
    mockGetKarmaTier.mockResolvedValue(0)
  })

  it('returns 0 karma when wallet is not connected', async () => {
    mockUseAccount.mockReturnValue({ address: undefined, isConnected: false })

    const { result } = renderHook(() => useMyKarma())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.total).toBe(0)
    expect(mockGetKarmaBalance).not.toHaveBeenCalled()
    expect(mockGetKarmaTier).not.toHaveBeenCalled()
  })

  it('fetches on-chain karma balance when wallet is connected', async () => {
    mockUseAccount.mockReturnValue({ address: TEST_ADDRESS, isConnected: true })
    mockGetKarmaBalance.mockResolvedValue(490n)
    mockGetKarmaTier.mockResolvedValue(4)

    const { result } = renderHook(() => useMyKarma())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockGetKarmaBalance).toHaveBeenCalledWith(TEST_ADDRESS)
    expect(mockGetKarmaTier).toHaveBeenCalledWith(TEST_ADDRESS)
    expect(result.current.total).toBe(490)
    expect(result.current.tierId).toBe(4)
    expect(result.current.tier.label).toBe('Active')
  })

  it('returns 0 gracefully when on-chain call fails', async () => {
    mockUseAccount.mockReturnValue({ address: TEST_ADDRESS, isConnected: true })
    mockGetKarmaBalance.mockRejectedValue(new Error('RPC timeout'))

    const { result } = renderHook(() => useMyKarma())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.total).toBe(0)
    expect(result.current.tierId).toBe(0)
    expect(result.current.error).toBeDefined()
  })

  it('exposes loading state while fetching', async () => {
    mockUseAccount.mockReturnValue({ address: TEST_ADDRESS, isConnected: true })
    mockGetKarmaBalance.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(100n), 100)),
    )
    mockGetKarmaTier.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(3), 100)),
    )

    const { result } = renderHook(() => useMyKarma())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.total).toBe(100)
    expect(result.current.tier.label).toBe('Basic')
  })

  it('handles zero karma balance from chain', async () => {
    mockUseAccount.mockReturnValue({ address: TEST_ADDRESS, isConnected: true })
    mockGetKarmaBalance.mockResolvedValue(0n)
    mockGetKarmaTier.mockResolvedValue(0)

    const { result } = renderHook(() => useMyKarma())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.total).toBe(0)
    expect(result.current.tier.label).toBe('—')
  })

  it('handles large karma values', async () => {
    mockUseAccount.mockReturnValue({ address: TEST_ADDRESS, isConnected: true })
    mockGetKarmaBalance.mockResolvedValue(100_000_000n)
    mockGetKarmaTier.mockResolvedValue(10)

    const { result } = renderHook(() => useMyKarma())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.total).toBe(100_000_000)
    expect(result.current.tier.label).toBe('Legendary')
  })

  it('reuses cached karma profile for the same address', async () => {
    mockUseAccount.mockReturnValue({ address: TEST_ADDRESS, isConnected: true })
    mockGetKarmaBalance.mockResolvedValue(5_000n)
    mockGetKarmaTier.mockResolvedValue(5)

    const first = renderHook(() => useMyKarma())
    await waitFor(() => expect(first.result.current.isLoading).toBe(false))

    const second = renderHook(() => useMyKarma())
    await waitFor(() => expect(second.result.current.isLoading).toBe(false))

    expect(mockGetKarmaBalance).toHaveBeenCalledTimes(1)
    expect(mockGetKarmaTier).toHaveBeenCalledTimes(1)
    expect(second.result.current.tier.label).toBe('Regular')
  })

  it('refetches when the connected wallet address changes', async () => {
    let currentAddress: string = TEST_ADDRESS
    mockUseAccount.mockImplementation(() => ({ address: currentAddress, isConnected: true }))
    mockGetKarmaBalance.mockImplementation(async (address) =>
      address === TEST_ADDRESS ? 5_000n : 1_000_000_000_000_000_000n,
    )
    mockGetKarmaTier.mockImplementation(async (address) => (address === TEST_ADDRESS ? 5 : 1))

    const { result, rerender } = renderHook(() => useMyKarma())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.tier.label).toBe('Regular')

    currentAddress = SECOND_TEST_ADDRESS
    rerender()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockGetKarmaBalance).toHaveBeenCalledWith(SECOND_TEST_ADDRESS)
    expect(mockGetKarmaTier).toHaveBeenCalledWith(SECOND_TEST_ADDRESS)
    expect(result.current.tier.label).toBe('Entry')
  })
})
