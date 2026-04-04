export type ResultReveal = 'immediate' | 'after_end'
export type CreateStep = 1 | 2 | 3

export interface CandidateDraft {
  id: string
  name: string
  group: string
  emoji: string
  emojiColor: string
}

export interface VoteCreateDraft {
  title: string
  org: string
  emoji: string
  category: string
  candidates: CandidateDraft[]
  startDate: string
  endDate: string
  maxChoices: 1 | 2 | 3
  resultReveal: ResultReveal
}
