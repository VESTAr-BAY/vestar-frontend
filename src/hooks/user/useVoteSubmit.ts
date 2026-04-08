import { useCallback, useState } from 'react'
import { useWalletClient, useSwitchChain } from 'wagmi'
import type { Address } from 'viem'
import {
  submitOpenVote,
  waitForVestarTransactionReceipt,
} from '../../contracts/vestar/actions'
import { vestarStatusTestnetChain } from '../../contracts/vestar/chain'

export type SubmitState = 'idle' | 'loading' | 'success'

export interface VoteSubmitResult {
  state: SubmitState
  txHash: string | null
  karmaEarned: number
  submit: (electionAddress: Address | undefined, candidateIds: string[]) => Promise<void>
  reset: () => void
}

export function useVoteSubmit(): VoteSubmitResult {
  const [state, setState] = useState<SubmitState>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const karmaEarned = 20 // TODO: query KarmaRegistry delta after tx confirms

  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()

  const submit = useCallback(
    async (electionAddress: Address | undefined, candidateIds: string[]) => {
      setState('loading')
      try {
        if (!electionAddress) {
          // ── Demo / mock path (no on-chain election deployed yet) ──────────
          await new Promise((resolve) => setTimeout(resolve, 1400))
          const mockHash =
            '0x' +
            Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
          setTxHash(mockHash)
          setState('success')
          return
        }

        // ── Real contract path ─────────────────────────────────────────────
        if (!walletClient) {
          throw new Error('Wallet not connected')
        }

        // Switch to Status Testnet if the user is on a different chain
        if (!walletClient.chain || walletClient.chain.id !== vestarStatusTestnetChain.id) {
          await switchChainAsync({ chainId: vestarStatusTestnetChain.id })
        }

        const hash = await submitOpenVote(walletClient, electionAddress, candidateIds)
        await waitForVestarTransactionReceipt(hash)
        setTxHash(hash)
        setState('success')
      } catch (err) {
        console.error('[useVoteSubmit] failed:', err)
        setState('idle')
      }
    },
    [walletClient, switchChainAsync],
  )

  const reset = useCallback(() => {
    setState('idle')
    setTxHash(null)
  }, [])

  return { state, txHash, karmaEarned, submit, reset }
}
