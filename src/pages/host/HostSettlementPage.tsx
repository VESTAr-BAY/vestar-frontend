import { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { formatEther, type Address } from 'viem'
import { useChainId, useSwitchChain, useWalletClient } from 'wagmi'
import { VoteDetailHeaderContext } from '../../components/layout/VoteDetailLayout'
import {
  getElectionSnapshot,
  settleElectionRevenue,
  waitForVestarTransactionReceipt,
} from '../../contracts/vestar/actions'
import { vestarStatusTestnetChain } from '../../contracts/vestar/chain'
import { useVoteDetail } from '../../hooks/user/useVoteDetail'
import { useToast } from '../../providers/ToastProvider'
import { VoteHero } from '../user/VoteHero'
import { VoteInfoSection } from '../user/VoteInfoSection'

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-[#E7E9ED] border-t-[#7140FF] animate-spin" />
    </div>
  )
}

function formatTokenAmount(value: bigint) {
  return formatEther(value)
}

function formatSettlementError(error: unknown) {
  if (!(error instanceof Error)) {
    return '정산에 실패했습니다.'
  }

  const message = error.message.trim()

  if (/settled|already/i.test(message)) {
    return '이미 정산이 완료된 투표입니다.'
  }

  if (/finaliz|invalid state|revert/i.test(message)) {
    return '아직 정산 가능한 상태가 아닙니다. finalize 이후 다시 시도해 주세요.'
  }

  if (/user rejected|denied|rejected/i.test(message)) {
    return '지갑에서 트랜잭션 서명이 취소되었습니다.'
  }

  if (/network|chain/i.test(message)) {
    return '네트워크를 Status Testnet으로 전환한 뒤 다시 시도해 주세요.'
  }

  return '정산 트랜잭션 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'
}

export function HostSettlementPage() {
  const { id = '1' } = useParams()
  const navigate = useNavigate()
  const { setConfig } = useContext(VoteDetailHeaderContext)
  const { vote, isLoading: isVoteLoading } = useVoteDetail(id)
  const { addToast } = useToast()
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()

  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getElectionSnapshot>> | null>(null)
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(true)
  const [isSettling, setIsSettling] = useState(false)

  useEffect(() => {
    if (!vote) return

    setConfig({
      title: `${vote.title} — 정산`,
      onShare: () => {
        if (navigator.share) {
          navigator.share({ title: vote.title, url: window.location.href }).catch(() => {})
        }
      },
    })
  }, [vote, setConfig])

  useEffect(() => {
    if (!vote?.electionAddress) {
      setSnapshot(null)
      setIsSnapshotLoading(false)
      return
    }

    let cancelled = false
    setIsSnapshotLoading(true)

    getElectionSnapshot(vote.electionAddress as Address)
      .then((nextSnapshot) => {
        if (!cancelled) {
          setSnapshot(nextSnapshot)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSnapshot(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsSnapshotLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [vote?.electionAddress])

  const settlement = snapshot?.settlementSummary
  const isSettled = settlement?.settled ?? false
  const canSettle = Boolean(vote?.electionAddress && settlement && !isSettled)

  const cards = useMemo(
    () =>
      settlement
        ? [
            {
              label: '총 수익',
              value: `${formatTokenAmount(settlement.totalRevenueAmount)}`,
            },
            {
              label: '플랫폼 수수료',
              value: `${formatTokenAmount(settlement.platformRevenueAmount)}`,
            },
            {
              label: '주최자 정산액',
              value: `${formatTokenAmount(settlement.organizerRevenueAmount)}`,
            },
          ]
        : [],
    [settlement],
  )

  const handleSettle = async () => {
    if (!vote?.electionAddress) {
      addToast({ type: 'info', message: '온체인 election 정보가 없어 정산을 실행할 수 없습니다.' })
      return
    }

    if (!settlement) {
      addToast({ type: 'info', message: '정산 정보를 아직 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' })
      return
    }

    if (settlement.settled) {
      addToast({ type: 'info', message: '이미 정산이 완료된 투표입니다.' })
      return
    }

    if (!walletClient?.account) {
      addToast({ type: 'error', message: '지갑 연결이 필요합니다.' })
      return
    }

    try {
      setIsSettling(true)

      if (chainId !== vestarStatusTestnetChain.id) {
        await switchChainAsync({ chainId: vestarStatusTestnetChain.id })
        addToast({ type: 'info', message: '네트워크를 변경했습니다. 다시 한 번 정산을 눌러주세요.' })
        return
      }

      const txHash = await settleElectionRevenue(walletClient, vote.electionAddress as Address)
      addToast({ type: 'info', message: `정산 트랜잭션 제출됨: ${txHash}` })
      await waitForVestarTransactionReceipt(txHash)

      const nextSnapshot = await getElectionSnapshot(vote.electionAddress as Address)
      setSnapshot(nextSnapshot)
      addToast({ type: 'success', message: '정산이 완료되었습니다.' })
    } catch (error) {
      addToast({ type: 'info', message: formatSettlementError(error) })
    } finally {
      setIsSettling(false)
    }
  }

  if (isVoteLoading || isSnapshotLoading || !vote) {
    return <LoadingSkeleton />
  }

  return (
    <>
      <VoteHero vote={vote} />
      <VoteInfoSection vote={vote} />

      <div className="h-2 bg-[#F7F8FA]" />

      <div className="mx-5 mt-5 rounded-3xl border border-[#E7E9ED] bg-white px-5 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#7140FF] font-mono">
          Settlement
        </div>
        <div className="mt-2 text-[15px] font-semibold text-[#090A0B]">정산 실행</div>
        <div className="mt-1 text-[13px] text-[#707070]">
          finalize 이후 정산 가능한 수익을 온체인에서 처리합니다.
        </div>
      </div>

      <div className="mx-5 mt-4 grid grid-cols-1 gap-3">
        <div className="rounded-3xl border border-[#E7E9ED] bg-white px-5 py-4">
          <div className="text-[12px] text-[#707070]">정산 상태</div>
          <div className={`mt-2 text-[16px] font-semibold ${isSettled ? 'text-[#16a34a]' : 'text-[#090A0B]'}`}>
            {isSettled ? '정산 완료' : '정산 대기'}
          </div>
        </div>

        {cards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-[#E7E9ED] bg-white px-5 py-4">
            <div className="text-[12px] text-[#707070]">{card.label}</div>
            <div className="mt-2 text-[18px] font-semibold text-[#090A0B] font-mono">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="px-5 py-6 bg-[#F7F8FA] flex flex-col gap-3">
        <button
          type="button"
          onClick={() => navigate(`/host/manage/${id}`)}
          className="w-full bg-white text-[#090A0B] border border-[#E7E9ED] rounded-2xl py-4 text-[15px] font-bold hover:border-[#d9ddf3] transition-colors active:scale-[0.99]"
        >
          관리 페이지로 돌아가기
        </button>
        <button
          type="button"
          disabled={!canSettle || isSettling}
          onClick={handleSettle}
          className="w-full bg-[#090A0B] text-white rounded-2xl py-4 text-[15px] font-bold disabled:bg-[#E7E9ED] disabled:text-[#707070] disabled:cursor-default hover:enabled:opacity-85 transition-opacity active:enabled:scale-[0.99]"
        >
          {isSettling ? '정산 진행 중...' : isSettled ? '정산 완료' : '정산 실행'}
        </button>
      </div>
    </>
  )
}
