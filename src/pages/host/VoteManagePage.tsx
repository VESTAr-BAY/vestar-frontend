import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useChainId, useSwitchChain, useWalletClient } from 'wagmi'
import { keccak256, toHex, type Address } from 'viem'
import { VoteDetailHeaderContext } from '../../components/layout/VoteDetailLayout'
import { finalizeElectionResults, waitForVestarTransactionReceipt } from '../../contracts/vestar/actions'
import { vestarStatusTestnetChain } from '../../contracts/vestar/chain'
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
  electionAddress?: string
  onchainElectionId?: string
  isReady: boolean
}) {
  if (params.visibilityMode !== 'PRIVATE') {
    return 'Finalize는 비공개 투표에서만 사용할 수 있습니다.'
  }

  if (!params.electionAddress || !params.onchainElectionId) {
    return '온체인 election 정보가 아직 준비되지 않아 finalize를 실행할 수 없습니다.'
  }

  if (!params.isReady) {
    return '아직 finalize 가능한 단계가 아닙니다. 키 공개 이후 다시 시도해 주세요.'
  }

  return null
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

export function VoteManagePage() {
  const { id = '1' } = useParams()
  const navigate = useNavigate()
  const { vote, result, isLoading } = useVoteManage(id)
  const {
    vote: liveVote,
    rankedCandidates,
    totalVotes,
    totalSubmissions,
    totalInvalidVotes,
  } = useHostLiveTally(id)
  const { setConfig } = useContext(VoteDetailHeaderContext)
  const { addToast } = useToast()
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient({ chainId: vestarStatusTestnetChain.id })
  const { switchChainAsync } = useSwitchChain()

  const [isFinalizing, setIsFinalizing] = useState(false)

  useEffect(() => {
    if (!vote) return
    setConfig({
      title: `${vote.title} — 관리`,
      onShare: () => {
        if (navigator.share) {
          navigator.share({ title: vote.title, url: window.location.href }).catch(() => {})
        }
      },
    })
  }, [vote, setConfig])

  if (isLoading || !vote || !result) return <LoadingSkeleton />

  const isFinalizeReady = Boolean(
    vote.visibilityMode === 'PRIVATE' &&
    vote.electionAddress &&
    liveVote?.badge === 'end' &&
    vote.onchainElectionId,
  )
  const isLiveTallyAvailable = vote.badge !== 'end'
  const handleFinalize = async () => {
    const blockingMessage = getFinalizeBlockingMessage({
      visibilityMode: vote.visibilityMode,
      electionAddress: vote.electionAddress,
      onchainElectionId: vote.onchainElectionId,
      isReady: isFinalizeReady,
    })

    if (blockingMessage) {
      addToast({ type: 'info', message: blockingMessage })
      return
    }

    if (!vote.electionAddress || !vote.onchainElectionId) {
      addToast({ type: 'error', message: '온체인 election 주소가 없어 finalize를 진행할 수 없습니다.' })
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

      const txHash = await finalizeElectionResults(
        walletClient,
        vote.electionAddress as Address,
        {
          resultManifestHash,
          resultManifestURI,
          totalSubmissions,
          totalValidVotes: totalVotes,
          totalInvalidVotes,
        },
      )

      addToast({ type: 'info', message: `Finalize 트랜잭션 제출됨: ${txHash}` })
      await waitForVestarTransactionReceipt(txHash)
      addToast({ type: 'success', message: '온체인 finalize가 완료되었습니다. 인덱서 반영을 기다리는 중입니다.' })
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
      <VoteHero vote={vote} />
      <VoteInfoSection vote={vote} />

      <div className="h-2 bg-[#F7F8FA]" />

      <div className="mx-5 mt-5 rounded-3xl border border-[#E7E9ED] bg-white px-5 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#7140FF] font-mono">
          Host Detail
        </div>
        <div className="mt-2 text-[15px] font-semibold text-[#090A0B]">
          생성자 전용 상세 화면
        </div>
        <div className="mt-1 text-[13px] text-[#707070]">
          진행 중 집계 확인과 finalize를 여기서 이어서 처리할 수 있습니다.
        </div>
      </div>

      {/* 현재 투표 현황 */}
      <VoteResultRankings rankedCandidates={rankedCandidates.length > 0 ? rankedCandidates : result.rankedCandidates} />

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
          disabled={isFinalizing}
          onClick={handleFinalize}
          className="w-full bg-[#090A0B] text-white rounded-2xl py-4 text-[15px] font-bold disabled:bg-[#E7E9ED] disabled:text-[#707070] disabled:cursor-default hover:enabled:opacity-85 transition-opacity active:enabled:scale-[0.99] flex items-center justify-center gap-2"
        >
          {isFinalizing ? 'Finalize 진행 중...' : 'Finalize 실행'}
        </button>
      </div>
    </>
  )
}
