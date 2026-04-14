import { describe, expect, it } from 'vitest'
import {
  buildStatusFeePreview,
  formatStatusFeeAmount,
  getStatusFeeTransactionNote,
} from './statusFee'

describe('buildStatusFeePreview', () => {
  it('treats all-zero fee estimates as gasless', () => {
    const preview = buildStatusFeePreview([
      {
        gasLimit: 21_000n,
        baseFeePerGas: 0n,
        priorityFeePerGas: 0n,
        maxFeePerGas: 0n,
        estimatedFee: 0n,
        isGasless: true,
      },
    ])

    expect(preview.isGasless).toBe(true)
    expect(preview.totalEstimatedFee).toBe(0n)
    expect(preview.transactionCount).toBe(1)
  })

  it('aggregates premium fees across multiple network transactions', () => {
    const preview = buildStatusFeePreview([
      {
        gasLimit: 21_000n,
        baseFeePerGas: 1n,
        priorityFeePerGas: 2n,
        maxFeePerGas: 3n,
        estimatedFee: 63_000n,
        isGasless: false,
      },
      {
        gasLimit: 40_000n,
        baseFeePerGas: 0n,
        priorityFeePerGas: 0n,
        maxFeePerGas: 0n,
        estimatedFee: 0n,
        isGasless: true,
      },
    ])

    expect(preview.isGasless).toBe(false)
    expect(preview.totalEstimatedFee).toBe(63_000n)
    expect(preview.transactionCount).toBe(2)
  })
})

describe('formatStatusFeeAmount', () => {
  it('formats wei amounts as ETH labels', () => {
    expect(formatStatusFeeAmount(1_500_000_000_000_000n)).toBe('0.0015 ETH')
  })
})

describe('getStatusFeeTransactionNote', () => {
  it('describes multi-transaction flows', () => {
    expect(getStatusFeeTransactionNote(2, 'ko')).toContain('2건')
    expect(getStatusFeeTransactionNote(2, 'en')).toContain('2 network transactions')
  })
})
