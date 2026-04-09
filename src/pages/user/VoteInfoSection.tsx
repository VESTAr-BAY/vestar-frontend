import { useLanguage } from '../../providers/LanguageProvider'
import type { VoteDetailData } from '../../types/vote'

interface VoteInfoSectionProps {
  vote: VoteDetailData
}

interface InfoRowProps {
  label: string
  children: React.ReactNode
  last?: boolean
}

function InfoRow({ label, children, last = false }: InfoRowProps) {
  return (
    <div
      className={`flex items-start justify-between py-[13px] gap-4 ${!last ? 'border-b border-[#E7E9ED]' : ''}`}
    >
      <span className="text-[13px] text-[#707070] flex-shrink-0">{label}</span>
      <span className="text-[13px] text-[#090A0B] text-right font-medium">{children}</span>
    </div>
  )
}

export function VoteInfoSection({ vote }: VoteInfoSectionProps) {
  const { t } = useLanguage()
  return (
    <div className="mx-5 mt-5 bg-white rounded-2xl border border-[#E7E9ED] px-4 overflow-hidden">
      <InfoRow label={t('vi_host')}>{vote.host}</InfoRow>
      <InfoRow label={t('vi_start')}>{vote.startDate}</InfoRow>
      <InfoRow label={t('vi_end')}>{vote.endDate}</InfoRow>
      <InfoRow label={t('vi_results')} last>
        <span className="text-[#7140FF]">{vote.resultReveal}</span>
      </InfoRow>
    </div>
  )
}
