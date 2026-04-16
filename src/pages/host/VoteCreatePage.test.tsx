import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VoteCreatePage } from './VoteCreatePage'

const mockAddToast = vi.fn()
const mockNavigateBack = vi.fn()
const mockResetDisplayUri = vi.fn()
const mockOpenFeePrompt = vi.fn()
const mockSubmit = vi.fn()
const mockEstimateFeePreview = vi.fn()

vi.mock('../../providers/LanguageProvider', () => ({
  useLanguage: () => ({
    lang: 'en',
  }),
}))

vi.mock('../../providers/ToastProvider', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}))

vi.mock('../../hooks/useSmartBackNavigation', () => ({
  useSmartBackNavigation: () => mockNavigateBack,
}))

vi.mock('../../hooks/useMetaMaskDisplayUri', () => ({
  useMetaMaskDisplayUri: () => ({
    displayUri: null,
    resetDisplayUri: mockResetDisplayUri,
  }),
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

vi.mock('../../hooks/host/useCreateVoteDraft', () => ({
  useCreateVoteDraft: () => ({
    draft: {
      title: 'Series',
      electionTitle: 'Election',
      sections: [],
    },
    step: 3,
    isCurrentStepValid: true,
    currentStepValidationMessage: null,
    submissionProgress: {
      stage: 'preparing',
      current: 0,
      total: 0,
      currentTitle: null,
    },
    updateField: vi.fn(),
    addCandidate: vi.fn(),
    removeCandidate: vi.fn(),
    updateCandidate: vi.fn(),
    addSection: vi.fn(),
    removeSection: vi.fn(),
    updateSectionName: vi.fn(),
    updateSectionCoverImage: vi.fn(),
    updateSectionField: vi.fn(),
    addCandidateToSection: vi.fn(),
    removeCandidateFromSection: vi.fn(),
    updateSectionCandidate: vi.fn(),
    clearSections: vi.fn(),
    nextStep: vi.fn(),
    prevStep: vi.fn(),
    estimateFeePreview: mockEstimateFeePreview,
    submit: mockSubmit,
    isSubmitting: false,
  }),
}))

vi.mock('./steps/StepBasicInfo', () => ({
  StepBasicInfo: () => <div>Basic</div>,
}))

vi.mock('./steps/StepCandidates', () => ({
  StepCandidates: () => <div>Candidates</div>,
}))

vi.mock('./steps/StepSchedule', () => ({
  StepSchedule: () => <div>Schedule</div>,
}))

vi.mock('../../components/shared/StatusFeePromptModal', () => ({
  StatusFeePromptModal: () => null,
}))

describe('VoteCreatePage', () => {
  beforeEach(() => {
    mockAddToast.mockReset()
    mockNavigateBack.mockReset()
    mockResetDisplayUri.mockReset()
    mockOpenFeePrompt.mockReset()
    mockSubmit.mockReset()
    mockEstimateFeePreview.mockReset()
  })

  it('opens the fee prompt before submitting vote creation', () => {
    render(
      <MemoryRouter>
        <VoteCreatePage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Create Vote' }))

    expect(mockResetDisplayUri).toHaveBeenCalledTimes(1)
    expect(mockOpenFeePrompt).toHaveBeenCalledTimes(1)
    expect(mockSubmit).not.toHaveBeenCalled()

    const [config] = mockOpenFeePrompt.mock.calls[0]
    expect(config.estimate).toBe(mockEstimateFeePreview)
    expect(config.title).toBe('Fee Notice')
  })
})
