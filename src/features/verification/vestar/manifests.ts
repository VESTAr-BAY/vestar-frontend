import { type Hex, keccak256, stringToHex } from 'viem'
import { parseCandidateManifest } from '../../../utils/candidateManifest'
import { resolveReadableIpfsUrls } from '../../../utils/ipfs'
import { readStoredItem, removeStoredItem, writeStoredItem } from './cache'
import { MANIFEST_CACHE_PREFIX, ZERO_HASH } from './constants'
import type { CandidateManifest, ResultManifest } from './types'
import { isLikelyCid } from './utils'

const manifestRequestCache = new Map<string, Promise<CandidateManifest | ResultManifest | null>>()

export async function readCandidateManifest(uri: string, expectedHash: Hex) {
  if (!uri) return null
  return readVerifiedCandidateManifest(uri, expectedHash)
}

export async function readResultManifest(uri: string, expectedHash: Hex) {
  if (!uri || expectedHash === ZERO_HASH) {
    return null
  }

  return readVerifiedManifest<ResultManifest>(uri, expectedHash)
}

async function readVerifiedManifest<T extends CandidateManifest | ResultManifest>(
  uri: string,
  expectedHash: Hex,
): Promise<T | null> {
  const manifestCacheKey = `${MANIFEST_CACHE_PREFIX}${expectedHash}:${uri}`
  const manifestRequestKey = `${expectedHash}:${uri}`

  if (manifestRequestCache.has(manifestRequestKey)) {
    return (await manifestRequestCache.get(manifestRequestKey)) as T | null
  }

  const pending = (async () => {
    const cachedBody = readStoredItem<string>(manifestCacheKey)
    if (cachedBody) {
      if (keccak256(stringToHex(cachedBody)) === expectedHash) {
        try {
          return JSON.parse(cachedBody) as T
        } catch {
          removeStoredItem(manifestCacheKey)
        }
      } else {
        removeStoredItem(manifestCacheKey)
      }
    }

    const resolved = await resolveManifestUrl(uri)
    if (!resolved) return null

    for (const url of resolved.urls) {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          continue
        }

        const body = await response.text()
        if (!resolved.skipHashVerification && keccak256(stringToHex(body)) !== expectedHash) {
          continue
        }

        writeStoredItem(manifestCacheKey, body)
        return JSON.parse(body) as T
      } catch {}
    }

    return null
  })()

  manifestRequestCache.set(manifestRequestKey, pending)
  const resolved = (await pending) as T | null

  if (resolved === null) {
    manifestRequestCache.delete(manifestRequestKey)
  }

  return resolved
}

async function readVerifiedCandidateManifest(
  uri: string,
  expectedHash: Hex,
): Promise<CandidateManifest | null> {
  const manifestCacheKey = `${MANIFEST_CACHE_PREFIX}${expectedHash}:${uri}`
  const manifestRequestKey = `${expectedHash}:${uri}:candidate`

  if (manifestRequestCache.has(manifestRequestKey)) {
    return (await manifestRequestCache.get(manifestRequestKey)) as CandidateManifest | null
  }

  const pending = (async () => {
    const cachedBody = readStoredItem<string>(manifestCacheKey)
    if (cachedBody) {
      if (keccak256(stringToHex(cachedBody)) === expectedHash) {
        try {
          return parseCandidateManifest(JSON.parse(cachedBody))
        } catch {
          removeStoredItem(manifestCacheKey)
        }
      } else {
        removeStoredItem(manifestCacheKey)
      }
    }

    const resolved = await resolveManifestUrl(uri)
    if (!resolved) return null

    for (const url of resolved.urls) {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          continue
        }

        const body = await response.text()
        if (!resolved.skipHashVerification && keccak256(stringToHex(body)) !== expectedHash) {
          continue
        }

        const parsed = parseCandidateManifest(JSON.parse(body))
        if (!parsed) {
          continue
        }

        writeStoredItem(manifestCacheKey, body)
        return parsed
      } catch {}
    }

    return null
  })()

  manifestRequestCache.set(manifestRequestKey, pending)
  const resolved = (await pending) as CandidateManifest | null

  if (resolved === null) {
    manifestRequestCache.delete(manifestRequestKey)
  }

  return resolved
}

async function resolveManifestUrl(uri: string) {
  if (!uri) return null

  if (uri.startsWith('https://') || uri.startsWith('http://')) {
    return { urls: [uri], skipHashVerification: false }
  }

  if (uri.startsWith('ipfs://')) {
    const cid = uri.replace('ipfs://', '')
    if (!isLikelyCid(cid)) {
      return null
    }

    return {
      urls: resolveReadableIpfsUrls(uri),
      skipHashVerification: false,
    }
  }

  return null
}
