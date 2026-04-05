import type { CandidateDraft, VoteCreateDraft } from '../../../types/host'

const CANDIDATE_EMOJIS = ['🎵', '👑', '💗', '🌌', '❄️', '🍀', '🔥', '⭐', '🌙', '🎀', '💎', '🦋']
const MAX_CANDIDATES = 10

interface StepCandidatesProps {
  candidates: VoteCreateDraft['candidates']
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, field: keyof Omit<CandidateDraft, 'id'>, value: string) => void
}

export function StepCandidates({ candidates, onAdd, onRemove, onUpdate }: StepCandidatesProps) {
  return (
    <div className="px-5 py-6">
      <div className="text-[12px] text-[#707070] mb-4">
        최소 2명, 최대 {MAX_CANDIDATES}명까지 등록할 수 있습니다.
      </div>

      <div className="flex flex-col gap-4">
        {candidates.map((candidate, idx) => (
          <div key={candidate.id} className="bg-white border border-[#E7E9ED] rounded-2xl p-4">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-semibold text-[#7140FF] font-mono">
                후보 {idx + 1}
              </span>
              {candidates.length > 2 && (
                <button
                  type="button"
                  onClick={() => onRemove(candidate.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-[#707070] hover:bg-[#FEF2F2] hover:text-[#dc2626] transition-colors"
                  aria-label="후보 삭제"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Emoji row */}
            <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 [scrollbar-width:none]">
              {CANDIDATE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onUpdate(candidate.id, 'emoji', emoji)}
                  className={`w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center text-base transition-all ${
                    candidate.emoji === emoji
                      ? 'bg-[#F0EDFF] border-2 border-[#7140FF]'
                      : 'bg-[#F7F8FA] border border-[#E7E9ED] hover:border-[#7140FF]/40'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Name */}
            <input
              type="text"
              value={candidate.name}
              onChange={(e) => onUpdate(candidate.id, 'name', e.target.value)}
              placeholder="아티스트 이름 *"
              maxLength={30}
              className="w-full bg-[#F7F8FA] border border-[#E7E9ED] rounded-xl px-3 py-2.5 text-[14px] text-[#090A0B] placeholder:text-[#C0C4CC] outline-none focus:border-[#7140FF] focus:bg-white transition-all mb-2"
            />

            {/* Group */}
            <input
              type="text"
              value={candidate.group}
              onChange={(e) => onUpdate(candidate.id, 'group', e.target.value)}
              placeholder="소속사 / 그룹 (선택)"
              maxLength={30}
              className="w-full bg-[#F7F8FA] border border-[#E7E9ED] rounded-xl px-3 py-2.5 text-[14px] text-[#090A0B] placeholder:text-[#C0C4CC] outline-none focus:border-[#7140FF] focus:bg-white transition-all"
            />
          </div>
        ))}
      </div>

      {/* Add button */}
      {candidates.length < MAX_CANDIDATES && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-4 w-full py-3.5 border-2 border-dashed border-[#E7E9ED] rounded-2xl text-[14px] font-semibold text-[#7140FF] hover:border-[#7140FF] hover:bg-[#F0EDFF] transition-all flex items-center justify-center gap-2"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          후보 추가
        </button>
      )}
    </div>
  )
}
