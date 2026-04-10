import { getAddress, keccak256, hexToBytes, type Address, type Hex } from 'viem'
import { OPEN_EMOJIS, STATUS_CHAIN_ID, STATUS_EXPLORER_URL } from './constants'
import { resolveVerificationLanguage, type VerificationLang } from './language'
import type { VerificationElectionSummary, VisibilityMode } from './types'

export function isLikelyCid(value: string) {
  return value.startsWith('Qm') || /^[b][a-z2-7]+$/i.test(value)
}

export function pickEmoji(seed: string) {
  const value = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return OPEN_EMOJIS[value % OPEN_EMOJIS.length] ?? '🗳️'
}

export function formatCandidateName(value: string) {
  if (/[가-힣]/.test(value)) {
    return value
  }

  return value.replace(/[_-]+/g, ' ')
}

export function formatElectionId(electionId: Hex, fallbackAddress: Address) {
  return decodeBytes32Ascii(electionId) ?? truncateAddress(fallbackAddress)
}

export function formatElectionTitle(
  electionId: Hex,
  fallbackAddress: Address,
  lang: VerificationLang = resolveVerificationLanguage(),
) {
  const rawId = decodeBytes32Ascii(electionId)
  if (!rawId) {
    return lang === 'ko'
      ? `투표 ${truncateAddress(fallbackAddress)}`
      : `Vote ${truncateAddress(fallbackAddress)}`
  }

  const cleaned = rawId
    .replace(/^verify-/, '')
    .replace(/^portal-/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned ||
    (lang === 'ko' ? `투표 ${truncateAddress(fallbackAddress)}` : `Vote ${truncateAddress(fallbackAddress)}`)
}

export function hasResolvedElectionTitle(
  election: Pick<VerificationElectionSummary, 'title' | 'chainElectionId' | 'address'>,
) {
  const lang = resolveVerificationLanguage()
  const loadingLabel = lang === 'ko' ? '불러오는 중' : 'Loading'

  if (election.title === loadingLabel) {
    return false
  }

  return election.title !== formatElectionTitle(election.chainElectionId, election.address, lang)
}

export function formatElectionDescription(
  mode: VisibilityMode,
  isFinalized: boolean,
  canDecrypt: boolean,
  lang: VerificationLang = resolveVerificationLanguage(),
) {
  if (mode === 'OPEN') {
    return isFinalized
      ? lang === 'ko'
        ? '끝난 뒤 최종 결과가 고정된 공개 투표예요.'
        : 'This is a public vote with finalized results after the vote ended.'
      : lang === 'ko'
        ? '현재 체인에 올라온 공개 투표예요. 지금까지 제출된 표 흐름을 바로 볼 수 있어요.'
        : 'This is a public vote currently on chain. You can review the submitted vote flow right away.'
  }

  return isFinalized
    ? canDecrypt
      ? lang === 'ko'
        ? '공개된 키와 투표 기록을 함께 보며 결과를 다시 확인할 수 있어요.'
        : 'You can verify the result again by reviewing the revealed keys and vote records together.'
      : lang === 'ko'
        ? '끝난 비공개 투표예요. 키가 공개된 형식이면 결과를 다시 확인할 수 있어요.'
        : 'This private vote has ended. If the key is revealed in a supported format, the results can be verified again.'
    : lang === 'ko'
      ? '현재 체인에 올라온 비공개 투표예요. 투표 수는 보이지만 결과는 키 공개 전까지 숨겨져요.'
      : 'This is a private vote currently on chain. Submission counts are visible, but results stay hidden until the key is revealed.'
}

export function formatStateLabel(state: number, lang: VerificationLang = resolveVerificationLanguage()) {
  switch (state) {
    case 0:
      return lang === 'ko' ? '시작 전' : 'Scheduled'
    case 1:
      return lang === 'ko' ? '진행 중' : 'Active'
    case 2:
      return lang === 'ko' ? '마감됨' : 'Closed'
    case 3:
      return lang === 'ko' ? '키 공개 대기' : 'Key reveal pending'
    case 4:
      return lang === 'ko' ? '키 공개됨' : 'Key revealed'
    case 5:
      return lang === 'ko' ? '결과 확정' : 'Finalized'
    case 6:
      return lang === 'ko' ? '취소됨' : 'Cancelled'
    default:
      return lang === 'ko' ? '상태 확인 중' : 'Checking status'
  }
}

export function decodeBytes32Ascii(value: Hex) {
  const bytes = hexToBytes(value)
  let output = ''

  for (const byte of bytes) {
    if (byte === 0) break
    if (byte < 32 || byte > 126) {
      return null
    }

    output += String.fromCharCode(byte)
  }

  return output || null
}

export function toVisibilityMode(value: number) {
  return value === 1 ? 'PRIVATE' : 'OPEN'
}

export function keccakParts(...parts: Uint8Array[]) {
  return hexToBytes(keccak256(concatHex(parts)))
}

export function concatHex(parts: Uint8Array[]) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0)
  const combined = new Uint8Array(totalLength)
  let offset = 0

  parts.forEach((part) => {
    combined.set(part, offset)
    offset += part.length
  })

  let hex = '0x'
  combined.forEach((value) => {
    hex += value.toString(16).padStart(2, '0')
  })
  return hex as Hex
}

