import { formatUnits, parseUnits } from 'viem'
import type { Lang } from '../i18n'

export const PAYMENT_TOKEN_SYMBOL = 'USDT'
export const PAYMENT_TOKEN_DECIMALS = 6

// Shared product pricing: 1 ballot = 0.066 USDT = 100 KRW (display)
export const SHARED_PAID_BALLOT_COST_DECIMAL = '0.066'
export const SHARED_PAID_BALLOT_COST_RAW = 66_000n
export const SHARED_PAID_BALLOT_COST_KRW = 100n

const LEGACY_SHARED_PAID_BALLOT_COST_VALUES = new Set(['100', '100000000'])

function normalizePaymentValue(value: string | number | bigint | null | undefined) {
  return String(value ?? '').trim()
}

function trimFormattedAmount(value: string) {
  if (!value.includes('.')) {
    return value
  }

  return value.replace(/\.?0+$/, '')
}

export function isZeroPaymentValue(value: string | number | bigint | null | undefined) {
  const normalized = normalizePaymentValue(value)
  return !normalized || /^0(?:\.0+)?$/u.test(normalized)
}

export function isSharedPaidBallotCost(value: string | number | bigint | null | undefined) {
  const normalized = normalizePaymentValue(value)

  return (
    normalized === SHARED_PAID_BALLOT_COST_DECIMAL ||
    normalized === SHARED_PAID_BALLOT_COST_RAW.toString() ||
    LEGACY_SHARED_PAID_BALLOT_COST_VALUES.has(normalized)
  )
}

export function coercePaymentAmountToRawUnits(
  value: string | number | bigint | null | undefined,
): bigint | null {
  const normalized = normalizePaymentValue(value)

  if (!normalized) {
    return null
  }

  if (isZeroPaymentValue(normalized)) {
    return 0n
  }

  if (isSharedPaidBallotCost(normalized)) {
    return SHARED_PAID_BALLOT_COST_RAW
  }

  if (/^\d+$/u.test(normalized)) {
    return BigInt(normalized)
  }

  try {
    return parseUnits(normalized, PAYMENT_TOKEN_DECIMALS)
  } catch {
    return null
  }
}

export function formatPaymentTokenAmount(
  rawAmount: bigint,
  decimals = PAYMENT_TOKEN_DECIMALS,
  symbol = PAYMENT_TOKEN_SYMBOL,
) {
  return `${trimFormattedAmount(formatUnits(rawAmount, decimals))} ${symbol}`
}

export function convertRawPaymentToDisplayedKrw(rawAmount: bigint) {
  return (
    (rawAmount * SHARED_PAID_BALLOT_COST_KRW + SHARED_PAID_BALLOT_COST_RAW / 2n) /
    SHARED_PAID_BALLOT_COST_RAW
  )
}

export function formatDisplayedKrwAmount(amount: bigint) {
  return `${amount.toLocaleString('ko-KR')}원`
}

export function formatPaymentAmountFromRaw(rawAmount: bigint, lang: Lang) {
  return lang === 'ko'
    ? formatDisplayedKrwAmount(convertRawPaymentToDisplayedKrw(rawAmount))
    : formatPaymentTokenAmount(rawAmount)
}

export function formatSharedPaidBallotCost(lang: Lang) {
  return lang === 'ko'
    ? formatDisplayedKrwAmount(SHARED_PAID_BALLOT_COST_KRW)
    : `${SHARED_PAID_BALLOT_COST_DECIMAL} ${PAYMENT_TOKEN_SYMBOL}`
}
