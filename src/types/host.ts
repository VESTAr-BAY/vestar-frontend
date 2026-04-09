export type ResultReveal = 'immediate' | 'after_end'
export type VoteVisibilityMode = 'OPEN' | 'PRIVATE'
export type VoteBallotPolicy = 'ONE_PER_ELECTION' | 'ONE_PER_INTERVAL' | 'UNLIMITED_PAID'
export type VotePaymentMode = 'FREE' | 'PAID'
export type VoteResetIntervalUnit = 'MINUTE' | 'HOUR' | 'DAY'
export type CreateStep = 1 | 2 | 3

export interface ElectionSettingsDraft {
  startDate: string
  endDate: string
  resultRevealAt: string
  maxChoices: number
  visibilityMode: VoteVisibilityMode
  ballotPolicy: VoteBallotPolicy
  paymentMode: VotePaymentMode
  costPerBallotEth: string
  minKarmaTier: string
  resetIntervalValue: string
  resetIntervalUnit: VoteResetIntervalUnit
  resultReveal: ResultReveal
}

export interface CandidateDraft {
  id: string
  name: string
  image: string
  imageFile?: File | null
}

export interface SectionDraft extends ElectionSettingsDraft {
  id: string
  name: string
  candidates: CandidateDraft[]
}

export interface VoteCreateDraft extends ElectionSettingsDraft {
  title: string
  electionTitle: string
  group: string
  bannerImage: string
  bannerImageFile?: File | null
  category: string
  candidates: CandidateDraft[]
  sections: SectionDraft[]
}
