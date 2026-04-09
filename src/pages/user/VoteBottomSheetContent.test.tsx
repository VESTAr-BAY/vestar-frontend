import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VoteBottomSheetContent } from './VoteBottomSheetContent'

const baseProps = {
  karmaEarned: 20,
  selectedCandidateLabels: [] as string[],
  isPrivateVote: false,
  onClose: vi.fn(),
}

describe('VoteBottomSheetContent — LoadingPhase', () => {
  it('shows a loading spinner area when idle', () => {
    render(<VoteBottomSheetContent state="idle" txHash={null} {...baseProps} />)
    expect(screen.getByText('Processing your vote…')).toBeInTheDocument()
  })

  it('shows a wallet confirmation message while awaiting signature', () => {
    render(<VoteBottomSheetContent state="awaiting_signature" txHash={null} {...baseProps} />)
    expect(screen.getByText('Confirm in wallet')).toBeInTheDocument()
  })

  it('shows processing content while confirming on-chain', () => {
    render(
      <VoteBottomSheetContent
        state="confirming"
        txHash={null}
        {...baseProps}
        selectedCandidateLabels={['Park Hyo Shin']}
      />,
    )
    expect(screen.getByText('Processing your vote…')).toBeInTheDocument()
    expect(screen.getByText('Park Hyo Shin')).toBeInTheDocument()
  })

  it('does NOT show success content while loading', () => {
    render(<VoteBottomSheetContent state="awaiting_signature" txHash={null} {...baseProps} />)
    expect(screen.queryByText('Vote recorded!')).not.toBeInTheDocument()
  })
})

describe('VoteBottomSheetContent — SuccessPhase', () => {
  it('shows success title', () => {
    render(<VoteBottomSheetContent state="success" txHash="0xabc123" {...baseProps} />)
    expect(screen.getByText('Vote recorded!')).toBeInTheDocument()
  })

  it('shows karma points earned', () => {
    render(<VoteBottomSheetContent state="success" txHash="0xabc123" {...baseProps} />)
    expect(screen.getByText('+20 Karma Points')).toBeInTheDocument()
  })

  it('shows the tx hash receipt', () => {
    render(<VoteBottomSheetContent state="success" txHash="0xabc123" {...baseProps} />)
    expect(screen.getByText('0xabc123')).toBeInTheDocument()
  })

  it('does NOT render a tx hash section when txHash is null', () => {
    render(<VoteBottomSheetContent state="success" txHash={null} {...baseProps} />)
    expect(screen.queryByText('Receipt')).not.toBeInTheDocument()
  })
})
