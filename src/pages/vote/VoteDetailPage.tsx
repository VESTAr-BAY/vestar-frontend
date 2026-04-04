import { useCallback, useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { BottomSheet } from '../../components/shared/BottomSheet'
import { VoteDetailHeaderContext } from '../../components/layout/VoteDetailLayout'
import { useCandidateSelection } from '../../hooks/user/useCandidateSelection'
import { useVoteDetail } from '../../hooks/user/useVoteDetail'
import { useVoteSubmit } from '../../hooks/user/useVoteSubmit'
import { useToast } from '../../providers/ToastProvider'
import { CandidateSection } from '../user/CandidateSection'
import { VoteBottomSheetContent } from '../user/VoteBottomSheetContent'
import { VoteHero } from '../user/VoteHero'
import { VoteInfoSection } from '../user/VoteInfoSection'

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-[#E7E9ED] border-t-[#7140FF] animate-spin" />
    </div>
  )
}

export function VoteDetailPage() {
  const { id = '1' } = useParams()
  const { vote, isLoading } = useVoteDetail(id)
  const { isSelected, toggle, canSubmit, selectedIds } = useCandidateSelection(vote?.maxChoices ?? 1)
  const { state, txHash, karmaEarned, submit, reset } = useVoteSubmit()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const { setConfig } = useContext(VoteDetailHeaderContext)
  const { addToast } = useToast()

  const isEnded = vote?.badge === 'end'
  const selectedCandidate = vote?.candidates.find((c) => selectedIds.has(c.id)) ?? null

  useEffect(() => {
    if (!vote) return
    setConfig({
      title: vote.title,
      onShare: () => {
        if (navigator.share) {
          navigator.share({ title: vote.title, url: window.location.href }).catch(() => {})
        }
      },
    })
  }, [vote, setConfig])

  useEffect(() => {
    if (state === 'success') {
      setHasVoted(true)
      addToast({ type: 'success', message: `"${selectedCandidate?.name}"에 투표 완료! ⚡` })
    }
  }, [state, selectedCandidate, addToast])

  const handleOpenSheet = useCallback(() => {
    if (!canSubmit || hasVoted || isEnded) return
    setSheetOpen(true)
  }, [canSubmit, hasVoted, isEnded])

  const handleConfirm = useCallback(async () => {
    if (!vote) return
    await submit(vote.id, Array.from(selectedIds))
  }, [vote, selectedIds, submit])

  const handleClose = useCallback(() => {
    if (state === 'loading') return
    setSheetOpen(false)
    if (state === 'success') reset()
  }, [state, reset])

  if (isLoading || !vote) return <LoadingSkeleton />

  const sheetTitle = state === 'success' ? '투표 완료!' : '투표 확인'

  const submitLabel = hasVoted
    ? `✓ "${selectedCandidate?.name}" 에 투표 완료!`
    : canSubmit
      ? `"${selectedCandidate?.name}" 에 투표하기`
      : '후보를 선택하세요'

  return (
    <>
      <VoteHero vote={vote} />
      <VoteInfoSection vote={vote} />

      <div className="h-2 bg-[#F7F8FA]" />

      <CandidateSection
        candidates={vote.candidates}
        maxChoices={vote.maxChoices}
        resultPublic={vote.resultPublic}
        isSelected={isSelected}
        onToggle={hasVoted || isEnded ? () => {} : toggle}
        isEnded={isEnded || hasVoted}
      />

      {/* Vote action bar */}
      <div className="px-5 pt-4 pb-6 bg-[#F7F8FA]">
        {hasVoted ? (
          <div className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.25)] text-[14px] font-semibold text-[#16a34a]">
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
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {submitLabel}
          </div>
        ) : isEnded ? (
          <div className="w-full py-4 rounded-2xl bg-white border border-[#E7E9ED] text-[15px] font-semibold text-[#707070] text-center cursor-default">
            투표가 종료되었습니다
          </div>
        ) : (
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleOpenSheet}
            className="w-full bg-[#7140FF] text-white rounded-2xl py-4 text-[15px] font-bold disabled:bg-[#E7E9ED] disabled:text-[#707070] disabled:cursor-default hover:enabled:opacity-85 transition-opacity active:enabled:scale-[0.99]"
          >
            {submitLabel}
          </button>
        )}
      </div>

      <BottomSheet open={sheetOpen} onClose={handleClose} title={sheetTitle}>
        <VoteBottomSheetContent
          state={state}
          vote={vote}
          selectedCandidate={selectedCandidate}
          txHash={txHash}
          karmaEarned={karmaEarned}
          onConfirm={handleConfirm}
          onClose={handleClose}
        />
      </BottomSheet>
    </>
  )
}
