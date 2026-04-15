import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { type Address, keccak256, toHex } from 'viem'
import { useChainId, useSwitchChain, useWalletClient } from 'wagmi'
import { StatusFeePromptModal } from '../../components/shared/StatusFeePromptModal'
import {
  estimateFinalizeElectionResultsFee,
  finalizeElectionResults,
  getElectionSnapshot,
  waitForVestarTransactionReceipt,
} from '../../contracts/vestar/actions'
import { vestarStatusTestnetChain } from '../../contracts/vestar/chain'
import { useVoteDetail } from '../../hooks/user/useVoteDetail'
import { useVoteLiveTally } from '../../hooks/user/useVoteLiveTally'
import { useStatusFeePrompt } from '../../hooks/useStatusFeePrompt'
import { useLanguage } from '../../providers/LanguageProvider'
import { useToast } from '../../providers/ToastProvider'
import type { VoteDetailData } from '../../types/vote'
import { buildStatusFeePreview, getStatusFeeTransactionNote } from '../../utils/statusFee'
import { getWalletActionErrorMessage } from '../../utils/walletErrors'
import { VoteResultRankings } from '../user/VoteResultRankings'
import { VoteResultWinner } from '../user/VoteResultWinner'

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

function getFinalTallyCopy(lang: 'en' | 'ko', needsSettlement: boolean) {
  return lang === 'ko'
    ? {
        eyebrow: '최종 집계',
        title: '최종 집계 확정',
        descriptionPending: needsSettlement
          ? '현재 집계 결과를 확인하고, 필요하면 finalize로 온체인 최종 결과를 확정하세요.'
          : '현재 집계 결과를 확인하고, 필요하면 finalize로 온체인 최종 결과를 확정하세요.',
        descriptionFinalized: needsSettlement
          ? '온체인 최종 확정이 완료되었습니다. 다음 단계로 정산을 진행할 수 있습니다.'
          : '온체인 최종 확정이 완료되었습니다. 이 무료 투표는 추가 정산 단계 없이 결과만 확인하면 됩니다.',
        descriptionSettled: '최종 확정과 정산이 모두 완료된 상태입니다.',
        guideCta: 'Finalize Guide',
        guideText: needsSettlement
          ? 'finalize는 투표 종료 후 최종 결과를 온체인에 확정하는 단계입니다. finalize가 끝나야 이후 정산을 진행할 수 있습니다.'
          : '무료 투표도 finalize를 통해 최종 결과를 온체인에 확정해야 선거 상태가 마무리됩니다. 정산은 없지만, 결과를 최종 상태로 고정하려면 finalize가 필요합니다.',
        statusSettled: '정산 완료',
        statusFinalized: 'Finalize 완료',
        statusPending: 'Finalize 대기',
        actionSettled: '정산 완료',
        actionCompleted: '최종 확정 완료',
        actionLoading: 'Finalize 진행 중...',
        actionIdle: 'Finalize 실행',
        backToSettlement: '정산 결과 보기',
        backToManagement: '관리 화면으로 돌아가기',
        missingElectionInfo: '온체인 election 주소가 없어 finalize를 진행할 수 없습니다.',
        walletRequired: '지갑 연결이 필요합니다.',
        txSubmitted: (txHash: string) => `Finalize 트랜잭션 제출됨: ${txHash}`,
        successWithSettlement: '온체인 finalize가 완료되었습니다. 정산 화면으로 이동합니다.',
        successWithoutSettlement: '온체인 최종 확정이 완료되었습니다. 관리 화면으로 돌아갑니다.',
        errorDefault: 'Finalize에 실패했습니다.',
        errorNotReady:
          '아직 finalize 가능한 단계가 아닙니다. 상태 전이를 확인한 뒤 다시 시도해 주세요.',
        errorUserRejected: '지갑에서 트랜잭션 서명이 취소되었습니다.',
        errorNetwork: '네트워크를 Status Testnet으로 전환한 뒤 다시 시도해 주세요.',
        errorTransactionFailed:
          'Finalize 트랜잭션 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      }
    : {
        eyebrow: 'Final Tally',
        title: 'Finalize Results',
        descriptionPending: needsSettlement
          ? 'Review the current tally and finalize the on-chain result when it is ready.'
          : 'Review the current tally and finalize the on-chain result when it is ready.',
        descriptionFinalized: needsSettlement
          ? 'The on-chain final result is already locked. Settlement is the next step.'
          : 'The on-chain final result is already locked. There is no settlement step for this free vote.',
        descriptionSettled: 'Both finalization and settlement are already complete.',
        guideCta: 'Finalize Guide',
        guideText: needsSettlement
          ? 'Finalize locks the final result on-chain after voting ends. Settlement becomes available only after finalization.'
          : 'Free votes still need finalization to lock the final result on-chain after voting ends. There is no settlement step, but finalize is required to complete the election state.',
        statusSettled: 'Settled',
        statusFinalized: 'Finalized',
        statusPending: 'Awaiting Finalize',
        actionSettled: 'Settlement Completed',
        actionCompleted: 'Finalization Completed',
        actionLoading: 'Finalizing...',
        actionIdle: 'Run Finalize',
        backToSettlement: 'View Settlement Summary',
        backToManagement: 'Back to Management',
        missingElectionInfo: 'Finalize cannot run because the on-chain election is missing.',
        walletRequired: 'Connect your wallet to continue.',
        txSubmitted: (txHash: string) => `Finalize transaction submitted: ${txHash}`,
        successWithSettlement: 'On-chain finalization completed. Moving to settlement.',
        successWithoutSettlement: 'On-chain finalization completed. Returning to management.',
        errorDefault: 'Finalization failed.',
        errorNotReady: 'Finalization is not available yet. Check the election state and try again.',
        errorUserRejected: 'Transaction signature was rejected in the wallet.',
        errorNetwork: 'Switch to Status Testnet and try again.',
        errorTransactionFailed: 'Finalize transaction failed. Please try again shortly.',
      }
}

function formatFinalizeError(error: unknown, copy: ReturnType<typeof getFinalTallyCopy>) {
  if (!(error instanceof Error)) {
    return copy.errorDefault
  }

  const message = error.message.trim()

  if (/revert|not finalized|invalid state|key reveal|reveal/i.test(message)) {
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

export function HostFinalTallyPage() {
  const { id = '1' } = useParams()
  const navigate = useNavigate()
  const { vote } = useVoteDetail(id)
  const { result, totalSubmissions, totalInvalidVotes } = useVoteLiveTally(id)
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

  const [isFinalizing, setIsFinalizing] = useState(false)
  const [isSettlementSettled, setIsSettlementSettled] = useState(false)
  const [isGuideOpen, setIsGuideOpen] = useState(false)
  const needsSettlement = vote ? hasSettlementStep(vote) : false
  const copy = useMemo(() => getFinalTallyCopy(lang, needsSettlement), [lang, needsSettlement])
  const winner = result?.rankedCandidates.find((candidate) => candidate.rank === 1)
  const isFinalizeReady = Boolean(
    vote &&
      vote.onchainState !== 'FINALIZED' &&
      ((vote.visibilityMode === 'OPEN' && vote.badge === 'end') ||
        (vote.visibilityMode === 'PRIVATE' && vote.badge === 'end')),
  )
  const resultManifestURI = `frontend://vestar/finalize/${vote?.onchainElectionId ?? ''}`
  const resultManifestHash = keccak256(toHex(resultManifestURI))
  const resultSummary = {
    resultManifestHash,
    resultManifestURI,
    totalSubmissions,
    totalValidVotes: result?.totalVotes ?? 0,
    totalInvalidVotes,
  }

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

  if (!vote || !result) {
    return <LoadingSkeleton />
  }

  const headerDescription = isSettlementSettled
    ? copy.descriptionSettled
    : vote.onchainState === 'FINALIZED'
      ? copy.descriptionFinalized
      : copy.descriptionPending
  const backPath =
    isSettlementSettled && needsSettlement ? `/host/${id}/settlement` : `/host/manage/${id}`
  const actionLabel = isSettlementSettled
    ? copy.actionSettled
    : vote.onchainState === 'FINALIZED'
      ? copy.actionCompleted
      : isFinalizing
        ? copy.actionLoading
        : copy.actionIdle

  const runFinalize = async () => {
    if (!vote.electionAddress || !vote.onchainElectionId) {
      addToast({
        type: 'error',
        message: copy.missingElectionInfo,
      })
      return
    }

    if (!walletClient?.account) {
      addToast({ type: 'error', message: copy.walletRequired })
      return
    }

    try {
      setIsFinalizing(true)

      if (chainId !== vestarStatusTestnetChain.id) {
        await switchChainAsync({ chainId: vestarStatusTestnetChain.id })
        addToast({
          type: 'info',
          message:
            lang === 'ko'
              ? '네트워크를 변경했습니다. 다시 한 번 finalize를 눌러주세요.'
              : 'The network was switched. Please tap finalize again.',
        })
        return
      }

      const txHash = await finalizeElectionResults(walletClient, vote.electionAddress as Address, {
        ...resultSummary,
      })

      addToast({ type: 'info', message: copy.txSubmitted(txHash) })
      await waitForVestarTransactionReceipt(txHash)
      addToast({
        type: 'success',
        message: needsSettlement ? copy.successWithSettlement : copy.successWithoutSettlement,
      })
      navigate(needsSettlement ? `/host/${id}/settlement` : `/host/manage/${id}`)
    } catch (error) {
      addToast({
        type: 'info',
        message: formatFinalizeError(error, copy),
      })
    } finally {
      setIsFinalizing(false)
    }
  }

  const handleFinalize = async () => {
    if (!vote.electionAddress || !vote.onchainElectionId) {
      addToast({
        type: 'error',
        message: copy.missingElectionInfo,
      })
      return
    }

    if (!walletClient?.account) {
      addToast({ type: 'error', message: copy.walletRequired })
      return
    }

    if (chainId !== vestarStatusTestnetChain.id) {
      await switchChainAsync({ chainId: vestarStatusTestnetChain.id })
      addToast({
        type: 'info',
        message:
          lang === 'ko'
            ? '네트워크를 변경했습니다. 다시 한 번 finalize를 눌러주세요.'
            : 'The network was switched. Please tap finalize again.',
      })
      return
    }

    void openFeePrompt({
      title: lang === 'ko' ? '수수료 안내' : 'Fee Notice',
      description:
        lang === 'ko'
          ? '현재 finalize 트랜잭션이 무료 처리 대상이 아니면 네트워크 수수료가 적용됩니다.'
          : 'If this finalize transaction is not currently eligible for gasless execution, a network fee will apply.',
      estimate: async () =>
        buildStatusFeePreview([
          await estimateFinalizeElectionResultsFee(
            walletClient,
            vote.electionAddress as Address,
            resultSummary,
          ),
        ]),
      note: (preview) => getStatusFeeTransactionNote(preview.transactionCount, lang),
      proceed: runFinalize,
    })
  }

  return (
    <>
      {winner ? <VoteResultWinner result={result} winner={winner} mode="finalized" /> : null}
      <div className="min-h-full bg-white pt-5 pb-8">
        <div className="mx-5 rounded-[28px] border border-[#E7E9ED] bg-[linear-gradient(180deg,#FFFFFF_0%,#FBF9FF_100%)] px-5 py-5 shadow-[0_10px_30px_rgba(113,64,255,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#7140FF] font-mono">
                {copy.eyebrow}
              </div>
              <div className="mt-2 text-[19px] font-semibold text-[#090A0B]">{copy.title}</div>
              <div className="mt-2 text-[13px] leading-relaxed text-[#707070]">
                {headerDescription}
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
                ? copy.statusSettled
                : vote.onchainState === 'FINALIZED'
                  ? copy.statusFinalized
                  : copy.statusPending}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsGuideOpen((prev) => !prev)}
          className="mx-5 mt-4 flex w-[calc(100%-2.5rem)] items-center justify-between rounded-2xl border border-[#DCCEFF] bg-[rgba(113,64,255,0.05)] px-4 py-3 text-left text-[13px] font-semibold text-[#7140FF] transition-colors hover:border-[#c9b2ff]"
          aria-expanded={isGuideOpen}
          aria-label={copy.guideCta}
        >
          <span>{copy.guideCta}</span>
          <span aria-hidden="true">{isGuideOpen ? '−' : '+'}</span>
        </button>
        {isGuideOpen ? (
          <div className="mx-5 mt-3 rounded-2xl border border-[#DCCEFF] bg-[rgba(113,64,255,0.05)] px-4 py-3">
            <div className="text-[13px] leading-relaxed text-[#5B6470]">{copy.guideText}</div>
          </div>
        ) : null}

        <VoteResultRankings rankedCandidates={result.rankedCandidates} mode="finalized" />

        <div className="px-5 pt-2 flex flex-col gap-3">
          <button
            type="button"
            disabled={
              isSettlementSettled ||
              vote.onchainState === 'FINALIZED' ||
              !isFinalizeReady ||
              isFinalizing
            }
            onClick={handleFinalize}
            className="w-full rounded-2xl bg-[#7140FF] py-4 text-[15px] font-bold text-white disabled:bg-[#E7E9ED] disabled:text-[#707070] disabled:cursor-default hover:enabled:opacity-90 transition-opacity active:enabled:scale-[0.99]"
          >
            {actionLabel}
          </button>
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="w-full rounded-2xl border border-[#E7E9ED] bg-white py-4 text-[15px] font-bold text-[#090A0B] transition-colors hover:border-[#d9ddf3] active:scale-[0.99]"
          >
            {isSettlementSettled && needsSettlement ? copy.backToSettlement : copy.backToManagement}
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
