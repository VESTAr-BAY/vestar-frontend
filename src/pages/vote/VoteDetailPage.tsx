import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { useChainId, useSwitchChain } from 'wagmi'
import completeVoteIcon from '../../assets/complete_vote.svg'
import reportProblemIcon from '../../assets/report_problem.svg'
import { VoteDetailHeaderContext } from '../../components/layout/VoteDetailLayout'
import { BottomSheet } from '../../components/shared/BottomSheet'
import { vestarStatusTestnetChain } from '../../contracts/vestar/chain'
import { useCandidateSelection } from '../../hooks/user/useCandidateSelection'
import { useSectionVoteSelection } from '../../hooks/user/useSectionVoteSelection'
import { useVoteDetail } from '../../hooks/user/useVoteDetail'
import { useVoteSubmit } from '../../hooks/user/useVoteSubmit'
import { useVotedVotes } from '../../hooks/useVotedVotes'
import { useToast } from '../../providers/ToastProvider'
import { useLanguage } from '../../providers/LanguageProvider'
import { CandidateSection, GroupedCandidateSection } from '../user/CandidateSection'
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

// ── Centered danger confirmation modal ──────────────────────────────────────
interface DangerConfirmModalProps {
  open: boolean
  target: string
  onConfirm: () => void
  onCancel: () => void
}

