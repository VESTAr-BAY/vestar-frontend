export type BadgeVariant = 'live' | 'hot' | 'new' | 'end'

export interface HotVote {
  id: string
  emoji: string
  gradient: string
  org: string
  name: string
  count: string
  badge: BadgeVariant
}

export interface VoteListItem {
  id: string
  emoji: string
  emojiColor: string
  org: string
  name: string
  count: string
  badge: BadgeVariant
  deadline: string
  urgent: boolean
  verified?: boolean
}

export interface RankedCandidate extends Candidate {
  votes: number
  percentage: number
  rank: number
}

export interface VoteResultData {
  id: string
  title: string
  org: string
  verified: boolean
  emoji: string
  endDate: string
  totalVotes: number
  rankedCandidates: RankedCandidate[]
}

export interface Candidate {
  id: string
  name: string
  group: string
  emoji: string
  emojiColor: string
  votes?: number
  percentage?: number
  votePreviewPct?: number
}

export interface VoteSection {
  id: string
  name: string
  candidates: Candidate[]
}

export interface VoteDetailData {
  id: string
  title: string
  org: string
  verified: boolean
  emoji: string
  badge: BadgeVariant
  deadlineLabel: string
  urgent: boolean
  startDate: string
  endDate: string
  endDateISO: string
  resultReveal: string
  maxChoices: number
  participantCount: number
  goalVotes: number
  voteFrequency: string
  voteLimit: string
  resultPublic: boolean
  candidates: Candidate[]
  sections?: VoteSection[] // present = grouped vote mode
}
