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
  createJsonArtifact: vi.fn(),
  uploadFileToPinata: vi.fn(),
  uploadJsonArtifactToPinata: vi.fn(),
}))

describe('useCreateVoteDraft', () => {
  it('initializes at step 1 with private visibility and two empty candidates', () => {
    const { result } = renderHook(() => useCreateVoteDraft())

    expect(result.current.step).toBe(1)
    expect(result.current.draft.visibilityMode).toBe('PRIVATE')
    expect(result.current.draft.sectionPolicyUnified).toBe(true)
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

    expect(result.current.draft.paymentMode).toBe('PAID')
    expect(result.current.draft.costPerBallotEth).toBe('0.066')
    expect(result.current.draft.maxChoices).toBe(1)
  })

  it('open voting keeps result reveal aligned with end date', () => {
    const { result } = renderHook(() => useCreateVoteDraft())

    act(() => result.current.updateField('endDate', '2026-04-09T12:00'))
    act(() => result.current.updateField('visibilityMode', 'OPEN'))

    expect(result.current.draft.resultRevealAt).toBe('2026-04-09T12:00')
  })

  it('standard paid voting fixes cost per ballot to 100', () => {
    const { result } = renderHook(() => useCreateVoteDraft())

    act(() => result.current.updateField('paymentMode', 'PAID'))

    expect(result.current.draft.costPerBallotEth).toBe('100')
  })

  it('syncs all section settings from section 1 when section policy unified is on', () => {
    const { result } = renderHook(() => useCreateVoteDraft())

    act(() => {
      result.current.addSection()
      result.current.addSection()
    })

    const [firstSection, secondSection] = result.current.draft.sections

    act(() =>
      result.current.updateSectionField(firstSection.id, 'ballotPolicy', 'ONE_PER_INTERVAL'),
    )
    act(() => result.current.updateSectionField(firstSection.id, 'resetIntervalValue', '6'))
    act(() => result.current.updateSectionField(firstSection.id, 'resetIntervalUnit', 'HOUR'))
    act(() => result.current.updateSectionField(firstSection.id, 'visibilityMode', 'OPEN'))

    const syncedSecondSection =
      result.current.draft.sections.find((section) => section.id === secondSection.id) ??
      secondSection

    expect(syncedSecondSection.ballotPolicy).toBe('ONE_PER_INTERVAL')
    expect(syncedSecondSection.resetIntervalValue).toBe('6')
    expect(syncedSecondSection.resetIntervalUnit).toBe('HOUR')
    expect(syncedSecondSection.visibilityMode).toBe('OPEN')
    expect(syncedSecondSection.resultRevealAt).toBe(syncedSecondSection.endDate)
  })

  it('keeps per-section settings independent when section policy unified is off', () => {
    const { result } = renderHook(() => useCreateVoteDraft())

    act(() => {
      result.current.addSection()
      result.current.addSection()
      result.current.updateField('sectionPolicyUnified', false)
    })

    const [firstSection, secondSection] = result.current.draft.sections

    act(() =>
      result.current.updateSectionField(firstSection.id, 'ballotPolicy', 'ONE_PER_INTERVAL'),
    )

    const untouchedSecondSection =
      result.current.draft.sections.find((section) => section.id === secondSection.id) ??
      secondSection

    expect(untouchedSecondSection.ballotPolicy).toBe('ONE_PER_ELECTION')
  })
})
