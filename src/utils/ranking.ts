type Rankable = {
  votes: number
}

export function assignCompetitionRanks<T extends Rankable>(items: T[]) {
  let previousVotes: number | null = null
  let previousRank = 0

  return items.map((item, index) => {
    const rank = previousVotes === item.votes ? previousRank : index + 1

    previousVotes = item.votes
    previousRank = rank

    return {
      ...item,
      rank,
    }
  })
}
