import { describe, expect, it } from 'vitest'
import {
  getBallotRefreshCountdownLabel,
  getVoteChoiceSummary,
  getVoteFrequencySummary,
} from './ballotRefresh'

describe('ballot refresh helpers', () => {
  it('formats localized vote policy summaries', () => {
    expect(getVoteFrequencySummary('ONE_PER_ELECTION', undefined, 'ko')).toBe('총 1회')
    expect(getVoteFrequencySummary('UNLIMITED_PAID', undefined, 'en')).toBe('Unlimited paid')
    expect(getVoteChoiceSummary(1, 'ko')).toBe('최대 1명 선택 가능')
    expect(getVoteChoiceSummary(3, 'en')).toBe('Up to 3 choices')
  })

  it('computes the next ballot refresh countdown for interval ballots', () => {
    expect(
      getBallotRefreshCountdownLabel(
        {
          ballotPolicy: 'ONE_PER_INTERVAL',
          resetIntervalSeconds: 86_400,
          timezoneWindowOffset: 0,
          endDateISO: '2026-04-20T00:00:00.000Z',
          badge: 'live',
        },
        'ko',
        Date.parse('2026-04-13T12:00:00.000Z'),
      ),
    ).toBe('다음 투표권 갱신까지 12시간')
  })

  it('shows minutes and seconds when less than one hour remains', () => {
    expect(
      getBallotRefreshCountdownLabel(
        {
          ballotPolicy: 'ONE_PER_INTERVAL',
          resetIntervalSeconds: 300,
          timezoneWindowOffset: 0,
          endDateISO: '2026-04-20T00:00:00.000Z',
          badge: 'live',
        },
        'ko',
        Date.parse('2026-04-13T12:02:00.000Z'),
      ),
    ).toBe('다음 투표권 갱신까지 3분 0초')
  })
})
