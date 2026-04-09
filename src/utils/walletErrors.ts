import type { Lang } from '../i18n'

interface NormalizeWalletErrorOptions {
  lang: Lang
  defaultMessage: string
}

interface ErrorLike {
  cause?: unknown
  code?: number | string
  details?: string
  message?: string
  name?: string
  shortMessage?: string
}

function collectWalletErrorParts(error: unknown): {
  codes: Array<number | string>
  messages: string[]
  names: string[]
} {
  const queue = [error]
  const seen = new Set<unknown>()
  const codes: Array<number | string> = []
  const messages: string[] = []
  const names: string[] = []

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || seen.has(current)) continue
    seen.add(current)

    if (current instanceof Error) {
      if (current.name) names.push(current.name)
      if (current.message) messages.push(current.message)
    }

    if (typeof current !== 'object') continue

    const maybeError = current as ErrorLike

    if (maybeError.code !== undefined) codes.push(maybeError.code)
    if (maybeError.name) names.push(maybeError.name)
    if (maybeError.message) messages.push(maybeError.message)
    if (maybeError.shortMessage) messages.push(maybeError.shortMessage)
    if (maybeError.details) messages.push(maybeError.details)
    if (maybeError.cause) queue.push(maybeError.cause)
  }

  return { codes, messages, names }
}

export function getWalletActionErrorMessage(
  error: unknown,
  { lang, defaultMessage }: NormalizeWalletErrorOptions,
): string {
  const { codes, messages, names } = collectWalletErrorParts(error)
  const codeSet = new Set(codes.map((code) => String(code)))
  const text = [...names, ...messages].join('\n').toLowerCase()

  if (
    codeSet.has('4001') ||
    codeSet.has('ACTION_REJECTED') ||
    /user rejected|user denied|rejected the request|request rejected|transaction rejected|denied transaction|cancelled|canceled|popup closed|window closed|modal closed/i.test(
      text,
    )
  ) {
    return lang === 'ko'
      ? '지갑 요청이 취소되었습니다. 지갑에서 다시 승인해주세요.'
      : 'The wallet request was cancelled. Please confirm it again in your wallet.'
  }

  if (
    codeSet.has('-32002') ||
    /already pending|request already pending|resource unavailable|currently pending/i.test(text)
  ) {
    return lang === 'ko'
      ? '지갑에서 이미 처리 중인 요청이 있습니다. 열린 지갑 팝업을 확인해주세요.'
      : 'There is already a pending wallet request. Check the open wallet popup.'
  }

  if (
    /wallet not connected|connector not connected|provider disconnected|walletclient\.account is missing|not connected/i.test(
      text,
    )
  ) {
    return lang === 'ko'
      ? '지갑 연결이 끊어졌습니다. 다시 연결한 뒤 시도해주세요.'
      : 'Your wallet is disconnected. Reconnect it and try again.'
  }

  if (
    codeSet.has('4902') ||
    /unsupported chain|chain not configured|switch chain|switch network|wrong network|status network testnet/i.test(
      text,
    )
  ) {
    return lang === 'ko'
      ? 'Status Network Testnet으로 전환한 뒤 다시 시도해주세요.'
      : 'Switch to Status Network Testnet and try again.'
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return defaultMessage
}
