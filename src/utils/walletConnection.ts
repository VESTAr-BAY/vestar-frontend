import type { Connector } from 'wagmi'

interface RequestWalletConnectionOptions {
  connect: (args: { connector: Connector }) => void
  connectors: readonly Connector[]
  onConnectStart?: () => void
  onDeeplinkOpen?: () => void
}

function isMobileUserAgent() {
  if (typeof navigator === 'undefined') {
    return false
  }

  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)
}

function hasInjectedEthereumProvider() {
  if (typeof window === 'undefined') {
    return false
  }

  return typeof (window as Window & { ethereum?: unknown }).ethereum !== 'undefined'
}

function isMetaMaskInAppBrowser() {
  if (typeof navigator === 'undefined') {
    return false
  }

  return /MetaMaskMobile/i.test(navigator.userAgent)
}

function openMetaMaskDeeplink() {
  if (typeof window === 'undefined') {
    return
  }

  const currentUrl = window.location.href.replace(/^https?:\/\//, '')
  const deeplinkUrl = `https://metamask.app.link/dapp/${currentUrl}`

  window.location.assign(deeplinkUrl)
}

export function requestWalletConnection({
  connect,
  connectors,
  onConnectStart,
  onDeeplinkOpen,
}: RequestWalletConnectionOptions) {
  const injectedConnector = connectors.find((connector) => connector.id === 'injected')
  const walletConnectConnector = connectors.find((connector) => connector.id === 'walletConnect')
  const connector = injectedConnector ?? walletConnectConnector ?? connectors[0]

  if (isMobileUserAgent()) {
    if (isMetaMaskInAppBrowser() || hasInjectedEthereumProvider()) {
      if (connector) {
        onConnectStart?.()
        connect({ connector })
      }
      return
    }

    onDeeplinkOpen?.()
    openMetaMaskDeeplink()
    return
  }

  if (connector) {
    onConnectStart?.()
    connect({ connector })
  }
}
