import type { Connector } from 'wagmi'

interface RequestWalletConnectionOptions {
  connect: (args: { connector: Connector }) => void
  connectors: readonly Connector[]
  onConnectStart?: () => void
}

function isMobileUserAgent() {
  if (typeof navigator === 'undefined') {
    return false
  }

  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)
}

function getPreferredConnector(connectors: readonly Connector[]) {
  const metaMaskConnector = connectors.find((connector) => connector.id === 'metaMaskSDK')
  const injectedConnector = connectors.find((connector) => connector.id === 'injected')

  if (isMobileUserAgent()) {
    return metaMaskConnector ?? injectedConnector ?? connectors[0]
  }

  return metaMaskConnector ?? injectedConnector ?? connectors[0]
}

export function requestWalletConnection({
  connect,
  connectors,
  onConnectStart,
}: RequestWalletConnectionOptions) {
  const connector = getPreferredConnector(connectors)

  if (connector) {
    onConnectStart?.()
    connect({ connector })
  }
}
