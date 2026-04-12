import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildMetaMaskDappDeepLink,
  isMetaMaskInAppBrowser,
  isMobileExternalBrowser,
  isMobileUserAgent,
} from './mobileWallet'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('mobileWallet', () => {
  it('detects MetaMask mobile browser separately from generic mobile browsers', () => {
    expect(
      isMetaMaskInAppBrowser(
        'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 MetaMaskMobile Chrome/120.0',
      ),
    ).toBe(true)
    expect(isMobileUserAgent('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36')).toBe(true)
    expect(isMobileExternalBrowser('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36')).toBe(
      true,
    )
    expect(
      isMobileExternalBrowser(
        'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 MetaMaskMobile Chrome/120.0',
      ),
    ).toBe(false)
  })

  it('builds a MetaMask deeplink that preserves the current route', () => {
    expect(buildMetaMaskDappDeepLink('https://example.com/vote/1?tab=live')).toBe(
      'https://link.metamask.io/dapp/example.com%2Fvote%2F1%3Ftab%3Dlive',
    )
  })
})