export function utf8Bytes(value: string) {
  return new TextEncoder().encode(value)
}

export function bytesEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) {
    return false
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false
    }
  }

  return true
}

export function getCryptoApi() {
  if (typeof globalThis.crypto === 'undefined') {
    throw new Error('Web Crypto API is unavailable')
  }

  return globalThis.crypto
}

export function decodeHexUtf8(value: Hex) {
  try {
    return bytesToUtf8(hexToBytes(value)).replace(/\0+$/g, '').trim()
  } catch {
    return null
  }
}

export function bytesToUtf8(value: Uint8Array) {
  return new TextDecoder().decode(value)
}

export function base64ToBytes(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = globalThis.atob(normalized)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

export function pemToDerBytes(pem: string) {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '')

  return base64ToBytes(body)
}

export function concatBytes(left: Uint8Array, right: Uint8Array) {
  const output = new Uint8Array(left.length + right.length)
  output.set(left, 0)
  output.set(right, left.length)
  return output
}

export function toArrayBuffer(value: Uint8Array) {
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer
}

export function makeExplorerUrl(kind: 'address' | 'tx', value: string) {
  return `${STATUS_EXPLORER_URL}/${kind}/${value}`
}

export function formatDate(timestamp: bigint, lang: VerificationLang = resolveVerificationLanguage()) {
  return new Intl.DateTimeFormat(lang === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(new Date(Number(timestamp) * 1000))
}

export function formatDateTime(timestamp: bigint, lang: VerificationLang = resolveVerificationLanguage()) {
  return new Intl.DateTimeFormat(lang === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(new Date(Number(timestamp) * 1000))
}

export function truncateAddress(address: Address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function truncateMiddle(value: string, start = 18, end = 12) {
  if (value.length <= start + end + 3) {
    return value
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`
}

export function isMatchingBallotPayload(
  payload: {
    schemaVersion?: number
    chainId?: number
    electionId?: string
    electionAddress?: string
    voterAddress?: string
  },
  electionId: Hex,
  electionAddress: Address,
  voterAddress: Address,
) {
  if (payload.schemaVersion !== undefined && payload.schemaVersion !== 1) {
    return false
  }

  if (payload.chainId !== undefined && payload.chainId !== STATUS_CHAIN_ID) {
    return false
  }

  if (payload.electionId && payload.electionId.toLowerCase() !== electionId.toLowerCase()) {
    return false
  }

  if (payload.electionAddress) {
    try {
      if (getAddress(payload.electionAddress) !== electionAddress) {
        return false
      }
    } catch {
      return false
    }
  }

  if (payload.voterAddress) {
    try {
      if (getAddress(payload.voterAddress) !== voterAddress) {
        return false
      }
    } catch {
      return false
    }
  }

  return true
}
