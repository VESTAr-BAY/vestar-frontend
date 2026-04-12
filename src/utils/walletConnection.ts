import type { Connector } from 'wagmi'
import { isMetaMaskInAppBrowser, isMobileUserAgent } from './mobileWallet'

interface RequestWalletConnectionOptions {
  connect: (args: { connector: Connector }) => void
  connectors: readonly Connector[]
  onConnectStart?: () => void
}

export function pickPreferredWalletConnector(connectors: readonly Connector[]) {
  const metaMaskConnector = connectors.find((connector) => connector.id === 'metaMaskSDK')
  const injectedConnector = connectors.find((connector) => connector.id === 'injected')

  if (isMetaMaskInAppBrowser()) {
    return injectedConnector ?? metaMaskConnector ?? connectors[0]
  }

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
  const connector = pickPreferredWalletConnector(connectors)

  if (connector) {
    onConnectStart?.()
    connect({ connector })
  }
}
