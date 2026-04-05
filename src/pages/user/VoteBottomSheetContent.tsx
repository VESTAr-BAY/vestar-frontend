import type { Candidate, VoteDetailData } from '../../types/vote'
import type { SubmitState } from '../../hooks/user/useVoteSubmit'

interface VoteBottomSheetContentProps {
  state: SubmitState
  vote: VoteDetailData
  selectedCandidate: Candidate | null
  txHash: string | null
  karmaEarned: number
  onConfirm: () => void
  onClose: () => void
}

function ConfirmPhase({
  vote,
  selectedCandidate,
  onConfirm,
}: {
  vote: VoteDetailData
  selectedCandidate: Candidate | null
  onConfirm: () => void
}) {
  return (
    <div>
      {/* Selected candidate card */}
      {selectedCandidate && (
        <div className="flex items-center gap-3 bg-[#F0EDFF] rounded-xl p-3 mb-5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: selectedCandidate.emojiColor }}
          >
            {selectedCandidate.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-[#090A0B] truncate">
              {selectedCandidate.name}
            </div>
            <div className="text-[12px] text-[#707070] truncate">{selectedCandidate.group}</div>
          </div>
        </div>
      )}

      {/* Price summary */}
      <div className="bg-[#F7F8FA] rounded-xl p-4 mb-5">
        <div className="flex justify-between items-center">
          <span className="text-[13px] text-[#707070]">투표권</span>
          <span className="text-[13px] font-medium text-[#090A0B]">₩100</span>
        </div>
      </div>

      {/* Vote context */}
      <div className="text-[12px] text-[#707070] text-center mb-5">
        {vote.org} · {vote.title}
      </div>

      {/* Confirm button */}
      <button
        type="button"
        onClick={onConfirm}
        className="w-full bg-[#7140FF] text-white rounded-2xl py-4 text-[15px] font-bold hover:opacity-85 transition-opacity active:scale-[0.99]"
      >
        투표 확정하기
      </button>
    </div>
  )
}

function LoadingPhase() {
  return (
    <div className="flex flex-col items-center py-10 gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-[#E7E9ED] border-t-[#7140FF] animate-spin" />
      <span className="text-[14px] text-[#707070]">투표를 처리하는 중…</span>
    </div>
  )
}

function SuccessPhase({
  txHash,
  karmaEarned,
  onClose,
}: {
  txHash: string | null
  karmaEarned: number
  onClose: () => void
}) {
  return (
    <div>
      {/* Success icon */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.2)] flex items-center justify-center animate-pop-in">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22C55E"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
      </div>

      <h3 className="text-[18px] font-bold text-[#090A0B] text-center mb-1">투표가 기록됐어요!</h3>
      <p className="text-[13px] text-[#707070] text-center mb-5">투표가 안전하게 저장됐습니다</p>

      {/* TX hash */}
      {txHash && (
        <div className="bg-[#F7F8FA] rounded-xl px-3 py-2.5 mb-4">
          <div className="text-[10px] text-[#707070] mb-1 font-mono uppercase tracking-wider">
            영수증
          </div>
          <div className="text-[12px] font-mono text-[#7140FF] break-all">{txHash}</div>
        </div>
      )}

      {/* Karma card */}
      <div className="bg-[#FEF9EC] border border-[#FDE68A] rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
        <span className="text-2xl">⚡</span>
        <div>
          <div className="text-[14px] font-bold text-[#92400E]">+{karmaEarned} Karma Points</div>
          <div className="text-[12px] text-[#B45309]">투표 참여 보상이 지급되었습니다</div>
        </div>
      </div>

      {/* Ad slot */}
      <div className="bg-[#13141A] rounded-xl p-4 mb-5">
        <div className="text-[9px] text-white/30 uppercase tracking-wider font-mono mb-2">
          Sponsored
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
            🎧
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-white truncate">
              Samsung Galaxy Buds3 Pro
            </div>
            <div className="text-[11px] text-white/40 truncate">
              프리미엄 무선 이어버드 · 지금 특가
            </div>
          </div>
        </div>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="w-full bg-[#F7F8FA] text-[#090A0B] rounded-2xl py-4 text-[15px] font-semibold hover:bg-[#E7E9ED] transition-colors"
      >
        닫기
      </button>
    </div>
  )
}

export function VoteBottomSheetContent({
  state,
  vote,
  selectedCandidate,
  txHash,
  karmaEarned,
  onConfirm,
  onClose,
}: VoteBottomSheetContentProps) {
  if (state === 'loading') return <LoadingPhase />
  if (state === 'success')
    return <SuccessPhase txHash={txHash} karmaEarned={karmaEarned} onClose={onClose} />
  return <ConfirmPhase vote={vote} selectedCandidate={selectedCandidate} onConfirm={onConfirm} />
}
