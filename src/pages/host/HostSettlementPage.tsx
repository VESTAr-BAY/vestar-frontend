import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { type Address } from 'viem'
import { useChainId, useSwitchChain, useWalletClient } from 'wagmi'
import { StatusFeePromptModal } from '../../components/shared/StatusFeePromptModal'
import {
  estimateSettleElectionRevenueFee,
  getElectionSnapshot,
  settleElectionRevenue,
  waitForVestarTransactionReceipt,
} from '../../contracts/vestar/actions'
import { vestarStatusTestnetChain } from '../../contracts/vestar/chain'
import { useStatusFeePrompt } from '../../hooks/useStatusFeePrompt'
import { useVoteDetail } from '../../hooks/user/useVoteDetail'
import { useLanguage } from '../../providers/LanguageProvider'
import { useToast } from '../../providers/ToastProvider'
import { formatSettlementAmount } from '../../utils/paymentDisplay'
import { getStatusFeeTransactionNote, buildStatusFeePreview } from '../../utils/statusFee'
import { getWalletActionErrorMessage } from '../../utils/walletErrors'
import { VoteHero } from '../user/VoteHero'
import { VoteInfoSection } from '../user/VoteInfoSection'

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-[#E7E9ED] border-t-[#7140FF] animate-spin" />
    </div>
  )
}

