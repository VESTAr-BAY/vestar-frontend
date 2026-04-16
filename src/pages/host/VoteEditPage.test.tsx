import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VoteEditPage } from './VoteEditPage'

const {
  languageState,
  mockNavigate,
  mockNavigateBack,
  mockAddToast,
  mockSubmit,
  mockUseEditVoteDraft,
} = vi.hoisted(() => ({
  languageState: { lang: 'en' as 'en' | 'ko' },
  mockNavigate: vi.fn(),
  mockNavigateBack: vi.fn(),
  mockAddToast: vi.fn(),
  mockSubmit: vi.fn(),
  mockUseEditVoteDraft: vi.fn(),
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')

  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1412' }),
  }
})

vi.mock('../../hooks/host/useEditVoteDraft', () => ({
  useEditVoteDraft: (id: string) => mockUseEditVoteDraft(id),
}))

vi.mock('../../hooks/useSmartBackNavigation', () => ({
  useSmartBackNavigation: () => mockNavigateBack,
}))

vi.mock('../../providers/LanguageProvider', () => ({
  useLanguage: () => ({
    lang: languageState.lang,
  }),
}))

vi.mock('../../providers/ToastProvider', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}))

vi.mock('./steps/StepBasicInfo', () => ({
  StepBasicInfo: () => <div>StepBasicInfo</div>,
}))

vi.mock('./steps/StepCandidates', () => ({
  StepCandidates: () => <div>StepCandidates</div>,
}))

describe('VoteEditPage', () => {
  beforeEach(() => {
    languageState.lang = 'en'
    mockNavigate.mockReset()
    mockNavigateBack.mockReset()
    mockAddToast.mockReset()
    mockSubmit.mockReset()
    mockUseEditVoteDraft.mockReset()
    mockSubmit.mockResolvedValue(undefined)
  })

  it('renders English step labels and navigation copy', () => {
    mockUseEditVoteDraft.mockReturnValue({
      isLoading: false,
      initialDraft: null,
      draft: {
        electionTitle: 'Vote title',
        electionCoverImage: null,
        candidates: [],
        sections: [],
      },
      step: 1,
      isCurrentStepValid: true,
      hasChanges: false,
      updateField: vi.fn(),
      addCandidate: vi.fn(),
      removeCandidate: vi.fn(),
      updateCandidate: vi.fn(),
      addSection: vi.fn(),
      removeSection: vi.fn(),
      updateSectionName: vi.fn(),
      updateSectionCoverImage: vi.fn(),
      addCandidateToSection: vi.fn(),
      removeCandidateFromSection: vi.fn(),
      updateSectionCandidate: vi.fn(),
      clearSections: vi.fn(),
      nextStep: vi.fn(),
      prevStep: vi.fn(),
      submit: mockSubmit,
      isSubmitting: false,
    })

    render(<VoteEditPage />)

    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument()
    expect(screen.getByText('Basic Info')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next Step' })).toBeInTheDocument()
  })

  it('shows an English success toast after saving changes', async () => {
    mockUseEditVoteDraft.mockReturnValue({
      isLoading: false,
      initialDraft: null,
      draft: {
        electionTitle: 'Vote title',
        electionCoverImage: null,
        candidates: [],
        sections: [],
      },
      step: 2,
      isCurrentStepValid: true,
      hasChanges: true,
      updateField: vi.fn(),
      addCandidate: vi.fn(),
      removeCandidate: vi.fn(),
      updateCandidate: vi.fn(),
      addSection: vi.fn(),
      removeSection: vi.fn(),
      updateSectionName: vi.fn(),
      updateSectionCoverImage: vi.fn(),
      addCandidateToSection: vi.fn(),
      removeCandidateFromSection: vi.fn(),
      updateSectionCandidate: vi.fn(),
      clearSections: vi.fn(),
      nextStep: vi.fn(),
      prevStep: vi.fn(),
      submit: mockSubmit,
      isSubmitting: false,
    })

    render(<VoteEditPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1)
    })

    expect(mockAddToast).toHaveBeenCalledWith({
      type: 'success',
      message: 'Vote updated successfully.',
    })
    expect(mockNavigate).toHaveBeenCalledWith('/host/manage/1412')
  })
})
