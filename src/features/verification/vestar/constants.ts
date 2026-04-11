import { createPublicClient, getAbiItem, getAddress, http } from 'viem'
import {
  vestarContractAddresses,
  vestarElectionAbi,
  vestarElectionFactoryAbi,
  vestarStatusTestnet,
} from '../../../contracts/vestar/generated'

export const STATUS_CHAIN_ID = 1660990954
export const STATUS_RPC_URL = vestarStatusTestnet.rpcUrl
export const STATUS_EXPLORER_URL = 'https://sepoliascan.status.network'
export const VERIFICATION_FACTORY = getAddress(vestarContractAddresses.electionFactory)
export const KEY_REVEALED_STATE = 4
export const FINALIZED_STATE = 5
export const INDEX_CACHE_KEY = `vestar-verification:index:v12:${VERIFICATION_FACTORY.toLowerCase()}`
export const DETAIL_CACHE_PREFIX = `vestar-verification:detail:v14:${VERIFICATION_FACTORY.toLowerCase()}:`
export const MANIFEST_CACHE_PREFIX = 'vestar-verification:manifest:v3:'
export const OPEN_EMOJIS = ['🗳️', '🎤', '🎶', '🔥', '🌙', '⭐', '🎸', '🎧']
export const LOG_BLOCK_CHUNK_SIZE = 4_000n
export const ZERO_HASH =
  '0x0000000000000000000000000000000000000000000000000000000000000000' as const

export const electionCreatedEvent = getAbiItem({
  abi: vestarElectionFactoryAbi,
  name: 'ElectionCreated',
})!

export const electionReadAbi = vestarElectionAbi
export const electionWriteAbi = vestarElectionAbi

export const openVoteEvent = getAbiItem({
  abi: vestarElectionAbi,
  name: 'OpenVoteSubmitted',
})!

export const encryptedVoteEvent = getAbiItem({
  abi: vestarElectionAbi,
  name: 'EncryptedVoteSubmitted',
})!

export const resultFinalizedEvent = getAbiItem({
  abi: vestarElectionAbi,
  name: 'ResultFinalized',
})!

export const publicClient = createPublicClient({
  chain: {
    id: STATUS_CHAIN_ID,
    name: 'Status Network Testnet',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [STATUS_RPC_URL] },
      public: { http: [STATUS_RPC_URL] },
    },
  },
  transport: http(STATUS_RPC_URL),
})
