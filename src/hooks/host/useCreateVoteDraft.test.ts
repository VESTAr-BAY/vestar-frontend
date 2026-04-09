import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useCreateVoteDraft } from './useCreateVoteDraft'

vi.mock('wagmi', () => ({
  useAccount: () => ({ address: undefined, isConnected: false }),
  useChainId: () => 0,
  useWalletClient: () => ({ data: undefined }),
  useSwitchChain: () => ({ switchChainAsync: vi.fn() }),
}))

vi.mock('../../config/api', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

vi.mock('../../api/verifiedOrganizers', () => ({
  fetchVerifiedOrganizerByWallet: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../contracts/vestar/client', () => ({
  vestarFactory: {
    createElection: vi.fn(),
  },
  vestarUtils: {
    waitForReceipt: vi.fn(),
  },
}))

vi.mock('../../utils/ipfs', () => ({
  uploadJsonToPinata: vi.fn(),
}))

describe('useCreateVoteDraft', () => {
  it('initializes at step 1 with private visibility and two empty candidates', () => {
    const { result } = renderHook(() => useCreateVoteDraft())

    expect(result.current.step).toBe(1)
    expect(result.current.draft.visibilityMode).toBe('PRIVATE')
    expect(result.current.draft.candidates).toHaveLength(2)
    expect(result.current.draft.group).toBe('')
  })

  it('step 1 becomes valid when title is filled', () => {
    const { result } = renderHook(() => useCreateVoteDraft())

    act(() => result.current.updateField('title', 'MAMA 2026'))

    expect(result.current.isCurrentStepValid).toBe(true)
  })

  it('nextStep does not advance while current step is invalid', () => {
    const { result } = renderHook(() => useCreateVoteDraft())

    act(() => result.current.nextStep())

    expect(result.current.step).toBe(1)
  })

  it('step 2 requires unique named candidates', () => {
    const { result } = renderHook(() => useCreateVoteDraft())

    act(() => result.current.updateField('title', 'MAMA 2026'))
    act(() => result.current.nextStep())
    act(() => result.current.updateField('electionTitle', '남자 그룹 인기상'))

    const [first, second] = result.current.draft.candidates
    act(() => result.current.updateCandidate(first.id, 'name', '아티스트A'))
    act(() => result.current.updateCandidate(second.id, 'name', '아티스트A'))

    expect(result.current.isCurrentStepValid).toBe(false)
  })

  it('unlimited paid voting forces paid single-choice configuration', () => {
    const { result } = renderHook(() => useCreateVoteDraft())

    act(() => result.current.updateField('ballotPolicy', 'UNLIMITED_PAID'))
    act(() => result.current.updateField('paymentMode', 'PAID'))
    act(() => result.current.updateField('costPerBallotEth', '100'))
    act(() => result.current.updateField('maxChoices', 1))

    expect(result.current.draft.paymentMode).toBe('PAID')
    expect(result.current.draft.costPerBallotEth).toBe('100')
    expect(result.current.draft.maxChoices).toBe(1)
  })
})
