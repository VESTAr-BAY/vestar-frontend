import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'
import { vestarStatusTestnetChain } from '../contracts/vestar/chain'
import { isMobileExternalBrowser } from '../utils/mobileWallet'

const dappOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
const shouldUseMobileMetaMaskConfig =
  typeof window !== 'undefined' ? isMobileExternalBrowser() : false

export const wagmiConfig = createConfig({
  chains: [vestarStatusTestnetChain, mainnet],
  connectors: [
    metaMask({
      dapp: {
        name: 'VESTAr',
        url: dappOrigin,
      },
      logging: {
        sdk: false,
      },
      ui: shouldUseMobileMetaMaskConfig
        ? {
            headless: true,
            showInstallModal: false,
          }
        : undefined,
      mobile: shouldUseMobileMetaMaskConfig
        ? {
            useDeeplink: true,
            preferredOpenLink: (deeplink: string) => {
              window.location.assign(deeplink)
            },
          }
        : undefined,
    }),
    injected(),
  ],
  transports: {
    [vestarStatusTestnetChain.id]: http(vestarStatusTestnetChain.rpcUrls.default.http[0]),
    [mainnet.id]: http(),
  },
})
