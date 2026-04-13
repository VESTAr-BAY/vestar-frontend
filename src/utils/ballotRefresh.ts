import type { VoteBallotPolicy } from '../types/host'
import type { VoteDetailData } from '../types/vote'

function formatShortDuration(totalSeconds: number, lang: 'ko' | 'en') {
  if (totalSeconds <= 0) {
    return lang === 'ko' ? '0초' : '0s'
  }

  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) {
    return lang === 'ko'
      ? `${days}일${hours > 0 ? ` ${hours}시간` : ''}`
      : `${days}d${hours > 0 ? ` ${hours}h` : ''}`
  }

  if (hours > 0) {
    return lang === 'ko'
      ? `${hours}시간${minutes > 0 ? ` ${minutes}분` : ''}`
      : `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
  }

  if (minutes > 0) {
    return lang === 'ko' ? `${minutes}분 ${seconds}초` : `${minutes}m ${seconds}s`
  }

  return lang === 'ko' ? `${seconds}초` : `${seconds}s`
}

function formatIntervalLabel(seconds: number, lang: 'ko' | 'en') {
  if (seconds % 86_400 === 0) {
    const days = seconds / 86_400
    if (days === 1) return lang === 'ko' ? '매일' : 'day'
    return lang === 'ko' ? `${days}일마다` : `${days} days`
  }

  if (seconds % 3_600 === 0) {
    const hours = seconds / 3_600
    if (hours === 1) return lang === 'ko' ? '매시간' : 'hour'
    return lang === 'ko' ? `${hours}시간마다` : `${hours} hours`
  }

  if (seconds % 60 === 0) {
    const minutes = seconds / 60
    if (minutes === 1) return lang === 'ko' ? '매분' : 'minute'
    return lang === 'ko' ? `${minutes}분마다` : `${minutes} minutes`
  }

  return lang === 'ko' ? `${seconds}초마다` : `${seconds} seconds`
}

export function getVoteFrequencySummary(
  ballotPolicy: VoteBallotPolicy | undefined,
  resetIntervalSeconds: number | undefined,
  lang: 'ko' | 'en',
) {
  switch (ballotPolicy) {
    case 'ONE_PER_ELECTION':
      return lang === 'ko' ? '총 1회' : '1 vote total'
    case 'ONE_PER_INTERVAL':
      if (!resetIntervalSeconds || resetIntervalSeconds <= 0) {
        return lang === 'ko' ? '주기별 1회' : '1 vote per interval'
      }

      if (lang === 'ko') {
        const intervalLabel = formatIntervalLabel(resetIntervalSeconds, lang)
        return intervalLabel.endsWith('마다') ? `${intervalLabel} 1회` : `${intervalLabel} 1회`
      }

      const intervalLabel = formatIntervalLabel(resetIntervalSeconds, lang)
      return `1 vote per ${intervalLabel}`
    case 'UNLIMITED_PAID':
      return lang === 'ko' ? '유료 반복 투표' : 'Unlimited paid'
    default:
      return lang === 'ko' ? '총 1회' : '1 vote total'
  }
}

export function getVoteChoiceSummary(maxChoices: number, lang: 'ko' | 'en') {
  const normalizedMaxChoices =
    Number.isFinite(maxChoices) && maxChoices > 0 ? Math.trunc(maxChoices) : 1

  return lang === 'ko'
    ? `최대 ${normalizedMaxChoices}명 선택 가능`
    : `Up to ${normalizedMaxChoices} ${normalizedMaxChoices === 1 ? 'choice' : 'choices'}`
}

export function getNextBallotRefreshAt(
  ballotPolicy: VoteBallotPolicy | undefined,
  resetIntervalSeconds: number | undefined,
  timezoneWindowOffset: number | undefined,
  endDateISO: string | undefined,
  nowMs: number,
) {
  if (ballotPolicy !== 'ONE_PER_INTERVAL' || !resetIntervalSeconds || resetIntervalSeconds <= 0) {
    return null
  }

  const endMs = endDateISO ? new Date(endDateISO).getTime() : Number.NaN
  if (Number.isFinite(endMs) && nowMs >= endMs) {
    return null
  }

  const offset = timezoneWindowOffset ?? 0
  const nowSeconds = Math.floor(nowMs / 1000)
  const adjusted = nowSeconds + offset
  const currentPeriodKey = Math.floor(adjusted / resetIntervalSeconds)
  const nextBoundarySeconds = (currentPeriodKey + 1) * resetIntervalSeconds - offset
  const nextBoundaryMs = nextBoundarySeconds * 1000

  if (Number.isFinite(endMs) && nextBoundaryMs >= endMs) {
    return null
  }

  return nextBoundaryMs
}

export function getBallotRefreshCountdownLabel(
  vote: Pick<VoteDetailData, 'ballotPolicy' | 'resetIntervalSeconds' | 'timezoneWindowOffset' | 'endDateISO' | 'badge'>,
  lang: 'ko' | 'en',
  nowMs: number,
) {
  if (vote.badge !== 'live') {
    return null
  }

  const nextRefreshAt = getNextBallotRefreshAt(
    vote.ballotPolicy,
    vote.resetIntervalSeconds,
    vote.timezoneWindowOffset,
    vote.endDateISO,
    nowMs,
  )

  if (!nextRefreshAt) {
    return null
  }

  const remainingSeconds = Math.max(0, Math.floor((nextRefreshAt - nowMs) / 1000))
  const durationLabel = formatShortDuration(remainingSeconds, lang)

  return lang === 'ko'
    ? `다음 투표권 갱신까지 ${durationLabel}`
    : `Next ballot refresh in ${durationLabel}`
}

export function getBallotRefreshExhaustedLabel(
  vote: Pick<VoteDetailData, 'ballotPolicy' | 'resetIntervalSeconds' | 'timezoneWindowOffset' | 'endDateISO' | 'badge'>,
  lang: 'ko' | 'en',
  nowMs: number,
) {
  const countdownLabel = getBallotRefreshCountdownLabel(vote, lang, nowMs)
  if (!countdownLabel) {
    return null
  }

  return lang === 'ko'
    ? `${countdownLabel.replace('다음 투표권 갱신까지 ', '투표권 갱신까지 ')} 남았어요.`
    : `${countdownLabel}.`
}
