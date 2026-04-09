import { useNavigate } from 'react-router'
import { useHostVotes } from '../../hooks/host/useHostVotes'
import { useLanguage } from '../../providers/LanguageProvider'

type BadgeVariant = 'live' | 'hot' | 'new' | 'end'

interface HostVoteCard {
  id: string
  title: string
  badge: BadgeVariant
  participantCount: number
  endDate: string
  emoji: string
}

const BADGE_STYLES: Record<BadgeVariant, string> = {
  live: 'bg-[rgba(34,197,94,0.12)] text-[#16a34a]',
  hot: 'bg-[rgba(239,68,68,0.10)] text-[#dc2626]',
  new: 'bg-[rgba(113,64,255,0.09)] text-[#7140FF]',
  end: 'bg-black/5 text-[#707070]',
}

function VoteCard({ vote, onNavigate }: { vote: HostVoteCard; onNavigate: (id: string) => void }) {
  const { lang } = useLanguage()

  const badgeLabel: Record<BadgeVariant, string> = {
    live: '● LIVE',
    hot: '🔥 HOT',
    new: 'NEW',
    end: lang === 'ko' ? '종료' : 'END',
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onNavigate(`/host/manage/${vote.id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onNavigate(`/host/manage/${vote.id}`)
        }
      }}
      className="w-full bg-white border border-[#E7E9ED] rounded-2xl p-4 flex items-center gap-4 text-left transition-colors hover:border-[#d9ddf3]"
    >
      <div className="w-12 h-12 rounded-xl bg-[#F0EDFF] flex items-center justify-center text-2xl flex-shrink-0">
        {vote.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-[#090A0B] truncate mb-1">{vote.title}</div>
        <div className="flex items-center gap-2 text-[12px] text-[#707070]">
          <span className="font-mono">{vote.participantCount.toLocaleString()}</span>
          <span>· {vote.endDate}</span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <span
          className={`text-[11px] font-bold font-mono px-3 py-1 rounded-[12px] tracking-[0.5px] uppercase ${BADGE_STYLES[vote.badge]}`}
        >
          {badgeLabel[vote.badge]}
        </span>
      </div>
    </div>
  )
}

export function HostDashboardPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { votes, activeCount, completedCount, isLoading } = useHostVotes()

  return (
    <>
      {/* Header strip */}
      <div className="bg-[#13141A] px-5 pt-[calc(56px+20px)] pb-6 relative overflow-hidden -mt-14">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7140FF] to-transparent" />
        <div className="text-[10px] font-semibold text-[#7140FF] tracking-[1.2px] uppercase font-mono mb-1.5">
          Host Dashboard
        </div>
        <div className="text-[22px] font-semibold text-white leading-tight mb-1">
          {t('hd_title')}
        </div>
        <div className="text-[13px] text-white/40">{t('hd_sub')}</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-[1px] bg-[#E7E9ED] mt-4 mx-5 rounded-2xl overflow-hidden">
        {[
          { key: 'total', labelKey: 'hd_my_votes' as const, value: String(votes.length) },
          { key: 'active', labelKey: 'hd_active' as const, value: String(activeCount) },
          { key: 'completed', labelKey: 'hd_completed' as const, value: String(completedCount) },
        ].map((stat) => (
          <div key={stat.key} className="bg-white px-3 py-3 text-center">
            <div className="text-[18px] font-bold text-[#7140FF] font-mono">{stat.value}</div>
            <div className="text-[11px] text-[#707070] mt-0.5">{t(stat.labelKey)}</div>
          </div>
        ))}
      </div>

      {/* Create CTA */}
      <div className="px-5 mt-5">
        <button
          type="button"
          onClick={() => navigate('/host/create')}
          className="w-full bg-[#7140FF] text-white rounded-2xl py-4 text-[15px] font-bold hover:opacity-85 transition-opacity active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t('hd_create_btn')}
        </button>
      </div>

      {/* My votes list */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[15px] font-semibold text-[#090A0B]">{t('hd_my_votes')}</span>
          <span className="text-[12px] text-[#707070] font-mono">{votes.length}</span>
        </div>
        <div className="flex flex-col gap-3 pb-4">
          {isLoading ? (
            <div className="bg-white border border-[#E7E9ED] rounded-2xl p-6 text-center text-[13px] text-[#707070]">
              불러오는 중...
            </div>
          ) : votes.length > 0 ? (
            votes.map((vote) => <VoteCard key={vote.id} vote={vote} onNavigate={navigate} />)
          ) : (
            <div className="bg-white border border-[#E7E9ED] rounded-2xl p-6 text-center text-[13px] text-[#707070]">
              아직 생성한 투표가 없습니다.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
