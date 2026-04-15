import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Address } from 'viem'
import { VoteDetailHeaderContext } from '../../components/layout/VoteDetailLayout'
import { getElectionSnapshot } from '../../contracts/vestar/actions'
import { useHostLiveTally } from '../../hooks/host/useHostLiveTally'
import { useVoteManage } from '../../hooks/host/useVoteManage'
import { useLanguage } from '../../providers/LanguageProvider'
import { useToast } from '../../providers/ToastProvider'
import type { VoteDetailData } from '../../types/vote'
import { VoteHero } from '../user/VoteHero'
import { VoteInfoSection } from '../user/VoteInfoSection'
import { VoteResultRankings } from '../user/VoteResultRankings'

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-[#E7E9ED] border-t-[#7140FF] animate-spin" />
    </div>
  )
}

function hasSettlementStep(vote: VoteDetailData) {
  if (vote.paymentMode === 'PAID') {
    return true
  }

  if (vote.paymentMode === 'FREE') {
    return false
  }

  return Boolean(vote.costPerBallot && vote.costPerBallot !== '0')
}

function getVoteManageCopy(lang: 'en' | 'ko', needsSettlement: boolean) {
  return lang === 'ko'
    ? {
        panelEyebrow: '주최자 패널',
        panelTitle: '주최자 전용 관리 화면',
        flowEyebrow: 'Host Flow',
        flowSettled: '정산까지 완료된 상태입니다. 정산 결과 화면으로 바로 이동할 수 있습니다.',
        flowFinalizedPaid: 'finalize까지 끝났습니다. 이제 정산 트랜잭션을 실행할 수 있습니다.',
        flowFinalizedFree:
          '최종 확정이 완료된 무료 투표입니다. 정산 단계는 없으니 결과만 확인하면 됩니다.',
        flowPendingPaid:
          '먼저 실시간 집계를 확인한 뒤, 종료된 투표는 finalize로 최종 확정하세요. 이후 정산을 진행할 수 있습니다.',
        flowPendingFree:
          '먼저 실시간 집계를 확인한 뒤, 종료된 투표는 finalize로 최종 확정하세요. 무료 투표는 정산 단계 없이 결과 확인으로 마무리됩니다.',
        finalizeHelpCta: 'finalize를 왜 해야하나요?',
        finalizeHelpBody: needsSettlement
          ? 'finalize는 투표 종료 후 최종 결과를 온체인에 확정하는 단계입니다. 확정이 끝나야 이후 정산을 진행할 수 있습니다.'
          : '무료 투표도 투표 종료 후 최종 결과를 온체인에 확정해야 선거 상태가 마무리됩니다. 정산 단계는 없지만, 결과를 최종 상태로 고정하려면 finalize가 필요합니다.',
        blockedAlreadyFinalized: '이미 finalize가 완료된 투표입니다.',
        blockedMissingElection:
          '온체인 election 정보가 아직 준비되지 않아 finalize를 실행할 수 없습니다.',
        blockedNotReadyPrivate:
          '아직 finalize 가능한 단계가 아닙니다. 키 공개 이후 다시 시도해 주세요.',
        blockedNotReadyOpen:
          '아직 finalize 가능한 단계가 아닙니다. 투표 종료 이후 다시 시도해 주세요.',
        primarySettlementResult: '정산 결과',
        primaryRunSettlement: '정산 실행',
        primaryViewFinalTally: '최종 집계 보기',
        primaryViewFinalizedResult: '최종 확정 결과',
        liveTally: '실시간 집계',
        stateActive: '진행 중',
        stateEnded: '종료',
        stateKeyRevealPending: '키 공개 대기',
        stateFinalized: 'Finalize 완료',
      }
    : {
        panelEyebrow: 'Host Panel',
        panelTitle: 'Host Management',
        flowEyebrow: 'Host Flow',
        flowSettled:
          'Settlement is already complete. You can jump straight to the settlement summary.',
        flowFinalizedPaid: 'Finalization is complete. Settlement is the next step.',
        flowFinalizedFree:
          'This free vote is already finalized on-chain. There is no settlement step, so you can simply review the finalized result.',
        flowPendingPaid:
          'Review the live tally first, then finalize ended votes. Settlement can continue after finalization.',
        flowPendingFree:
          'Review the live tally first, then finalize ended votes. Free votes finish with finalized results instead of settlement.',
        finalizeHelpCta: 'Why do I need to finalize?',
        finalizeHelpBody: needsSettlement
          ? 'Finalize locks the final result on-chain after voting ends. Settlement becomes available only after finalization.'
          : 'Free votes still need finalization to lock the final result on-chain after voting ends. There is no settlement step, but finalize is required to complete the election state.',
        blockedAlreadyFinalized: 'This vote has already been finalized.',
        blockedMissingElection:
          'Finalize cannot run because the on-chain election is not ready yet.',
        blockedNotReadyPrivate: 'Finalization is not available yet. Try again after key reveal.',
        blockedNotReadyOpen: 'Finalization is not available yet. Try again after voting ends.',
        primarySettlementResult: 'Settlement Result',
        primaryRunSettlement: 'Run Settlement',
        primaryViewFinalTally: 'View Final Tally',
        primaryViewFinalizedResult: 'View Finalized Result',
        liveTally: 'Live Tally',
        stateActive: 'Active',
        stateEnded: 'Ended',
        stateKeyRevealPending: 'Key Reveal Pending',
        stateFinalized: 'Finalized',
      }
}

