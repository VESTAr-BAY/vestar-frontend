import { defineChain } from 'viem'
import { vestarDeployment } from './generated'

export const VESTAR_STATUS_TESTNET_MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11'

const CHAIN_METADATA = {
  374: {
    chainName: 'Status Network Hoodi Testnet',
    explorerUrl: 'https://hoodiscan.status.network',
    nativeCurrencyName: 'Status Hoodi ETH',
  },
  1660990954: {
    chainName: 'Status Network Sepolia Testnet',
    explorerUrl: 'https://sepoliascan.status.network',
    nativeCurrencyName: 'Status Sepolia ETH',
  },
} as const

const chainMetadata =
  CHAIN_METADATA[vestarDeployment.chainId as keyof typeof CHAIN_METADATA] ??
  ({
    chainName: vestarDeployment.chainName,
    explorerUrl: '',
    nativeCurrencyName: 'Status ETH',
  } as const)

export const vestarStatusExplorerUrl = chainMetadata.explorerUrl

export const vestarStatusTestnetChain = defineChain({
  id: vestarDeployment.chainId,
  name: chainMetadata.chainName,
  nativeCurrency: {
    name: chainMetadata.nativeCurrencyName,
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [vestarDeployment.rpcUrl],
    },
    public: {
      http: [vestarDeployment.rpcUrl],
    },
  },
  contracts: {
    multicall3: {
      address: VESTAR_STATUS_TESTNET_MULTICALL3,
      blockCreated: 0,
    },
  },
  testnet: true,
})
