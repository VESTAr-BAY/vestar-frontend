import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'
import { vestarStatusTestnetChain } from '../contracts/vestar/chain'

const dappOrigin =
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'

export const wagmiConfig = createConfig({
  chains: [vestarStatusTestnetChain, mainnet, sepolia],
  connectors: [
    metaMask({
      dapp: {
        name: 'VESTAr',
        url: dappOrigin,
      },
      logging: {
        sdk: false,
      },
    }),
    injected(),
  ],
  transports: {
    [vestarStatusTestnetChain.id]: http(vestarStatusTestnetChain.rpcUrls.default.http[0]),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})
