import type { RankedCandidate } from '../../types/vote'

interface VoteResultRankingsProps {
  rankedCandidates: RankedCandidate[]
}

const RANK_COLORS: Record<number, string> = {
  1: 'text-[#F59E0B]',
  2: 'text-[#9CA3AF]',
  3: 'text-[#CD7C3A]',
}

const BAR_COLORS: Record<number, string> = {
  1: 'bg-[#F59E0B]',
  2: 'bg-[#7140FF]',
  3: 'bg-[#7140FF]/70',
}

export function VoteResultRankings({ rankedCandidates }: VoteResultRankingsProps) {
  const sorted = [...rankedCandidates].sort((a, b) => a.rank - b.rank)

  return (
    <div className="mx-5 mt-5 mb-6">
      <div className="text-[13px] font-semibold text-[#707070] uppercase tracking-wider font-mono mb-3">
        전체 순위
      </div>

      <div className="flex flex-col gap-3">
        {sorted.map((candidate) => (
          <div key={candidate.id} className="bg-white rounded-2xl border border-[#E7E9ED] p-4">
            <div className="flex items-center gap-3">
              {/* Rank number */}
              <div
                className={`w-7 h-7 flex items-center justify-center font-bold font-mono text-[14px] flex-shrink-0 ${RANK_COLORS[candidate.rank] ?? 'text-[#707070]'}`}
              >
                <span data-testid="rank-number">{candidate.rank}</span>
              </div>

              {/* Emoji box */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: candidate.emojiColor }}
              >
                {candidate.emoji}
              </div>

              {/* Name + group */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-[14px] font-semibold text-[#090A0B] truncate"
                  data-testid="candidate-name"
                >
                  {candidate.name}
                </div>
                <div className="text-[11px] text-[#707070] truncate">{candidate.group}</div>
              </div>

              {/* Stats */}
              <div className="flex-shrink-0 text-right">
                <div
                  className={`text-[15px] font-bold font-mono ${RANK_COLORS[candidate.rank] ?? 'text-[#090A0B]'}`}
                >
                  {candidate.percentage.toFixed(1)}%
                </div>
                <div className="text-[11px] font-mono text-[#707070]">
                  {candidate.votes.toLocaleString()}표
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1.5 bg-[#F7F8FA] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${BAR_COLORS[candidate.rank] ?? 'bg-[#E7E9ED]'}`}
                style={{ width: `${candidate.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