function getFinalizeBlockingMessage(params: {
  visibilityMode?: 'OPEN' | 'PRIVATE'
  onchainState?: string
  electionAddress?: string
  onchainElectionId?: string
  isReady: boolean
  copy: ReturnType<typeof getVoteManageCopy>
}) {
  if (params.onchainState === 'FINALIZED') {
    return params.copy.blockedAlreadyFinalized
  }

  if (!params.electionAddress || !params.onchainElectionId) {
    return params.copy.blockedMissingElection
  }

  if (!params.isReady) {
    return params.visibilityMode === 'PRIVATE'
      ? params.copy.blockedNotReadyPrivate
      : params.copy.blockedNotReadyOpen
  }

  return null
}

export function VoteManagePage() {
  const { id = '1' } = useParams()
  const navigate = useNavigate()
  const { vote, isLoading } = useVoteManage(id)
  const { vote: liveVote, rankedCandidates } = useHostLiveTally(id)
  const { addToast } = useToast()
  const { lang } = useLanguage()
  const { scrollState } = useContext(VoteDetailHeaderContext)
  const [isSettlementSettled, setIsSettlementSettled] = useState(false)
  const [isFinalizeHelpOpen, setIsFinalizeHelpOpen] = useState(false)

  useEffect(() => {
    if (!vote?.electionAddress) {
      setIsSettlementSettled(false)
      return
    }

    let cancelled = false

    getElectionSnapshot(vote.electionAddress as Address)
      .then((snapshot) => {
        if (!cancelled) {
          setIsSettlementSettled(snapshot.settlementSummary.settled)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsSettlementSettled(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [vote?.electionAddress])

  if (isLoading || !vote) return <LoadingSkeleton />

  const needsSettlement = hasSettlementStep(vote)
  const copy = getVoteManageCopy(lang, needsSettlement)
  const isFinalizeReady = Boolean(
    vote.electionAddress &&
      vote.onchainElectionId &&
      vote.onchainState !== 'FINALIZED' &&
      (vote.visibilityMode === 'OPEN'
        ? liveVote?.badge === 'end'
        : vote.visibilityMode === 'PRIVATE' && liveVote?.badge === 'end'),
  )
  const finalizeBlockingMessage = getFinalizeBlockingMessage({
    visibilityMode: vote.visibilityMode,
    onchainState: vote.onchainState,
    electionAddress: vote.electionAddress,
    onchainElectionId: vote.onchainElectionId,
    isReady: isFinalizeReady,
    copy,
  })
  const isLiveTallyAvailable = vote.badge !== 'end'
  const isFinalized = vote.onchainState === 'FINALIZED'

  const handleOpenFinalTally = () => {
    if (isFinalized) {
      navigate(needsSettlement ? `/host/${id}/settlement` : `/host/${id}/result`)
      return
    }
    if (finalizeBlockingMessage) {
      addToast({ type: 'info', message: finalizeBlockingMessage })
      return
    }
    navigate(`/host/${id}/result`)
  }

  const primaryLabel = isSettlementSettled
    ? copy.primarySettlementResult
    : isFinalized
      ? needsSettlement
        ? copy.primaryRunSettlement
        : copy.primaryViewFinalizedResult
      : copy.primaryViewFinalTally

  const onchainStateBadge = vote.onchainState
    ? {
        ACTIVE: { label: copy.stateActive, cls: 'bg-green-100 text-green-700' },
        ENDED: { label: copy.stateEnded, cls: 'bg-[#F7F8FA] text-[#707070]' },
        KEY_REVEAL_PENDING: {
          label: copy.stateKeyRevealPending,
          cls: 'bg-amber-100 text-amber-700',
        },
        FINALIZED: {
          label: copy.stateFinalized,
          cls: 'bg-[#F0EDFF] text-[#7140FF]',
        },
      }[vote.onchainState as string]
    : null

  const hostFlowBody = isSettlementSettled
    ? copy.flowSettled
    : isFinalized
      ? needsSettlement
        ? copy.flowFinalizedPaid
        : copy.flowFinalizedFree
      : needsSettlement
        ? copy.flowPendingPaid
        : copy.flowPendingFree

  return (
    <>
      <VoteHero vote={vote} />

      {/* Scrollable white content — pb clears the fixed action bar */}
      <div className="pb-[calc(5rem+var(--safe-bottom))]">
        <VoteInfoSection vote={vote} />

        <div className="h-2 bg-[#F7F8FA] my-3" />

        {/* Host management panel card */}
        <div className="mx-5 rounded-[28px] border border-[#E7E9ED] bg-[linear-gradient(180deg,#FFFFFF_0%,#FBF9FF_100%)] px-5 py-5 shadow-[0_10px_30px_rgba(113,64,255,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#7140FF] font-mono mb-1">
                {copy.panelEyebrow}
              </div>
              <div className="text-[19px] font-semibold text-[#090A0B]">{copy.panelTitle}</div>
            </div>
            {onchainStateBadge ? (
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${onchainStateBadge.cls}`}
              >
                {onchainStateBadge.label}
              </span>
            ) : null}
          </div>
          <div className="mt-4 rounded-2xl border border-[#E9DDFC] bg-[rgba(113,64,255,0.05)] px-4 py-3">
            <div className="text-[11px] font-mono uppercase tracking-[1px] text-[#7140FF]">
              {copy.flowEyebrow}
            </div>
            <div className="mt-2 text-[13px] leading-relaxed text-[#5B6470]">{hostFlowBody}</div>
          </div>
          <button
            type="button"
            onClick={() => setIsFinalizeHelpOpen((prev) => !prev)}
            className="mt-3 flex w-full items-center justify-between rounded-2xl border border-[#E7E9ED] bg-white px-4 py-3 text-left text-[13px] font-semibold text-[#090A0B] transition-colors hover:border-[#d9ddf3]"
            aria-expanded={isFinalizeHelpOpen}
            aria-label={copy.finalizeHelpCta}
          >
            <span>{copy.finalizeHelpCta}</span>
            <span aria-hidden="true" className="text-[#7140FF]">
              {isFinalizeHelpOpen ? '−' : '+'}
            </span>
          </button>
          {isFinalizeHelpOpen ? (
            <div className="mt-3 rounded-2xl border border-[#E7E9ED] bg-white px-4 py-3">
              <div className="text-[13px] leading-relaxed text-[#5B6470]">
                {copy.finalizeHelpBody}
              </div>
            </div>
          ) : null}
          {finalizeBlockingMessage ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-700 leading-relaxed">
              {finalizeBlockingMessage}
            </div>
          ) : null}
        </div>

        {/* 현재 투표 현황 */}
        <VoteResultRankings rankedCandidates={rankedCandidates} />
      </div>

      {/* Fixed action bar — same pattern as VoteDetailPage */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[90] px-5 pt-4 pb-[calc(1.5rem+var(--safe-bottom))] bg-[#FFFFFF] border-t border-[#E7E9ED] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          scrollState === 'hidden' ? 'translate-y-full bottom-0' : 'translate-y-0 bottom-0'
        }`}
      >
        <div className="flex gap-3">
          <button
            type="button"
            disabled={!isLiveTallyAvailable}
            onClick={() => navigate(`/host/${id}/live`)}
            className="flex-1 bg-[#F7F8FA] text-[#090A0B] border border-[#E7E9ED] rounded-2xl py-4 text-[14px] font-bold disabled:bg-[#E7E9ED] disabled:text-[#707070] disabled:border-transparent disabled:cursor-default hover:enabled:border-[#d9ddf3] transition-colors active:enabled:scale-[0.99]"
          >
            {copy.liveTally}
          </button>
          <button
            type="button"
            disabled={
              isSettlementSettled ? false : isFinalized ? false : Boolean(finalizeBlockingMessage)
            }
            onClick={() => {
              if (isSettlementSettled || isFinalized) {
                navigate(
                  isSettlementSettled || needsSettlement
                    ? `/host/${id}/settlement`
                    : `/host/${id}/result`,
                )
                return
              }
              handleOpenFinalTally()
            }}
            className="flex-1 bg-[#7140FF] text-white rounded-2xl py-4 text-[14px] font-bold disabled:bg-[#E7E9ED] disabled:text-[#707070] disabled:cursor-default hover:enabled:opacity-90 transition-opacity active:enabled:scale-[0.99]"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </>
  )
}
