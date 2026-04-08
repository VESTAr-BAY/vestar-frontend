export type ResultReveal = 'immediate' | 'after_end'
export type CreateStep = 1 | 2 | 3 | 4
export type VoteVisibility = 'OPEN' | 'PRIVATE'

export interface CandidateDraft {
  id: string
  name: string
  image: string
  imageFile?: File | null
}

export type VotePolicy = 'ONE_TIME' | 'PERIODIC' | 'UNLIMITED'
export type VotePayment = 'FREE' | 'PAID'
export type IntervalUnit = 'days' | 'hours' | 'minutes'

export interface SectionDraft {
  id: string
  name: string // "남자 그룹", "여자 그룹", etc.
  candidates: CandidateDraft[]
}

export interface VoteCreateDraft {
  title: string
  group: string
  bannerImage: string
  bannerImageFile?: File | null
  category: string
  visibility: VoteVisibility
  candidates: CandidateDraft[]
  sections: SectionDraft[] // empty = flat mode (default)
  startDate: string
  endDate: string
  revealDate: string
  maxChoices: number
  resultReveal: ResultReveal
  votePolicy: VotePolicy
  resetIntervalValue: number
  resetIntervalUnit: IntervalUnit
  paymentType: VotePayment
  costPerBallot: number
  minKarmaTier: number
}
