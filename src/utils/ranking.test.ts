import { describe, expect, it } from 'vitest'
import { assignCompetitionRanks } from './ranking'

describe('assignCompetitionRanks', () => {
  it('assigns competition ranks for tied vote counts', () => {
    const ranked = assignCompetitionRanks([
      { id: '1', votes: 2 },
      { id: '2', votes: 1 },
      { id: '3', votes: 1 },
      { id: '4', votes: 1 },
      { id: '5', votes: 1 },
      { id: '6', votes: 0 },
    ])

    expect(ranked.map((candidate) => candidate.rank)).toEqual([1, 2, 2, 2, 2, 6])
  })

  it('keeps sequential ranks when there are no ties', () => {
    const ranked = assignCompetitionRanks([
      { id: '1', votes: 5 },
      { id: '2', votes: 4 },
      { id: '3', votes: 3 },
    ])

    expect(ranked.map((candidate) => candidate.rank)).toEqual([1, 2, 3])
  })
})
