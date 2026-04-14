import { describe, expect, it } from 'vitest'
import { normalizeElectionSettingsDraft } from './hostElectionSettings'
import type { ElectionSettingsDraft } from '../types/host'
import { SHARED_PAID_BALLOT_COST_DECIMAL } from './paymentConstants'

const BASE_SETTINGS: ElectionSettingsDraft = {
  startDate: '2026-04-13T11:00',
  endDate: '2026-04-13T12:00',
  resultRevealAt: '2026-04-13T12:00',
  maxChoices: 1,
  visibilityMode: 'PRIVATE',
  ballotPolicy: 'ONE_PER_ELECTION',
  paymentMode: 'FREE',
  costPerBallotEth: '0',
  minKarmaTier: '0',
  resetIntervalValue: '60',
  resetIntervalUnit: 'MINUTE',
  resultReveal: 'after_end',
}

describe('normalizeElectionSettingsDraft', () => {
  it('forces standard paid elections to the shared 0.066 ballot cost', () => {
    const normalized = normalizeElectionSettingsDraft({
      ...BASE_SETTINGS,
      ballotPolicy: 'ONE_PER_INTERVAL',
      paymentMode: 'PAID',
      costPerBallotEth: '100',
    })

    expect(normalized.costPerBallotEth).toBe(SHARED_PAID_BALLOT_COST_DECIMAL)
  })

  it('forces unlimited paid elections to the shared 0.066 ballot cost', () => {
    const normalized = normalizeElectionSettingsDraft({
      ...BASE_SETTINGS,
      ballotPolicy: 'UNLIMITED_PAID',
      paymentMode: 'PAID',
      costPerBallotEth: '100',
    })

    expect(normalized.costPerBallotEth).toBe(SHARED_PAID_BALLOT_COST_DECIMAL)
  })
})
