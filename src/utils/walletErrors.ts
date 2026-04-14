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

function stripRpcNoise(message: string): string {
  return message
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(
      (line) =>
        !/^(missing or invalid parameters\.?|double check you have provided the correct parameters\.?|url:|request body:|version:)/i.test(
          line,
        ),
    )
    .join('\n')
}

function extractReadableMessage(message: string): string | null {
  const compact = stripRpcNoise(message)

  if (!compact) {
    return null
  }

  const detailsMatch = compact.match(/details:\s*([^\n]+)/i)
  if (detailsMatch) {
    return extractReadableMessage(detailsMatch[1]) ?? detailsMatch[1].trim()
  }

  const revertParenMatch = compact.match(/execution reverted\s*\(([^)]+)\)/i)
  if (revertParenMatch) {
    return revertParenMatch[1].trim()
  }

  const revertColonMatch = compact.match(/execution reverted:?[\s"]+([^\n"]+)/i)
  if (revertColonMatch) {
    return revertColonMatch[1].trim()
  }

  const reasonStringMatch = compact.match(/reverted with reason string ['"]([^'"]+)['"]/i)
  if (reasonStringMatch) {
    return reasonStringMatch[1].trim()
  }

  const vestarReasonMatch = compact.match(/(vestar:\s*[^\n]+)/i)
  if (vestarReasonMatch) {
    return vestarReasonMatch[1].trim()
  }

  if (/execution reverted/i.test(compact)) {
    return 'Execution reverted'
  }

  return compact.trim()
}

export function getReadableWalletErrorMessage(error: unknown): string | null {
  const { messages } = collectWalletErrorParts(error)

  for (const message of messages) {
    const readableMessage = extractReadableMessage(message)

    if (readableMessage) {
      return readableMessage
    }
  }

  return null
}

export function getWalletActionErrorMessage(
  error: unknown,
  { lang, defaultMessage }: NormalizeWalletErrorOptions,
): string {
  const { codes, messages, names } = collectWalletErrorParts(error)
  const readableMessage = getReadableWalletErrorMessage(error)
  const codeSet = new Set(codes.map((code) => String(code)))
  const text = [...names, ...messages, readableMessage ?? ''].join('\n').toLowerCase()

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

  if (
    /insufficient balance|erc20insufficientbalance|transfer amount exceeds balance|exceeds balance|잔액이 부족/i.test(
      text,
    )
  ) {
    return lang === 'ko'
      ? '잔액이 부족합니다. 유료 투표에 필요한 금액을 충전한 뒤 다시 시도해주세요.'
      : 'Insufficient balance. Add funds for this paid vote and try again.'
  }

  if (/out of gas/i.test(text)) {
    return lang === 'ko'
      ? '트랜잭션 실행 중 gas가 부족했습니다. 다시 시도해주세요.'
      : 'The transaction ran out of gas during execution. Please try again.'
  }

  if (/not finalized/i.test(text)) {
    return lang === 'ko'
      ? '아직 finalize되지 않아 이 작업을 실행할 수 없습니다.'
      : 'This action is not available yet because the election is not finalized.'
  }

  if (/already settled|settled already/i.test(text)) {
    return lang === 'ko'
      ? '이미 정산이 완료된 투표입니다.'
      : 'This election has already been settled.'
  }

  if (/invalid state|key reveal|reveal pending|execution reverted/i.test(text)) {
    return lang === 'ko'
      ? '현재 선거 상태에서는 이 작업을 실행할 수 없습니다.'
      : 'This action is not available in the current election state.'
  }

  if (readableMessage) {
    return readableMessage
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return defaultMessage
}
