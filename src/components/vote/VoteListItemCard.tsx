import checkboxBlank from '../../assets/check_box_outline_blank.svg'
import completeVoteIcon from '../../assets/complete_vote.svg'
import { useLanguage } from '../../providers/LanguageProvider'
import type { BadgeVariant, VoteListItem } from '../../types/vote'
import { resolveIpfsUrl } from '../../utils/ipfs'

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

interface VoteListItemCardProps {
  item: VoteListItem
  onNavigate: (id: string) => void
  onPrefetch?: (id: string) => void
  isVoted: boolean
}

export function VoteListItemCard({ item, onNavigate, onPrefetch, isVoted }: VoteListItemCardProps) {
  const { t } = useLanguage()
  const badgeLabel = item.badge === 'end' ? t('badge_end') : BADGE_LABEL[item.badge]

  return (
    <button
      type="button"
      onClick={() => onNavigate(item.id)}
      onMouseEnter={() => onPrefetch?.(item.id)}
      onFocus={() => onPrefetch?.(item.id)}
      onTouchStart={() => onPrefetch?.(item.id)}
      className="w-full bg-white border border-[#E7E9ED] rounded-2xl p-4 flex items-center gap-[14px] cursor-pointer transition-[border-color,background] duration-150 hover:border-[rgba(113,64,255,0.25)] hover:bg-[#F0EDFF] active:scale-[0.99] text-left"
    >
      <div
        className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden bg-[#F7F8FA]"
        style={!item.imageUrl ? { background: item.emojiColor } : undefined}
      >
        {item.imageUrl ? (
          <img src={resolveIpfsUrl(item.imageUrl)} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[11px] text-[#707070] font-mono truncate">{item.org}</span>
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
        {item.deadline ? (
          <span
            className={`text-[11px] font-mono ${item.urgent ? 'text-[#dc2626] font-semibold' : 'text-[#707070]'}`}
          >
            {item.deadline}
          </span>
        ) : null}
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
