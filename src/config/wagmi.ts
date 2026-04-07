import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined

if (!projectId) {
  console.warn('VITE_WALLETCONNECT_PROJECT_ID is not configured — WalletConnect will be disabled')
}

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  connectors: projectId ? [injected(), walletConnect({ projectId })] : [injected()],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})
