import type { VoteDetailData } from '../types/vote'
import { getBallotRefreshExhaustedLabel } from './ballotRefresh'
import { getKarmaTierDisplay } from './karmaTier'

export type VoteSubmissionBlockReason = 'none' | 'tier' | 'ballots' | 'unavailable'

type ResolveVoteSubmissionBlockReasonArgs = {
  vote: VoteDetailData | null
  canSubmitBallot: boolean
  remainingBallots?: number
  currentTierId?: number
}

export function resolveVoteSubmissionBlockReason({
  vote,
  canSubmitBallot,
  remainingBallots,
  currentTierId,
}: ResolveVoteSubmissionBlockReasonArgs): VoteSubmissionBlockReason {
  if (!vote || canSubmitBallot) {
    return 'none'
  }

  if (
    typeof currentTierId === 'number' &&
    vote.minKarmaTier > 0 &&
    currentTierId < vote.minKarmaTier
  ) {
    return 'tier'
  }

  if (typeof remainingBallots === 'number' && remainingBallots <= 0) {
    return 'ballots'
  }

  return 'unavailable'
}

export function getVoteSubmissionBlockButtonLabel(
  reason: VoteSubmissionBlockReason,
  lang: 'ko' | 'en',
  vote?: VoteDetailData | null,
  nowMs = Date.now(),
) {
  switch (reason) {
    case 'tier':
      return lang === 'ko' ? '티어가 낮아서 참여할 수 없어요.' : 'Your tier is too low to join.'
    case 'ballots': {
      const refreshLabel = vote ? getBallotRefreshExhaustedLabel(vote, lang, nowMs) : null
      if (refreshLabel) {
        return refreshLabel
      }

      return lang === 'ko'
        ? '투표권을 모두 사용했어요.'
        : 'This address has used all available ballots.'
    }
    case 'unavailable':
      return lang === 'ko' ? '현재 제출 가능한 투표권이 없습니다.' : 'No ballot available right now.'
    case 'none':
    default:
      return null
  }
}

export function getVoteSubmissionBlockErrorMessage(
  reason: VoteSubmissionBlockReason,
  lang: 'ko' | 'en',
  vote?: Pick<
    VoteDetailData,
    'minKarmaTier' | 'ballotPolicy' | 'resetIntervalSeconds' | 'timezoneWindowOffset' | 'endDateISO' | 'badge'
  > | null,
  nowMs = Date.now(),
) {
  switch (reason) {
    case 'tier': {
      if (!vote || vote.minKarmaTier <= 0) {
        return lang === 'ko'
          ? '참여 조건이 맞지 않아 투표할 수 없습니다.'
          : 'This vote cannot be submitted because the eligibility requirement is not met.'
      }

      const minimumTier = getKarmaTierDisplay(vote.minKarmaTier)
      return lang === 'ko'
        ? `이 투표는 티어 ${minimumTier.id} · ${minimumTier.label} 이상부터 참여할 수 있어요.`
        : `This vote requires Tier ${minimumTier.id} · ${minimumTier.label} or higher.`
    }
    case 'ballots':
      if (vote) {
        const refreshLabel = getBallotRefreshExhaustedLabel(vote, lang, nowMs)
        if (refreshLabel) {
          return refreshLabel
        }
      }
      return lang === 'ko'
        ? '이 주소로 사용할 수 있는 투표권을 모두 사용했습니다.'
        : 'This address has already used all available ballots.'
    case 'unavailable':
    case 'none':
    default:
      return lang === 'ko'
        ? '현재 제출 가능한 투표권이 없습니다.'
        : 'There is no ballot available to submit right now.'
  }
}
