import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VoteBottomSheetContent } from './VoteBottomSheetContent'

describe('VoteBottomSheetContent — LoadingPhase (idle or loading)', () => {
  it('shows a loading spinner area when idle', () => {
    render(
      <VoteBottomSheetContent
        state="idle"
        txHash={null}
        karmaEarned={20}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('Processing your vote…')).toBeInTheDocument()
  })

  it('shows a loading spinner area when loading', () => {
    render(
      <VoteBottomSheetContent
        state="loading"
        txHash={null}
        karmaEarned={20}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('Processing your vote…')).toBeInTheDocument()
  })

  it('does NOT show success content while loading', () => {
    render(
      <VoteBottomSheetContent
        state="loading"
        txHash={null}
        karmaEarned={20}
        onClose={vi.fn()}
      />,
    )
    expect(screen.queryByText('Vote recorded!')).not.toBeInTheDocument()
  })
})

describe('VoteBottomSheetContent — SuccessPhase', () => {
  it('shows success title', () => {
    render(
      <VoteBottomSheetContent
        state="success"
        txHash="0xabc123"
        karmaEarned={20}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('Vote recorded!')).toBeInTheDocument()
  })

  it('shows karma points earned', () => {
    render(
      <VoteBottomSheetContent
        state="success"
        txHash="0xabc123"
        karmaEarned={20}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('+20 Karma Points')).toBeInTheDocument()
  })

  it('shows the tx hash receipt', () => {
    render(
      <VoteBottomSheetContent
        state="success"
        txHash="0xabc123"
        karmaEarned={20}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('0xabc123')).toBeInTheDocument()
  })

  it('does NOT render a tx hash section when txHash is null', () => {
    render(
      <VoteBottomSheetContent
        state="success"
        txHash={null}
        karmaEarned={20}
        onClose={vi.fn()}
      />,
    )
    expect(screen.queryByText('Receipt')).not.toBeInTheDocument()
  })
})
