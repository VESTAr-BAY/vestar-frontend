import { useNavigate, useSearchParams } from 'react-router'
import { useAccount } from 'wagmi'
import keyboardArrowLeft from '../../assets/keyboard_arrow_left.svg'
import { useMyKarma } from '../../hooks/user/useMyKarma'
import { useMyVotes } from '../../hooks/user/useMyVotes'
import type { BadgeVariant, KarmaEventType, KarmaEvent, MyVoteItem } from '../../types/user'

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
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

const KARMA_TYPE_STYLES: Record<KarmaEventType, { bg: string; text: string }> = {
  vote: { bg: '#F0EDFF', text: '#7140FF' },
  referral: { bg: '#E8FFF0', text: '#16a34a' },
  bonus: { bg: '#FFF5E8', text: '#d97706' },
  streak: { bg: '#E8F0FF', text: '#2563eb' },
}

function VoteHistoryList({ votes }: { votes: MyVoteItem[] }) {
  if (votes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-5xl">🗳️</span>
        <p className="text-[14px] text-[#707070]">아직 참여한 투표가 없어요</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[10px] px-4 py-4">
      {votes.map((item) => (
        <div
          key={item.id}
          className="bg-white border border-[#E7E9ED] rounded-2xl p-4 flex items-center gap-[14px]"
        >
          <div
            className="w-[48px] h-[48px] rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: '#F0EDFF' }}
          >
            {item.choiceEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-[#707070] font-mono mb-[2px] truncate">{item.org}</div>
            <div className="text-[14px] font-semibold text-[#090A0B] mb-1 truncate leading-[1.35]">
              {item.title}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-[#707070]">선택: {item.choice}</span>
              <span className="text-[#E7E9ED]">·</span>
              <span className="text-[12px] text-[#707070]">{item.date}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-[6px] flex-shrink-0">
            <span
              className={`text-[9px] font-bold font-mono px-2 py-[3px] rounded-[10px] tracking-[0.4px] uppercase ${BADGE_STYLES[item.badge]}`}
            >
              {BADGE_LABEL[item.badge]}
            </span>
            <span className="text-[12px] font-semibold text-[#7140FF] font-mono">
              +{item.karmaEarned} ⚡
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function KarmaHistoryList({ events, total }: { events: KarmaEvent[]; total: number }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-5xl">⚡</span>
        <p className="text-[14px] text-[#707070]">아직 획득한 Karma가 없어요</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      {/* Total summary */}
      <div className="bg-white border border-[#E7E9ED] rounded-2xl px-4 py-4 mb-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-[#707070] mb-1">총 보유 Karma</div>
          <div className="text-[24px] font-bold text-[#7140FF] font-mono">
            {total.toLocaleString()} ⚡
          </div>
        </div>
        <div className="text-4xl">🏆</div>
      </div>

      {/* Timeline */}
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
                {event.icon}
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
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'karma' ? 'karma' : 'votes'

  const { votes } = useMyVotes()
  const { events, total } = useMyKarma()

  return (
    <div className="bg-[#F7F8FA] min-h-screen pb-24">
      {/* Header strip */}
      <div className="bg-[#13141A] px-5 pt-6 pb-5 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7140FF] to-transparent" />
        <button
          type="button"
          onClick={() => navigate('/vote')}
          className="flex items-center gap-1 mb-3 text-white/50 hover:text-white transition-colors"
        >
          <img src={keyboardArrowLeft} alt="" className="w-5 h-5 brightness-0 invert opacity-50" />
          <span className="text-[12px] font-mono tracking-[0.5px]">홈으로</span>
        </button>
        <div className="text-[10px] font-semibold text-[#7140FF] tracking-[1.2px] uppercase font-mono mb-1.5">
          My Page
        </div>
        <div className="text-[20px] font-semibold text-white leading-tight truncate">
          {isConnected && address ? truncateAddress(address) : '지갑 미연결'}
        </div>
        <div className="text-[13px] text-white/40 mt-[2px]">
          총 Karma{' '}
          <span className="text-[#7140FF] font-mono font-semibold">{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Tab bar */}
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
          투표 내역
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
          Karma 내역
        </button>
      </div>

      {/* Tab content */}
      {tab === 'votes' ? (
        <VoteHistoryList votes={votes} />
      ) : (
        <KarmaHistoryList events={events} total={total} />
      )}
    </div>
  )
}
