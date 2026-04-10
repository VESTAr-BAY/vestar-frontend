import { describe, expect, it } from 'vitest'
import { formatBallotCostLabel } from './paymentDisplay'

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
    expect(formatBallotCostLabel('100', 'en')).toBe('100 usdt')
  })
})
