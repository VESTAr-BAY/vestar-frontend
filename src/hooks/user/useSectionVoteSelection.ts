import { useCallback, useState } from 'react'
import type { VoteSection } from '../../types/vote'

export interface SectionSelection {
  sectionId: string
  sectionName: string
  candidateId: string
}

export interface UseSectionVoteSelectionResult {
  getSelected: (sectionId: string) => string | undefined
  toggle: (sectionId: string, candidateId: string) => void
  isSelected: (sectionId: string, candidateId: string) => boolean
  selectedCount: number
  selectedSections: SectionSelection[]
  canSubmit: boolean
  reset: () => void
}

export function useSectionVoteSelection(sections: VoteSection[]): UseSectionVoteSelectionResult {
  // Map: sectionId → candidateId
  const [selections, setSelections] = useState<Map<string, string>>(new Map())

  const toggle = useCallback((sectionId: string, candidateId: string) => {
    setSelections((prev) => {
      const next = new Map(prev)
      if (next.get(sectionId) === candidateId) {
        next.delete(sectionId)
      } else {
        next.set(sectionId, candidateId)
      }
      return next
    })
  }, [])

  const getSelected = useCallback((sectionId: string) => selections.get(sectionId), [selections])

  const isSelected = useCallback(
    (sectionId: string, candidateId: string) => selections.get(sectionId) === candidateId,
    [selections],
  )

  const selectedSections: SectionSelection[] = sections
    .filter((s) => selections.has(s.id))
    .map((s) => ({
      sectionId: s.id,
      sectionName: s.name,
      candidateId: selections.get(s.id)!,
    }))

  const selectedCount = selectedSections.length
  const canSubmit = selectedCount >= 1

  const reset = useCallback(() => setSelections(new Map()), [])

  return { getSelected, toggle, isSelected, selectedCount, selectedSections, canSubmit, reset }
}
