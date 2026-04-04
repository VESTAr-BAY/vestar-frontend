import type { RankedCandidate, VoteResultData } from '../../types/vote'

interface VoteResultWinnerProps {
  result: VoteResultData
  winner: RankedCandidate
}

export function VoteResultWinner({ result, winner }: VoteResultWinnerProps) {
  return (
    <div className="bg-[linear-gradient(180deg,#1a1035_0%,#0f0a24_60%,#090A0B_100%)] px-5 pt-6 pb-8 relative overflow-hidden">
      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7140FF] to-transparent" />

      {/* Top: badge + end date */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-[10px] tracking-[0.4px] uppercase bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border border-[rgba(245,158,11,0.25)]">
          🏆 결과 발표
        </span>
        <span className="text-[12px] font-mono text-white/40">{result.endDate} 종료</span>
      </div>

      {/* Vote title + org */}
      <div className="text-[11px] font-mono text-white/40 mb-1 flex items-center gap-1">
        {result.org}
        {result.verified && <span className="text-[#a78bfa]">✦</span>}
      </div>
      <h1 className="text-[20px] font-bold text-white leading-tight mb-6">{result.title}</h1>

      {/* Winner card */}
      <div className="bg-white/[0.07] border border-[rgba(245,158,11,0.3)] rounded-2xl p-5">
        <div className="text-[11px] font-mono text-[#F59E0B] mb-3 uppercase tracking-wider">
          🥇 1위
        </div>
        <div className="flex items-center gap-4">
          <div
            className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-[36px] flex-shrink-0 ring-2 ring-[#F59E0B]/40"
            style={{ backgroundColor: winner.emojiColor }}
          >
            {winner.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[22px] font-bold text-white leading-tight">{winner.name}</div>
            <div className="text-[13px] text-white/50 mt-0.5">{winner.group}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[18px] font-bold font-mono text-[#F59E0B]">
                {winner.percentage.toFixed(1)}%
              </span>
              <span className="text-[12px] font-mono text-white/40">
                ({winner.votes.toLocaleString()}표)
              </span>
            </div>
          </div>
        </div>

        {/* Winner bar */}
        <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#F59E0B]"
            style={{ width: `${winner.percentage}%` }}
          />
        </div>
      </div>

      {/* Total votes */}
      <div className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-white/35 font-mono">
        총 <span className="text-white/60 font-semibold">{result.totalVotes.toLocaleString()}</span>명 참여
      </div>
    </div>
  )
}
