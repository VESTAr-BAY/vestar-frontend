import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Candidate, VoteDetailData } from '../../types/vote'
import { VoteBottomSheetContent } from './VoteBottomSheetContent'

const mockVote: VoteDetailData = {
  id: '1',
  title: '이번 주 1위는 누구?',
  org: 'Show! Music Core',
  verified: true,
  emoji: '🎤',
  badge: 'live',
  deadlineLabel: '2h',
  urgent: true,
  startDate: '2025.04.01',
  endDate: '2025.04.03',
  endDateISO: '2025-04-03T11:00:00+09:00',
  resultReveal: '종료 후 공개',
  maxChoices: 1,
  participantCount: 100,
  goalVotes: 1000,
  voteFrequency: '매일',
  voteLimit: '1인 1표',
  resultPublic: false,
  candidates: [],
}

const mockCandidate: Candidate = {
  id: '1',
  name: 'BTS',
  group: '빅히트 뮤직',
  emoji: '👑',
  emojiColor: '#fef3c7',
}

describe('VoteBottomSheetContent — ConfirmPhase (idle)', () => {
  it('renders the selected candidate name', () => {
    render(
      <VoteBottomSheetContent
        state="idle"
        vote={mockVote}
        selectedCandidate={mockCandidate}
        txHash={null}
        karmaEarned={20}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('BTS')).toBeInTheDocument()
  })

  it('renders the confirm button', () => {
    render(
      <VoteBottomSheetContent
        state="idle"
        vote={mockVote}
        selectedCandidate={mockCandidate}
        txHash={null}
        karmaEarned={20}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: '투표 확정하기' })).toBeInTheDocument()
  })

  it('does NOT render gas fee row', () => {
    render(
      <VoteBottomSheetContent
        state="idle"
        vote={mockVote}
        selectedCandidate={mockCandidate}
        txHash={null}
        karmaEarned={20}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.queryByText('가스비')).not.toBeInTheDocument()
    expect(screen.queryByText(/⛽/)).not.toBeInTheDocument()
  })

  it('does NOT render on-chain / Status Network note', () => {
    render(
      <VoteBottomSheetContent
        state="idle"
        vote={mockVote}
        selectedCandidate={mockCandidate}
        txHash={null}
        karmaEarned={20}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.queryByText(/Status Network/)).not.toBeInTheDocument()
    expect(screen.queryByText(/영구 기록/)).not.toBeInTheDocument()
  })
})

describe('VoteBottomSheetContent — LoadingPhase', () => {
  it('shows a loading spinner area', () => {
    render(
      <VoteBottomSheetContent
        state="loading"
        vote={mockVote}
        selectedCandidate={mockCandidate}
        txHash={null}
        karmaEarned={20}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('투표를 처리하는 중…')).toBeInTheDocument()
  })

  it('does NOT mention gas or network fees', () => {
    render(
      <VoteBottomSheetContent
        state="loading"
        vote={mockVote}
        selectedCandidate={mockCandidate}
        txHash={null}
        karmaEarned={20}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.queryByText(/가스/)).not.toBeInTheDocument()
    expect(screen.queryByText(/⛽/)).not.toBeInTheDocument()
    expect(screen.queryByText(/브로드캐스팅/)).not.toBeInTheDocument()
  })
})

describe('VoteBottomSheetContent — SuccessPhase', () => {
  it('shows success title', () => {
    render(
      <VoteBottomSheetContent
        state="success"
        vote={mockVote}
        selectedCandidate={mockCandidate}
        txHash="0xabc123"
        karmaEarned={20}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('투표가 기록됐어요!')).toBeInTheDocument()
  })

  it('shows karma points earned', () => {
    render(
      <VoteBottomSheetContent
        state="success"
        vote={mockVote}
        selectedCandidate={mockCandidate}
        txHash="0xabc123"
        karmaEarned={20}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('+20 Karma Points')).toBeInTheDocument()
  })

  it('does NOT mention Status Network in the success subtitle', () => {
    render(
      <VoteBottomSheetContent
        state="success"
        vote={mockVote}
        selectedCandidate={mockCandidate}
        txHash="0xabc123"
        karmaEarned={20}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.queryByText(/Status Network/)).not.toBeInTheDocument()
    expect(screen.queryByText(/영구 저장/)).not.toBeInTheDocument()
  })
})
