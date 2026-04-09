export type LocalOpenElectionMetadata = {
  onchainElectionId: `0x${string}`
  onchainElectionAddress: `0x${string}`
  seriesId: `0x${string}`
  title: string
  coverImageUrl?: string | null
  series: {
    seriesPreimage: string
    coverImageUrl?: string | null
  }
  electionCandidates: Array<{
    candidateKey: string
    displayName?: string | null
    imageUrl?: string | null
    displayOrder: number
  }>
  createdAt: string
}

const STORAGE_KEY = 'vestar:open-election-metadata'

function canUseStorage() {
  return typeof window !== 'undefined' && !!window.localStorage
}

function parseStoredValue(rawValue: string | null): LocalOpenElectionMetadata[] {
  if (!rawValue) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue) as LocalOpenElectionMetadata[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function loadLocalOpenElectionMetadata(): LocalOpenElectionMetadata[] {
  if (!canUseStorage()) {
    return []
  }

  return parseStoredValue(window.localStorage.getItem(STORAGE_KEY))
}

export function saveLocalOpenElectionMetadata(nextItem: LocalOpenElectionMetadata) {
  if (!canUseStorage()) {
    return
  }

  const items = loadLocalOpenElectionMetadata()
  const nextItems = [
    nextItem,
    ...items.filter(
      (item) =>
        item.onchainElectionId !== nextItem.onchainElectionId &&
        item.onchainElectionAddress.toLowerCase() !== nextItem.onchainElectionAddress.toLowerCase(),
    ),
  ]

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems))
}

export function findLocalOpenElectionMetadata(input: {
  onchainElectionId?: string | null
  onchainElectionAddress?: string | null
}) {
  const items = loadLocalOpenElectionMetadata()

  return (
    items.find((item) => {
      if (
        input.onchainElectionId &&
        item.onchainElectionId.toLowerCase() === input.onchainElectionId.toLowerCase()
      ) {
        return true
      }

      if (
        input.onchainElectionAddress &&
        item.onchainElectionAddress.toLowerCase() === input.onchainElectionAddress.toLowerCase()
      ) {
        return true
      }

      return false
    }) ?? null
  )
}
