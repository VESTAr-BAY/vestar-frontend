import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useCreateVoteDraft } from './useCreateVoteDraft'

describe('useCreateVoteDraft', () => {
  it('initializes at step 1 with empty title and org', () => {
    const { result } = renderHook(() => useCreateVoteDraft())
    expect(result.current.step).toBe(1)
    expect(result.current.draft.title).toBe('')
    expect(result.current.draft.org).toBe('')
  })

  it('step 1 is invalid when title is empty', () => {
    const { result } = renderHook(() => useCreateVoteDraft())
    expect(result.current.isCurrentStepValid).toBe(false)
  })

  it('step 1 becomes valid when title and org are filled', () => {
    const { result } = renderHook(() => useCreateVoteDraft())
    act(() => result.current.updateField('title', '테스트 투표'))
    act(() => result.current.updateField('org', '테스트 주최'))
    expect(result.current.isCurrentStepValid).toBe(true)
  })

  it('nextStep does not advance when current step is invalid', () => {
    const { result } = renderHook(() => useCreateVoteDraft())
    act(() => result.current.nextStep())
    expect(result.current.step).toBe(1)
  })

  it('nextStep advances when step is valid', () => {
    const { result } = renderHook(() => useCreateVoteDraft())
    act(() => result.current.updateField('title', '테스트 투표'))
    act(() => result.current.updateField('org', '테스트 주최'))
    act(() => result.current.nextStep())
    expect(result.current.step).toBe(2)
  })

  it('prevStep goes back from step 2 to step 1', () => {
    const { result } = renderHook(() => useCreateVoteDraft())
    act(() => result.current.updateField('title', '테스트 투표'))
    act(() => result.current.updateField('org', '테스트 주최'))
    act(() => result.current.nextStep())
    act(() => result.current.prevStep())
    expect(result.current.step).toBe(1)
  })

  it('initializes with 2 empty candidate slots', () => {
    const { result } = renderHook(() => useCreateVoteDraft())
    expect(result.current.draft.candidates).toHaveLength(2)
  })

  it('addCandidate increases candidate count', () => {
    const { result } = renderHook(() => useCreateVoteDraft())
    act(() => result.current.addCandidate())
    expect(result.current.draft.candidates).toHaveLength(3)
  })

  it('removeCandidate removes candidate by id', () => {
    const { result } = renderHook(() => useCreateVoteDraft())
    act(() => result.current.addCandidate())
    const idToRemove = result.current.draft.candidates[2].id
    act(() => result.current.removeCandidate(idToRemove))
    expect(result.current.draft.candidates).toHaveLength(2)
    expect(result.current.draft.candidates.find((c) => c.id === idToRemove)).toBeUndefined()
  })

  it('step 2 is invalid when candidate names are empty', () => {
    const { result } = renderHook(() => useCreateVoteDraft())
    act(() => result.current.updateField('title', 'T'))
    act(() => result.current.updateField('org', 'O'))
    act(() => result.current.nextStep())
    expect(result.current.isCurrentStepValid).toBe(false)
  })

  it('step 2 is valid when 2+ candidates have names', () => {
    const { result } = renderHook(() => useCreateVoteDraft())
    act(() => result.current.updateField('title', 'T'))
    act(() => result.current.updateField('org', 'O'))
    act(() => result.current.nextStep())
    const [c1, c2] = result.current.draft.candidates
    act(() => result.current.updateCandidate(c1.id, 'name', '아티스트A'))
    act(() => result.current.updateCandidate(c2.id, 'name', '아티스트B'))
    expect(result.current.isCurrentStepValid).toBe(true)
  })

  it('updateField immutably updates draft', () => {
    const { result } = renderHook(() => useCreateVoteDraft())
    const before = result.current.draft
    act(() => result.current.updateField('title', '새 투표'))
    expect(result.current.draft).not.toBe(before)
    expect(result.current.draft.title).toBe('새 투표')
  })
})
