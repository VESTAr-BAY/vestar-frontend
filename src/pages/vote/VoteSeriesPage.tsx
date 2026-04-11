import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import verifiedIcon from '../../assets/verified.svg'
import { fetchCandidateManifest } from '../../api/candidateManifest'
import { fetchElections } from '../../api/elections'
import { VoteListItemCard } from '../../components/vote/VoteListItemCard'
import { VoteCardSkeleton } from '../../components/shared/VoteCardSkeleton'
import { useVotedVotes } from '../../hooks/useVotedVotes'
import { VOTE_ITEMS } from '../../data/mockVotes'
import { useLanguage } from '../../providers/LanguageProvider'
import type { VoteListItem } from '../../types/vote'
import { applyManifestToElection, mapToVoteListItem } from '../../utils/electionMapper'
import {
  buildVoteTargetPath,
  groupVoteItemsBySeries,
  type VoteSeriesGroup,
} from '../../utils/voteSeries'

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
  const { t, lang } = useLanguage()
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState<VoteListItem[]>([])
  const decodedSeriesKey = decodeURIComponent(seriesKey ?? '')
  const locationState = (location.state ?? {}) as SeriesLocationState

  useEffect(() => {
    let cancelled = false

    fetchElections()
      .then((elections) =>
        Promise.all(
          elections.map(async (election) =>
            applyManifestToElection(
              election,
              await fetchCandidateManifest(
                election.candidateManifestUri,
                election.candidateManifestHash,
              ),
            ),
          ),
        ),
      )
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

  const seriesTitle = seriesGroup?.title ?? locationState.title ?? t('vs_label')
  const seriesHost = seriesGroup?.host ?? locationState.host
  const seriesVerified = seriesGroup?.verified ?? locationState.verified

  return (
    <div className="bg-[#FFFFFF] min-h-screen">
      <div className="relative px-5 pt-5 pb-8 bg-gradient-to-r from-[#EBFBFA] to-[#F2E9FB] overflow-hidden">
        {/* Decorative: large circle ring — top-right */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 opacity-[0.08]"
          width="200"
          height="200"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle cx="100" cy="100" r="92" stroke="#7140FF" strokeWidth="10" />
        </svg>
        {/* Decorative: dotted arc — bottom-left */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-6 -left-6 opacity-[0.06]"
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
        >
          <circle cx="60" cy="60" r="52" stroke="#7140FF" strokeWidth="5" strokeDasharray="4 8" />
        </svg>
        {/* Decorative: sparkle star */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-8 top-4 opacity-[0.18] animate-pulse"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
        >
          <path d="M7 0L8.3 5.7L14 7L8.3 8.3L7 14L5.7 8.3L0 7L5.7 5.7Z" fill="#7140FF" />
        </svg>
        {/* Bottom separator */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7140FF]/25 to-transparent" />

        <div className="relative">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#7140FF]/20 bg-[rgba(113,64,255,0.07)] px-3 py-[5px]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7140FF]" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[1.2px] text-[#7140FF]">
              {t('vs_label')}
            </span>
          </span>
          <h1 className="mt-1 bg-gradient-to-r from-[#7140FF] to-[#22d3ee] bg-clip-text text-[26px] font-bold tracking-tight leading-tight text-transparent">
            {seriesTitle}
          </h1>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[12px] text-[#707070]">
          <span>
            {seriesGroup
              ? lang === 'ko'
                ? `${seriesGroup.items.length}개의 투표`
                : `${seriesGroup.items.length} vote${seriesGroup.items.length === 1 ? '' : 's'}`
              : t('vs_loading')}
          </span>
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
