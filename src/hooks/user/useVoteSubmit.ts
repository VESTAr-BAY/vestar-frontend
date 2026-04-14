import { useCallback, useEffect, useRef, useState } from 'react'
import { maxUint256, type Address, type Hex } from 'viem'
import { useChainId, useSwitchChain, useWalletClient } from 'wagmi'
import {
  approveErc20Spender,
  canAccountSubmitBallot,
  estimateApproveErc20SpenderFee,
  estimateSubmitEncryptedVoteFee,
  estimateSubmitOpenVoteFee,
  getKarmaTier,
  getErc20Allowance,
  getErc20Balance,
  getElectionRemainingBallots,
  getElectionState,
  quoteElectionPayment,
  submitEncryptedVote,
  submitOpenVote,
  waitForVestarTransactionReceipt,
} from '../../contracts/vestar/actions'
import { vestarStatusTestnetChain } from '../../contracts/vestar/chain'
import { VESTAR_ELECTION_STATE } from '../../contracts/vestar/types'
import { useLanguage } from '../../providers/LanguageProvider'
import type { VoteDetailData } from '../../types/vote'
import { encryptBallotWithPublicKey, randomNonceHex } from '../../utils/privateBallot'
import {
  getVoteSubmissionBlockErrorMessage,
  resolveVoteSubmissionBlockReason,
} from '../../utils/voteEligibility'
import { formatBallotCostLabel } from '../../utils/paymentDisplay'
import { buildStatusFeePreview, type StatusFeePreview } from '../../utils/statusFee'
import { getWalletActionErrorMessage } from '../../utils/walletErrors'

const VOTE_SUBMIT_PREFLIGHT_DEBOUNCE_MS = 350
const VOTE_SUBMIT_PREFLIGHT_TTL_MS = 15_000
const MAX_PREPARED_VOTE_SUBMISSION_CACHE_ENTRIES = 6
const MOCK_USDT_MAX_APPROVAL = maxUint256

export type SubmitState = 'idle' | 'awaiting_signature' | 'confirming' | 'success'

type PreparedVoteSubmission = {
  key: string
  createdAt: number
  canSubmit: boolean
  electionState?: number
  remainingBallots?: number
  quotedPayment: bigint
  allowance?: bigint
  balance?: bigint
  encryptedBallot?: Hex
}

function getInsufficientPaidVoteBalanceMessage(requiredAmount: bigint, lang: 'ko' | 'en') {
  const amountLabel = formatBallotCostLabel(requiredAmount, lang)

  return lang === 'ko'
    ? `잔액이 부족합니다. 이 유료 투표에는 ${amountLabel}이 필요합니다. 충전한 뒤 다시 시도해주세요.`
    : `Insufficient balance. This paid vote requires ${amountLabel}. Add funds and try again.`
}

export interface VoteSubmitResult {
  state: SubmitState
  txHash: string | null
  errorMessage: string | null
  karmaEarned: number
  estimateFeePreview: (
    vote: VoteDetailData | null,
    candidateKeys: string[],
  ) => Promise<StatusFeePreview>
  submit: (vote: VoteDetailData | null, candidateKeys: string[]) => Promise<void>
  reset: () => void
}

function trimPreparedVoteSubmissionCache(cache: Map<string, PreparedVoteSubmission>) {
  while (cache.size > MAX_PREPARED_VOTE_SUBMISSION_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value
    if (!oldestKey) return
    cache.delete(oldestKey)
  }
}

function buildVoteSubmitPreparationKey(
  vote: VoteDetailData | null,
  candidateKeys: string[],
  voterAddress?: Address,
) {
  if (
    !vote?.electionAddress ||
    !vote.onchainElectionId ||
    !voterAddress ||
    candidateKeys.length === 0
  ) {
    return null
  }

  return JSON.stringify({
    electionAddress: vote.electionAddress,
    electionId: vote.onchainElectionId,
    visibilityMode: vote.visibilityMode,
    paymentMode: vote.paymentMode,
    paymentToken: vote.paymentToken ?? null,
    publicKeyPem: vote.publicKeyPem ?? null,
    voterAddress,
    candidateKeys: [...candidateKeys],
  })
}

