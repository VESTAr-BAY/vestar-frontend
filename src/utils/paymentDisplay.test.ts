import { describe, expect, it } from 'vitest'
import { formatBallotCostLabel, formatSettlementAmount } from './paymentDisplay'

describe('formatBallotCostLabel', () => {
  it('shows unlimited paid cost as KRW-style label in Korean', () => {
    expect(formatBallotCostLabel('0.066', 'ko')).toBe('100원')
    expect(formatBallotCostLabel('66000', 'ko')).toBe('100원')
  })

  it('shows unlimited paid cost as decimal usdt in English', () => {
    expect(formatBallotCostLabel('0.066', 'en')).toBe('0.066 usdt')
    expect(formatBallotCostLabel('66000', 'en')).toBe('0.066 usdt')
  })

  it('keeps standard paid fixed cost readable per locale', () => {
    expect(formatBallotCostLabel('100', 'ko')).toBe('100원')
    expect(formatBallotCostLabel('100', 'en')).toBe('0.066 usdt')
  })
})

describe('formatSettlementAmount', () => {
  it('converts collected mockUSDT into KRW-style display for Korean', () => {
    expect(formatSettlementAmount(66_000_000n, 'ko')).toBe('100,000원')
    expect(formatSettlementAmount(0n, 'ko')).toBe('0원')
  })

  it('keeps collected amounts in USDT for English', () => {
    expect(formatSettlementAmount(66_000_000n, 'en')).toBe('66 USDT')
    expect(formatSettlementAmount(1_500_000n, 'en')).toBe('1.5 USDT')
  })
})
