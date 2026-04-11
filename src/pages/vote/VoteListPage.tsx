import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import completeVoteIcon from '../../assets/complete_vote.svg'
import verifiedIcon from '../../assets/verified.svg'
import { HotCardSkeleton } from '../../components/shared/HotCardSkeleton'
import { InfiniteScrollSentinel } from '../../components/shared/InfiniteScrollSentinel'
import { VoteCardSkeleton } from '../../components/shared/VoteCardSkeleton'
import { useVotedVotes } from '../../hooks/useVotedVotes'
import { useInfiniteVotes } from '../../hooks/vote/useInfiniteVotes'
import { useVoteList } from '../../hooks/vote/useVoteList'
import { useLanguage } from '../../providers/LanguageProvider'
import type { BadgeVariant, HotVote } from '../../types/vote'
import { resolveIpfsUrl } from '../../utils/ipfs'
import {
  buildVoteSeriesTargetPath,
  groupVoteItemsBySeries,
  isVoteSeriesEnded,
  type VoteSeriesGroup,
} from '../../utils/voteSeries'

const BADGE_STYLES: Record<BadgeVariant, string> = {
  live: 'bg-[rgba(34,197,94,0.12)] text-[#16a34a]',
  hot: 'bg-[rgba(239,68,68,0.10)] text-[#dc2626]',
  new: 'bg-[rgba(113,64,255,0.09)] text-[#7140FF]',
  end: 'bg-black/5 text-[#707070]',
}

const BADGE_LABEL: Record<BadgeVariant, string> = {
  live: '● LIVE',
  hot: 'HOT',
  new: 'NEW',
  end: 'END',
}

type FilterChip = {
  labelKey: 'filter_all' | 'filter_music' | 'filter_awards' | 'filter_fan' | 'filter_other'
  filter: HomeCategoryFilter
}

type HomeCategoryFilter = 'all' | 'music' | 'awards' | 'fan' | 'other'

const FILTER_CHIPS: FilterChip[] = [
  { labelKey: 'filter_all', filter: 'all' },
  { labelKey: 'filter_music', filter: 'music' },
  { labelKey: 'filter_awards', filter: 'awards' },
  { labelKey: 'filter_fan', filter: 'fan' },
  { labelKey: 'filter_other', filter: 'other' },
]

function normalizeHomeCategory(category?: string | null): HomeCategoryFilter {
  const normalized = category?.trim().toLowerCase()

  switch (normalized) {
    case '음악방송':
    case 'music show':
    case 'music shows':
      return 'music'
    case '시상식':
    case 'awards':
      return 'awards'
    case '팬투표':
    case 'fan vote':
    case 'fan votes':
      return 'fan'
    case '콘셉트':
    case 'concept':
    case '기타':
    case 'other':
    default:
      return 'other'
  }
}

function matchesHomeCategory(category: string | null | undefined, filter: HomeCategoryFilter) {
  if (filter === 'all') {
    return true
  }

  return normalizeHomeCategory(category) === filter
}

function getHeroCopy(filter: HomeCategoryFilter, lang: string) {
  switch (filter) {
    case 'music':
      return lang === 'ko'
        ? {
            eyebrow: '음악방송',
            title: '음악방송 투표를 한눈에 볼 수 있어요',
            sub: '음악방송 카테고리의 진행 중이거나 마감된 투표를 빠르게 둘러보세요.',
          }
        : {
            eyebrow: 'Music Shows',
            title: 'See music show votes at a glance',
            sub: 'Browse active and ended votes from the music show category.',
          }
    case 'awards':
      return lang === 'ko'
        ? {
            eyebrow: '시상식',
            title: '시상식 투표를 한눈에 볼 수 있어요',
            sub: '시상식 카테고리의 진행 중이거나 마감된 투표를 빠르게 둘러보세요.',
          }
        : {
            eyebrow: 'Awards',
            title: 'See awards votes at a glance',
            sub: 'Browse active and ended votes from the awards category.',
          }
    case 'fan':
      return lang === 'ko'
        ? {
            eyebrow: '팬투표',
            title: '팬투표를 한눈에 볼 수 있어요',
            sub: '팬투표 카테고리의 진행 중이거나 마감된 투표를 빠르게 둘러보세요.',
          }
        : {
            eyebrow: 'Fan Votes',
            title: 'See fan votes at a glance',
            sub: 'Browse active and ended votes from the fan vote category.',
          }
    case 'other':
      return lang === 'ko'
        ? {
            eyebrow: '기타',
            title: '기타 카테고리 투표를 한눈에 볼 수 있어요',
            sub: '기타 카테고리의 진행 중이거나 마감된 투표를 빠르게 둘러보세요.',
          }
        : {
            eyebrow: 'Other',
            title: 'See other category votes at a glance',
            sub: 'Browse active and ended votes from other categories.',
          }
    default:
      return lang === 'ko'
        ? {
            eyebrow: '전체 보기',
            title: '지금 열려 있는 투표를 한눈에 볼 수 있어요',
            sub: '진행 중이거나 마감된 투표를 모아서 빠르게 둘러보세요.',
          }
        : {
            eyebrow: 'All Votes',
            title: 'See currently open votes at a glance',
            sub: 'Browse active and ended votes in one place.',
          }
  }
}

