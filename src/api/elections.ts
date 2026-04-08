import { apiFetch } from './client'
import type { ApiElectionDetail, ApiElectionListResponse } from './types'

export interface FetchElectionListParams {
  state?: string        // filter by onchain_state
  page?: number
  pageSize?: number
}

export async function fetchElectionList(
  params: FetchElectionListParams = {},
): Promise<ApiElectionListResponse> {
  const q = new URLSearchParams()
  if (params.state) q.set('state', params.state)
  if (params.page != null) q.set('page', String(params.page))
  if (params.pageSize != null) q.set('page_size', String(params.pageSize))

  const qs = q.toString()
  return apiFetch<ApiElectionListResponse>(`/elections${qs ? `?${qs}` : ''}`)
}

export async function fetchElectionDetail(id: string): Promise<ApiElectionDetail> {
  return apiFetch<ApiElectionDetail>(`/elections/${id}`)
}
