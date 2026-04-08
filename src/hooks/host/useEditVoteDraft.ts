import { useCallback, useEffect, useState } from 'react'
import type { CandidateDraft, CreateStep, SectionDraft, VoteCreateDraft } from '../../types/host'
import { useVoteDetail } from '../user/useVoteDetail'

let _counter = 100

function makeId(): string {
  return String(_counter++)
}

function makeBlankCandidate(): CandidateDraft {
  return {
    id: makeId(),
    name: '',
    image: '',
    imageFile: null,
  }
}

const INITIAL_DRAFT: VoteCreateDraft = {
  title: '',
  group: '',
  bannerImage: '',
  bannerImageFile: null,
  category: '음악방송',
  visibility: 'PRIVATE',
  candidates: [],
  sections: [],
  startDate: '',
  endDate: '',
  revealDate: '',
  maxChoices: 1,
  resultReveal: 'after_end',
  votePolicy: 'ONE_TIME',
  resetIntervalValue: 1,
  resetIntervalUnit: 'days',
  paymentType: 'FREE',
  costPerBallot: 0,
  minKarmaTier: 0,
}

function isStep1Valid(draft: VoteCreateDraft): boolean {
  return draft.title.trim().length > 0
}

function isStep2Valid(draft: VoteCreateDraft): boolean {
  if (draft.sections.length > 0) {
    return draft.sections.every(
      (s) =>
        s.name.trim().length > 0 &&
        s.candidates.length >= 2 &&
        s.candidates.every((c) => c.name.trim().length > 0),
    )
  }
  return draft.candidates.length >= 2 && draft.candidates.every((c) => c.name.trim().length > 0)
}

function validateStep(step: CreateStep, draft: VoteCreateDraft): boolean {
  if (step === 1) return isStep1Valid(draft)
  return isStep2Valid(draft)
}

export function useEditVoteDraft(id: string) {
  const { vote, isLoading } = useVoteDetail(id)
  
  const [initialDraft, setInitialDraft] = useState<VoteCreateDraft | null>(null)
  const [draft, setDraft] = useState<VoteCreateDraft>(INITIAL_DRAFT)
  const [step, setStep] = useState<CreateStep>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (vote && !initialDraft) {
      const init: VoteCreateDraft = {
        title: vote.title,
        group: vote.org || '',
        bannerImage: '', // Mock doesn't have it
        bannerImageFile: null,
        category: '음악방송',
        visibility: 'PRIVATE',
        candidates: vote.candidates.map(c => ({
          id: c.id,
          name: c.name,
          image: '',
          imageFile: null,
        })),
        sections: [],
        startDate: vote.startDate || '',
        endDate: vote.endDate || '',
        revealDate: vote.startDate || '', // Temporary
        maxChoices: vote.maxChoices || 1,
        resultReveal: vote.resultPublic ? 'immediate' : 'after_end',
        votePolicy: 'ONE_TIME',
        resetIntervalValue: 1,
        resetIntervalUnit: 'days',
        paymentType: 'FREE',
        costPerBallot: 0,
        minKarmaTier: 0,
      }
      setInitialDraft(init)
      setDraft(init)
    }
  }, [vote, initialDraft])

  const isCurrentStepValid = validateStep(step, draft)
  const hasChanges = initialDraft ? JSON.stringify(initialDraft) !== JSON.stringify(draft) : false

  const updateField = useCallback(
    <K extends keyof VoteCreateDraft>(key: K, value: VoteCreateDraft[K]) => {
      setDraft((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const addCandidate = useCallback(() => {
    setDraft((prev) => ({
      ...prev,
      candidates: [...prev.candidates, makeBlankCandidate()],
    }))
  }, [])

  const removeCandidate = useCallback((id: string) => {
    setDraft((prev) => ({
      ...prev,
      candidates: prev.candidates.filter((c) => c.id !== id),
    }))
  }, [])

  const updateCandidate = useCallback(
    (
      id: string,
      field: keyof Omit<CandidateDraft, 'id'>,
      value: CandidateDraft[keyof Omit<CandidateDraft, 'id'>],
    ) => {
      setDraft((prev) => ({
        ...prev,
        candidates: prev.candidates.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
      }))
    },
    [],
  )

  // ── Section actions ───────────────────────────────────────────────────────

  const addSection = useCallback(() => {
    setDraft((prev) => {
      const newSection: SectionDraft = {
        id: makeId(),
        name: '',
        candidates: [makeBlankCandidate(), makeBlankCandidate()],
      }
      return { ...prev, sections: [...prev.sections, newSection] }
    })
  }, [])

  const removeSection = useCallback((sectionId: string) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== sectionId),
    }))
  }, [])

  const updateSectionName = useCallback((sectionId: string, name: string) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, name } : s)),
    }))
  }, [])

  const addCandidateToSection = useCallback((sectionId: string) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s
        return { ...s, candidates: [...s.candidates, makeBlankCandidate()] }
      }),
    }))
  }, [])

  const removeCandidateFromSection = useCallback((sectionId: string, candidateId: string) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s
        return { ...s, candidates: s.candidates.filter((c) => c.id !== candidateId) }
      }),
    }))
  }, [])

  const updateSectionCandidate = useCallback(
    (
      sectionId: string,
      candidateId: string,
      field: keyof Omit<CandidateDraft, 'id'>,
      value: CandidateDraft[keyof Omit<CandidateDraft, 'id'>],
    ) => {
      setDraft((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id !== sectionId) return s
          return {
            ...s,
            candidates: s.candidates.map((c) =>
              c.id === candidateId ? { ...c, [field]: value } : c,
            ),
          }
        }),
      }))
    },
    [],
  )

  const clearSections = useCallback(() => {
    setDraft((prev) => ({ ...prev, sections: [] }))
  }, [])

  const nextStep = useCallback(() => {
    setStep((prev) => {
      if (!validateStep(prev, draft)) return prev
      return Math.min(prev + 1, 2) as CreateStep
    })
  }, [draft])

  const prevStep = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 1) as CreateStep)
  }, [])

  const submit = useCallback(async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSubmitting(false)
  }, [])

  return {
    isLoading: isLoading || !initialDraft,
    initialDraft,
    draft,
    step,
    isCurrentStepValid,
    hasChanges,
    updateField,
    addCandidate,
    removeCandidate,
    updateCandidate,
    addSection,
    removeSection,
    updateSectionName,
    addCandidateToSection,
    removeCandidateFromSection,
    updateSectionCandidate,
    clearSections,
    nextStep,
    prevStep,
    submit,
    isSubmitting,
  }
}
