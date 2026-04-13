import { apiFetch } from './client'
import type {
  ApiElection,
  ApiElectionMetadata,
  ApiElectionResultSummary,
  ApiFinalizedTallyRow,
  ApiLiveTallyRow,
  ApiVoteHistoryCursor,
  ApiVoteHistoryResponse,
  ApiVoteSubmissionStatus,
  ApiVisibilityMode,
  PreparePrivateElectionRequest,
  PreparePrivateElectionResponse,
} from './types'
import {
  findOptimisticElection,
  mergeOptimisticElections,
} from '../utils/optimisticVotes'

const electionDetailRequestCache = new Map<string, Promise<ApiElection>>()

export interface FetchElectionsParams {
  seriesId?: string
  onchainElectionId?: string
  onchainElectionAddress?: string
  organizerWalletAddress?: string
  syncState?: string
  onchainState?: string
  visibilityMode?: ApiVisibilityMode
  sortBy?: 'LATEST' | 'HOT'
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
  const path = `/elections${buildQuery({
    seriesId: params.seriesId,
    onchainElectionId: params.onchainElectionId,
    onchainElectionAddress: params.onchainElectionAddress,
    organizerWalletAddress: params.organizerWalletAddress,
    syncState: params.syncState,
    onchainState: params.onchainState,
    visibilityMode: params.visibilityMode,
    sortBy: params.sortBy,
  })}`

  return apiFetch<ApiElection[]>(path)
    .then((elections) => mergeOptimisticElections(elections, params))
    .catch((error) => {
      const optimisticOnly = mergeOptimisticElections([], params)
      if (optimisticOnly.length > 0) {
        return optimisticOnly
      }

      throw error
    })
}

export function fetchElectionMetadata(
  params: Omit<FetchElectionsParams, 'onchainState'> = {},
): Promise<ApiElectionMetadata[]> {
  return apiFetch<ApiElectionMetadata[]>(
    `/elections/meta${buildQuery({
      seriesId: params.seriesId,
      onchainElectionId: params.onchainElectionId,
      onchainElectionAddress: params.onchainElectionAddress,
      organizerWalletAddress: params.organizerWalletAddress,
      syncState: params.syncState,
      visibilityMode: params.visibilityMode,
    })}`,
  )
}

export function fetchElectionDetail(id: string): Promise<ApiElection> {
  const optimisticElection = findOptimisticElection(id)
  if (optimisticElection) {
    return Promise.resolve(optimisticElection)
  }

  const cachedRequest = electionDetailRequestCache.get(id)
  if (cachedRequest) {
    return cachedRequest
  }

  const request = apiFetch<ApiElection>(`/elections/${id}`).finally(() => {
    electionDetailRequestCache.delete(id)
  })

  electionDetailRequestCache.set(id, request)
  return request
}

export function prefetchElectionDetail(id: string) {
  void fetchElectionDetail(id).catch(() => {})
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

export function fetchVoteHistory(voterAddress: string): Promise<ApiVoteHistoryResponse> {
  return apiFetch<ApiVoteHistoryResponse>(
    `/vote-submissions/history${buildQuery({
      voterAddress,
      limit: '20',
    })}`,
  )
}

export function fetchMoreVoteHistory(
  voterAddress: string,
  cursor: ApiVoteHistoryCursor,
): Promise<ApiVoteHistoryResponse> {
  return apiFetch<ApiVoteHistoryResponse>(
    `/vote-submissions/history${buildQuery({
      voterAddress,
      limit: '20',
      cursorTimestamp: cursor.cursorTimestamp,
      cursorBlockNumber: String(cursor.cursorBlockNumber),
      cursorId: cursor.cursorId,
    })}`,
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
