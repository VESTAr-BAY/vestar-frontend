import { useConnect } from 'wagmi'
import walletIcon from '../../assets/account_balance_wallet.svg'
import { requestWalletConnection } from '../../utils/walletConnection'

interface WalletButtonProps {
  onConnected?: () => void
}

export function WalletButton({ onConnected }: WalletButtonProps) {
  const { connect, connectors, isPending } = useConnect()

  const handleConnect = () => {
    requestWalletConnection({
      connect,
      connectors,
      onConnectStart: onConnected,
    })
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={isPending}
      className="flex items-center gap-2 rounded-full bg-[#7140FD] px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      <img src={walletIcon} alt="" className="size-5 brightness-0 invert" />
      {isPending ? 'Connecting…' : 'Connect Wallet'}
    </button>
  )
}
