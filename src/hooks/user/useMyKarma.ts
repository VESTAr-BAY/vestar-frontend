import { useCallback, useEffect, useState } from 'react'
import type { Address } from 'viem'
import { useAccount } from 'wagmi'
import { getKarmaBalance, getKarmaTier } from '../../contracts/vestar/actions'
import type { KarmaEvent } from '../../types/user'
import { getKarmaTierDisplay, type KarmaTierDisplay } from '../../utils/karmaTier'

const KARMA_CACHE_TTL_MS = 60_000
const KARMA_CACHE_PREFIX = 'vestar:karma-profile:v1:'

type CachedKarmaProfile = {
  total: number
  tierId: number
  cachedAt: number
}

const karmaProfileMemoryCache = new Map<string, CachedKarmaProfile>()
const karmaProfileRequests = new Map<string, Promise<CachedKarmaProfile>>()

function buildKarmaCacheKey(address: Address) {
  return `${KARMA_CACHE_PREFIX}${address.toLowerCase()}`
}

function isFreshCache(entry: CachedKarmaProfile | null) {
  return Boolean(entry && Date.now() - entry.cachedAt < KARMA_CACHE_TTL_MS)
}

function readFreshCachedKarmaProfile(address: Address): CachedKarmaProfile | null {
  const cacheKey = buildKarmaCacheKey(address)
  const memoryCached = karmaProfileMemoryCache.get(cacheKey) ?? null
  if (isFreshCache(memoryCached)) {
    return memoryCached as CachedKarmaProfile
  }

  const storageCached = readKarmaProfileFromStorage(cacheKey)
  if (isFreshCache(storageCached)) {
    karmaProfileMemoryCache.set(cacheKey, storageCached as CachedKarmaProfile)
    return storageCached as CachedKarmaProfile
  }

  return null
}

function readKarmaProfileFromStorage(cacheKey: string): CachedKarmaProfile | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(cacheKey)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<CachedKarmaProfile>
    if (
      typeof parsed.total !== 'number' ||
      typeof parsed.tierId !== 'number' ||
      typeof parsed.cachedAt !== 'number'
    ) {
      return null
    }

    return {
      total: parsed.total,
      tierId: parsed.tierId,
      cachedAt: parsed.cachedAt,
    }
  } catch {
    return null
  }
}

function writeKarmaProfileToStorage(cacheKey: string, value: CachedKarmaProfile) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(value))
  } catch {
    // localStorage can be unavailable in private browsing or constrained webviews.
  }
}

async function readOnchainKarmaProfile(
  address: Address,
  force = false,
): Promise<CachedKarmaProfile> {
  const cacheKey = buildKarmaCacheKey(address)

  if (!force) {
    const cachedProfile = readFreshCachedKarmaProfile(address)
    if (cachedProfile) {
      return cachedProfile
    }
  }

  const pendingRequest = karmaProfileRequests.get(cacheKey)
  if (pendingRequest) {
    return pendingRequest
  }

  const request = Promise.all([getKarmaBalance(address), getKarmaTier(address)]).then(
    ([balance, tierId]) => {
      const nextProfile = {
        total: Number(balance),
        tierId,
        cachedAt: Date.now(),
      }

      karmaProfileMemoryCache.set(cacheKey, nextProfile)
      writeKarmaProfileToStorage(cacheKey, nextProfile)

      return nextProfile
    },
  )

  karmaProfileRequests.set(cacheKey, request)

  try {
    return await request
  } finally {
    karmaProfileRequests.delete(cacheKey)
  }
}

export interface UseMyKarmaResult {
  events: KarmaEvent[]
  total: number
  tierId: number
  tier: KarmaTierDisplay
  isLoading: boolean
  error: Error | undefined
  refetch: () => void
}

export function useMyKarma(): UseMyKarmaResult {
  const { address, isConnected } = useAccount()
  const initialCachedProfile =
    isConnected && address ? readFreshCachedKarmaProfile(address) : null
  const [total, setTotal] = useState(() => initialCachedProfile?.total ?? 0)
  const [tierId, setTierId] = useState(() => initialCachedProfile?.tierId ?? 0)
  const [isLoading, setIsLoading] = useState(
    () => Boolean(isConnected && address && !initialCachedProfile),
  )
  const [error, setError] = useState<Error | undefined>(undefined)

  const fetchKarma = useCallback(
    async (force = false) => {
      if (!isConnected || !address) {
        setTotal(0)
        setTierId(0)
        setIsLoading(false)
        setError(undefined)
        return
      }

      setError(undefined)
      const cachedProfile = force ? null : readFreshCachedKarmaProfile(address)

      if (cachedProfile) {
        setTotal(cachedProfile.total)
        setTierId(cachedProfile.tierId)
        setIsLoading(false)
        return
      }

      // Reset immediately when the connected wallet changes so the previous wallet's tier
      // does not linger while the next read is in flight.
      setTotal(0)
      setTierId(0)
      setIsLoading(true)

      try {
        const profile = await readOnchainKarmaProfile(address, force)
        setTotal(profile.total)
        setTierId(profile.tierId)
      } catch (err) {
        setTotal(0)
        setTierId(0)
        setError(err instanceof Error ? err : new Error('Failed to fetch karma balance'))
      } finally {
        setIsLoading(false)
      }
    },
    [address, isConnected],
  )

  useEffect(() => {
    void fetchKarma()
  }, [fetchKarma])

  return {
    events: [],
    total,
    tierId,
    tier: getKarmaTierDisplay(tierId),
    isLoading,
    error,
    refetch: () => {
      void fetchKarma(true)
    },
  }
}

export function __resetMyKarmaCacheForTests() {
  karmaProfileMemoryCache.clear()
  karmaProfileRequests.clear()
}
