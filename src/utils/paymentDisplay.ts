import type { Lang } from '../i18n'
import {
  coercePaymentAmountToRawUnits,
  formatPaymentAmountFromRaw,
  isZeroPaymentValue,
  PAYMENT_TOKEN_SYMBOL,
} from './paymentConstants'

export function formatBallotCostLabel(
  rawCost: string | number | bigint | null | undefined,
  lang: Lang,
) {
  const normalized = String(rawCost ?? '').trim()

  if (isZeroPaymentValue(normalized)) {
    return lang === 'ko' ? '무료' : 'Free'
  }

  const rawAmount = coercePaymentAmountToRawUnits(normalized)
  if (rawAmount !== null) {
    return formatPaymentAmountFromRaw(rawAmount, lang)
  }

  return lang === 'ko' ? normalized : `${normalized} ${PAYMENT_TOKEN_SYMBOL}`
}

export function formatSettlementAmount(rawAmount: bigint, lang: Lang, decimals = 6) {
  void decimals
  return formatPaymentAmountFromRaw(rawAmount, lang)
}
