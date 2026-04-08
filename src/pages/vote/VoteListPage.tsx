import { useState } from 'react'
import { useNavigate } from 'react-router'
import completeVoteIcon from '../../assets/complete_vote.svg'
import checkboxBlank from '../../assets/check_box_outline_blank.svg'
import verifiedIcon from '../../assets/verified.svg'
import { useLanguage } from '../../providers/LanguageProvider'
import { useVotedVotes } from '../../hooks/useVotedVotes'
import { HotCardSkeleton } from '../../components/shared/HotCardSkeleton'
import { InfiniteScrollSentinel } from '../../components/shared/InfiniteScrollSentinel'
import { VoteCardSkeleton } from '../../components/shared/VoteCardSkeleton'
import { useInfiniteVotes, type VoteFilter } from '../../hooks/vote/useInfiniteVotes'
import { useVoteList } from '../../hooks/vote/useVoteList'
import type { BadgeVariant, HotVote, VoteListItem } from '../../types/vote'

const BADGE_STYLES: Record<BadgeVariant, string> = {
  live: 'bg-[rgba(34,197,94,0.12)] text-[#16a34a]',
  hot: 'bg-[rgba(239,68,68,0.10)] text-[#dc2626]',
  new: 'bg-[rgba(113,64,255,0.09)] text-[#7140FF]',
  end: 'bg-black/5 text-[#707070]',
}

const BADGE_LABEL: Record<BadgeVariant, string> = {
  live: '● LIVE',
  hot: '🔥 HOT',
  new: 'NEW',
  end: 'END',
}

type FilterChip = {
  labelKey: 'filter_all' | 'filter_music' | 'filter_awards' | 'filter_fan' | 'filter_popular'
  filter: VoteFilter
}

const FILTER_CHIPS: FilterChip[] = [
  { labelKey: 'filter_all', filter: 'all' },
  { labelKey: 'filter_music', filter: 'live' },
  { labelKey: 'filter_awards', filter: 'hot' },
  { labelKey: 'filter_fan', filter: 'new' },
  { labelKey: 'filter_popular', filter: 'popular' },
]

