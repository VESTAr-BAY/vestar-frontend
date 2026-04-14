import { formatEther } from 'viem'
import type { StatusFeeEstimate } from '../contracts/vestar/actions'

export interface StatusFeePreview {
  estimates: StatusFeeEstimate[]
  isGasless: boolean
  totalEstimatedFee: bigint
  transactionCount: number
}

function trimFormattedAmount(value: string) {
  if (!value.includes('.')) {
    return value
  }

  return value.replace(/\.?0+$/, '')
}

export function buildStatusFeePreview(estimates: StatusFeeEstimate[]): StatusFeePreview {
  const nextEstimates = estimates.filter(Boolean)
  const totalEstimatedFee = nextEstimates.reduce((sum, estimate) => sum + estimate.estimatedFee, 0n)

  return {
    estimates: nextEstimates,
    isGasless: nextEstimates.every((estimate) => estimate.isGasless),
    totalEstimatedFee,
    transactionCount: nextEstimates.length,
  }
}

export function formatStatusFeeAmount(amount: bigint) {
  return `${trimFormattedAmount(formatEther(amount))} ETH`
}

export function getStatusFeeTransactionNote(transactionCount: number, lang: 'en' | 'ko') {
  if (transactionCount <= 1) {
    return lang === 'ko'
      ? '현재 전송 기준 예상 네트워크 수수료입니다.'
      : 'This is the estimated network fee for the current transaction.'
  }

  return lang === 'ko'
    ? `현재 흐름에서는 최대 ${transactionCount}건의 네트워크 트랜잭션이 이어질 수 있습니다.`
    : `This flow may send up to ${transactionCount} network transactions.`
}
