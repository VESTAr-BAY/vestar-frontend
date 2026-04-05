import { useNavigate } from 'react-router'

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

const BADGE_LABEL: Record<BadgeVariant, string> = {
  live: '● LIVE',
  hot: '🔥 HOT',
  new: 'NEW',
  end: '종료',
}

const MOCK_HOST_VOTES: HostVoteCard[] = [
  {
    id: '1',
    emoji: '🎤',
    title: '이번 주 1위는 누구?',
    badge: 'live',
    participantCount: 24891,
    endDate: '2025.04.03',
  },
  {
    id: '7',
    emoji: '🏆',
    title: '지난 달 최고의 무대',
    badge: 'end',
    participantCount: 18204,
    endDate: '2025.03.27',
  },
]

function VoteCard({ vote, onNavigate }: { vote: HostVoteCard; onNavigate: (id: string) => void }) {
  const isEnded = vote.badge === 'end'

  return (
    <div className="bg-white border border-[#E7E9ED] rounded-2xl p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-[#F0EDFF] flex items-center justify-center text-2xl flex-shrink-0">
        {vote.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-[#090A0B] truncate mb-1">{vote.title}</div>
        <div className="flex items-center gap-2 text-[12px] text-[#707070]">
          <span
            className={`text-[9px] font-bold font-mono px-2 py-[3px] rounded-[10px] tracking-[0.4px] uppercase ${BADGE_STYLES[vote.badge]}`}
          >
            {BADGE_LABEL[vote.badge]}
          </span>
          <span className="font-mono">{vote.participantCount.toLocaleString()}명</span>
          <span>· {vote.endDate}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onNavigate(isEnded ? `/vote/${vote.id}/result` : `/vote/${vote.id}`)}
        className="flex-shrink-0 text-[12px] font-semibold text-[#7140FF] bg-[#F0EDFF] px-3 py-1.5 rounded-lg hover:bg-[#E5DFFF] transition-colors"
      >
        {isEnded ? '결과 보기' : '관리'}
      </button>
    </div>
  )
}

export function HostDashboardPage() {
  const navigate = useNavigate()

  return (
    <>
      {/* Header strip */}
      <div className="bg-[#13141A] px-5 pt-5 pb-6 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7140FF] to-transparent" />
        <div className="text-[10px] font-semibold text-[#7140FF] tracking-[1.2px] uppercase font-mono mb-1.5">
          Host Dashboard
        </div>
        <div className="text-[22px] font-semibold text-white leading-tight mb-1">
          내 투표 관리 🗳️
        </div>
        <div className="text-[13px] text-white/40">투표를 만들고 결과를 확인하세요</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-[1px] bg-[#E7E9ED] mt-4 mx-5 rounded-2xl overflow-hidden">
        {[
          { label: '진행 중', value: '1' },
          { label: '총 참여', value: '43,095' },
          { label: '완료된 투표', value: '1' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white px-3 py-3 text-center">
            <div className="text-[18px] font-bold text-[#7140FF] font-mono">{stat.value}</div>
            <div className="text-[11px] text-[#707070] mt-0.5">{stat.label}</div>
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
          새 투표 만들기
        </button>
      </div>

      {/* My votes list */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[15px] font-semibold text-[#090A0B]">내 투표 목록</span>
          <span className="text-[12px] text-[#707070] font-mono">{MOCK_HOST_VOTES.length}개</span>
        </div>
        <div className="flex flex-col gap-3 pb-4">
          {MOCK_HOST_VOTES.map((vote) => (
            <VoteCard key={vote.id} vote={vote} onNavigate={navigate} />
          ))}
        </div>
      </div>
    </>
  )
}