function DangerConfirmModal({ open, target, onConfirm, onCancel }: DangerConfirmModalProps) {
  const { t } = useLanguage()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center px-5">
      {/* Backdrop */}
      <button
        type="button"
        aria-label={t('btn_cancel')}
        onClick={onCancel}
        className="absolute inset-0 bg-[rgba(9,10,11,0.65)]"
      />

      {/* Card */}
      <div className="relative z-[501] w-full max-w-[340px] bg-white rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.30)] animate-[slideUp_0.22s_ease-out]">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FEF5E7] flex items-center justify-center">
            <img
              src={reportProblemIcon}
              alt=""
              aria-hidden="true"
              className="w-8 h-8"
              style={{
                filter:
                  'brightness(0) saturate(100%) invert(55%) sepia(90%) saturate(600%) hue-rotate(5deg) brightness(100%) contrast(95%)',
              }}
            />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-[18px] font-bold text-[#090A0B] text-center mb-2 leading-snug">
          {t('dm_title')}
        </h2>

        {/* Target */}
        <p className="text-[14px] text-[#090A0B] text-center mb-3 font-semibold">{target}</p>

        {/* Warning */}
        <div className="bg-[#FEF5E7] border border-[#FDE68A] rounded-2xl px-4 py-3 mb-5">
          <p className="text-[12px] text-[#92400E] text-center leading-snug">
            {t('dm_irreversible')}
          </p>
        </div>

        {/* Vote fee */}
        <div className="flex justify-between items-center bg-[#F7F8FA] rounded-xl px-4 py-3 mb-5 text-[13px]">
          <span className="text-[#707070]">{t('dm_vote_fee')}</span>
          <span className="font-bold text-[#090A0B]">₩100</span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl bg-[#F7F8FA] text-[14px] font-semibold text-[#707070] hover:bg-[#E7E9ED] transition-colors active:scale-[0.99]"
          >
            {t('btn_cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3.5 rounded-2xl bg-[#7140FF] text-white text-[14px] font-bold hover:opacity-85 transition-opacity active:scale-[0.99]"
          >
            {t('btn_vote_now')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export function VoteDetailPage() {
  const { id = '1' } = useParams()
  const { vote, isLoading } = useVoteDetail(id)

  const isGrouped = (vote?.sections?.length ?? 0) > 0

  const { isSelected, toggle, canSubmit, selectedIds } = useCandidateSelection(
    vote?.maxChoices ?? 1,
  )
  const sectionSelection = useSectionVoteSelection(vote?.sections ?? [])

  const { isVoted, markVoted, getVotedCandidates } = useVotedVotes()
  const { state, txHash, karmaEarned, submit, reset } = useVoteSubmit()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dangerModalOpen, setDangerModalOpen] = useState(false)
  const [hasVoted, setHasVoted] = useState(() => isVoted(id))

  const { setConfig, scrollState } = useContext(VoteDetailHeaderContext)
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const { addToast } = useToast()
  const { t, lang } = useLanguage()

  const isEnded = vote?.badge === 'end'
  const isWrongNetwork = !!vote?.electionAddress && chainId !== vestarStatusTestnetChain.id

  // ── Voted candidate IDs (from localStorage, stable after voting or on reload) ──
  const votedCandidateIds = useMemo<Set<string> | undefined>(
    () => (hasVoted ? new Set(getVotedCandidates(id)) : undefined),
    [hasVoted, id, getVotedCandidates],
  )

  // ── Override isSelected to show voted candidates highlighted after voting ──
  const effectiveIsSelected = useCallback(
    (candidateId: string) =>
      hasVoted ? (votedCandidateIds?.has(candidateId) ?? false) : isSelected(candidateId),
    [hasVoted, votedCandidateIds, isSelected],
  )
  const effectiveSectionIsSelected = useCallback(
    (_sectionId: string, candidateId: string) =>
      hasVoted
        ? (votedCandidateIds?.has(candidateId) ?? false)
        : sectionSelection.isSelected(_sectionId, candidateId),
    [hasVoted, votedCandidateIds, sectionSelection],
  )

  // Derive selected candidate for flat mode (works on reload via votedCandidateIds)
  const selectedCandidate = useMemo(
    () =>
      vote?.candidates.find((c) =>
        hasVoted ? votedCandidateIds?.has(c.id) : selectedIds.has(c.id),
      ) ?? null,
    [vote, hasVoted, votedCandidateIds, selectedIds],
  )

  const votedSectionCount = votedCandidateIds?.size ?? 0
  const activeCanSubmit = isGrouped ? sectionSelection.canSubmit : canSubmit

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
    if (state !== 'success' || !vote) return
    const candidateIds = isGrouped
      ? sectionSelection.selectedSections.map((s) => s.candidateId)
      : Array.from(selectedIds)
    setHasVoted(true)
    markVoted(vote.id, candidateIds)
    if (isGrouped) {
      addToast({
        type: 'success',
        message: `${sectionSelection.selectedCount} ${lang === 'ko' ? '섹션 투표 완료! ⚡' : 'sections voted! ⚡'}`,
      })
    } else {
      addToast({
        type: 'success',
        message:
          lang === 'ko'
            ? `"${selectedCandidate?.name}" 투표 완료! ⚡`
            : `Voted for "${selectedCandidate?.name}"! ⚡`,
      })
    }
  }, [
    state,
    vote,
    isGrouped,
    sectionSelection,
    selectedIds,
    selectedCandidate,
    markVoted,
    addToast,
    lang,
  ])

  // Open danger modal when user taps the vote button
  const handleVoteClick = useCallback(() => {
    if (!activeCanSubmit || hasVoted || isEnded) return
    setDangerModalOpen(true)
  }, [activeCanSubmit, hasVoted, isEnded])

  // Called when user confirms in the danger modal
  const handleDangerConfirm = useCallback(() => {
    if (!vote) return
    setDangerModalOpen(false)
    setSheetOpen(true)
    const candidateIds = isGrouped
      ? sectionSelection.selectedSections.map((s) => s.candidateId)
      : Array.from(selectedIds)
    submit(vote.electionAddress, candidateIds)
  }, [vote, isGrouped, sectionSelection.selectedSections, selectedIds, submit])

  const handleClose = useCallback(() => {
    if (state === 'loading') return
    setSheetOpen(false)
    if (state === 'success') reset()
  }, [state, reset])

  if (isLoading || !vote) return <LoadingSkeleton />

  // ── Action bar label ──────────────────────────────────────────────────────
  const submitLabel = hasVoted
    ? isGrouped
      ? `✓ ${votedSectionCount} ${lang === 'ko' ? '섹션 투표 완료!' : 'sections voted!'}`
      : `✓ ${lang === 'ko' ? `"${selectedCandidate?.name ?? ''}" 투표 완료` : `Voted for "${selectedCandidate?.name ?? ''}"`}`
    : isGrouped
      ? activeCanSubmit
        ? `${sectionSelection.selectedCount} ${lang === 'ko' ? `섹션 선택됨 · ₩${sectionSelection.selectedCount * 100}` : `sections selected · ₩${sectionSelection.selectedCount * 100}`}`
        : t('vd_select_section')
      : activeCanSubmit
        ? `${lang === 'ko' ? `"${selectedCandidate?.name}" 투표` : `Vote for "${selectedCandidate?.name}"`}`
        : t('vd_select_candidate')

  // Danger modal target label
  const dangerTarget = isGrouped
    ? `${sectionSelection.selectedCount} ${lang === 'ko' ? '섹션' : `section${sectionSelection.selectedCount !== 1 ? 's' : ''}`}`
    : selectedCandidate
      ? `"${selectedCandidate.name}"`
      : lang === 'ko'
        ? '선택된 후보'
        : 'selected candidate'

  return (
    <>
      <VoteHero vote={vote} />

      <div className="bg-[#FFFFFF]">
        <VoteInfoSection vote={vote} />

        <div className="h-2 bg-[#F7F8FA] my-3" />

        {isGrouped ? (
          <GroupedCandidateSection
            sections={vote.sections!}
            resultPublic={vote.resultPublic}
            isSelected={effectiveSectionIsSelected}
            onToggle={hasVoted || isEnded ? () => {} : sectionSelection.toggle}
            isEnded={isEnded || hasVoted}
            votedCandidateIds={votedCandidateIds}
          />
        ) : (
          <CandidateSection
            candidates={vote.candidates}
            maxChoices={vote.maxChoices}
            resultPublic={vote.resultPublic}
            isSelected={effectiveIsSelected}
            onToggle={hasVoted || isEnded ? () => {} : toggle}
            isEnded={isEnded || hasVoted}
            votedCandidateIds={votedCandidateIds}
          />
        )}
      </div>

      {/* Vote action bar */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[90] px-5 pt-4 pb-6 bg-[#F7F8FA] border-t border-[#E7E9ED] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          scrollState === 'hidden' ? 'translate-y-full bottom-0' : 'translate-y-0 bottom-0'
        }`}
      >
        {isWrongNetwork ? (
          <button
            type="button"
            onClick={() => switchChainAsync({ chainId: vestarStatusTestnetChain.id })}
            className="w-full bg-[#FEF5E7] border border-[#FDE68A] text-[#92400E] rounded-2xl py-4 text-[14px] font-bold hover:bg-[#FDE68A] transition-colors"
          >
            {t('vd_switch_network')}
          </button>
        ) : hasVoted ? (
          <div className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.25)] text-[14px] font-semibold text-[#16a34a]">
            <img
              src={completeVoteIcon}
              alt=""
              aria-hidden="true"
              className="w-5 h-5"
              style={{
                filter:
                  'brightness(0) saturate(100%) invert(33%) sepia(98%) saturate(400%) hue-rotate(93deg) brightness(95%) contrast(97%)',
              }}
            />
            {submitLabel}
          </div>
        ) : isEnded ? (
          <div className="w-full py-4 rounded-2xl bg-[#F7F8FA] border border-[#E7E9ED] text-[14px] font-semibold text-[#707070] text-center cursor-default flex items-center justify-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
            {t('vd_voting_ended')}
          </div>
        ) : (
          <button
            type="button"
            disabled={!activeCanSubmit}
            onClick={handleVoteClick}
            className="w-full bg-[#7140FF] text-white rounded-2xl py-4 text-[15px] font-bold disabled:bg-[#E7E9ED] disabled:text-[#707070] disabled:cursor-default hover:enabled:opacity-85 transition-opacity active:enabled:scale-[0.99]"
          >
            {submitLabel}
          </button>
        )}
      </div>

      {/* Centered danger confirmation modal */}
      <DangerConfirmModal
        open={dangerModalOpen}
        target={dangerTarget}
        onConfirm={handleDangerConfirm}
        onCancel={() => setDangerModalOpen(false)}
      />

      {/* Bottom sheet — progress + receipt (only before voting) */}
      {!hasVoted && !isEnded && (
        <BottomSheet open={sheetOpen} onClose={handleClose} title={t('bs_title')}>
          <VoteBottomSheetContent
            state={state}
            txHash={txHash}
            karmaEarned={karmaEarned}
            onClose={handleClose}
          />
        </BottomSheet>
      )}
    </>
  )
}
