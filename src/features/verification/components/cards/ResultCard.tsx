import { useLanguage } from '../../../../providers/LanguageProvider'
import { PortalPanel } from '../ui/PortalPanel'

type ResultCardProps = {
  rank: number
  name: string
  emoji: string
  subtitle: string
  votes: number
  percentage: number
}

export function ResultCard({
  rank,
  name,
  emoji,
  subtitle,
  votes,
  percentage,
}: ResultCardProps) {
  const { lang } = useLanguage()
  const rankColor =
    rank === 1 ? 'text-[#F59E0B]' : rank === 2 ? 'text-[#9CA3AF]' : 'text-[#CD7C3A]'
  const barColor = rank === 1 ? 'bg-[#F59E0B]' : rank === 2 ? 'bg-[#7140FF]' : 'bg-[#8B5CF6]'

  return (
    <PortalPanel className="rounded-[22px]">
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center font-mono text-[14px] font-bold ${rankColor}`}>
          {rank}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EDFF] text-[18px]">
          {emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-[#090A0B]">{name}</div>
          <div className="truncate text-[12px] text-[#707070]">{subtitle}</div>
        </div>
        <div className="text-right">
          <div className={`font-mono text-[15px] font-bold ${rankColor}`}>{percentage.toFixed(1)}%</div>
          <div className="font-mono text-[12px] text-[#707070]">
            {lang === 'ko' ? `${votes.toLocaleString()}표` : `${votes.toLocaleString()} votes`}
          </div>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#F7F8FA]">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </PortalPanel>
  )
}
