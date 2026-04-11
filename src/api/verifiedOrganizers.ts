import { apiFetch } from './client'

export interface ApiVerifiedOrganizer {
  id: string
  walletAddress: `0x${string}`
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  organizationName: string
  contactEmail: string | null
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

export function fetchVerifiedOrganizerRequestStatus(walletAddress: string) {
  const query = new URLSearchParams({ walletAddress })
  return apiFetch<ApiVerifiedOrganizer | null>(
    `/verified-organizers/request-status?${query.toString()}`,
  )
}

export function fetchVerifiedOrganizerRequests(status?: ApiVerifiedOrganizer['status']) {
  const query = new URLSearchParams()

  if (status) {
    query.set('status', status)
  }

  const suffix = query.toString() ? `?${query.toString()}` : ''
  return apiFetch<ApiVerifiedOrganizer[]>(`/verified-organizers${suffix}`)
}

export function requestVerifiedOrganizer(body: {
  walletAddress: string
  organizationName: string
  contactEmail?: string | null
}) {
  return apiFetch<ApiVerifiedOrganizer | null>('/verified-organizers/request', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function approveVerifiedOrganizer(id: string) {
  return apiFetch<ApiVerifiedOrganizer>(`/verified-organizers/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({}),
  })
}

export function rejectVerifiedOrganizer(id: string, rejectionReason?: string) {
  return apiFetch<ApiVerifiedOrganizer>(`/verified-organizers/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({
      rejectionReason: rejectionReason?.trim() ? rejectionReason.trim() : null,
    }),
  })
}
