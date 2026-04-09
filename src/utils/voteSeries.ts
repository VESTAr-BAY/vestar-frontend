import type { VoteListItem } from '../types/vote'

export interface VoteSeriesGroup {
  key: string
  title: string
  host?: string
  verified?: boolean
  items: VoteListItem[]
}

export function buildVoteTargetPath(item: VoteListItem): string {
  return item.badge === 'end' ? `/vote/${item.id}/result` : `/vote/${item.id}`
}

export function groupVoteItemsBySeries(items: VoteListItem[]): VoteSeriesGroup[] {
  const groups = items.reduce<VoteSeriesGroup[]>((accumulator, item) => {
    const resolvedSeriesKey = item.seriesKey ?? `series:${item.org}`
    const existingGroup = accumulator.find((group) => group.key === resolvedSeriesKey)

    if (existingGroup) {
      existingGroup.items.push(item)
      existingGroup.host = existingGroup.host ?? item.host
      existingGroup.verified = existingGroup.verified ?? item.verified
      return accumulator
    }

    accumulator.push({
      key: resolvedSeriesKey,
      title: item.org,
      host: item.host,
      verified: item.verified,
      items: [item],
    })
    return accumulator
  }, [])

  // sungje : 시리즈 카드와 시리즈 상세가 같은 순서를 보도록 묶은 뒤 내부 아이템을 한 번 더 최신순으로 정렬한다.
  groups.forEach((group) => {
    group.items.sort((left, right) => (right.sortKey ?? Number(right.id)) - (left.sortKey ?? Number(left.id)))
  })

  return groups
}
