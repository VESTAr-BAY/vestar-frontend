import type { Address } from 'viem'
import { getElectionVoterSnapshot } from '../contracts/vestar/actions'

const VOTER_SNAPSHOT_CACHE_PREFIX = 'vestar_voter_snapshot:'
const VOTER_SNAPSHOT_TTL_MS = 15_000
const voterSnapshotRequests = new Map<string, Promise<CachedVoterSnapshot>>()

export interface CachedVoterSnapshot {
  canSubmitBallot: boolean
  remainingBallots: number
  updatedAt: number
}

function makeSnapshotCacheKey(electionAddress: Address, voterAddress: Address) {
  return `${VOTER_SNAPSHOT_CACHE_PREFIX}${electionAddress.toLowerCase()}:${voterAddress.toLowerCase()}`
}

export function readCachedVoterSnapshot(
  electionAddress: Address,
  voterAddress: Address,
): CachedVoterSnapshot | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    // sungje : 선거 주소 + 지갑 주소 조합별로 최근 voter snapshot을 저장해서 읽기 부하를 줄임
    const raw = window.localStorage.getItem(makeSnapshotCacheKey(electionAddress, voterAddress))
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as CachedVoterSnapshot
    if (Date.now() - parsed.updatedAt > VOTER_SNAPSHOT_TTL_MS) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function writeCachedVoterSnapshot(
  electionAddress: Address,
  voterAddress: Address,
  snapshot: Omit<CachedVoterSnapshot, 'updatedAt'>,
) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      makeSnapshotCacheKey(electionAddress, voterAddress),
      JSON.stringify({
        ...snapshot,
        updatedAt: Date.now(),
      } satisfies CachedVoterSnapshot),
    )
  } catch {
    return
  }
}

export async function fetchCachedVoterSnapshot(
  electionAddress: Address,
  voterAddress: Address,
): Promise<CachedVoterSnapshot> {
  const cached = readCachedVoterSnapshot(electionAddress, voterAddress)
  if (cached) {
    return cached
  }

  const cacheKey = makeSnapshotCacheKey(electionAddress, voterAddress)
  const existingRequest = voterSnapshotRequests.get(cacheKey)
  if (existingRequest) {
    return existingRequest
  }

  const request = getElectionVoterSnapshot(electionAddress, voterAddress)
    .then((snapshot) => {
      const nextSnapshot: CachedVoterSnapshot = {
        canSubmitBallot: snapshot.canSubmitBallot,
        remainingBallots: snapshot.remainingBallots,
        updatedAt: Date.now(),
      }

      writeCachedVoterSnapshot(electionAddress, voterAddress, {
        canSubmitBallot: nextSnapshot.canSubmitBallot,
        remainingBallots: nextSnapshot.remainingBallots,
      })

      return nextSnapshot
    })
    .finally(() => {
      voterSnapshotRequests.delete(cacheKey)
    })

  voterSnapshotRequests.set(cacheKey, request)
  return request
}

export function prefetchVoterSnapshot(electionAddress: Address, voterAddress: Address) {
  void fetchCachedVoterSnapshot(electionAddress, voterAddress).catch(() => {})
}
