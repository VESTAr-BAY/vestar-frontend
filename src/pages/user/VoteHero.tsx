import verifiedIcon from '../../assets/verified.svg'
import { useLanguage } from '../../providers/LanguageProvider'
import { resolveIpfsUrl } from '../../utils/ipfs'
import type { BadgeVariant, VoteDetailData } from '../../types/vote'

const BADGE_STYLES: Record<BadgeVariant, string> = {
  live: 'bg-[rgba(34,197,94,0.12)] text-[#16a34a] border border-[rgba(34,197,94,0.2)]',
  hot: 'bg-[rgba(239,68,68,0.10)] text-[#dc2626] border border-[rgba(239,68,68,0.2)]',
  new: 'bg-[rgba(113,64,255,0.09)] text-[#7140FF] border border-[rgba(113,64,255,0.2)]',
  end: 'bg-black/5 text-[#707070]',
}

const BADGE_LABEL: Record<BadgeVariant, string> = {
  live: '● LIVE',
  hot: '🔥 HOT',
  new: 'NEW',
  end: 'END',
}

interface VoteHeroProps {
  vote: VoteDetailData
}

export function VoteHero({ vote }: VoteHeroProps) {
  const { t } = useLanguage()

  return (
    <div className="bg-gradient-to-r from-[#EBFBFA] to-[#F2E9FB] px-5 pb-7 pt-[calc(56px+24px)] -mt-14 relative overflow-hidden">
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7140FF] to-transparent" />

      {/* Top row: badge + deadline */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`text-[10px] font-bold font-mono px-2 py-[3px] rounded-[10px] tracking-[0.4px] uppercase ${BADGE_STYLES[vote.badge]}`}
        >
          {vote.badge === 'end' ? t('badge_end') : BADGE_LABEL[vote.badge]}
        </span>
        <span
          className={`text-[12px] font-mono ${vote.urgent ? 'text-[#dc2626]' : 'text-[#707070]'}`}
        >
          {vote.deadlineLabel}
        </span>
      </div>

      {/* Banner image (shown when available) */}
      {vote.imageUrl && (
        <div className="mb-4 rounded-2xl overflow-hidden h-[140px] -mx-5 px-0">
          <img
            src={resolveIpfsUrl(vote.imageUrl)}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Org icon */}
      <div className="w-16 h-16 bg-white/60 border border-[#E7E9ED] rounded-[18px] flex items-center justify-center text-[32px] mb-4">
        {vote.emoji}
      </div>

      {/* Org row */}
      <div className="flex items-center gap-1 mb-2">
        <span className="text-[11px] text-[#707070] font-mono">{vote.org}</span>
        {vote.verified && <span className="text-[#7140FF] text-[11px]">✦</span>}
        {vote.verified && <img src={verifiedIcon} alt="verified" className="w-3 h-3 opacity-60" />}
      </div>

      {/* Title */}
      <h1 className="text-[22px] font-bold text-[#090A0B] leading-tight mb-4">{vote.title}</h1>

      {/* Meta row */}
      <div className="flex items-center gap-0 text-[12px] text-[#707070] flex-wrap mb-3">
        <span className="font-mono font-semibold text-[#090A0B]">
          {vote.participantCount.toLocaleString()} {t('vh_participants')}
        </span>
        <span className="mx-2">·</span>
        <span>{vote.voteFrequency}</span>
        <span className="mx-2">·</span>
        <span>{vote.voteLimit}</span>
      </div>

    </div>
  )
}
