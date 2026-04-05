import { useState } from 'react'
import { useNavigate } from 'react-router'
import verifiedIcon from '../../assets/verified.svg'
import checkboxBlank from '../../assets/check_box_outline_blank.svg'
import { HotCardSkeleton } from '../../components/shared/HotCardSkeleton'
import { InfiniteScrollSentinel } from '../../components/shared/InfiniteScrollSentinel'
import { VoteCardSkeleton } from '../../components/shared/VoteCardSkeleton'
import { useInfiniteVotes } from '../../hooks/vote/useInfiniteVotes'
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
  end: '종료',
}

const FILTER_CHIPS = ['전체', '🎤 음악방송', '🏆 시상식', '💜 팬투표', '🌟 인기순']

function HotVoteCard({ vote, onNavigate }: { vote: HotVote; onNavigate: (id: string) => void }) {
  return (
    <div
      onClick={() => onNavigate(vote.id)}
      className="flex-shrink-0 w-[200px] bg-white border border-[#E7E9ED] rounded-2xl overflow-hidden cursor-pointer transition-[transform,box-shadow,border-color] duration-[180ms] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(113,64,255,0.10)] hover:border-[rgba(113,64,255,0.25)] active:scale-[0.98]"
    >
      <div
        className="h-[100px] flex items-center justify-center text-4xl relative"
        style={{ background: vote.gradient }}
      >
        {vote.emoji}
        <span
          className={`absolute top-2 right-2 text-[9px] font-bold font-mono px-2 py-[3px] rounded-[10px] tracking-[0.4px] uppercase ${BADGE_STYLES[vote.badge]}`}
        >
          {BADGE_LABEL[vote.badge]}
        </span>
      </div>
      <div className="px-3 pt-3 pb-[14px]">
        <div className="text-[10px] text-[#707070] font-mono mb-[3px]">{vote.org}</div>
        <div className="text-[13px] font-semibold text-[#090A0B] mb-2 leading-[1.3]">
          {vote.name}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#707070]">{vote.count} 참여</span>
          {vote.badge === 'end' ? (
            <button
              type="button"
              className="bg-[#E7E9ED] text-[#707070] rounded-lg px-[11px] py-[5px] text-[11px] font-semibold cursor-default"
              disabled
            >
              종료됨
            </button>
          ) : (
            <button
              type="button"
              className="bg-[#7140FF] text-white rounded-lg px-[11px] py-[5px] text-[11px] font-semibold hover:opacity-85 transition-opacity"
            >
              투표하기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function VoteItem({ item, onNavigate }: { item: VoteListItem; onNavigate: (id: string) => void }) {
  const isEnded = item.badge === 'end'
  return (
    <div
      onClick={() => onNavigate(isEnded ? `${item.id}/result` : item.id)}
      className="bg-white border border-[#E7E9ED] rounded-2xl p-4 flex items-center gap-[14px] cursor-pointer transition-[border-color,background] duration-150 hover:border-[rgba(113,64,255,0.25)] hover:bg-[#F0EDFF] active:scale-[0.99]"
    >
      <div
        className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: item.emojiColor }}
      >
        {item.emoji}
      </div>
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
          <strong className="text-[#7140FF] font-mono">{item.count}명</strong> 참여 중
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span
          className={`text-[9px] font-bold font-mono px-2 py-[3px] rounded-[10px] tracking-[0.4px] uppercase ${BADGE_STYLES[item.badge]}`}
        >
          {BADGE_LABEL[item.badge]}
        </span>
        <span
          className={`text-[11px] font-mono ${item.urgent ? 'text-[#dc2626] font-semibold' : 'text-[#707070]'}`}
        >
          {item.deadline}
        </span>
        <img src={checkboxBlank} alt="" className="w-4 h-4 opacity-30" />
      </div>
    </div>
  )
}

export function VoteListPage() {
  const [activeFilter, setActiveFilter] = useState(0)
  const navigate = useNavigate()
  const { isLoading, hotVotes } = useVoteList()
  const { items, hasMore, isLoadingMore, loadMore } = useInfiniteVotes()

  const handleNavigate = (id: string) => navigate(`/vote/${id}`)

  return (
    <>
      {/* Hero strip */}
      <div className="bg-[#13141A] px-5 pt-5 pb-6 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7140FF] to-transparent" />
        <div className="text-[10px] font-semibold text-[#7140FF] tracking-[1.2px] uppercase font-mono mb-1.5">
          Live Now
        </div>
        <div className="text-[22px] font-semibold text-white leading-tight mb-1">
          지금 투표하세요 🗳️
        </div>
        <div className="text-[13px] text-white/40">K-pop 팬이라면 지금 바로 참여하세요</div>
      </div>

      {/* Filter chips */}
      <div className="px-5 py-[14px] flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTER_CHIPS.map((chip, idx) => (
          <button
            key={chip}
            type="button"
            onClick={() => setActiveFilter(idx)}
            className={`inline-flex items-center px-[14px] py-[6px] rounded-[20px] text-[13px] font-medium whitespace-nowrap cursor-pointer transition-all flex-shrink-0 border ${
              activeFilter === idx
                ? 'bg-[#7140FF] text-white border-[#7140FF]'
                : 'bg-white text-[#707070] border-[#E7E9ED] hover:border-[#7140FF] hover:text-[#7140FF] hover:bg-[#F0EDFF]'
            }`}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* HOT 투표 section */}
      <div className="flex items-center justify-between px-5 pt-4 pb-[10px]">
        <span className="text-[15px] font-semibold text-[#090A0B]">🔥 HOT 투표</span>
        <span className="text-[12px] text-[#7140FF] cursor-pointer">전체 보기</span>
      </div>
      <div className="px-5 pb-1 flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isLoading
          ? Array.from({ length: 4 }, (_, i) => <HotCardSkeleton key={i} />)
          : hotVotes.map((v) => <HotVoteCard key={v.id} vote={v} onNavigate={handleNavigate} />)}
      </div>

      {/* 진행 중인 투표 section */}
      <div className="flex items-center justify-between px-5 pt-[20px] pb-[10px]">
        <span className="text-[15px] font-semibold text-[#090A0B]">진행 중인 투표</span>
        <span className="text-[12px] text-[#7140FF] cursor-pointer">정렬 ▾</span>
      </div>
      <div className="px-5 flex flex-col gap-[10px] pb-2">
        {isLoading
          ? Array.from({ length: 6 }, (_, i) => <VoteCardSkeleton key={i} />)
          : items.map((item) => <VoteItem key={item.id} item={item} onNavigate={handleNavigate} />)}
      </div>

      {/* Infinite scroll sentinel */}
      {!isLoading && (
        <InfiniteScrollSentinel onVisible={loadMore} isLoading={isLoadingMore} hasMore={hasMore} />
      )}
    </>
  )
}
