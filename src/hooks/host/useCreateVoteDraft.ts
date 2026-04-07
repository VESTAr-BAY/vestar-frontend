import { useCallback, useState } from 'react'
import type { CandidateDraft, CreateStep, SectionDraft, VoteCreateDraft } from '../../types/host'

const EMOJI_COLORS = [
  '#F0EDFF',
  '#fef3c7',
  '#fce7f3',
  '#ede9fe',
  '#e0f2fe',
  '#dcfce7',
  '#fff1f2',
  '#e8f0ff',
]

let _counter = 3

function makeId(): string {
  return String(_counter++)
}

function makeBlankCandidate(colorIdx: number): CandidateDraft {
  return {
    id: makeId(),
    name: '',
    group: '',
    emoji: '🎵',
    emojiColor: EMOJI_COLORS[colorIdx % EMOJI_COLORS.length],
  }
}

const INITIAL_DRAFT: VoteCreateDraft = {
  title: '',
  org: '',
  emoji: '🎤',
  category: '음악방송',
  candidates: [
    { id: '1', name: '', group: '', emoji: '🎵', emojiColor: EMOJI_COLORS[0] },
    { id: '2', name: '', group: '', emoji: '🎵', emojiColor: EMOJI_COLORS[1] },
  ],
  sections: [],
  startDate: '',
  endDate: '',
  maxChoices: 1,
  resultReveal: 'after_end',
}

function isStep1Valid(draft: VoteCreateDraft): boolean {
  return draft.title.trim().length > 0 && draft.org.trim().length > 0
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

function isStep3Valid(draft: VoteCreateDraft): boolean {
  return draft.startDate.trim().length > 0 && draft.endDate.trim().length > 0
}

function validateStep(step: CreateStep, draft: VoteCreateDraft): boolean {
  if (step === 1) return isStep1Valid(draft)
  if (step === 2) return isStep2Valid(draft)
  return isStep3Valid(draft)
}

export interface UseCreateVoteDraftResult {
  draft: VoteCreateDraft
  step: CreateStep
  isCurrentStepValid: boolean
  updateField: <K extends keyof VoteCreateDraft>(key: K, value: VoteCreateDraft[K]) => void
  // Flat candidate actions
  addCandidate: () => void
  removeCandidate: (id: string) => void
  updateCandidate: (id: string, field: keyof Omit<CandidateDraft, 'id'>, value: string) => void
  // Section actions
  addSection: () => void
  removeSection: (sectionId: string) => void
  updateSectionName: (sectionId: string, name: string) => void
  addCandidateToSection: (sectionId: string) => void
  removeCandidateFromSection: (sectionId: string, candidateId: string) => void
  updateSectionCandidate: (
    sectionId: string,
    candidateId: string,
    field: keyof Omit<CandidateDraft, 'id'>,
    value: string,
  ) => void
  clearSections: () => void
  nextStep: () => void
  prevStep: () => void
  submit: () => Promise<void>
  isSubmitting: boolean
}

export function useCreateVoteDraft(): UseCreateVoteDraftResult {
  const [draft, setDraft] = useState<VoteCreateDraft>(INITIAL_DRAFT)
  const [step, setStep] = useState<CreateStep>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isCurrentStepValid = validateStep(step, draft)

  const updateField = useCallback(
    <K extends keyof VoteCreateDraft>(key: K, value: VoteCreateDraft[K]) => {
      setDraft((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  // ── Flat candidate actions ────────────────────────────────────────────────

  const addCandidate = useCallback(() => {
    setDraft((prev) => {
      const colorIdx = prev.candidates.length % EMOJI_COLORS.length
      return { ...prev, candidates: [...prev.candidates, makeBlankCandidate(colorIdx)] }
    })
  }, [])

  const removeCandidate = useCallback((id: string) => {
    setDraft((prev) => ({
      ...prev,
      candidates: prev.candidates.filter((c) => c.id !== id),
    }))
  }, [])

  const updateCandidate = useCallback(
    (id: string, field: keyof Omit<CandidateDraft, 'id'>, value: string) => {
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
        candidates: [makeBlankCandidate(0), makeBlankCandidate(1)],
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
        return { ...s, candidates: [...s.candidates, makeBlankCandidate(s.candidates.length)] }
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
      value: string,
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

  // ── Navigation ────────────────────────────────────────────────────────────

  const nextStep = useCallback(() => {
    setStep((prev) => {
      if (!validateStep(prev, draft)) return prev
      return Math.min(prev + 1, 3) as CreateStep
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
    draft,
    step,
    isCurrentStepValid,
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