async function prepareVoteSubmission(
  vote: VoteDetailData,
  candidateKeys: string[],
  voterAddress: Address,
): Promise<PreparedVoteSubmission> {
  const key = buildVoteSubmitPreparationKey(vote, candidateKeys, voterAddress)

  if (!key || !vote.electionAddress || !vote.onchainElectionId) {
    throw new Error('Vote submission preflight could not be prepared.')
  }

  const canSubmit = await canAccountSubmitBallot(vote.electionAddress as Address, voterAddress)

  let electionState: number | undefined
  let remainingBallots: number | undefined

  if (!canSubmit) {
    const [resolvedState, resolvedRemainingBallots] = await Promise.all([
      getElectionState(vote.electionAddress as Address).catch(() => undefined),
      getElectionRemainingBallots(vote.electionAddress as Address, voterAddress).catch(
        () => undefined,
      ),
    ])

    electionState = resolvedState
    remainingBallots = resolvedRemainingBallots
  }

  let quotedPayment = 0n
  let allowance: bigint | undefined
  let balance: bigint | undefined

  if (
    vote.paymentMode === 'PAID' &&
    vote.paymentToken &&
    vote.paymentToken !== '0x0000000000000000000000000000000000000000'
  ) {
    quotedPayment = await quoteElectionPayment(vote.electionAddress as Address, 1)
    if (quotedPayment > 0n) {
      ;[allowance, balance] = await Promise.all([
        getErc20Allowance(vote.paymentToken, voterAddress, vote.electionAddress as Address),
        getErc20Balance(vote.paymentToken, voterAddress),
      ])
    }
  }

  let encryptedBallot: Hex | undefined

  if (vote.visibilityMode === 'PRIVATE') {
    if (!vote.publicKeyPem) {
      throw new Error('Private election public key is missing')
    }

    encryptedBallot = await encryptBallotWithPublicKey({
      publicKeyPem: vote.publicKeyPem,
      payload: {
        schemaVersion: 1,
        electionId: vote.onchainElectionId,
        chainId: vestarStatusTestnetChain.id,
        electionAddress: vote.electionAddress,
        voterAddress,
        candidateKeys,
        nonce: randomNonceHex(),
      },
    })
  }

  return {
    key,
    createdAt: Date.now(),
    canSubmit,
    electionState,
    remainingBallots,
    quotedPayment,
    allowance,
    balance,
    encryptedBallot,
  }
}

