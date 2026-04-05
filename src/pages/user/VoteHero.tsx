import verifiedIcon from '../../assets/verified.svg'
import type { VoteDetailData } from '../../types/vote'
import type { BadgeVariant } from '../../types/vote'

const BADGE_STYLES: Record<BadgeVariant, string> = {
  live: 'bg-[rgba(34,197,94,0.12)] text-[#4ade80] border border-[rgba(74,222,128,0.2)]',
  hot: 'bg-[rgba(239,68,68,0.10)] text-[#f87171] border border-[rgba(248,113,113,0.2)]',
  new: 'bg-[rgba(113,64,255,0.09)] text-[#a78bfa] border border-[rgba(167,139,250,0.2)]',
  end: 'bg-white/5 text-white/30',
}

const BADGE_LABEL: Record<BadgeVariant, string> = {
  live: '● LIVE',
  hot: '🔥 HOT',
  new: 'NEW',
  end: '종료',
}

interface VoteHeroProps {
  vote: VoteDetailData
}

export function VoteHero({ vote }: VoteHeroProps) {
  return (
    <div className="bg-[linear-gradient(180deg,#1a1035_0%,#0f0a24_60%,#090A0B_100%)] px-5 pt-6 pb-7 relative overflow-hidden">
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7140FF] to-transparent" />

      {/* Top row: badge + deadline */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`text-[10px] font-bold font-mono px-2 py-[3px] rounded-[10px] tracking-[0.4px] uppercase ${BADGE_STYLES[vote.badge]}`}
        >
          {BADGE_LABEL[vote.badge]}
        </span>
        <span
          className={`text-[12px] font-mono ${vote.urgent ? 'text-[#f87171]' : 'text-white/40'}`}
        >
          {vote.deadlineLabel}
        </span>
      </div>

      {/* Org icon */}
      <div className="w-16 h-16 bg-white/[0.06] border border-white/[0.08] rounded-[18px] flex items-center justify-center text-[32px] mb-4">
        {vote.emoji}
      </div>

      {/* Org row */}
      <div className="flex items-center gap-1 mb-2">
        <span className="text-[11px] text-white/40 font-mono">{vote.org}</span>
        {vote.verified && <span className="text-[#a78bfa] text-[11px]">✦</span>}
        {vote.verified && <img src={verifiedIcon} alt="verified" className="w-3 h-3 opacity-50" />}
      </div>

      {/* Title */}
      <h1 className="text-[22px] font-bold text-white leading-tight mb-4">{vote.title}</h1>

      {/* Meta row */}
      <div className="flex items-center gap-0 text-[12px] text-white/40 flex-wrap">
        <span className="font-mono font-semibold text-white/60">
          {vote.participantCount.toLocaleString()}명 참여
        </span>
        <span className="mx-2">·</span>
        <span>{vote.voteFrequency}</span>
        <span className="mx-2">·</span>
        <span>{vote.voteLimit}</span>
      </div>
    </div>
  )
}
