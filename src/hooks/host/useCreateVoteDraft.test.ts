import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { preparePrivateElection } from '../../api/elections'
import {
  createJsonArtifact,
  uploadFileToPinata,
  uploadJsonArtifactToPinata,
} from '../../utils/ipfs'
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

vi.mock('../../api/elections', async () => {
  const actual = await vi.importActual<typeof import('../../api/elections')>('../../api/elections')
  return {
    ...actual,
    preparePrivateElection: vi.fn().mockResolvedValue({
      publicKey: {
        format: 'pem',
        algorithm: 'ECDH-P256',
        value: 'mock-public-key',
      },
      privateKeyCommitmentHash: '0x1234',
    }),
  }
})

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
  const createJsonArtifactMock = vi.mocked(createJsonArtifact)
  const uploadFileToPinataMock = vi.mocked(uploadFileToPinata)
  const uploadJsonArtifactToPinataMock = vi.mocked(uploadJsonArtifactToPinata)
  const preparePrivateElectionMock = vi.mocked(preparePrivateElection)

  beforeEach(() => {
    createJsonArtifactMock.mockReset()
    uploadFileToPinataMock.mockReset()
    uploadJsonArtifactToPinataMock.mockReset()
    preparePrivateElectionMock.mockClear()

    createJsonArtifactMock.mockImplementation((fileName, body) => ({
      body,
      file: new File([JSON.stringify(body)], fileName, { type: 'application/json' }),
      rawJson: JSON.stringify(body),
      hash: '0xabc123',
    }))

    uploadFileToPinataMock.mockResolvedValue({
      cid: 'bafy-image',
      uri: 'ipfs://bafy-image',
      gatewayUrl: 'https://gateway.test/ipfs/bafy-image',
    })

    uploadJsonArtifactToPinataMock.mockResolvedValue({
      cid: 'bafy-manifest',
      uri: 'ipfs://bafy-manifest',
      gatewayUrl: 'https://gateway.test/ipfs/bafy-manifest',
      body: {},
      rawJson: '{}',
      hash: '0xabc123',
    })
  })

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

  it('starts preparing manifest uploads in the background once step 3 is valid', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useCreateVoteDraft())

    act(() => result.current.updateField('title', 'MAMA 2026'))
    act(() => result.current.nextStep())
    act(() => result.current.updateField('electionTitle', '남자 그룹 인기상'))

    const [first, second] = result.current.draft.candidates
    act(() => result.current.updateCandidate(first.id, 'name', '아티스트A'))
    act(() => result.current.updateCandidate(second.id, 'name', '아티스트B'))
    act(() => result.current.nextStep())

    expect(result.current.step).toBe(3)
    expect(uploadJsonArtifactToPinataMock).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })

    expect(uploadJsonArtifactToPinataMock).toHaveBeenCalledTimes(1)
    expect(preparePrivateElectionMock).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('invalidates prepared uploads when step 3 settings change', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useCreateVoteDraft())

    act(() => result.current.updateField('title', 'MAMA 2026'))
    act(() => result.current.nextStep())
    act(() => result.current.updateField('electionTitle', '남자 그룹 인기상'))

    const [first, second] = result.current.draft.candidates
    act(() => result.current.updateCandidate(first.id, 'name', '아티스트A'))
    act(() => result.current.updateCandidate(second.id, 'name', '아티스트B'))
    act(() => result.current.nextStep())

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })

    expect(uploadJsonArtifactToPinataMock).toHaveBeenCalledTimes(1)

    act(() => result.current.updateField('maxChoices', 2))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })

    expect(uploadJsonArtifactToPinataMock).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('keeps section policies synchronized by default', () => {
    const { result } = renderHook(() => useCreateVoteDraft())

    act(() => result.current.updateField('title', 'MAMA 2026'))
    act(() => result.current.addSection())
    act(() => result.current.addSection())

    const [firstSection, secondSection] = result.current.draft.sections

    act(() => result.current.updateSectionField(firstSection.id, 'ballotPolicy', 'ONE_PER_INTERVAL'))

    expect(result.current.draft.sections[0].ballotPolicy).toBe('ONE_PER_INTERVAL')
    expect(result.current.draft.sections[1].ballotPolicy).toBe('ONE_PER_INTERVAL')

    act(() => result.current.updateSectionField(secondSection.id, 'resetIntervalUnit', 'DAY'))

    expect(result.current.draft.sections[0].resetIntervalUnit).toBe('DAY')
    expect(result.current.draft.sections[1].resetIntervalUnit).toBe('DAY')
    expect(result.current.draft.sections[0].id).toBe(firstSection.id)
    expect(result.current.draft.sections[1].id).toBe(secondSection.id)
  })

  it('allows section policies to diverge when unification is turned off', () => {
    const { result } = renderHook(() => useCreateVoteDraft())

    act(() => result.current.addSection())
    act(() => result.current.addSection())
    act(() => result.current.updateField('sectionPolicyUnified', false))

    const [firstSection, secondSection] = result.current.draft.sections

    act(() => result.current.updateSectionField(firstSection.id, 'ballotPolicy', 'ONE_PER_INTERVAL'))

    expect(result.current.draft.sections[0].ballotPolicy).toBe('ONE_PER_INTERVAL')
    expect(result.current.draft.sections[1].ballotPolicy).toBe('ONE_PER_ELECTION')

    act(() => result.current.updateSectionField(secondSection.id, 'visibilityMode', 'OPEN'))

    expect(result.current.draft.sections[0].visibilityMode).toBe('PRIVATE')
    expect(result.current.draft.sections[1].visibilityMode).toBe('OPEN')
  })

  it('immediately applies section 1 policy to every section when unification is turned back on', () => {
    const { result } = renderHook(() => useCreateVoteDraft())

    act(() => result.current.addSection())
    act(() => result.current.addSection())
    act(() => result.current.updateField('sectionPolicyUnified', false))

    const [firstSection, secondSection] = result.current.draft.sections

    act(() => result.current.updateSectionField(firstSection.id, 'ballotPolicy', 'ONE_PER_INTERVAL'))
    act(() => result.current.updateSectionField(firstSection.id, 'resetIntervalUnit', 'DAY'))
    act(() => result.current.updateSectionField(secondSection.id, 'visibilityMode', 'OPEN'))
    act(() => result.current.updateSectionField(secondSection.id, 'paymentMode', 'PAID'))

    act(() => result.current.updateField('sectionPolicyUnified', true))

    expect(result.current.draft.sections[0].ballotPolicy).toBe('ONE_PER_INTERVAL')
    expect(result.current.draft.sections[1].ballotPolicy).toBe('ONE_PER_INTERVAL')
    expect(result.current.draft.sections[0].resetIntervalUnit).toBe('DAY')
    expect(result.current.draft.sections[1].resetIntervalUnit).toBe('DAY')
    expect(result.current.draft.sections[0].visibilityMode).toBe('PRIVATE')
    expect(result.current.draft.sections[1].visibilityMode).toBe('PRIVATE')
    expect(result.current.draft.sections[0].paymentMode).toBe('FREE')
    expect(result.current.draft.sections[1].paymentMode).toBe('FREE')
    expect(result.current.draft.sections[0].id).toBe(firstSection.id)
    expect(result.current.draft.sections[1].id).toBe(secondSection.id)
  })
})
