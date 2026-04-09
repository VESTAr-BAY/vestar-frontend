import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { fetchElections } from '../../api/elections'
import verifiedIcon from '../../assets/verified.svg'
import { VoteCardSkeleton } from '../../components/shared/VoteCardSkeleton'
import { VoteListItemCard } from '../../components/vote/VoteListItemCard'
import { VOTE_ITEMS } from '../../data/mockVotes'
import { useVotedVotes } from '../../hooks/useVotedVotes'
import { useLanguage } from '../../providers/LanguageProvider'
import type { VoteListItem } from '../../types/vote'
import { mapToVoteListItem } from '../../utils/electionMapper'
import { resolveIpfsUrl } from '../../utils/ipfs'
import {
  buildVoteTargetPath,
  groupVoteItemsBySeries,
  type VoteSeriesGroup,
} from '../../utils/voteSeries'

type SeriesLocationState = {
  title?: string
  host?: string
  verified?: boolean
  imageUrl?: string
}

export function VoteSeriesPage() {
  const { seriesKey } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isVoted } = useVotedVotes()
  const { t, lang } = useLanguage()
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
  const seriesImageUrl = seriesGroup?.imageUrl ?? locationState.imageUrl
  const seriesCountLabel = seriesGroup
    ? lang === 'ko'
      ? `${seriesGroup.items.length}개의 투표`
      : `${seriesGroup.items.length} votes`
    : t('vs_loading')

  return (
    <div className="bg-[#FFFFFF] min-h-screen">
      <div className="relative overflow-hidden px-5 pb-6 pt-[calc(56px+20px)]">
        {seriesImageUrl ? (
          <img
            src={resolveIpfsUrl(seriesImageUrl)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#DFF8F5_0%,#EDE9FE_52%,#FDE68A_100%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090A0B]/84 via-[#090A0B]/42 to-transparent" />

        <div className="relative flex min-h-[224px] flex-col">
          <button
            type="button"
            onClick={() => navigate('/vote')}
            className="inline-flex self-start rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-sm"
          >
            {t('vs_back_to_list')}
          </button>

          <div className="mt-auto">
            <div className="text-[10px] font-semibold tracking-[1.2px] uppercase font-mono text-white/72">
              {t('vs_label')}
            </div>
            <div className="mt-1 text-[26px] font-semibold leading-tight text-white">
              {seriesTitle}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-white/80">
              <span className="rounded-full bg-white/12 px-2.5 py-1 backdrop-blur-sm">
                {seriesCountLabel}
              </span>
              {seriesHost ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/18 bg-white/12 px-2.5 py-1 backdrop-blur-sm">
                  {seriesVerified ? (
                    <img
                      src={verifiedIcon}
                      alt="verified organizer"
                      className="w-4 h-4"
                      style={{
                        filter:
                          'brightness(0) saturate(100%) invert(76%) sepia(13%) saturate(2082%) hue-rotate(90deg) brightness(91%) contrast(89%)',
                      }}
                    />
                  ) : null}
                  <span className="font-semibold text-white">{seriesHost}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 4 }, (_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
            <VoteCardSkeleton key={index} />
          ))
        ) : seriesGroup ? (
          seriesGroup.items.map((item) => (
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
        ) : (
          <div className="rounded-2xl border border-[#E7E9ED] bg-white px-4 py-5 text-[14px] text-[#707070]">
            {t('vs_empty')}
          </div>
        )}
      </div>
    </div>
  )
}
