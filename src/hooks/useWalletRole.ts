import { useAccount } from 'wagmi'
import { isHost } from '../config/hosts'

export type WalletRole = 'host' | 'user' | 'disconnected'

interface WalletRoleResult {
  role: WalletRole
  address: string | undefined
  isConnected: boolean
}

export function useWalletRole(): WalletRoleResult {
  const { address, isConnected } = useAccount()

  if (!isConnected || !address) {
    return { role: 'disconnected', address: undefined, isConnected: false }
  }

  const role: WalletRole = isHost(address) ? 'host' : 'user'
  return { role, address, isConnected: true }
}
