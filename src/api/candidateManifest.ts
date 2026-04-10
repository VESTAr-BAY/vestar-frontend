import { keccak256, stringToHex, type Hex } from 'viem'
import { parseCandidateManifest, type CandidateManifest } from '../utils/candidateManifest'
import { resolveReadableIpfsUrls } from '../utils/ipfs'

const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000' as const

const manifestRequestCache = new Map<string, Promise<CandidateManifest | null>>()

function parseManifestBody(body: string) {
  try {
    return parseCandidateManifest(JSON.parse(body))
  } catch {
    return null
  }
}

export async function fetchCandidateManifest(
  uri?: string | null,
  expectedHash?: string | null,
): Promise<CandidateManifest | null> {
  if (!uri) {
    return null
  }

  const cacheKey = `${expectedHash ?? ZERO_HASH}:${uri}`
  if (manifestRequestCache.has(cacheKey)) {
    return manifestRequestCache.get(cacheKey) ?? null
  }

  const pending = (async () => {
    for (const resolvedUrl of resolveReadableIpfsUrls(uri)) {
      try {
        const response = await fetch(resolvedUrl)
        if (!response.ok) {
          console.warn('[candidateManifest] fetch failed', {
            uri,
            resolvedUrl,
            status: response.status,
            statusText: response.statusText,
          })
          continue
        }

        const body = await response.text()
        const parsed = parseManifestBody(body)
        if (!parsed) {
          console.warn('[candidateManifest] parse failed', { uri, resolvedUrl, body })
          continue
        }

        if (
          expectedHash &&
          expectedHash !== ZERO_HASH &&
          keccak256(stringToHex(body)) !== (expectedHash as Hex)
        ) {
          console.warn('[candidateManifest] hash mismatch', {
            uri,
            resolvedUrl,
            expectedHash,
            actualHash: keccak256(stringToHex(body)),
          })
        }

        return parsed
      } catch (error) {
        console.warn('[candidateManifest] request threw', { uri, resolvedUrl, error })
      }
    }

    return null
  })()

  manifestRequestCache.set(cacheKey, pending)

  try {
    return await pending
  } finally {
    manifestRequestCache.delete(cacheKey)
  }
}
