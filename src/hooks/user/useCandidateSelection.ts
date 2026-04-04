import { useCallback, useState } from 'react'

export interface CandidateSelectionResult {
  selectedIds: Set<string>
  toggle: (id: string) => void
  isSelected: (id: string) => boolean
  canSubmit: boolean
  reset: () => void
}

export function useCandidateSelection(maxChoices = 1): CandidateSelectionResult {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggle = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        if (prev.has(id)) {
          const next = new Set(prev)
          next.delete(id)
          return next
        }
        if (maxChoices === 1) return new Set([id])
        if (prev.size >= maxChoices) return prev
        return new Set([...prev, id])
      })
    },
    [maxChoices],
  )

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds])
  const canSubmit = selectedIds.size > 0
  const reset = useCallback(() => setSelectedIds(new Set()), [])

  return { selectedIds, toggle, isSelected, canSubmit, reset }
}
