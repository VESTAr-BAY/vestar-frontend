import { apiFetch } from './client'

export interface ApiVerifiedOrganizer {
  id: string
  walletAddress: `0x${string}`
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  organizationName: string
  organizationLogoUrl: string | null
  rejectionReason: string | null
  verifiedBy: string | null
  verifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export function fetchVerifiedOrganizerByWallet(walletAddress: string) {
  const query = new URLSearchParams({ walletAddress })
  return apiFetch<ApiVerifiedOrganizer | null>(`/verified-organizers/by-wallet?${query.toString()}`)
}
