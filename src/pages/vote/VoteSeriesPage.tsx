import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import verifiedIcon from '../../assets/verified.svg'
import { fetchElections } from '../../api/elections'
import { VoteListItemCard } from '../../components/vote/VoteListItemCard'
import { VoteCardSkeleton } from '../../components/shared/VoteCardSkeleton'
import { useVotedVotes } from '../../hooks/useVotedVotes'
import { VOTE_ITEMS } from '../../data/mockVotes'
import type { VoteListItem } from '../../types/vote'
import { mapToVoteListItem } from '../../utils/electionMapper'
import { buildVoteTargetPath, groupVoteItemsBySeries, type VoteSeriesGroup } from '../../utils/voteSeries'

type SeriesLocationState = {
  title?: string
  host?: string
  verified?: boolean
}

export function VoteSeriesPage() {
  const { seriesKey } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isVoted } = useVotedVotes()
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState<VoteListItem[]>([])
  const decodedSeriesKey = decodeURIComponent(seriesKey ?? '')
  const locationState = (location.state ?? {}) as SeriesLocationState

  useEffect(() => {
    let cancelled = false

    fetchElections()
      .then((elections) => {
        if (cancelled) return
        setItems(elections.map((election, index) => mapToVoteListItem(election, index)))
      })
      .catch(() => {
        if (cancelled) return
        setItems(VOTE_ITEMS)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const seriesGroup = useMemo<VoteSeriesGroup | null>(() => {
    const groupedItems = groupVoteItemsBySeries(items)
    return groupedItems.find((group) => group.key === decodedSeriesKey) ?? null
  }, [decodedSeriesKey, items])

  useEffect(() => {
    if (isLoading || !seriesGroup || seriesGroup.items.length !== 1) return

    navigate(buildVoteTargetPath(seriesGroup.items[0]), { replace: true })
  }, [isLoading, navigate, seriesGroup])

  const seriesTitle = seriesGroup?.title ?? locationState.title ?? '시리즈'
  const seriesHost = seriesGroup?.host ?? locationState.host
  const seriesVerified = seriesGroup?.verified ?? locationState.verified

  return (
    <div className="bg-[#FFFFFF] min-h-screen">
      <div className="px-5 pt-[calc(56px+20px)] pb-6 bg-gradient-to-r from-[#EBFBFA] to-[#F2E9FB]">
        <button
          type="button"
          onClick={() => navigate('/vote')}
          className="text-[12px] font-semibold text-[#7140FF]"
        >
          목록으로 돌아가기
        </button>
        <div className="mt-4 text-[10px] font-semibold text-violet-600 tracking-[1.2px] uppercase font-mono">
          Series
        </div>
        <div className="mt-1 text-[24px] font-semibold text-[#090A0B]">{seriesTitle}</div>
        <div className="mt-2 flex items-center gap-2 text-[12px] text-[#707070]">
          <span>{seriesGroup ? `${seriesGroup.items.length}개의 투표` : '투표를 찾는 중'}</span>
          {seriesHost ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#E7E9ED] bg-white px-2.5 py-1">
              {seriesVerified ? (
                <img
                  src={verifiedIcon}
                  alt="verified organizer"
                  className="w-4 h-4"
                  style={{
                    filter:
                      'brightness(0) saturate(100%) invert(48%) sepia(76%) saturate(566%) hue-rotate(88deg) brightness(95%) contrast(93%)',
                  }}
                />
              ) : null}
              <span className="font-semibold text-[#090A0B]">{seriesHost}</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="px-5 py-5 flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
              <VoteCardSkeleton key={index} />
            ))
          : seriesGroup
            ? seriesGroup.items.map((item) => (
                <VoteListItemCard
                  key={item.id}
                  item={item}
                  onNavigate={(id) => {
                    const target = seriesGroup.items.find((candidate) => candidate.id === id)
                    if (!target) return
                    navigate(buildVoteTargetPath(target))
                  }}
                  isVoted={isVoted(item.id)}
                />
              ))
            : (
                <div className="rounded-2xl border border-[#E7E9ED] bg-white px-4 py-5 text-[14px] text-[#707070]">
                  이 시리즈에 표시할 투표가 아직 없습니다.
                </div>
              )}
      </div>
    </div>
  )
}
