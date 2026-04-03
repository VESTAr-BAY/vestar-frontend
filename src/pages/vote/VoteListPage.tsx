import { useState } from 'react'
import verifiedIcon from '../../assets/verified.svg'
import checkboxBlank from '../../assets/check_box_outline_blank.svg'

type BadgeVariant = 'live' | 'hot' | 'new' | 'end'

interface HotVote {
  id: string
  emoji: string
  gradient: string
  org: string
  name: string
  count: string
  badge: BadgeVariant
}

interface VoteItemData {
  id: string
  emoji: string
  emojiColor: string
  org: string
  name: string
  count: string
  badge: BadgeVariant
  deadline: string
  urgent: boolean
  verified?: boolean
}

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

const HOT_VOTES: HotVote[] = [
  {
    id: '1',
    emoji: '🎤',
    gradient: 'linear-gradient(135deg,#1a1035,#2d1b6e)',
    org: 'Show! Music Core',
    name: '이번 주 1위는 누구?',
    count: '24,891명',
    badge: 'live',
  },
  {
    id: '2',
    emoji: '🏆',
    gradient: 'linear-gradient(135deg,#0a1a35,#1a2d6e)',
    org: '2025 MAMA Awards',
    name: 'Fan Choice 올해의 아티스트',
    count: '182,440명',
    badge: 'hot',
  },
  {
    id: '3',
    emoji: '💜',
    gradient: 'linear-gradient(135deg,#1a0a35,#3d1a6e)',
    org: 'ARMY 팬카페 공식',
    name: 'BTS 컴백 콘셉트 투표',
    count: '8,204명',
    badge: 'new',
  },
  {
    id: '4',
    emoji: '🎧',
    gradient: 'linear-gradient(135deg,#1a1a1a,#2a2a2a)',
    org: 'Melon Music Awards',
    name: '올해의 앨범 최종 투표',
    count: '420,100명',
    badge: 'end',
  },
]

const VOTE_ITEMS: VoteItemData[] = [
  {
    id: '1',
    emoji: '🎤',
    emojiColor: '#e8f0ff',
    org: 'Show! Music Core × Mubeat',
    name: '이번 주 1위 사전투표',
    count: '24,891',
    badge: 'live',
    deadline: '2h 14m',
    urgent: true,
    verified: true,
  },
  {
    id: '2',
    emoji: '🏆',
    emojiColor: '#e8fff0',
    org: '2025 MAMA Awards',
    name: '올해의 아티스트 Fan Choice',
    count: '182,440',
    badge: 'hot',
    deadline: '14d 남음',
    urgent: false,
    verified: true,
  },
  {
    id: '3',
    emoji: '💜',
    emojiColor: '#f0edff',
    org: 'ARMY 팬카페 공식 투표',
    name: 'BTS 컴백 콘셉트 투표',
    count: '8,204',
    badge: 'new',
    deadline: '5d 남음',
    urgent: false,
    verified: false,
  },
  {
    id: '4',
    emoji: '🎵',
    emojiColor: '#fff5e8',
    org: 'MBC Show Champion',
    name: '주간 최애 아이돌 랭킹',
    count: '51,200',
    badge: 'live',
    deadline: '45m 남음',
    urgent: true,
    verified: true,
  },
  {
    id: '5',
    emoji: '🎧',
    emojiColor: '#e8f8ff',
    org: 'Gaon Chart 공식',
    name: '이 달의 최고 뮤직비디오',
    count: '96,780',
    badge: 'hot',
    deadline: '3d 남음',
    urgent: false,
    verified: true,
  },
  {
    id: '6',
    emoji: '🌟',
    emojiColor: '#fff0f0',
    org: 'SBS 인기가요',
    name: 'K-POP 올스타 인기 투표',
    count: '134,050',
    badge: 'live',
    deadline: '7d 남음',
    urgent: false,
    verified: true,
  },
]

const FILTER_CHIPS = ['전체', '🎤 음악방송', '🏆 시상식', '💜 팬투표', '🌟 인기순']

function HotVoteCard({ vote }: { vote: HotVote }) {
  return (
    <div className="flex-shrink-0 w-[200px] bg-white border border-[#E7E9ED] rounded-2xl overflow-hidden cursor-pointer transition-[transform,box-shadow,border-color] duration-[180ms] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(113,64,255,0.10)] hover:border-[rgba(113,64,255,0.25)] active:scale-[0.98]">
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
        <div className="text-[13px] font-semibold text-[#090A0B] mb-2 leading-[1.3]">{vote.name}</div>
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

function VoteItem({ item }: { item: VoteItemData }) {
  return (
    <div className="bg-white border border-[#E7E9ED] rounded-2xl p-4 flex items-center gap-[14px] cursor-pointer transition-[border-color,background] duration-150 hover:border-[rgba(113,64,255,0.25)] hover:bg-[#F0EDFF] active:scale-[0.99]">
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
        <div className="text-[13px] text-white/40">조작 없는 온체인 K-pop 팬 투표</div>
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
        {HOT_VOTES.map((v) => (
          <HotVoteCard key={v.id} vote={v} />
        ))}
      </div>

      {/* 진행 중인 투표 section */}
      <div className="flex items-center justify-between px-5 pt-[20px] pb-[10px]">
        <span className="text-[15px] font-semibold text-[#090A0B]">진행 중인 투표</span>
        <span className="text-[12px] text-[#7140FF] cursor-pointer">정렬 ▾</span>
      </div>
      <div className="px-5 flex flex-col gap-[10px] pb-4">
        {VOTE_ITEMS.map((item) => (
          <VoteItem key={item.id} item={item} />
        ))}
      </div>
    </>
  )
}