export function useVoteSubmit(
  preflightVote: VoteDetailData | null = null,
  preflightCandidateKeys: string[] = [],
): VoteSubmitResult {
  const [state, setState] = useState<SubmitState>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const karmaEarned = 20

  const preparedSubmissionCacheRef = useRef<Map<string, PreparedVoteSubmission>>(new Map())
  const preparedSubmissionPromiseRef = useRef<Map<string, Promise<PreparedVoteSubmission>>>(
    new Map(),
  )

  const chainId = useChainId()
  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()
  const { lang } = useLanguage()

  const preflightKey = buildVoteSubmitPreparationKey(
    preflightVote,
    preflightCandidateKeys,
    walletClient?.account?.address,
  )

  const ensurePreparedSubmission = useCallback(
    async (vote: VoteDetailData, candidateKeys: string[], voterAddress: Address) => {
      const key = buildVoteSubmitPreparationKey(vote, candidateKeys, voterAddress)
      if (!key) {
        throw new Error('Vote submission preflight could not be prepared.')
      }

      const cached = preparedSubmissionCacheRef.current.get(key)
      if (cached && Date.now() - cached.createdAt < VOTE_SUBMIT_PREFLIGHT_TTL_MS) {
        return cached
      }

      if (cached) {
        preparedSubmissionCacheRef.current.delete(key)
      }

      const existingPromise = preparedSubmissionPromiseRef.current.get(key)
      if (existingPromise) {
        return existingPromise
      }

      const nextPromise = prepareVoteSubmission(vote, candidateKeys, voterAddress)
        .then((prepared) => {
          preparedSubmissionCacheRef.current.set(key, prepared)
          trimPreparedVoteSubmissionCache(preparedSubmissionCacheRef.current)
          return prepared
        })
        .finally(() => {
          preparedSubmissionPromiseRef.current.delete(key)
        })

      preparedSubmissionPromiseRef.current.set(key, nextPromise)
      return nextPromise
    },
    [],
  )

  useEffect(() => {
    if (!preflightKey || !preflightVote || !walletClient?.account?.address) return

    const timeoutId = window.setTimeout(() => {
      void ensurePreparedSubmission(
        preflightVote,
        preflightCandidateKeys,
        walletClient.account.address,
      ).catch(() => {})
    }, VOTE_SUBMIT_PREFLIGHT_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [ensurePreparedSubmission, preflightCandidateKeys, preflightKey, preflightVote, walletClient])

  const estimateFeePreview = useCallback(
    async (vote: VoteDetailData | null, candidateKeys: string[]) => {
      if (!vote?.electionAddress || !vote.onchainElectionId) {
        throw new Error(
          lang === 'ko'
            ? '아직 온체인 election 정보가 인덱싱되지 않아 투표할 수 없습니다.'
            : 'This vote cannot be submitted yet because the on-chain election data is not indexed.',
        )
      }

      if (!walletClient?.account) {
        throw new Error(
          lang === 'ko'
            ? '지갑 연결이 확인되지 않습니다. 지갑을 다시 연결한 뒤 시도해주세요.'
            : 'Wallet connection could not be confirmed. Reconnect your wallet and try again.',
        )
      }

      const prepared = await ensurePreparedSubmission(
        vote,
        candidateKeys,
        walletClient.account.address,
      )
      const feeEstimates = []

      if (
        vote.paymentMode === 'PAID' &&
        vote.paymentToken &&
        vote.paymentToken !== '0x0000000000000000000000000000000000000000' &&
        prepared.quotedPayment > 0n
      ) {
        let allowance = prepared.allowance

        if (allowance === undefined || allowance < prepared.quotedPayment) {
          allowance = await getErc20Allowance(
            vote.paymentToken,
            walletClient.account.address,
            vote.electionAddress as Address,
          )
        }

        if (allowance < prepared.quotedPayment) {
          feeEstimates.push(
            await estimateApproveErc20SpenderFee(
              walletClient,
              vote.paymentToken,
              vote.electionAddress as Address,
              MOCK_USDT_MAX_APPROVAL,
            ),
          )
        }
      }

      if (vote.visibilityMode === 'PRIVATE') {
        if (!prepared.encryptedBallot) {
          throw new Error('Private election payload could not be prepared.')
        }

        feeEstimates.push(
          await estimateSubmitEncryptedVoteFee(
            walletClient,
            vote.electionAddress as Address,
            prepared.encryptedBallot,
          ),
        )
      } else {
        feeEstimates.push(
          await estimateSubmitOpenVoteFee(
            walletClient,
            vote.electionAddress as Address,
            candidateKeys,
          ),
        )
      }

      return buildStatusFeePreview(feeEstimates)
    },
    [ensurePreparedSubmission, lang, walletClient],
  )

  const submit = useCallback(
    async (vote: VoteDetailData | null, candidateKeys: string[]) => {
      setErrorMessage(null)

      try {
        console.info('[useVoteSubmit] preflight', {
          electionAddress: vote?.electionAddress,
          onchainElectionId: vote?.onchainElectionId,
          visibilityMode: vote?.visibilityMode,
          chainId,
          walletAddress: walletClient?.account?.address,
          candidateKeys,
        })

        if (!vote?.electionAddress || !vote.onchainElectionId) {
          throw new Error(
            lang === 'ko'
              ? '아직 온체인 election 정보가 인덱싱되지 않아 투표할 수 없습니다.'
              : 'This vote cannot be submitted yet because the on-chain election data is not indexed.',
          )
        }

        if (!walletClient?.account) {
          throw new Error(
            lang === 'ko'
              ? '지갑 연결이 확인되지 않습니다. 지갑을 다시 연결한 뒤 시도해주세요.'
              : 'Wallet connection could not be confirmed. Reconnect your wallet and try again.',
          )
        }

        if (chainId !== vestarStatusTestnetChain.id) {
          console.warn('[useVoteSubmit] wrong chain', {
            currentChainId: chainId,
            expectedChainId: vestarStatusTestnetChain.id,
          })
          await switchChainAsync({ chainId: vestarStatusTestnetChain.id })
          throw new Error(
            lang === 'ko'
              ? '네트워크를 Status testnet으로 변경했습니다. 다시 한 번 투표를 눌러주세요.'
              : 'The network was switched to Status Testnet. Please tap vote again.',
          )
        }

        const prepared = await ensurePreparedSubmission(
          vote,
          candidateKeys,
          walletClient.account.address,
        )

        console.info('[useVoteSubmit] canSubmitBallot', {
          electionAddress: vote.electionAddress,
          walletAddress: walletClient.account.address,
          canSubmit: prepared.canSubmit,
        })

        if (!prepared.canSubmit) {
          console.warn('[useVoteSubmit] blocked before wallet request', {
            electionAddress: vote.electionAddress,
            walletAddress: walletClient.account.address,
            state: prepared.electionState,
            remainingBallots: prepared.remainingBallots,
          })

          if (
            prepared.electionState !== undefined &&
            prepared.electionState !== VESTAR_ELECTION_STATE.ACTIVE
          ) {
            throw new Error(
              lang === 'ko'
                ? '현재 투표 가능한 상태가 아닙니다.'
                : 'This vote is not currently open for submissions.',
            )
          }

          const currentTierId =
            vote.minKarmaTier > 0
              ? await getKarmaTier(walletClient.account.address).catch(() => undefined)
              : undefined
          const blockedReason = resolveVoteSubmissionBlockReason({
            vote,
            canSubmitBallot: prepared.canSubmit,
            remainingBallots: prepared.remainingBallots,
            currentTierId,
          })

          throw new Error(getVoteSubmissionBlockErrorMessage(blockedReason, lang, vote))
        }

        setState('awaiting_signature')

        if (
          vote.paymentMode === 'PAID' &&
          vote.paymentToken &&
          vote.paymentToken !== '0x0000000000000000000000000000000000000000'
        ) {
          const quotedPayment = prepared.quotedPayment

          console.info('[useVoteSubmit] payment quote', {
            electionAddress: vote.electionAddress,
            paymentToken: vote.paymentToken,
            quotedPayment: quotedPayment.toString(),
          })

          if (quotedPayment > 0n) {
            let balance = prepared.balance
            let allowance = prepared.allowance

            if (balance === undefined || balance < quotedPayment) {
              balance = await getErc20Balance(vote.paymentToken, walletClient.account.address)
            }

            console.info('[useVoteSubmit] token balance', {
              tokenAddress: vote.paymentToken,
              owner: walletClient.account.address,
              balance: balance.toString(),
              required: quotedPayment.toString(),
            })

            if (balance < quotedPayment) {
              throw new Error(getInsufficientPaidVoteBalanceMessage(quotedPayment, lang))
            }

            if (allowance === undefined || allowance < quotedPayment) {
              allowance = await getErc20Allowance(
                vote.paymentToken,
                walletClient.account.address,
                vote.electionAddress as Address,
              )
            }

            console.info('[useVoteSubmit] token allowance', {
              tokenAddress: vote.paymentToken,
              owner: walletClient.account.address,
              spender: vote.electionAddress,
              allowance: allowance.toString(),
              required: quotedPayment.toString(),
            })

            if (allowance < quotedPayment) {
              const approvalHash = await approveErc20Spender(
                walletClient,
                vote.paymentToken,
                vote.electionAddress as Address,
                MOCK_USDT_MAX_APPROVAL,
              )

              console.info('[useVoteSubmit] approval sent', {
                tokenAddress: vote.paymentToken,
                spender: vote.electionAddress,
                approvalAmount: MOCK_USDT_MAX_APPROVAL.toString(),
                approvalHash,
              })

              await waitForVestarTransactionReceipt(approvalHash)
              preparedSubmissionCacheRef.current.set(prepared.key, {
                ...prepared,
                createdAt: Date.now(),
                balance,
                allowance: MOCK_USDT_MAX_APPROVAL,
              })
            }
          }
        }

        const encryptedBallot =
          vote.visibilityMode === 'PRIVATE'
            ? (() => {
                if (!prepared.encryptedBallot) {
                  throw new Error('Private election payload could not be prepared.')
                }
                return prepared.encryptedBallot
              })()
            : null

        const hash =
          vote.visibilityMode === 'PRIVATE'
            ? await submitEncryptedVote(
                walletClient,
                vote.electionAddress as Address,
                encryptedBallot as Hex,
              )
            : await submitOpenVote(walletClient, vote.electionAddress as Address, candidateKeys)

        console.info('[useVoteSubmit] wallet request sent', {
          electionAddress: vote.electionAddress,
          visibilityMode: vote.visibilityMode,
          hash,
        })

        setState('confirming')
        await waitForVestarTransactionReceipt(hash)
        setTxHash(hash)
        setState('success')
      } catch (error) {
        console.error('[useVoteSubmit] failed:', error)
        setState('idle')
        setErrorMessage(
          getWalletActionErrorMessage(error, {
            lang,
            defaultMessage:
              lang === 'ko' ? '투표 제출에 실패했습니다.' : 'Failed to submit the vote.',
          }),
        )
      }
    },
    [chainId, ensurePreparedSubmission, lang, switchChainAsync, walletClient],
  )

  const reset = useCallback(() => {
    setState('idle')
    setTxHash(null)
    setErrorMessage(null)
  }, [])

  return {
    state,
    txHash,
    errorMessage,
    karmaEarned,
    estimateFeePreview,
    submit,
    reset,
  }
}
