export type ResultReveal = 'immediate' | 'after_end'
export type CreateStep = 1 | 2 | 3

export interface CandidateDraft {
  id: string
  name: string
  group: string
  emoji: string
  emojiColor: string
}

export interface SectionDraft {
  id: string
  name: string // "남자 그룹", "여자 그룹", etc.
  candidates: CandidateDraft[]
}

export interface VoteCreateDraft {
  title: string
  org: string
  emoji: string
  category: string
  candidates: CandidateDraft[]
  sections: SectionDraft[] // empty = flat mode (default)
  startDate: string
  endDate: string
  maxChoices: 1 | 2 | 3
  resultReveal: ResultReveal
}
