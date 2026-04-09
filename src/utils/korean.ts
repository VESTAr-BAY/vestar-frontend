const TRAILING_IGNORED_PATTERN = /[\s"'“”‘’`)\]}]+$/u
const HANGUL_SYLLABLE_START = 0xac00
const HANGUL_SYLLABLE_END = 0xd7a3
const JONGSEONG_COUNT = 28
const RIEUL_JONGSEONG_INDEX = 8

export type KoreanParticlePair = '이/가' | '을/를' | '은/는' | '와/과' | '으로/로'

function getLastMeaningfulChar(value: string): string {
  return value.trim().replace(TRAILING_IGNORED_PATTERN, '').slice(-1)
}

function getHangulJongseongIndex(char: string): number | null {
  const codePoint = char.codePointAt(0)

  if (!codePoint || codePoint < HANGUL_SYLLABLE_START || codePoint > HANGUL_SYLLABLE_END) {
    return null
  }

  return (codePoint - HANGUL_SYLLABLE_START) % JONGSEONG_COUNT
}

export function pickKoreanParticle(value: string, pair: KoreanParticlePair): string {
  const [withBatchim, withoutBatchim] = pair.split('/') as [string, string]
  const lastChar = getLastMeaningfulChar(value)
  const jongseongIndex = lastChar ? getHangulJongseongIndex(lastChar) : null

  if (jongseongIndex === null) {
    return withoutBatchim
  }

  if (pair === '으로/로') {
    return jongseongIndex !== 0 && jongseongIndex !== RIEUL_JONGSEONG_INDEX
      ? withBatchim
      : withoutBatchim
  }

  return jongseongIndex === 0 ? withoutBatchim : withBatchim
}

export function withKoreanParticle(value: string, pair: KoreanParticlePair): string {
  return `${value}${pickKoreanParticle(value, pair)}`
}
