import type { Lang } from '../i18n'

const UNLIMITED_PAID_DECIMAL_COST = '0.066'
const UNLIMITED_PAID_RAW_COST = '66000'
const FIXED_PAID_DISPLAY_COST = '100'
const FIXED_PAID_RAW_COST = '100000000'

// sungje : on-chain 저장값(0.066 / 66000)과 화면 표시값(100원)을 분리해서, 컨트랙트 검증 조건을 유지하면서 locale별 문구만 바꿔 보여준다.
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

  if (normalized === FIXED_PAID_DISPLAY_COST || normalized === FIXED_PAID_RAW_COST) {
    // prettier-ignore
    return lang === 'ko' ? '100원' : '0.066 usdt'
  }

  return lang === 'ko' ? normalized : `${normalized} usdt`
}
