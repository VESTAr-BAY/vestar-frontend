import { useCallback, useState } from 'react'

const VOTED_IDS_KEY = 'vestar_voted_ids'
const VOTED_SELECTIONS_KEY = 'vestar_voted_selections'

function readVotedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(VOTED_IDS_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function writeVotedIds(ids: Set<string>): void {
  try { localStorage.setItem(VOTED_IDS_KEY, JSON.stringify([...ids])) } catch {}
}

function readSelections(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(VOTED_SELECTIONS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {}
  } catch {
    return {}
  }
}

function writeSelections(map: Record<string, string[]>): void {
  try { localStorage.setItem(VOTED_SELECTIONS_KEY, JSON.stringify(map)) } catch {}
}

/**
 * Tracks which votes the user has participated in and which candidates they chose.
 * Both the vote ID set and per-vote candidate selections are persisted in localStorage.
 */
export function useVotedVotes() {
  const [votedIds, setVotedIds] = useState<Set<string>>(readVotedIds)

  /** Mark a vote completed, storing the candidate IDs that were voted for. */
  const markVoted = useCallback((voteId: string, candidateIds: string[]) => {
    setVotedIds((prev) => {
      const next = new Set(prev)
      next.add(voteId)
      writeVotedIds(next)
      return next
    })
    const selections = readSelections()
    selections[voteId] = candidateIds
    writeSelections(selections)
  }, [])

  const isVoted = useCallback(
    (voteId: string) => votedIds.has(voteId),
    [votedIds],
  )

  /** Returns the candidate IDs the user voted for in a given vote (empty array if not voted). */
  const getVotedCandidates = useCallback((voteId: string): string[] => {
    return readSelections()[voteId] ?? []
  }, [])

  return { isVoted, markVoted, getVotedCandidates }
}
