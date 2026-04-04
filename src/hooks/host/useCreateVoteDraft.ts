import { useCallback, useState } from 'react'
import type { CandidateDraft, CreateStep, VoteCreateDraft } from '../../types/host'

const EMOJI_COLORS = ['#F0EDFF', '#fef3c7', '#fce7f3', '#ede9fe', '#e0f2fe', '#dcfce7', '#fff1f2', '#e8f0ff']

let _counter = 3

function makeId(): string {
  return String(_counter++)
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
  startDate: '',
  endDate: '',
  maxChoices: 1,
  resultReveal: 'after_end',
}

function isStep1Valid(draft: VoteCreateDraft): boolean {
  return draft.title.trim().length > 0 && draft.org.trim().length > 0
}

function isStep2Valid(draft: VoteCreateDraft): boolean {
  return (
    draft.candidates.length >= 2 &&
    draft.candidates.every((c) => c.name.trim().length > 0)
  )
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
  addCandidate: () => void
  removeCandidate: (id: string) => void
  updateCandidate: (id: string, field: keyof Omit<CandidateDraft, 'id'>, value: string) => void
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

  const updateField = useCallback(<K extends keyof VoteCreateDraft>(
    key: K,
    value: VoteCreateDraft[K],
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }, [])

  const addCandidate = useCallback(() => {
    setDraft((prev) => {
      const colorIdx = prev.candidates.length % EMOJI_COLORS.length
      const newCandidate: CandidateDraft = {
        id: makeId(),
        name: '',
        group: '',
        emoji: '🎵',
        emojiColor: EMOJI_COLORS[colorIdx],
      }
      return { ...prev, candidates: [...prev.candidates, newCandidate] }
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
        candidates: prev.candidates.map((c) =>
          c.id === id ? { ...c, [field]: value } : c,
        ),
      }))
    },
    [],
  )

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
    nextStep,
    prevStep,
    submit,
    isSubmitting,
  }
}
