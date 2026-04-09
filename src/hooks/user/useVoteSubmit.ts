import { useCallback, useState } from 'react'
import type { Address } from 'viem'
import { useChainId, useSwitchChain, useWalletClient } from 'wagmi'
import {
  canAccountSubmitBallot,
  getElectionRemainingBallots,
  getElectionState,
  submitEncryptedVote,
  submitOpenVote,
  waitForVestarTransactionReceipt,
} from '../../contracts/vestar/actions'
import { vestarStatusTestnetChain } from '../../contracts/vestar/chain'
import { VESTAR_ELECTION_STATE } from '../../contracts/vestar/types'
import { useLanguage } from '../../providers/LanguageProvider'
import type { VoteDetailData } from '../../types/vote'
import { encryptBallotWithPublicKey, randomNonceHex } from '../../utils/privateBallot'
import { getWalletActionErrorMessage } from '../../utils/walletErrors'

export type SubmitState = 'idle' | 'awaiting_signature' | 'confirming' | 'success'

export interface VoteSubmitResult {
  state: SubmitState
  txHash: string | null
  errorMessage: string | null
  karmaEarned: number
  submit: (vote: VoteDetailData | null, candidateKeys: string[]) => Promise<void>
  reset: () => void
}

export function useVoteSubmit(): VoteSubmitResult {
  const [state, setState] = useState<SubmitState>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const karmaEarned = 20

  const chainId = useChainId()
  const { data: walletClient } = useWalletClient({ chainId: vestarStatusTestnetChain.id })
  const { switchChainAsync } = useSwitchChain()
  const { lang } = useLanguage()

  const submit = useCallback(
    async (vote: VoteDetailData | null, candidateKeys: string[]) => {
      setErrorMessage(null)

      try {
        if (!vote?.electionAddress || !vote.onchainElectionId) {
          throw new Error('아직 온체인 election 정보가 인덱싱되지 않아 투표할 수 없습니다.')
        }

        if (!walletClient?.account) {
          throw new Error('Wallet not connected')
        }

        if (chainId !== vestarStatusTestnetChain.id) {
          await switchChainAsync({ chainId: vestarStatusTestnetChain.id })
        }

        const canSubmit = await canAccountSubmitBallot(
          vote.electionAddress as Address,
          walletClient.account.address,
        )

        if (!canSubmit) {
          const [state, remainingBallots] = await Promise.all([
            getElectionState(vote.electionAddress as Address).catch(() => undefined),
            getElectionRemainingBallots(
              vote.electionAddress as Address,
              walletClient.account.address,
            ).catch(() => undefined),
          ])

          if (state !== undefined && state !== VESTAR_ELECTION_STATE.ACTIVE) {
            throw new Error('현재 투표 가능한 상태가 아닙니다.')
          }

          if (remainingBallots !== undefined && remainingBallots <= 0) {
            throw new Error('이 주소로 사용할 수 있는 투표권을 모두 사용했습니다.')
          }

          throw new Error('현재 제출 가능한 투표권이 없습니다.')
        }

        setState('awaiting_signature')

        const hash =
          vote.visibilityMode === 'PRIVATE'
            ? await submitEncryptedVote(
                walletClient,
                vote.electionAddress as Address,
                await encryptBallotWithPublicKey({
                  publicKeyPem: (() => {
                    if (!vote.publicKeyPem) {
                      throw new Error('Private election public key is missing')
                    }

                    return vote.publicKeyPem
                  })(),
                  payload: {
                    schemaVersion: 1,
                    electionId: vote.onchainElectionId,
                    chainId: vestarStatusTestnetChain.id,
                    electionAddress: vote.electionAddress,
                    voterAddress: walletClient.account.address,
                    candidateKeys,
                    nonce: randomNonceHex(),
                  },
                }),
              )
            : await submitOpenVote(walletClient, vote.electionAddress as Address, candidateKeys)

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
    [chainId, lang, switchChainAsync, walletClient],
  )

  const reset = useCallback(() => {
    setState('idle')
    setTxHash(null)
    setErrorMessage(null)
  }, [])

  return { state, txHash, errorMessage, karmaEarned, submit, reset }
}
