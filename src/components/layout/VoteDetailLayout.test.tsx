import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { VoteDetailLayout } from './VoteDetailLayout'

vi.mock('../../hooks/useScrollDirection', () => ({
  useScrollDirection: () => ({ scrollState: 'default', onScroll: vi.fn() }),
}))

vi.mock('./Header', () => ({
  Header: () => <div data-testid="mock-header" />,
}))

vi.mock('./ProfilePanel', () => ({
  ProfilePanel: () => null,
}))

vi.mock('./SearchOverlay', () => ({
  SearchOverlay: () => null,
}))

describe('VoteDetailLayout', () => {
  it('renders the header and main outlet', () => {
    const { getByTestId } = render(
      <MemoryRouter>
        <VoteDetailLayout />
      </MemoryRouter>,
    )
    expect(getByTestId('mock-header')).toBeInTheDocument()
  })
})
