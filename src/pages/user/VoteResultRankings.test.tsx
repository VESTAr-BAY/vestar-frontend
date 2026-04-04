import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { RankedCandidate } from '../../types/vote'
import { VoteResultRankings } from './VoteResultRankings'

const mockRanked: RankedCandidate[] = [
  { id: '1', name: 'NewJeans', group: '어도어', emoji: '🍀', emojiColor: '#dcfce7', votes: 8934, percentage: 35.9, rank: 1 },
  { id: '2', name: 'BTS', group: '빅히트 뮤직', emoji: '👑', emojiColor: '#fef3c7', votes: 6721, percentage: 27.0, rank: 2 },
  { id: '3', name: 'aespa', group: 'SM 엔터테인먼트', emoji: '🌌', emojiColor: '#ede9fe', votes: 4203, percentage: 16.9, rank: 3 },
]

describe('VoteResultRankings', () => {
  it('renders all candidates', () => {
    render(<VoteResultRankings rankedCandidates={mockRanked} />)
    expect(screen.getByText('NewJeans')).toBeInTheDocument()
    expect(screen.getByText('BTS')).toBeInTheDocument()
    expect(screen.getByText('aespa')).toBeInTheDocument()
  })

  it('renders rank numbers', () => {
    render(<VoteResultRankings rankedCandidates={mockRanked} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders percentage for each candidate', () => {
    render(<VoteResultRankings rankedCandidates={mockRanked} />)
    expect(screen.getByText('35.9%')).toBeInTheDocument()
    expect(screen.getByText('27.0%')).toBeInTheDocument()
    expect(screen.getByText('16.9%')).toBeInTheDocument()
  })

  it('renders vote counts', () => {
    render(<VoteResultRankings rankedCandidates={mockRanked} />)
    expect(screen.getByText('8,934표')).toBeInTheDocument()
    expect(screen.getByText('6,721표')).toBeInTheDocument()
  })

  it('renders candidates in rank order (rank 1 first)', () => {
    render(<VoteResultRankings rankedCandidates={[...mockRanked].reverse()} />)
    const names = screen.getAllByTestId('candidate-name').map((el) => el.textContent)
    expect(names[0]).toBe('NewJeans')
    expect(names[1]).toBe('BTS')
    expect(names[2]).toBe('aespa')
  })
})