function HotVoteCard({ vote, onNavigate }: { vote: HotVote; onNavigate: (id: string) => void }) {
  const { t, lang } = useLanguage()
  const badgeLabel = vote.badge === 'end' ? t('badge_end') : BADGE_LABEL[vote.badge]

  return (
    <button
      type="button"
      onClick={() => onNavigate(vote.id)}
      className="flex-shrink-0 w-[200px] bg-white border border-[#E7E9ED] rounded-2xl overflow-hidden cursor-pointer transition-[transform,box-shadow,border-color] duration-[180ms] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(113,64,255,0.10)] hover:border-[rgba(113,64,255,0.25)] active:scale-[0.98] text-left"
    >
      <div className="h-[100px] relative" style={{ background: vote.gradient }}>
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

function VoteItem({
  item,
  onNavigate,
  isVoted,
}: {
  item: VoteListItem
  onNavigate: (id: string) => void
  isVoted: boolean
}) {
  const isEnded = item.badge === 'end'
  const { t } = useLanguage()
  const badgeLabel = item.badge === 'end' ? t('badge_end') : BADGE_LABEL[item.badge]

  return (
    <button
      type="button"
      onClick={() => onNavigate(isEnded ? `${item.id}/result` : item.id)}
      className="w-full bg-white border border-[#E7E9ED] rounded-2xl p-4 flex items-center gap-[14px] cursor-pointer transition-[border-color,background] duration-150 hover:border-[rgba(113,64,255,0.25)] hover:bg-[#F0EDFF] active:scale-[0.99] text-left"
    >
      <div
        className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: item.emojiColor }}
      ></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[11px] text-[#707070] font-mono truncate">{item.org}</span>
          {item.verified && (
            <img src={verifiedIcon} alt="verified" className="w-3 h-3 flex-shrink-0 opacity-60" />
          )}
        </div>
        <div className="text-[15px] font-semibold text-[#090A0B] mb-1.5 truncate leading-[1.35]">
          {item.name}
        </div>
        <div className="text-[12px] text-[#707070]">
          <strong className="text-[#7140FF] font-mono">{item.count}</strong> {t('vl_participating')}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span
          className={`text-[9px] font-bold font-mono px-2 py-[3px] rounded-[10px] tracking-[0.4px] uppercase ${BADGE_STYLES[item.badge]}`}
        >
          {badgeLabel}
        </span>
        <span
          className={`text-[11px] font-mono ${item.urgent ? 'text-[#dc2626] font-semibold' : 'text-[#707070]'}`}
        >
          {item.deadline}
        </span>
        {isVoted ? (
          <img
            src={completeVoteIcon}
            alt={t('vl_voted_alt')}
            className="w-4 h-4"
            style={{
              filter:
                'brightness(0) saturate(100%) invert(33%) sepia(98%) saturate(400%) hue-rotate(93deg) brightness(95%) contrast(97%)',
            }}
          />
        ) : (
          <img src={checkboxBlank} alt="" className="w-4 h-4 opacity-30" />
        )}
      </div>
    </button>
  )
}

export function VoteListPage() {
  const [activeFilter, setActiveFilter] = useState(0)
  const navigate = useNavigate()
  const { isVoted } = useVotedVotes()
  const { isLoading: isHotLoading, hotVotes } = useVoteList()
  const {
    items,
    isLoading: isItemsLoading,
    hasMore,
    isLoadingMore,
    loadMore,
  } = useInfiniteVotes(FILTER_CHIPS[activeFilter].filter)
  const { t } = useLanguage()

  const handleNavigate = (id: string) => navigate(`/vote/${id}`)

  return (
    <>
      {/* Hero strip */}
      {/*내용을 좀 더 풍성하게 작성해주면 좋을듯 */}
      <div className="h-80 relative px-5 pb-6 pt-[calc(56px+20px)] -mt-14 bg-gradient-to-r from-[#EBFBFA] to-[#F2E9FB]">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7140FF] to-transparent" />
        <div className="text-[10px] font-semibold text-violet-600 tracking-[1.2px] uppercase font-mono mb-1.5">
          Live Now
        </div>
        <div className="text-[22px] font-semibold text-violet-600 leading-tight mb-1">
          {t('vl_hero_title')}
        </div>
        <div className="text-[13px] text-violet-600/60">{t('vl_hero_sub')}</div>
      </div>

      {/* List content */}
      <div className="bg-[#FFFFFF]">
        {/* Filter chips */}
        <div className="px-5 py-[14px] flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-[#E7E9ED]">
          {FILTER_CHIPS.map(({ labelKey }, idx) => (
            <button
              key={labelKey}
              type="button"
              onClick={() => setActiveFilter(idx)}
              className={`inline-flex items-center px-[14px] py-[6px] rounded-[20px] text-[13px] font-medium whitespace-nowrap cursor-pointer transition-all flex-shrink-0 border ${
                activeFilter === idx
                  ? 'bg-[#7140FF] text-white border-[#7140FF]'
                  : 'bg-white text-[#707070] border-[#E7E9ED] hover:border-[#7140FF] hover:text-[#7140FF] hover:bg-[#F0EDFF]'
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {/* HOT section */}
        {/*컨트랙트 내용 받아와서 리스트 작성하는 것으로 전체 수정*/}
        {/*DEFAULT IMAGE 생성도 해야됨*/}
        <div className="flex items-center justify-between px-5 pt-4 pb-[10px]">
          <span className="text-[15px] font-semibold text-[#090A0B]">{t('vl_hot_section')}</span>
          <span className="text-[12px] text-[#7140FF] cursor-pointer">{t('vl_see_all')}</span>
        </div>
        <div className="px-5 pb-1 flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {isHotLoading
            ? Array.from({ length: 4 }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
                <HotCardSkeleton key={i} />
              ))
            : hotVotes.map((v) => <HotVoteCard key={v.id} vote={v} onNavigate={handleNavigate} />)}
        </div>

        <div className="border-t border-[#E7E9ED] mt-5" />

        {/* Active Votes section */}
        {/*여기에서 사용되는 EMOJI모두 지우기*/}
        <div className="flex items-center justify-between px-5 pt-[20px] pb-[10px]">
          <span className="text-[15px] font-semibold text-[#090A0B]">{t('vl_active_section')}</span>
          <span className="text-[12px] text-[#7140FF] cursor-pointer">{t('vl_sort')}</span>
        </div>
        <div className="px-5 flex flex-col gap-[10px] pb-2">
          {isItemsLoading
            ? Array.from({ length: 6 }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
                <VoteCardSkeleton key={i} />
              ))
            : items.map((item) => (
                <VoteItem
                  key={item.id}
                  item={item}
                  onNavigate={handleNavigate}
                  isVoted={isVoted(item.id)}
                />
              ))}
        </div>

        {/* Infinite scroll sentinel */}
        {!isItemsLoading && (
          <InfiniteScrollSentinel
            onVisible={loadMore}
            isLoading={isLoadingMore}
            hasMore={hasMore}
          />
        )}
      </div>
    </>
  )
}
