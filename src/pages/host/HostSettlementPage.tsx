import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { type Address, formatUnits } from 'viem'
import { useChainId, useSwitchChain, useWalletClient } from 'wagmi'
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

function formatTokenAmount(value: bigint, decimals = 6) {
  return formatUnits(value, decimals)
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
  const { vote, isLoading: isVoteLoading } = useVoteDetail(id)
  const { addToast } = useToast()
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()

  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getElectionSnapshot>> | null>(
    null,
  )
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(true)
  const [isSettling, setIsSettling] = useState(false)

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
  const totalCollectedAmount = snapshot?.totalCollectedAmount ?? 0n
  const platformShareBps = BigInt(snapshot?.platformShareBps ?? 0)
  const organizerShareBps = BigInt(snapshot?.organizerShareBps ?? 0)
  const bpsDenominator = 10_000n
  const platformRevenueAmount =
    totalCollectedAmount > 0n ? (totalCollectedAmount * platformShareBps) / bpsDenominator : 0n
  const organizerRevenueAmount =
    totalCollectedAmount > 0n ? (totalCollectedAmount * organizerShareBps) / bpsDenominator : 0n

  const cards = useMemo(
    () => [
      {
        label: '총 수익',
        value: `${formatTokenAmount(totalCollectedAmount)}`,
      },
      {
        label: '플랫폼 수수료',
        value: `${formatTokenAmount(platformRevenueAmount)}`,
      },
      {
        label: '주최자 정산액',
        value: `${formatTokenAmount(organizerRevenueAmount)}`,
      },
    ],
    [organizerRevenueAmount, platformRevenueAmount, totalCollectedAmount],
  )

  const handleSettle = async () => {
    if (!vote?.electionAddress) {
      addToast({ type: 'info', message: '온체인 election 정보가 없어 정산을 실행할 수 없습니다.' })
      return
    }

    if (!settlement) {
      addToast({
        type: 'info',
        message: '정산 정보를 아직 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      })
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
        addToast({
          type: 'info',
          message: '네트워크를 변경했습니다. 다시 한 번 정산을 눌러주세요.',
        })
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
      <div className="pb-8">
        <VoteInfoSection vote={vote} />

        <div className="h-2 bg-[#F7F8FA] my-3" />

        <div className="mx-5 rounded-[28px] border border-[#E7E9ED] bg-[linear-gradient(180deg,#FFFFFF_0%,#FBF9FF_100%)] px-5 py-5 shadow-[0_10px_30px_rgba(113,64,255,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#7140FF] font-mono">
                Settlement
              </div>
              <div className="mt-2 text-[19px] font-semibold text-[#090A0B]">
                {isSettled ? '정산 결과' : '정산 실행'}
              </div>
              <div className="mt-2 text-[13px] leading-relaxed text-[#707070]">
                {isSettled
                  ? '온체인 정산이 완료되었습니다. 아래 카드에서 수익 배분 결과를 확인할 수 있습니다.'
                  : 'finalize 이후 확정된 수익을 체인 기준으로 정산합니다.'}
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                isSettled
                  ? 'bg-[rgba(34,197,94,0.12)] text-[#16a34a]'
                  : 'bg-[#F3F4F6] text-[#5B6470]'
              }`}
            >
              {isSettled ? '정산 완료' : '정산 대기'}
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-[#E9DDFC] bg-[rgba(113,64,255,0.05)] px-4 py-3">
            <div className="text-[11px] font-mono uppercase tracking-[1px] text-[#7140FF]">
              Settlement Guide
            </div>
            <div className="mt-2 text-[13px] leading-relaxed text-[#5B6470]">
              {isSettled
                ? '정산 트랜잭션까지 완료된 상태입니다. 추가 실행은 필요하지 않습니다.'
                : '아직 정산 전 상태입니다. finalize가 끝난 뒤 주최자 지갑으로 정산 트랜잭션을 실행하세요.'}
            </div>
          </div>
        </div>

        <div className="mx-5 mt-4 grid grid-cols-1 gap-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-[24px] border border-[#E7E9ED] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
            >
              <div className="text-[12px] font-medium text-[#707070]">{card.label}</div>
              <div className="mt-2 text-[22px] font-semibold text-[#090A0B] font-mono tracking-[-0.02em]">
                {card.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-5 mt-4 rounded-[24px] border border-[#E7E9ED] bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[12px] text-[#707070]">지급 비율</div>
              <div className="mt-1 text-[14px] font-semibold text-[#090A0B]">
                플랫폼 {Number(platformShareBps) / 100}% · 주최자 {Number(organizerShareBps) / 100}%
              </div>
            </div>
            <div className="h-2 w-24 overflow-hidden rounded-full bg-[#EEF0F4]">
              <div
                className="h-full rounded-full bg-[#7140FF]"
                style={{
                  width: `${Number(organizerShareBps) / 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="px-5 pt-6 flex flex-col gap-3">
          <button
            type="button"
            disabled={!canSettle || isSettling}
            onClick={handleSettle}
            className="w-full rounded-2xl bg-[#7140FF] py-4 text-[15px] font-bold text-white disabled:bg-[#E7E9ED] disabled:text-[#707070] disabled:cursor-default hover:enabled:opacity-90 transition-opacity active:enabled:scale-[0.99]"
          >
            {isSettling ? '정산 진행 중...' : isSettled ? '정산 결과 확인 완료' : '정산 실행'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/host/manage/${id}`)}
            className="w-full rounded-2xl border border-[#E7E9ED] bg-white py-4 text-[15px] font-bold text-[#090A0B] hover:border-[#d9ddf3] transition-colors active:scale-[0.99]"
          >
            관리 페이지로 돌아가기
          </button>
        </div>
      </div>
    </>
  )
}
