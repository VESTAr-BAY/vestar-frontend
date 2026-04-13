import { formatUnits } from 'viem'
import type { Lang } from '../i18n'

const UNLIMITED_PAID_DECIMAL_COST = '0.066'
const UNLIMITED_PAID_RAW_COST = '66000'
const LEGACY_FIXED_PAID_DISPLAY_COST = '100'
const LEGACY_FIXED_PAID_RAW_COST = '100000000'
const RAW_UNITS_PER_DISPLAYED_100_KRW = 66_000n

// sungje : on-chain 저장값(0.066 / 66000)과 화면 표시값(100원)을 분리해서, 컨트랙트 검증 조건을 유지하면서 locale별 문구만 바꿔 보여준다.
// legacy로 100 / 100000000 이 저장된 데이터도 화면에선 같은 가격으로 읽는다.
export function formatBallotCostLabel(
  rawCost: string | number | bigint | null | undefined,
  lang: Lang,
) {
  const normalized = String(rawCost ?? '').trim()

  if (!normalized || normalized === '0') {
    return lang === 'ko' ? '무료' : 'Free'
  }

  if (normalized === UNLIMITED_PAID_DECIMAL_COST || normalized === UNLIMITED_PAID_RAW_COST) {
    return lang === 'ko' ? '100원' : '0.066 usdt'
  }

  if (normalized === LEGACY_FIXED_PAID_DISPLAY_COST || normalized === LEGACY_FIXED_PAID_RAW_COST) {
    // prettier-ignore
    return lang === 'ko' ? '100원' : '0.066 usdt'
  }

  return lang === 'ko' ? normalized : `${normalized} usdt`
}

function trimFormattedAmount(value: string) {
  if (!value.includes('.')) {
    return value
  }

  return value.replace(/\.?0+$/, '')
}

export function formatSettlementAmount(rawAmount: bigint, lang: Lang, decimals = 6) {
  if (lang === 'ko') {
    const convertedWon = (rawAmount * 100n) / RAW_UNITS_PER_DISPLAYED_100_KRW
    return `${convertedWon.toLocaleString('ko-KR')}원`
  }

  const usdtAmount = trimFormattedAmount(formatUnits(rawAmount, decimals))
  return `${usdtAmount} USDT`
}
