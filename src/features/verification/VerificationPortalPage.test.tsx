import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VerificationPortalPage from './VerificationPortalPage'

const mockSyncVerificationElectionSummaries = vi.fn()

vi.mock('../../providers/LanguageProvider', () => ({
  useLanguage: () => ({
    lang: 'en' as const,
  }),
}))

vi.mock('./vestar', () => ({
  readCachedVerificationElectionSummaries: () => ({
    elections: [],
    lastSyncedAt: null,
  }),
  syncVerificationElectionSummaries: () => mockSyncVerificationElectionSummaries(),
  getVerificationElectionDetail: vi.fn(),
  readCachedVerificationElectionDetail: vi.fn(() => null),
}))

describe('VerificationPortalPage', () => {
  beforeEach(() => {
    mockSyncVerificationElectionSummaries.mockReset()
    mockSyncVerificationElectionSummaries.mockResolvedValue({
      elections: [],
      lastSyncedAt: new Date('2026-04-16T00:00:00.000Z'),
      lastSyncedBlock: 0n,
    })
  })

  it('defaults to ended votes on first load', async () => {
    render(
      <MemoryRouter>
        <VerificationPortalPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(mockSyncVerificationElectionSummaries).toHaveBeenCalled()
    })

    expect(await screen.findByText('There are no ended votes yet')).toBeInTheDocument()
    expect(screen.queryByText('There are no active votes yet')).not.toBeInTheDocument()
  })
})
