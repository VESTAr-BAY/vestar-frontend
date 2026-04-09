import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { VoteDetailData } from '../../types/vote'
import { VoteInfoSection } from './VoteInfoSection'

const mockVote: VoteDetailData = {
  id: '1',
  title: '이번 주 1위는 누구?',
  org: 'Show! Music Core × Mubeat',
  host: 'MBC',
  verified: true,
  emoji: '🎤',
  badge: 'live',
  deadlineLabel: '2h 14m 남음',
  urgent: true,
  startDate: '2025.04.01 18:00',
  endDate: '2025.04.03 11:00',
  endDateISO: '2025-04-03T11:00:00+09:00',
  resultReveal: '종료 후 공개',
  maxChoices: 1,
  participantCount: 24891,
  goalVotes: 50000,
  voteFrequency: '매일 갱신',
  voteLimit: '1인 1표',
  resultPublic: false,
  candidates: [],
}

describe('VoteInfoSection', () => {
  it('renders the org row', () => {
    render(<VoteInfoSection vote={mockVote} />)
    expect(screen.getByText('주최')).toBeInTheDocument()
    expect(screen.getByText('Show! Music Core × Mubeat')).toBeInTheDocument()
  })

  it('renders start and end date rows', () => {
    render(<VoteInfoSection vote={mockVote} />)
    expect(screen.getByText('시작')).toBeInTheDocument()
    expect(screen.getByText('2025.04.01 18:00')).toBeInTheDocument()
    expect(screen.getByText('종료')).toBeInTheDocument()
    expect(screen.getByText('2025.04.03 11:00')).toBeInTheDocument()
  })

  it('renders result reveal row', () => {
    render(<VoteInfoSection vote={mockVote} />)
    expect(screen.getByText('결과 공개')).toBeInTheDocument()
    expect(screen.getByText('종료 후 공개')).toBeInTheDocument()
  })

  it('does NOT render gas fee row', () => {
    render(<VoteInfoSection vote={mockVote} />)
    expect(screen.queryByText('가스비')).not.toBeInTheDocument()
  })

  it('does NOT render any gas fee value text', () => {
    render(<VoteInfoSection vote={mockVote} />)
    expect(screen.queryByText(/⛽/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Status Network/)).not.toBeInTheDocument()
  })
})
