import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Address } from 'viem'
import { VoteDetailHeaderContext } from '../../components/layout/VoteDetailLayout'
import { getElectionSnapshot } from '../../contracts/vestar/actions'
import { useHostLiveTally } from '../../hooks/host/useHostLiveTally'
import { useVoteManage } from '../../hooks/host/useVoteManage'
import { useLanguage } from '../../providers/LanguageProvider'
import { useToast } from '../../providers/ToastProvider'
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

function getFinalizeBlockingMessage(params: {
  visibilityMode?: 'OPEN' | 'PRIVATE'
  onchainState?: string
  electionAddress?: string
  onchainElectionId?: string
  isReady: boolean
}) {
  if (params.onchainState === 'FINALIZED') {
    return '이미 finalize가 완료된 투표입니다.'
  }

  if (!params.electionAddress || !params.onchainElectionId) {
    return '온체인 election 정보가 아직 준비되지 않아 finalize를 실행할 수 없습니다.'
  }

  if (!params.isReady) {
    return params.visibilityMode === 'PRIVATE'
      ? '아직 finalize 가능한 단계가 아닙니다. 키 공개 이후 다시 시도해 주세요.'
      : '아직 finalize 가능한 단계가 아닙니다. 투표 종료 이후 다시 시도해 주세요.'
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
  })
  const isLiveTallyAvailable = vote.badge !== 'end'
  const isFinalized = vote.onchainState === 'FINALIZED'

  const handleOpenFinalTally = async () => {
    if (isFinalized) {
      navigate(`/host/${id}/settlement`)
      return
    }
    if (finalizeBlockingMessage) {
      addToast({ type: 'info', message: finalizeBlockingMessage })
      return
    }
    navigate(`/host/${id}/result`)
  }

  const primaryLabel = isSettlementSettled
    ? lang === 'ko'
      ? '정산 결과'
      : 'Settlement Result'
    : isFinalized
      ? lang === 'ko'
        ? '정산 실행'
        : 'Run Settlement'
      : lang === 'ko'
        ? '최종 집계 보기'
        : 'View Final Tally'

  const onchainStateBadge = vote.onchainState
    ? {
        ACTIVE: { label: lang === 'ko' ? '진행 중' : 'Active', cls: 'bg-green-100 text-green-700' },
        ENDED: { label: lang === 'ko' ? '종료' : 'Ended', cls: 'bg-[#F7F8FA] text-[#707070]' },
        KEY_REVEAL_PENDING: { label: 'Key Reveal Pending', cls: 'bg-amber-100 text-amber-700' },
        FINALIZED: {
          label: lang === 'ko' ? '정산 완료' : 'Finalized',
          cls: 'bg-[#F0EDFF] text-[#7140FF]',
        },
      }[vote.onchainState as string]
    : null

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
                Host Panel
              </div>
              <div className="text-[19px] font-semibold text-[#090A0B]">
                {lang === 'ko' ? '생성자 전용 관리 화면' : 'Host Management'}
              </div>
              <div className="mt-2 text-[13px] leading-relaxed text-[#707070]">
                {lang === 'ko'
                  ? '실시간 집계 확인과 finalize를 여기서 처리할 수 있습니다.'
                  : 'Check live tallies and run finalization from here.'}
              </div>
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
              Host Flow
            </div>
            <div className="mt-2 text-[13px] leading-relaxed text-[#5B6470]">
              {isSettlementSettled
                ? lang === 'ko'
                  ? '정산까지 완료된 상태입니다. 정산 결과 화면으로 바로 이동할 수 있습니다.'
                  : 'Settlement is already complete. You can jump straight to the settlement summary.'
                : isFinalized
                  ? lang === 'ko'
                    ? 'finalize까지 끝났습니다. 이제 정산 트랜잭션을 실행할 수 있습니다.'
                    : 'Finalization is complete. You can run settlement next.'
                  : lang === 'ko'
                    ? '먼저 실시간 집계와 최종 집계 상태를 확인한 뒤, 종료된 투표는 finalize로 확정하세요.'
                    : 'Check live and final tally status first, then finalize ended votes.'}
            </div>
          </div>
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
            {lang === 'ko' ? '실시간 집계' : 'Live Tally'}
          </button>
          <button
            type="button"
            disabled={
              isSettlementSettled ? false : isFinalized ? false : Boolean(finalizeBlockingMessage)
            }
            onClick={() => {
              if (isSettlementSettled || isFinalized) {
                navigate(`/host/${id}/settlement`)
                return
              }
              void handleOpenFinalTally()
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
