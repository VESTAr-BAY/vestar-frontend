import type { Candidate } from '../../types/vote'

interface CandidateSectionProps {
  candidates: Candidate[]
  maxChoices: number
  resultPublic: boolean
  isSelected: (id: string) => boolean
  onToggle: (id: string) => void
  isEnded: boolean
}

interface CandidateItemProps {
  candidate: Candidate
  selected: boolean
  onToggle: (id: string) => void
  isEnded: boolean
  resultPublic: boolean
}

function CandidateItem({ candidate, selected, onToggle, isEnded, resultPublic }: CandidateItemProps) {
  return (
    <button
      type="button"
      disabled={isEnded}
      onClick={() => onToggle(candidate.id)}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 relative overflow-hidden transition-all duration-150 text-left ${
        selected
          ? 'bg-[#F0EDFF] border-[#7140FF]'
          : 'bg-white border-[#E7E9ED] hover:border-[rgba(113,64,255,0.3)] hover:bg-[#F7F6FF]'
      } ${isEnded ? 'opacity-60 cursor-default' : 'cursor-pointer active:scale-[0.99]'}`}
    >
      {/* Left violet bar when selected */}
      {selected && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#7140FF] rounded-l-xl" />
      )}

      {/* Radio circle */}
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          selected ? 'border-[#7140FF] bg-[#7140FF]' : 'border-[#E7E9ED] bg-white'
        }`}
      >
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>

      {/* Emoji box */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: candidate.emojiColor }}
      >
        {candidate.emoji}
      </div>

      {/* Name + group */}
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-[#090A0B] truncate">{candidate.name}</div>
        <div className="text-[12px] text-[#707070] truncate">{candidate.group}</div>
      </div>

      {/* Votes */}
      <div className="flex-shrink-0 text-right">
        {resultPublic && candidate.votes !== undefined ? (
          <span className="text-[13px] font-mono text-[#707070]">
            {candidate.votes.toLocaleString()}
          </span>
        ) : (
          <span className="text-[13px] font-mono text-[#E7E9ED]">—</span>
        )}
      </div>
    </button>
  )
}

export function CandidateSection({
  candidates,
  maxChoices,
  resultPublic,
  isSelected,
  onToggle,
  isEnded,
}: CandidateSectionProps) {
  return (
    <div className="mx-5 mt-5">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[15px] font-semibold text-[#090A0B]">후보 선택</span>
        <span className="text-[11px] bg-[#F0EDFF] text-[#7140FF] px-2.5 py-1 rounded-full font-medium">
          {maxChoices}명 선택
        </span>
      </div>

      {/* Candidate list */}
      <div className="flex flex-col gap-2">
        {candidates.map((candidate) => (
          <CandidateItem
            key={candidate.id}
            candidate={candidate}
            selected={isSelected(candidate.id)}
            onToggle={onToggle}
            isEnded={isEnded}
            resultPublic={resultPublic}
          />
        ))}
      </div>

      {/* Result hidden message */}
      {!resultPublic && (
        <div className="mt-3 flex items-center gap-2 text-[12px] text-[#707070] bg-white border border-[#E7E9ED] rounded-xl px-3 py-2.5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>결과는 투표 종료 후 공개됩니다</span>
        </div>
      )}
    </div>
  )
}
