import { apiFetch } from './client'
import type {
  ApiElection,
  ApiElectionMetadata,
  ApiElectionResultSummary,
  ApiFinalizedTallyRow,
  ApiLiveTallyRow,
  ApiVoteSubmissionStatus,
  ApiVisibilityMode,
  PreparePrivateElectionRequest,
  PreparePrivateElectionResponse,
} from './types'

export interface FetchElectionsParams {
  seriesId?: string
  onchainElectionId?: string
  onchainElectionAddress?: string
  syncState?: string
  onchainState?: string
  visibilityMode?: ApiVisibilityMode
}

function buildQuery(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value)
    }
  })

  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

export function fetchElections(params: FetchElectionsParams = {}): Promise<ApiElection[]> {
  return apiFetch<ApiElection[]>(
    `/elections${buildQuery({
      seriesId: params.seriesId,
      onchainElectionId: params.onchainElectionId,
      onchainElectionAddress: params.onchainElectionAddress,
      syncState: params.syncState,
      onchainState: params.onchainState,
      visibilityMode: params.visibilityMode,
    })}`,
  )
}

export function fetchElectionMetadata(
  params: Omit<FetchElectionsParams, 'onchainState'> = {},
): Promise<ApiElectionMetadata[]> {
  return apiFetch<ApiElectionMetadata[]>(
    `/elections/meta${buildQuery({
      seriesId: params.seriesId,
      onchainElectionId: params.onchainElectionId,
      onchainElectionAddress: params.onchainElectionAddress,
      syncState: params.syncState,
      visibilityMode: params.visibilityMode,
    })}`,
  )
}

export function fetchElectionDetail(id: string): Promise<ApiElection> {
  return apiFetch<ApiElection>(`/elections/${id}`)
}

export function fetchLiveTally(electionId: string): Promise<ApiLiveTallyRow[]> {
  return apiFetch<ApiLiveTallyRow[]>(`/live-tally${buildQuery({ electionId })}`)
}

export function fetchFinalizedTally(electionId: string): Promise<ApiFinalizedTallyRow[]> {
  return apiFetch<ApiFinalizedTallyRow[]>(`/finalized-tally${buildQuery({ electionId })}`)
}

export function fetchResultSummaries(electionId: string): Promise<ApiElectionResultSummary[]> {
  return apiFetch<ApiElectionResultSummary[]>(`/result-summaries${buildQuery({ electionId })}`)
}

export function fetchVoteSubmissionByTxHash(
  txHash: string,
): Promise<ApiVoteSubmissionStatus | null> {
  return apiFetch<ApiVoteSubmissionStatus | null>(
    `/vote-submissions/by-tx-hash${buildQuery({ txHash })}`,
  )
}

export function preparePrivateElection(
  payload: PreparePrivateElectionRequest,
): Promise<PreparePrivateElectionResponse> {
  return apiFetch<PreparePrivateElectionResponse>('/private-elections/prepare', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
