const MOBILE_USER_AGENT_PATTERN = /android|iphone|ipad|ipod|mobile/i
const METAMASK_MOBILE_PATTERN = /metamaskmobile/i

function getNavigatorUserAgent() {
  if (typeof navigator === 'undefined') return ''
  return navigator.userAgent ?? ''
}

export function isMobileUserAgent(userAgent = getNavigatorUserAgent()) {
  return MOBILE_USER_AGENT_PATTERN.test(userAgent)
}

export function isMetaMaskInAppBrowser(userAgent = getNavigatorUserAgent()) {
  return METAMASK_MOBILE_PATTERN.test(userAgent)
}

export function isMobileExternalBrowser(userAgent = getNavigatorUserAgent()) {
  return isMobileUserAgent(userAgent) && !isMetaMaskInAppBrowser(userAgent)
}

export function buildMetaMaskDappDeepLink(currentUrl?: string) {
  const resolvedUrl =
    currentUrl ?? (typeof window !== 'undefined' ? window.location.href : 'http://localhost:5173')

  const normalizedUrl = resolvedUrl.replace(/^https?:\/\//i, '')
  return `https://link.metamask.io/dapp/${encodeURIComponent(normalizedUrl)}`
}

export function openMetaMaskLink(displayUri?: string | null) {
  if (typeof window === 'undefined') return
  const target = displayUri && displayUri.trim().length > 0 ? displayUri : buildMetaMaskDappDeepLink()
  window.location.assign(target)
}
