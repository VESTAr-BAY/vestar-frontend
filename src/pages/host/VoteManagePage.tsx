import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { type Address } from 'viem'
import { getElectionSnapshot } from '../../contracts/vestar/actions'
import { useVoteManage } from '../../hooks/host/useVoteManage'
import { useHostLiveTally } from '../../hooks/host/useHostLiveTally'
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

  return (
    <>
      <VoteHero vote={vote} />
      <VoteInfoSection vote={vote} />

      <div className="h-2 bg-[#F7F8FA]" />

      <div className="mx-5 mt-5 rounded-3xl border border-[#E7E9ED] bg-white px-5 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#7140FF] font-mono">
          Host Detail
        </div>
        <div className="mt-2 text-[15px] font-semibold text-[#090A0B]">생성자 전용 상세 화면</div>
        <div className="mt-1 text-[13px] text-[#707070]">
          진행 중 집계 확인과 finalize를 여기서 이어서 처리할 수 있습니다.
        </div>
      </div>

      {/* 현재 투표 현황 */}
      <VoteResultRankings rankedCandidates={rankedCandidates} />

      <div className="px-5 py-6 bg-[#F7F8FA] flex flex-col gap-3">
        <button
          type="button"
          disabled={!isLiveTallyAvailable}
          onClick={() => navigate(`/host/${id}/live`)}
          className="w-full bg-white text-[#090A0B] border border-[#E7E9ED] rounded-2xl py-4 text-[15px] font-bold disabled:bg-[#E7E9ED] disabled:text-[#707070] disabled:border-transparent disabled:cursor-default hover:enabled:border-[#d9ddf3] transition-colors active:enabled:scale-[0.99] flex items-center justify-center gap-2"
        >
          실시간 집계 보기
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
          className="w-full bg-[#090A0B] text-white rounded-2xl py-4 text-[15px] font-bold disabled:bg-[#E7E9ED] disabled:text-[#707070] disabled:cursor-default hover:enabled:opacity-85 transition-opacity active:enabled:scale-[0.99] flex items-center justify-center gap-2"
        >
          {isSettlementSettled ? '정산 결과' : isFinalized ? '정산 실행' : '최종 집계 보기'}
        </button>
      </div>
    </>
  )
}