function HotVoteCard({ vote, onNavigate }: { vote: HotVote; onNavigate: (vote: HotVote) => void }) {
  const { t, lang } = useLanguage()
  const badgeLabel = vote.badge === 'end' ? t('badge_end') : BADGE_LABEL[vote.badge]

  return (
    <button
      type="button"
      onClick={() => onNavigate(vote)}
      className="flex-shrink-0 w-[200px] bg-white border border-[#E7E9ED] rounded-2xl overflow-hidden cursor-pointer transition-[transform,box-shadow,border-color] duration-[180ms] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(113,64,255,0.10)] hover:border-[rgba(113,64,255,0.25)] active:scale-[0.98] text-left"
    >
      <div
        className="h-[100px] relative overflow-hidden"
        style={!vote.imageUrl ? { background: vote.gradient } : undefined}
      >
        {vote.imageUrl ? (
          <img
            src={resolveIpfsUrl(vote.imageUrl)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090A0B]/26 to-transparent" />
        <span
          className={`absolute top-2 right-2 text-[9px] font-bold font-mono px-2 py-[3px] rounded-[10px] tracking-[0.4px] uppercase ${BADGE_STYLES[vote.badge]}`}
        >
          {badgeLabel}
        </span>
      </div>
      <div className="px-3 pt-3 pb-[14px]">
        <div className="text-[10px] text-[#707070] font-mono mb-[3px]">{vote.org}</div>
        <div className="text-[13px] font-semibold text-[#090A0B] mb-2 leading-[1.3]">
          {vote.name}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#707070]">
            {lang === 'ko' ? `${vote.count}명 참여` : `${vote.count} votes`}
          </span>
          {vote.badge === 'end' ? (
            <span className="bg-[#E7E9ED] text-[#707070] rounded-lg px-[11px] py-[5px] text-[11px] font-semibold">
              {t('vl_ended_badge')}
            </span>
          ) : (
            <span className="bg-[#7140FF] text-white rounded-lg px-[11px] py-[5px] text-[11px] font-semibold">
              {t('vl_vote_btn')}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function SeriesVoteCard({
  group,
  onNavigate,
  hasVoted,
}: {
  group: VoteSeriesGroup
  onNavigate: (group: VoteSeriesGroup) => void
  hasVoted: boolean
}) {
  const { lang } = useLanguage()
  const isEndedSeries = isVoteSeriesEnded(group)
  const previewLabel =
    group.items.length === 1
      ? group.items[0].name
      : group.items
          .slice(0, 2)
          .map((item) => item.name)
          .join(' · ')
  const descriptionLabel =
    group.items.length === 1
      ? isEndedSeries
        ? lang === 'ko'
          ? `${group.items[0].count}명 참여`
          : `${group.items[0].count} votes`
        : lang === 'ko'
          ? `${group.items[0].count}명 참여 중`
          : `${group.items[0].count} voting`
      : isEndedSeries
        ? lang === 'ko'
          ? `${group.items.length}개의 마감된 투표`
          : `${group.items.length} ended votes`
        : lang === 'ko'
          ? `${group.items.length}개의 투표`
          : `${group.items.length} votes`
  const ctaLabel = isEndedSeries
    ? group.items.length === 1
      ? lang === 'ko'
        ? '결과 보기'
        : 'View results'
      : lang === 'ko'
        ? `${group.items.length}개 보기`
        : `View ${group.items.length}`
    : group.items.length === 1
      ? lang === 'ko'
        ? '바로 입장'
        : 'Open vote'
      : lang === 'ko'
        ? `${group.items.length}개 보기`
        : `View ${group.items.length}`
  const cardClass = isEndedSeries
    ? 'w-full overflow-hidden rounded-[26px] border border-[#D8DEE6] bg-[#F4F6F8] text-left transition-[transform,box-shadow,border-color] duration-[180ms] hover:-translate-y-0.5 hover:border-[#C4CCD6] hover:shadow-[0_10px_26px_rgba(15,23,42,0.08)] active:scale-[0.99]'
    : 'w-full overflow-hidden rounded-[26px] border border-[#E7E9ED] bg-white text-left transition-[transform,box-shadow,border-color] duration-[180ms] hover:-translate-y-0.5 hover:border-[rgba(113,64,255,0.25)] hover:shadow-[0_10px_30px_rgba(113,64,255,0.12)] active:scale-[0.99]'
  const bannerClass = isEndedSeries
    ? 'relative h-[148px] overflow-hidden bg-gradient-to-br from-[#EEF1F4] via-[#E5E7EB] to-[#D3D8DF]'
    : 'relative h-[148px] overflow-hidden bg-gradient-to-br from-[#EBFBFA] via-[#F2E9FB] to-[#FFF4D6]'
  const bannerFallbackClass = isEndedSeries
    ? 'absolute inset-0 bg-[radial-gradient(circle_at_top_left,#ffffff_0%,rgba(255,255,255,0.28)_24%,transparent_52%),linear-gradient(135deg,#EDF1F5_0%,#E3E7ED_55%,#CDD3DB_100%)]'
    : 'absolute inset-0 bg-[radial-gradient(circle_at_top_left,#ffffff_0%,rgba(255,255,255,0.18)_28%,transparent_56%),linear-gradient(135deg,#DFF8F5_0%,#EDE9FE_52%,#FDE68A_100%)]'
  const overlayClass = isEndedSeries
    ? 'absolute inset-0 bg-gradient-to-t from-[#1F2937]/78 via-[#4B5563]/34 to-transparent'
    : 'absolute inset-0 bg-gradient-to-t from-[#090A0B]/78 via-[#090A0B]/28 to-transparent'
  const titleVerifiedFilter = isEndedSeries
    ? 'grayscale(1) brightness(1.15)'
    : 'brightness(0) saturate(100%) invert(76%) sepia(13%) saturate(2082%) hue-rotate(90deg) brightness(91%) contrast(89%)'
  const ctaClass = isEndedSeries
    ? 'inline-flex flex-shrink-0 rounded-full bg-[#E1E5EA] px-3 py-1.5 text-[11px] font-semibold text-[#5B6470]'
    : 'inline-flex flex-shrink-0 rounded-full bg-[#F0EDFF] px-3 py-1.5 text-[11px] font-semibold text-[#7140FF]'

  return (
    <button type="button" onClick={() => onNavigate(group)} className={cardClass}>
      <div className={bannerClass}>
        {group.imageUrl ? (
          <img
            src={resolveIpfsUrl(group.imageUrl)}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover ${isEndedSeries ? 'grayscale' : ''}`}
          />
        ) : (
          <div className={bannerFallbackClass} />
        )}

        <div className={overlayClass} />

        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
          <span className="inline-flex rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-bold font-mono tracking-[0.5px] text-[#090A0B]">
            {descriptionLabel}
          </span>
          {hasVoted ? (
            <span
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm ${
                isEndedSeries ? 'bg-white/16' : 'bg-[rgba(34,197,94,0.14)]'
              }`}
            >
              <img
                src={completeVoteIcon}
                alt=""
                className="h-4 w-4"
                style={{
                  filter: isEndedSeries
                    ? 'grayscale(1) brightness(1.2)'
                    : 'brightness(0) saturate(100%) invert(33%) sepia(98%) saturate(400%) hue-rotate(93deg) brightness(95%) contrast(97%)',
                }}
              />
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          {group.host ? (
            <div className="mb-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-black/28 px-2.5 py-1 text-[11px] text-white/92 backdrop-blur-sm">
              {group.verified ? (
                <img
                  src={verifiedIcon}
                  alt="verified organizer"
                  className="h-4 w-4 flex-shrink-0"
                  style={{
                    filter: titleVerifiedFilter,
                  }}
                />
              ) : null}
              <span className="truncate font-medium">{group.host}</span>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <div className="min-w-0 text-[22px] font-semibold leading-tight text-white">
              {group.title}
            </div>
            {group.verified ? (
              <img
                src={verifiedIcon}
                alt="verified series"
                className="h-5 w-5 flex-shrink-0"
                style={{
                  filter: titleVerifiedFilter,
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-[14px] font-medium ${isEndedSeries ? 'text-[#3F4752]' : 'text-[#090A0B]'}`}
          >
            {previewLabel}
          </div>
          <div
            className={`mt-1 text-[12px] ${isEndedSeries ? 'text-[#6B7280]' : 'text-[#707070]'}`}
          >
            {descriptionLabel}
          </div>
        </div>
        <span className={ctaClass}>{ctaLabel}</span>
      </div>
    </button>
  )
}

export function VoteListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isVoted } = useVotedVotes()
  const { isLoading: isHotLoading, hotVotes } = useVoteList()
  const {
    allItems,
    items,
    isLoading: isItemsLoading,
    hasMore,
    isLoadingMore,
    loadMore,
  } = useInfiniteVotes()
  const { t, lang } = useLanguage()
  const activeCategory = useMemo<HomeCategoryFilter>(() => {
    const category = searchParams.get('category')
    return FILTER_CHIPS.some((chip) => chip.filter === category)
      ? (category as HomeCategoryFilter)
      : 'all'
  }, [searchParams])
  const seriesTab = searchParams.get('tab') === 'ended' ? 'ended' : 'active'
  const activeVisibilityFilter =
    searchParams.get('visibility') === 'OPEN' || searchParams.get('visibility') === 'PRIVATE'
      ? (searchParams.get('visibility') as 'OPEN' | 'PRIVATE')
      : 'all'
  const activePaymentFilter =
    searchParams.get('payment') === 'FREE' || searchParams.get('payment') === 'PAID'
      ? (searchParams.get('payment') as 'FREE' | 'PAID')
      : 'all'
  const heroCopy = getHeroCopy(activeCategory, lang)
  const updateFilters = (next: {
    category?: HomeCategoryFilter
    tab?: 'active' | 'ended'
    visibility?: 'all' | 'OPEN' | 'PRIVATE'
    payment?: 'all' | 'FREE' | 'PAID'
  }) => {
    const params = new URLSearchParams(searchParams)
    const category = next.category ?? activeCategory
    const tab = next.tab ?? seriesTab
    const visibility = next.visibility ?? activeVisibilityFilter
    const payment = next.payment ?? activePaymentFilter

    category === 'all' ? params.delete('category') : params.set('category', category)
    tab === 'active' ? params.delete('tab') : params.set('tab', tab)
    visibility === 'all' ? params.delete('visibility') : params.set('visibility', visibility)
    payment === 'all' ? params.delete('payment') : params.set('payment', payment)

    setSearchParams(params, { replace: true })
  }
  const activeVisibilityChips = [
    { key: 'all' as const, label: lang === 'ko' ? '전체' : 'All' },
    { key: 'OPEN' as const, label: 'OPEN' },
    { key: 'PRIVATE' as const, label: 'PRIVATE' },
  ]
  const activePaymentChips = [
    { key: 'all' as const, label: lang === 'ko' ? '전체' : 'All' },
    { key: 'FREE' as const, label: lang === 'ko' ? '무료' : 'FREE' },
    { key: 'PAID' as const, label: lang === 'ko' ? '유료' : 'PAID' },
  ]

  const handleHotNavigate = (vote: HotVote) => {
    navigate(vote.badge === 'end' ? `/vote/${vote.id}/result` : `/vote/${vote.id}`)
  }

  const handleSeriesNavigate = (group: VoteSeriesGroup) => {
    const targetPath = buildVoteSeriesTargetPath(group)

    if (group.items.length === 1) {
      navigate(targetPath)
      return
    }

    navigate(targetPath, {
      state: {
        title: group.title,
        host: group.host,
        verified: group.verified,
        imageUrl: group.imageUrl,
      },
    })
  }

  const visibleVoteItems = items.filter((item) => {
    const matchesCategory = matchesHomeCategory(item.category, activeCategory)
    const matchesVisibility =
      activeVisibilityFilter === 'all' || item.visibilityMode === activeVisibilityFilter
    const matchesPayment = activePaymentFilter === 'all' || item.paymentMode === activePaymentFilter
    return matchesCategory && matchesVisibility && matchesPayment
  })
  const allVoteItems = allItems.filter((item) => {
    const matchesCategory = matchesHomeCategory(item.category, activeCategory)
    const matchesVisibility =
      activeVisibilityFilter === 'all' || item.visibilityMode === activeVisibilityFilter
    const matchesPayment = activePaymentFilter === 'all' || item.paymentMode === activePaymentFilter
    return matchesCategory && matchesVisibility && matchesPayment
  })
  const visibleHotVotes = hotVotes.filter((vote) =>
    matchesHomeCategory(vote.category, activeCategory),
  )
  const visibleGroupedItems = groupVoteItemsBySeries(visibleVoteItems)
  const visibleActiveGroups = visibleGroupedItems.filter((group) => !isVoteSeriesEnded(group))
  const visibleEndedGroups = visibleGroupedItems.filter((group) => isVoteSeriesEnded(group))
  const allGroupedItems = groupVoteItemsBySeries(allVoteItems)
  const allActiveGroups = allGroupedItems.filter((group) => !isVoteSeriesEnded(group))
  const allEndedGroups = allGroupedItems.filter((group) => isVoteSeriesEnded(group))
  const totalGroups = seriesTab === 'active' ? allActiveGroups : allEndedGroups
  const groupedItems = seriesTab === 'active' ? visibleActiveGroups : visibleEndedGroups
  const hasMoreSeries = groupedItems.length < totalGroups.length
  const shouldShowHotSection = isHotLoading || visibleHotVotes.length > 0
  const shouldShowEmptyState = !isItemsLoading && groupedItems.length === 0 && !hasMoreSeries

  return (
    <>
      {/* Hero Banner */}
      <div className="relative h-[17.5rem] [margin-top:calc(var(--header-h)*-1)] overflow-hidden bg-gradient-to-r from-[#EBFBFA] to-[#F2E9FB] px-5 pb-5 pt-[calc(var(--header-h)+14px)]">
        {/* Decorative: large faint circle ring — top-right, partially clipped */}
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

        {/* Decorative: dotted arc — bottom-left, partially clipped */}
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

        {/* Decorative: sparkle star — right of content area */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-8 top-[calc(var(--header-h)+30px)] opacity-[0.18] animate-pulse"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
        >
          <path d="M7 0L8.3 5.7L14 7L8.3 8.3L7 14L5.7 8.3L0 7L5.7 5.7Z" fill="#7140FF" />
        </svg>

        {/* Bottom separator */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7140FF]/25 to-transparent" />

        {/* Content */}
        <div className="relative mt-10">
          {/* Eyebrow badge */}
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#7140FF]/20 bg-[rgba(113,64,255,0.07)] px-3 py-[5px]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7140FF]" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[1.2px] text-[#7140FF]">
              {heroCopy.eyebrow}
            </span>
          </span>

          {/* Title — gradient text */}
          <h1 className="mb-2 bg-gradient-to-r from-[#7140FF] to-[#22d3ee] bg-clip-text text-[26px] font-bold tracking-tight leading-tight text-transparent">
            {heroCopy.title}
          </h1>

          {/* Subtitle */}
          <p className="text-[13px] leading-relaxed text-violet-600/60">{heroCopy.sub}</p>
        </div>
      </div>

      <div className="bg-[#FFFFFF]">
        <div className="px-5 py-[14px] flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-[#E7E9ED]">
          {FILTER_CHIPS.map(({ labelKey, filter }) => (
            <button
              key={filter}
              type="button"
              onClick={() => updateFilters({ category: filter })}
              className={`inline-flex items-center px-[14px] py-[6px] rounded-[20px] text-[13px] font-medium whitespace-nowrap cursor-pointer transition-all flex-shrink-0 border ${
                activeCategory === filter
                  ? 'bg-[#7140FF] text-white border-[#7140FF]'
                  : 'bg-white text-[#707070] border-[#E7E9ED] hover:border-[#7140FF] hover:text-[#7140FF] hover:bg-[#F0EDFF]'
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {shouldShowHotSection ? (
          <>
            <div className="flex items-center justify-between px-5 pt-4 pb-[10px]">
              <span className="text-[15px] font-semibold text-[#090A0B]">
                {t('vl_hot_section')}
              </span>
              <span className="text-[12px] text-[#7140FF] cursor-pointer">{t('vl_see_all')}</span>
            </div>
            <div className="px-5 pb-1 flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {isHotLoading
                ? Array.from({ length: 4 }, (_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
                    <HotCardSkeleton key={i} />
                  ))
                : visibleHotVotes.map((vote) => (
                    <HotVoteCard key={vote.id} vote={vote} onNavigate={handleHotNavigate} />
                  ))}
            </div>

            <div className="border-t border-[#E7E9ED] mt-5" />
          </>
        ) : null}

        <div className="px-5 pt-[20px] pb-[10px] flex flex-col gap-3">
          {/* Full-width segmented toggle */}
          <div className="flex rounded-full bg-[#F4F5F7] p-1">
            <button
              type="button"
              onClick={() => updateFilters({ tab: 'active' })}
              className={`flex-1 rounded-full py-2 text-[13px] font-semibold text-center transition-colors ${
                seriesTab === 'active'
                  ? 'bg-white text-[#090A0B] shadow-[0_4px_12px_rgba(15,23,42,0.08)]'
                  : 'text-[#707070]'
              }`}
            >
              {t('vl_active_section')}
            </button>
            <button
              type="button"
              onClick={() => updateFilters({ tab: 'ended' })}
              className={`flex-1 rounded-full py-2 text-[13px] font-semibold text-center transition-colors ${
                seriesTab === 'ended'
                  ? 'bg-white text-[#090A0B] shadow-[0_4px_12px_rgba(15,23,42,0.08)]'
                  : 'text-[#707070]'
              }`}
            >
              {t('vl_ended_section')}
            </button>
          </div>

          {/* Filters + sort label */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-[11px] font-semibold text-[#7140FF]">
                  {lang === 'ko' ? '공개 방식' : 'Visibility'}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {activeVisibilityChips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => updateFilters({ visibility: chip.key })}
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                        activeVisibilityFilter === chip.key
                          ? 'border-[#7140FF] bg-[#F0EDFF] text-[#7140FF]'
                          : 'border-[#E7E9ED] bg-white text-[#707070]'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-[11px] font-semibold text-[#7140FF]">
                  {lang === 'ko' ? '결제 방식' : 'Payment'}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {activePaymentChips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => updateFilters({ payment: chip.key })}
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                        activePaymentFilter === chip.key
                          ? 'border-[#7140FF] bg-[#F0EDFF] text-[#7140FF]'
                          : 'border-[#E7E9ED] bg-white text-[#707070]'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <span className="shrink-0 pt-1 text-[12px] text-[#7140FF]">
              {lang === 'ko' ? '최신순' : 'Latest'}
            </span>
          </div>
        </div>
        <div className="px-5 flex flex-col gap-4 pb-2">
          {isItemsLoading ? (
            Array.from({ length: 6 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
              <VoteCardSkeleton key={i} />
            ))
          ) : groupedItems.length > 0 ? (
            groupedItems.map((group) => (
              <SeriesVoteCard
                key={group.key}
                group={group}
                onNavigate={handleSeriesNavigate}
                hasVoted={group.items.some((item) => isVoted(item.id))}
              />
            ))
          ) : shouldShowEmptyState ? (
            <div className="rounded-2xl border border-[#E7E9ED] bg-white px-4 py-5 text-[14px] text-[#707070]">
              {t(seriesTab === 'active' ? 'vl_empty_active' : 'vl_empty_ended')}
            </div>
          ) : null}
        </div>

        {!isItemsLoading && !shouldShowEmptyState && (
          <InfiniteScrollSentinel
            onVisible={loadMore}
            isLoading={isLoadingMore}
            hasMore={hasMore && hasMoreSeries}
          />
        )}
      </div>
    </>
  )
}
