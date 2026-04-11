import { useNavigate, useSearchParams } from 'react-router'
import { useAccount } from 'wagmi'
import completeVoteIcon from '../../assets/complete_vote.svg'
import karmaIcon from '../../assets/karma.svg'
import { useMyKarma } from '../../hooks/user/useMyKarma'
import { useMyVotes } from '../../hooks/user/useMyVotes'
import { useSmartBackNavigation } from '../../hooks/useSmartBackNavigation'
import { useLanguage } from '../../providers/LanguageProvider'
import type { BadgeVariant, KarmaEvent, KarmaEventType, MyVoteItem } from '../../types/user'

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const BADGE_STYLES: Record<BadgeVariant, string> = {
  live: 'bg-[rgba(34,197,94,0.12)] text-[#16a34a]',
  hot: 'bg-[rgba(239,68,68,0.10)] text-[#dc2626]',
  new: 'bg-[rgba(113,64,255,0.09)] text-[#7140FF]',
  end: 'bg-black/5 text-[#707070]',
}

const KARMA_TYPE_STYLES: Record<KarmaEventType, { bg: string; text: string }> = {
  vote: { bg: '#F0EDFF', text: '#7140FF' },
  referral: { bg: '#E8FFF0', text: '#16a34a' },
  bonus: { bg: '#FFF5E8', text: '#d97706' },
  streak: { bg: '#E8F0FF', text: '#2563eb' },
}

