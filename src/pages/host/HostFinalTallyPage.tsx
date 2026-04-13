import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { type Address, keccak256, toHex } from 'viem'
import { useChainId, useSwitchChain, useWalletClient } from 'wagmi'
import {
  finalizeElectionResults,
  getElectionSnapshot,
  waitForVestarTransactionReceipt,
} from '../../contracts/vestar/actions'
import { vestarStatusTestnetChain } from '../../contracts/vestar/chain'
import { useVoteDetail } from '../../hooks/user/useVoteDetail'
import { useVoteLiveTally } from '../../hooks/user/useVoteLiveTally'
import { useToast } from '../../providers/ToastProvider'
import { VoteResultRankings } from '../user/VoteResultRankings'
import { VoteResultWinner } from '../user/VoteResultWinner'

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-[#E7E9ED] border-t-[#7140FF] animate-spin" />
    </div>
  )
}

function formatFinalizeError(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Finalize에 실패했습니다.'
  }

  const message = error.message.trim()

  if (/revert|not finalized|invalid state|key reveal|reveal/i.test(message)) {
    return '아직 finalize 가능한 단계가 아닙니다. 상태 전이를 확인한 뒤 다시 시도해 주세요.'
  }

  if (/user rejected|denied|rejected/i.test(message)) {
    return '지갑에서 트랜잭션 서명이 취소되었습니다.'
  }

  if (/network|chain/i.test(message)) {
    return '네트워크를 Status Testnet으로 전환한 뒤 다시 시도해 주세요.'
  }

  return 'Finalize 트랜잭션 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'
}

export function HostFinalTallyPage() {
  const { id = '1' } = useParams()
  const navigate = useNavigate()
  const { vote, isLoading: isVoteLoading } = useVoteDetail(id)
  const {
    result,
    totalSubmissions,
    totalInvalidVotes,
    isLoading: isResultLoading,
  } = useVoteLiveTally(id)
  const { addToast } = useToast()
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient({ chainId: vestarStatusTestnetChain.id })
  const { switchChainAsync } = useSwitchChain()

  const [isFinalizing, setIsFinalizing] = useState(false)
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

  if (isVoteLoading || isResultLoading || !vote || !result) {
    return <LoadingSkeleton />
  }

  const winner = result.rankedCandidates.find((candidate) => candidate.rank === 1)
  const isFinalizeReady =
    vote.onchainState !== 'FINALIZED' &&
    ((vote.visibilityMode === 'OPEN' && vote.badge === 'end') ||
      (vote.visibilityMode === 'PRIVATE' && vote.badge === 'end'))

  const handleFinalize = async () => {
    if (!vote.electionAddress || !vote.onchainElectionId) {
      addToast({
        type: 'error',
        message: '온체인 election 주소가 없어 finalize를 진행할 수 없습니다.',
      })
      return
    }

    if (!walletClient?.account) {
      addToast({ type: 'error', message: '지갑 연결이 필요합니다.' })
      return
    }

    try {
      setIsFinalizing(true)

      if (chainId !== vestarStatusTestnetChain.id) {
        await switchChainAsync({ chainId: vestarStatusTestnetChain.id })
      }

      const resultManifestURI = `frontend://vestar/finalize/${vote.onchainElectionId}`
      const resultManifestHash = keccak256(toHex(resultManifestURI))

      const txHash = await finalizeElectionResults(walletClient, vote.electionAddress as Address, {
        resultManifestHash,
        resultManifestURI,
        totalSubmissions,
        totalValidVotes: result.totalVotes,
        totalInvalidVotes,
      })

      addToast({ type: 'info', message: `Finalize 트랜잭션 제출됨: ${txHash}` })
      await waitForVestarTransactionReceipt(txHash)
      addToast({
        type: 'success',
        message: '온체인 finalize가 완료되었습니다. 정산 화면으로 이동합니다.',
      })
      navigate(`/host/${id}/settlement`)
    } catch (error) {
      addToast({
        type: 'info',
        message: formatFinalizeError(error),
      })
    } finally {
      setIsFinalizing(false)
    }
  }

  return (
    <>
      {winner ? <VoteResultWinner result={result} winner={winner} mode="finalized" /> : null}
      <div className="min-h-full pb-8">
        <div className="mx-5 -mt-4 rounded-[28px] border border-[#E7E9ED] bg-[linear-gradient(180deg,#FFFFFF_0%,#FBF9FF_100%)] px-5 py-5 shadow-[0_10px_30px_rgba(113,64,255,0.06)] relative z-[1]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#7140FF] font-mono">
                Final Tally
              </div>
              <div className="mt-2 text-[19px] font-semibold text-[#090A0B]">최종 집계 확정</div>
              <div className="mt-2 text-[13px] leading-relaxed text-[#707070]">
                현재 집계 결과를 확인하고, 필요하면 finalize로 온체인 최종 결과를 확정합니다.
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                isSettlementSettled
                  ? 'bg-[rgba(34,197,94,0.12)] text-[#16a34a]'
                  : vote.onchainState === 'FINALIZED'
                    ? 'bg-[rgba(113,64,255,0.12)] text-[#7140FF]'
                    : 'bg-[#F3F4F6] text-[#5B6470]'
              }`}
            >
              {isSettlementSettled
                ? '정산 완료'
                : vote.onchainState === 'FINALIZED'
                  ? 'Finalize 완료'
                  : 'Finalize 대기'}
            </span>
          </div>
        </div>

        <VoteResultRankings rankedCandidates={result.rankedCandidates} mode="finalized" />

        <div className="px-5 pt-2 flex flex-col gap-3">
          <button
            type="button"
            disabled={isSettlementSettled || !isFinalizeReady || isFinalizing}
            onClick={handleFinalize}
            className="w-full rounded-2xl bg-[#7140FF] py-4 text-[15px] font-bold text-white disabled:bg-[#E7E9ED] disabled:text-[#707070] disabled:cursor-default hover:enabled:opacity-90 transition-opacity active:enabled:scale-[0.99]"
          >
            {isFinalizing ? 'Finalize 진행 중...' : 'Finalize 실행'}
          </button>
          <button
            type="button"
            onClick={() =>
              navigate(isSettlementSettled ? `/host/${id}/settlement` : `/host/manage/${id}`)
            }
            className="w-full rounded-2xl border border-[#E7E9ED] bg-white py-4 text-[15px] font-bold text-[#090A0B] transition-colors hover:border-[#d9ddf3] active:scale-[0.99]"
          >
            {isSettlementSettled ? '정산 결과 보기' : '관리 화면으로 돌아가기'}
          </button>
        </div>
      </div>
    </>
  )
}
