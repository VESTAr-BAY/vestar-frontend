import { useCallback, useEffect, useState } from 'react'
import type { CandidateDraft, CreateStep, VoteCreateDraft } from '../../types/host'
import { useVoteDetail } from '../user/useVoteDetail'

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

let _counter = 100

function makeId(): string {
  return String(_counter++)
}

const INITIAL_DRAFT: VoteCreateDraft = {
  title: '',
  org: '',
  emoji: '🎤',
  category: '음악방송',
  candidates: [],
  startDate: '',
  endDate: '',
  maxChoices: 1,
  resultReveal: 'after_end',
}

function isStep1Valid(draft: VoteCreateDraft): boolean {
  return draft.title.trim().length > 0 && draft.org.trim().length > 0
}

function isStep2Valid(draft: VoteCreateDraft): boolean {
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
        org: vote.org,
        emoji: vote.emoji,
        category: '음악방송', // Mock data default
        candidates: vote.candidates.map(c => ({
          id: c.id,
          name: c.name,
          group: c.group || '',
          emoji: c.emoji || '🎵',
          emojiColor: c.emojiColor || EMOJI_COLORS[0],
        })),
        startDate: vote.startDate || '',
        endDate: vote.endDate || '',
        maxChoices: vote.maxChoices || 1,
        resultReveal: vote.resultPublic ? 'immediate' : 'after_end',
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
        candidates: prev.candidates.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
      }))
    },
    [],
  )

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
    // TODO: 컨트랙트 또는 백엔드와 소통하여 실제 투표 내용을 수정하는 로직 구현
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
    nextStep,
    prevStep,
    submit,
    isSubmitting,
  }
}
