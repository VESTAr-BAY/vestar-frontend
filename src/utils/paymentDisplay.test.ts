import { describe, expect, it } from 'vitest'
import { formatBallotCostLabel, formatSettlementAmount } from './paymentDisplay'

describe('formatBallotCostLabel', () => {
  it('shows unlimited paid cost as KRW-style label in Korean', () => {
    expect(formatBallotCostLabel('0.066', 'ko')).toBe('100원')
    expect(formatBallotCostLabel('66000', 'ko')).toBe('100원')
  })

  it('shows unlimited paid cost as decimal USDT in English', () => {
    expect(formatBallotCostLabel('0.066', 'en')).toBe('0.066 USDT')
    expect(formatBallotCostLabel('66000', 'en')).toBe('0.066 USDT')
  })

  it('keeps standard paid fixed cost readable per locale', () => {
    expect(formatBallotCostLabel('100', 'ko')).toBe('100원')
    expect(formatBallotCostLabel('100', 'en')).toBe('0.066 USDT')
  })

  it('keeps legacy raw paid cost readable per locale', () => {
    expect(formatBallotCostLabel('100000000', 'ko')).toBe('100원')
    expect(formatBallotCostLabel('100000000', 'en')).toBe('0.066 USDT')
  })

  it('formats arbitrary raw mockUSDT amounts with the shared unit rules', () => {
    expect(formatBallotCostLabel('1500000', 'en')).toBe('1.5 USDT')
    expect(formatBallotCostLabel('1500000', 'ko')).toBe('2,273원')
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

  it('uses the shared KRW conversion ratio globally', () => {
    expect(formatSettlementAmount(1_500_000n, 'ko')).toBe('2,273원')
  })
})
