import { useCallback, useState } from 'react'

export type SubmitState = 'idle' | 'loading' | 'success' | 'error'

export interface VoteSubmitResult {
  state: SubmitState
  txHash: string | null
  karmaEarned: number
  submit: (voteId: string, candidateIds: string[]) => Promise<void>
  reset: () => void
}

export function useVoteSubmit(): VoteSubmitResult {
  const [state, setState] = useState<SubmitState>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const karmaEarned = 20 // TODO: from contract

  const submit = useCallback(async (_voteId: string, _candidateIds: string[]) => {
    setState('loading')
    // Simulate network delay — replace with wagmi writeContract
    await new Promise((resolve) => setTimeout(resolve, 1400))
    const hash =
      '0x' +
      Array.from({ length: 40 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')
    setTxHash(hash)
    setState('success')
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setTxHash(null)
  }, [])

  return { state, txHash, karmaEarned, submit, reset }
}
