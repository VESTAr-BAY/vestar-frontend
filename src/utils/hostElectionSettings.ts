import type { ElectionSettingsDraft } from '../types/host'

export const FIXED_PAID_COST_PER_BALLOT = '100'
export const UNLIMITED_PAID_COST_PER_BALLOT = '0.066'

export function normalizeElectionSettingsDraft<T extends ElectionSettingsDraft>(settings: T): T {
  const isOpenVote = settings.visibilityMode === 'OPEN'
  const isUnlimitedPaid = settings.ballotPolicy === 'UNLIMITED_PAID'
  const nextPaymentMode = isUnlimitedPaid ? 'PAID' : settings.paymentMode

  // sungje : 화면 입력이 바뀌어도 공개투표/유료반복 규칙은 항상 같은 값으로 정리해서 UI와 컨트랙트 payload가 어긋나지 않게 한다.
  return {
    ...settings,
    resultReveal: isOpenVote ? 'immediate' : 'after_end',
    resultRevealAt: isOpenVote ? settings.endDate : settings.resultRevealAt,
    paymentMode: nextPaymentMode,
    costPerBallotEth:
      nextPaymentMode === 'FREE'
        ? '0'
        : isUnlimitedPaid
          ? UNLIMITED_PAID_COST_PER_BALLOT
          : FIXED_PAID_COST_PER_BALLOT,
    maxChoices: isUnlimitedPaid ? 1 : settings.maxChoices,
  }
}

export function getEffectiveResultRevealAt(settings: ElectionSettingsDraft): string {
  return settings.visibilityMode === 'OPEN' ? settings.endDate : settings.resultRevealAt
}
