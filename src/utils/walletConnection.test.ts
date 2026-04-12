import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Connector } from 'wagmi'
import { pickPreferredWalletConnector } from './walletConnection'

function createConnector(id: string) {
  return { id } as Connector
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pickPreferredWalletConnector', () => {
  it('prefers injected inside the MetaMask in-app browser', () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 MetaMaskMobile Chrome/120.0',
    )

    const connector = pickPreferredWalletConnector([
      createConnector('metaMaskSDK'),
      createConnector('injected'),
    ])

    expect(connector?.id).toBe('injected')
  })

  it('prefers MetaMask SDK in external mobile browsers', () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
    )

    const connector = pickPreferredWalletConnector([
      createConnector('metaMaskSDK'),
      createConnector('injected'),
    ])

    expect(connector?.id).toBe('metaMaskSDK')
  })
})