function VoteHistoryList({ votes, isLoading }: { votes: MyVoteItem[]; isLoading: boolean }) {
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const badgeLabel: Record<BadgeVariant, string> = {
    live: '● LIVE',
    hot: 'HOT',
    new: 'NEW',
    end: lang === 'ko' ? '종료' : 'END',
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <img src={completeVoteIcon} alt="" className="w-10 h-10 opacity-35" />
        <p className="text-[14px] text-[#707070]">{t('common_loading')}</p>
      </div>
    )
  }

  if (votes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <img src={completeVoteIcon} alt="" className="w-10 h-10 opacity-35" />
        <p className="text-[14px] text-[#707070]">{t('mp_no_votes')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[10px] px-4 py-4">
      {votes.map((item) => (
        <button
          type="button"
          key={item.id}
          onClick={() =>
            navigate(`/vote/${item.voteId}`, {
              state: {
                // sungje : 마이페이지 투표내역에서 들어오면 당시 제출한 선택값을 그대로 보여주는 읽기 전용 뷰로 연다.
                historySelectionCandidateKeys: item.selectedCandidateKeys,
                historySelectionLabel: item.choice,
              },
            })
          }
          className="bg-white border border-[#E7E9ED] rounded-2xl p-4 flex items-center gap-[14px] text-left transition-colors hover:border-[#d9ddf3]"
        >
          <div
            className="w-[48px] h-[48px] rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: '#F0EDFF' }}
          >
            <img src={completeVoteIcon} alt="" className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-[#707070] font-mono mb-[2px] truncate">{item.org}</div>
            <div className="text-[14px] font-semibold text-[#090A0B] mb-1 truncate leading-[1.35]">
              {item.title}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-[#707070]">
                {t('mp_voted_label')} {item.choice}
              </span>
              <span className="text-[#E7E9ED]">·</span>
              <span className="text-[12px] text-[#707070]">{item.date}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-[6px] flex-shrink-0">
            <span
              className={`text-[9px] font-bold font-mono px-2 py-[3px] rounded-[10px] tracking-[0.4px] uppercase ${BADGE_STYLES[item.badge]}`}
            >
              {badgeLabel[item.badge]}
            </span>
            <span className="text-[12px] font-semibold text-[#7140FF] font-mono">
              +{item.karmaEarned}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}

function KarmaHistoryList({ events, total }: { events: KarmaEvent[]; total: number }) {
  const { t } = useLanguage()

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <img src={karmaIcon} alt="" className="w-10 h-10 opacity-35" />
        <p className="text-[14px] text-[#707070]">{t('mp_no_karma')}</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      <div className="bg-white border border-[#E7E9ED] rounded-2xl px-4 py-4 mb-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-[#707070] mb-1">{t('mp_total_karma_stat')}</div>
          <div className="text-[24px] font-bold text-[#7140FF] font-mono">
            {total.toLocaleString()}
          </div>
        </div>
        <img src={karmaIcon} alt="" className="w-8 h-8 opacity-70" />
      </div>

      <div className="flex flex-col gap-[8px]">
        {events.map((event) => {
          const style = KARMA_TYPE_STYLES[event.type]
          return (
            <div
              key={event.id}
              className="bg-white border border-[#E7E9ED] rounded-2xl px-4 py-3 flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: style.bg }}
              >
                <img src={karmaIcon} alt="" className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[#090A0B] leading-[1.35] truncate">
                  {event.label}
                </div>
                <div className="text-[11px] text-[#707070] mt-[2px]">{event.date}</div>
              </div>
              <span
                className="text-[15px] font-bold font-mono flex-shrink-0"
                style={{ color: style.text }}
              >
                +{event.karma}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function MyPage() {
  const { address, isConnected } = useAccount()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigateBack = useSmartBackNavigation('/vote')
  const tab = searchParams.get('tab') === 'karma' ? 'karma' : 'votes'
  const { t } = useLanguage()

  const { votes, isLoading: isVotesLoading } = useMyVotes()
  const { events, total, tier } = useMyKarma()

  return (
    <div className="min-h-screen pb-24">
      <div className="relative h-[17.5rem] [margin-top:calc(var(--header-h)*-1)] overflow-hidden bg-gradient-to-r from-[#EBFBFA] to-[#F2E9FB] px-5 pb-5 pt-[calc(var(--header-h)+14px)]">
        <button
          type="button"
          aria-label={t('btn_back')}
          onClick={navigateBack}
          className="absolute left-5 top-[calc(var(--header-h)+8px)] z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-[#13141A] shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Decorative: large circle ring — top-right */}
        <svg aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 opacity-[0.08]" width="200" height="200" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="92" stroke="#7140FF" strokeWidth="10" />
        </svg>
        {/* Decorative: dotted arc — bottom-left */}
        <svg aria-hidden="true" className="pointer-events-none absolute -bottom-6 -left-6 opacity-[0.06]" width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="52" stroke="#7140FF" strokeWidth="5" strokeDasharray="4 8" />
        </svg>
        {/* Decorative: sparkle star */}
        <svg aria-hidden="true" className="pointer-events-none absolute right-8 top-[calc(var(--header-h)+30px)] opacity-[0.18] animate-pulse" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 0L8.3 5.7L14 7L8.3 8.3L7 14L5.7 8.3L0 7L5.7 5.7Z" fill="#7140FF" />
        </svg>
        {/* Bottom separator */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7140FF]/25 to-transparent" />

        <div className="relative mt-10">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#7140FF]/20 bg-[rgba(113,64,255,0.07)] px-3 py-[5px]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7140FF]" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[1.2px] text-[#7140FF]">My Page</span>
          </span>
          <h1 className="mb-2 bg-gradient-to-r from-[#7140FF] to-[#22d3ee] bg-clip-text text-[26px] font-bold tracking-tight leading-tight text-transparent">
            {isConnected && address ? truncateAddress(address) : t('pp_not_connected')}
          </h1>
          <p className="text-[13px] leading-relaxed text-violet-600/60">
            {tier.label}
          </p>
        </div>
      </div>

      <div className="bg-white border-b border-[#E7E9ED] flex">
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'votes' })}
          className={`flex-1 py-3 text-[14px] font-semibold transition-colors ${
            tab === 'votes'
              ? 'text-[#7140FF] border-b-2 border-[#7140FF]'
              : 'text-[#707070] border-b-2 border-transparent'
          }`}
        >
          {t('mp_tab_votes')}
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'karma' })}
          className={`flex-1 py-3 text-[14px] font-semibold transition-colors ${
            tab === 'karma'
              ? 'text-[#7140FF] border-b-2 border-[#7140FF]'
              : 'text-[#707070] border-b-2 border-transparent'
          }`}
        >
          {t('mp_tab_karma')}
        </button>
      </div>

      <div className="bg-[#ffffff] min-h-screen">
        {tab === 'votes' ? (
          <VoteHistoryList votes={votes} isLoading={isVotesLoading} />
        ) : (
          <KarmaHistoryList events={events} total={total} />
        )}
      </div>
    </div>
  )
}