function getSettlementCopy(lang: 'en' | 'ko') {
  return lang === 'ko'
    ? {
        eyebrow: '정산',
        guideEyebrow: '정산 안내',
        titlePending: '정산 실행',
        titleSettled: '정산 결과',
        descriptionPending: 'finalize 이후 확정된 수익을 체인 기준으로 정산합니다.',
        descriptionSettled:
          '온체인 정산이 완료되었습니다. 아래 카드에서 수익 배분 결과를 확인할 수 있습니다.',
        statusPending: '정산 대기',
        statusSettled: '정산 완료',
        guidePending:
          '아직 정산 전 상태입니다. finalize가 끝난 뒤 주최자 지갑으로 정산 트랜잭션을 실행하세요.',
        guideSettled: '정산 트랜잭션까지 완료된 상태입니다. 추가 실행은 필요하지 않습니다.',
        totalRevenueLabel: '총 수익',
        platformFeeLabel: '플랫폼 수수료',
        organizerPayoutLabel: '주최자 정산액',
        payoutRatioLabel: '지급 비율',
        platformShareLabel: '플랫폼',
        organizerShareLabel: '주최자',
        settleButtonIdle: '정산 실행',
        settleButtonSettled: '정산 완료됨',
        settleButtonLoading: '정산 진행 중...',
        backButton: '관리 페이지로 돌아가기',
        missingElectionInfo: '온체인 election 정보가 없어 정산을 실행할 수 없습니다.',
        missingSummary: '정산 정보를 아직 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
        alreadySettled: '이미 정산이 완료된 투표입니다.',
        walletRequired: '지갑 연결이 필요합니다.',
        networkSwitched: '네트워크를 변경했습니다. 다시 한 번 정산을 눌러주세요.',
        txSubmitted: (txHash: string) => `정산 트랜잭션 제출됨: ${txHash}`,
        settlementCompleted: '정산이 완료되었습니다.',
        errorDefault: '정산에 실패했습니다.',
        errorNotReady: '아직 정산 가능한 상태가 아닙니다. finalize 이후 다시 시도해 주세요.',
        errorUserRejected: '지갑에서 트랜잭션 서명이 취소되었습니다.',
        errorNetwork: '네트워크를 Status Testnet으로 전환한 뒤 다시 시도해 주세요.',
        errorTransactionFailed: '정산 트랜잭션 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      }
    : {
        eyebrow: 'Settlement',
        guideEyebrow: 'Settlement Guide',
        titlePending: 'Run Settlement',
        titleSettled: 'Settlement Summary',
        descriptionPending:
          'After finalization, revenue is settled on-chain according to the recorded payout rules.',
        descriptionSettled:
          'On-chain settlement is complete. Review the revenue split in the cards below.',
        statusPending: 'Awaiting Settlement',
        statusSettled: 'Settled',
        guidePending:
          'Settlement is still pending. After finalization, run the settlement transaction from the organizer wallet.',
        guideSettled:
          'The settlement transaction has already completed. No further action is required.',
        totalRevenueLabel: 'Total Revenue',
        platformFeeLabel: 'Platform Fee',
        organizerPayoutLabel: 'Organizer Payout',
        payoutRatioLabel: 'Payout Ratio',
        platformShareLabel: 'Platform',
        organizerShareLabel: 'Organizer',
        settleButtonIdle: 'Run Settlement',
        settleButtonSettled: 'Settlement Completed',
        settleButtonLoading: 'Settling...',
        backButton: 'Back to Management',
        missingElectionInfo: 'Settlement cannot run because the on-chain election is missing.',
        missingSummary: 'Settlement data is still loading. Please try again in a moment.',
        alreadySettled: 'This election has already been settled.',
        walletRequired: 'Connect your wallet to continue.',
        networkSwitched: 'Network switched. Please tap settlement again.',
        txSubmitted: (txHash: string) => `Settlement transaction submitted: ${txHash}`,
        settlementCompleted: 'Settlement completed.',
        errorDefault: 'Settlement failed.',
        errorNotReady: 'Settlement is not available yet. Try again after finalization.',
        errorUserRejected: 'Transaction signature was rejected in the wallet.',
        errorNetwork: 'Switch to Status Testnet and try again.',
        errorTransactionFailed: 'Settlement transaction failed. Please try again shortly.',
      }
}

function formatSettlementError(error: unknown, copy: ReturnType<typeof getSettlementCopy>) {
  if (!(error instanceof Error)) {
    return copy.errorDefault
  }

  const message = error.message.trim()

  if (/settled|already/i.test(message)) {
    return copy.alreadySettled
  }

  if (/finaliz|invalid state|revert/i.test(message)) {
    return copy.errorNotReady
  }

  if (/user rejected|denied|rejected/i.test(message)) {
    return copy.errorUserRejected
  }

  if (/network|chain/i.test(message)) {
    return copy.errorNetwork
  }

  return copy.errorTransactionFailed
}

export function HostSettlementPage() {
  const { id = '1' } = useParams()
  const navigate = useNavigate()
  const { vote, isLoading: isVoteLoading } = useVoteDetail(id)
  const { lang } = useLanguage()
  const { addToast } = useToast()
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()
  const {
    prompt: feePrompt,
    busyAction: feePromptBusyAction,
    openForAction: openFeePrompt,
    closePrompt: closeFeePrompt,
    handleRecheck: handleFeePromptRecheck,
    handleProceed: handleFeePromptProceed,
  } = useStatusFeePrompt((error) => {
    addToast({
      type: 'error',
      message: getWalletActionErrorMessage(error, {
        lang,
        defaultMessage:
          lang === 'ko' ? '수수료 상태를 확인하지 못했습니다.' : 'Failed to check the fee status.',
      }),
    })
  })

  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getElectionSnapshot>> | null>(
    null,
  )
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(true)
  const [isSettling, setIsSettling] = useState(false)
  const copy = useMemo(() => getSettlementCopy(lang), [lang])

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
        label: copy.totalRevenueLabel,
        value: formatSettlementAmount(totalCollectedAmount, lang),
      },
      {
        label: copy.platformFeeLabel,
        value: formatSettlementAmount(platformRevenueAmount, lang),
      },
      {
        label: copy.organizerPayoutLabel,
        value: formatSettlementAmount(organizerRevenueAmount, lang),
      },
    ],
    [copy, lang, organizerRevenueAmount, platformRevenueAmount, totalCollectedAmount],
  )

  const runSettlement = async () => {
    if (!vote?.electionAddress) {
      addToast({ type: 'info', message: copy.missingElectionInfo })
      return
    }

    if (!settlement) {
      addToast({
        type: 'info',
        message: copy.missingSummary,
      })
      return
    }

    if (settlement.settled) {
      addToast({ type: 'info', message: copy.alreadySettled })
      return
    }

    if (!walletClient?.account) {
      addToast({ type: 'error', message: copy.walletRequired })
      return
    }

    try {
      setIsSettling(true)

      const txHash = await settleElectionRevenue(walletClient, vote.electionAddress as Address)
      addToast({ type: 'info', message: copy.txSubmitted(txHash) })
      await waitForVestarTransactionReceipt(txHash)

      const nextSnapshot = await getElectionSnapshot(vote.electionAddress as Address)
      setSnapshot(nextSnapshot)
      addToast({ type: 'success', message: copy.settlementCompleted })
    } catch (error) {
      addToast({ type: 'info', message: formatSettlementError(error, copy) })
    } finally {
      setIsSettling(false)
    }
  }

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

    if (chainId !== vestarStatusTestnetChain.id) {
      await switchChainAsync({ chainId: vestarStatusTestnetChain.id })
      addToast({
        type: 'info',
        message:
          lang === 'ko'
            ? '네트워크를 변경했습니다. 다시 한 번 정산을 눌러주세요.'
            : 'The network was switched. Please tap settlement again.',
      })
      return
    }

    void openFeePrompt({
      title: lang === 'ko' ? '수수료 안내' : 'Fee Notice',
      description:
        lang === 'ko'
          ? '현재 정산 트랜잭션이 무료 처리 대상이 아니면 네트워크 수수료가 적용됩니다.'
          : 'If this settlement transaction is not currently eligible for gasless execution, a network fee will apply.',
      estimate: async () =>
        buildStatusFeePreview([
          await estimateSettleElectionRevenueFee(walletClient, vote.electionAddress as Address),
        ]),
      note: (preview) => getStatusFeeTransactionNote(preview.transactionCount, lang),
      proceed: runSettlement,
    })
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
                {copy.eyebrow}
              </div>
              <div className="mt-2 text-[19px] font-semibold text-[#090A0B]">
                {isSettled ? copy.titleSettled : copy.titlePending}
              </div>
              <div className="mt-2 text-[13px] leading-relaxed text-[#707070]">
                {isSettled ? copy.descriptionSettled : copy.descriptionPending}
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                isSettled
                  ? 'bg-[rgba(34,197,94,0.12)] text-[#16a34a]'
                  : 'bg-[#F3F4F6] text-[#5B6470]'
              }`}
            >
              {isSettled ? copy.statusSettled : copy.statusPending}
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-[#E9DDFC] bg-[rgba(113,64,255,0.05)] px-4 py-3">
            <div className="text-[11px] font-mono uppercase tracking-[1px] text-[#7140FF]">
              {copy.guideEyebrow}
            </div>
            <div className="mt-2 text-[13px] leading-relaxed text-[#5B6470]">
              {isSettled ? copy.guideSettled : copy.guidePending}
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
              <div className="mt-2 font-mono text-[22px] font-semibold tracking-[-0.02em] text-[#090A0B]">
                {card.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-5 mt-4 rounded-[24px] border border-[#E7E9ED] bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[12px] text-[#707070]">{copy.payoutRatioLabel}</div>
              <div className="mt-1 text-[14px] font-semibold text-[#090A0B]">
                {copy.platformShareLabel} {Number(platformShareBps) / 100}% ·{' '}
                {copy.organizerShareLabel} {Number(organizerShareBps) / 100}%
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
            {isSettling
              ? copy.settleButtonLoading
              : isSettled
                ? copy.settleButtonSettled
                : copy.settleButtonIdle}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/host/manage/${id}`)}
            className="w-full rounded-2xl border border-[#E7E9ED] bg-white py-4 text-[15px] font-bold text-[#090A0B] hover:border-[#d9ddf3] transition-colors active:scale-[0.99]"
          >
            {copy.backButton}
          </button>
        </div>
      </div>

      <StatusFeePromptModal
        open={Boolean(feePrompt)}
        title={feePrompt?.title ?? ''}
        description={feePrompt?.description ?? ''}
        estimatedFee={feePrompt?.preview.totalEstimatedFee ?? 0n}
        note={feePrompt?.note ?? ''}
        busyAction={feePromptBusyAction}
        onProceed={() => void handleFeePromptProceed()}
        onRefresh={() => void handleFeePromptRecheck()}
        onClose={closeFeePrompt}
      />
    </>
  )
}
