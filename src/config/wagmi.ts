import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string

if (!projectId) {
  throw new Error('VITE_WALLETCONNECT_PROJECT_ID is not configured')
}

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  connectors: [injected(), walletConnect({ projectId })],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})
