import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiVerifiedOrganizer } from '../../api/verifiedOrganizers'
import type { Lang } from '../../i18n'
import { VerifiedRequestPage } from './VerifiedRequestPage'

let mockLang: Lang = 'en'

const mockFetchVerifiedOrganizerRequestStatus =
  vi.fn<(walletAddress: string) => Promise<ApiVerifiedOrganizer | null>>()
const mockRequestVerifiedOrganizer = vi.fn()

vi.mock('../../providers/LanguageProvider', () => ({
  useLanguage: () => ({
    lang: mockLang,
  }),
}))

vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890abcdef1234567890abcdef12345678',
    isConnected: true,
  }),
}))

vi.mock('../../api/verifiedOrganizers', () => ({
  fetchVerifiedOrganizerRequestStatus: (walletAddress: string) =>
    mockFetchVerifiedOrganizerRequestStatus(walletAddress),
  requestVerifiedOrganizer: (body: unknown) => mockRequestVerifiedOrganizer(body),
}))

describe('VerifiedRequestPage', () => {
  beforeEach(() => {
    mockLang = 'en'
    mockFetchVerifiedOrganizerRequestStatus.mockReset()
    mockFetchVerifiedOrganizerRequestStatus.mockResolvedValue(null)
    mockRequestVerifiedOrganizer.mockReset()
    mockRequestVerifiedOrganizer.mockResolvedValue(null)
  })

  it('renders English copy when the current language is English', async () => {
    render(<VerifiedRequestPage />)

    expect(screen.getByText('Request organizer verification')).toBeInTheDocument()
    expect(screen.getByText('Connected wallet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send verification request' })).toBeInTheDocument()

    await waitFor(() => {
      expect(mockFetchVerifiedOrganizerRequestStatus).toHaveBeenCalledWith(
        '0x1234567890abcdef1234567890abcdef12345678',
      )
    })
  })

  it('shows the updated Korean approved wording for verified requests', async () => {
    mockLang = 'ko'
    mockFetchVerifiedOrganizerRequestStatus.mockResolvedValue({
      id: 'verified-request-1',
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      status: 'VERIFIED',
      organizationName: 'MAMA 2026',
      contactEmail: 'contact@company.com',
      organizationLogoUrl: null,
      rejectionReason: null,
      verifiedBy: null,
      verifiedAt: '2026-04-15T00:00:00.000Z',
      createdAt: '2026-04-14T00:00:00.000Z',
      updatedAt: '2026-04-15T00:00:00.000Z',
    })

    render(<VerifiedRequestPage />)

    expect(await screen.findByText('승인됨')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '승인되었어요' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '이미 승인됨' })).not.toBeInTheDocument()
  })
})
