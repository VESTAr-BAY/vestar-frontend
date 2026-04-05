import { useAccount, useConnect } from 'wagmi'
import searchIcon from '../../assets/search_button.svg'
import accountCircleIcon from '../../assets/account_circle.svg'
import walletIcon from '../../assets/account_balance_wallet.svg'
import type { ScrollState } from '../../hooks/useScrollDirection'

interface HeaderProps {
  scrollState: ScrollState
  onOpenPanel: () => void
  onOpenSearch: () => void
}

const STATE_CLASSES: Record<ScrollState, string> = {
  default: 'top-0 w-full max-w-[430px] h-14 bg-[#13141A] px-5',
  hidden: '-top-[66px] w-full max-w-[430px] h-14 bg-[#13141A] px-5',
  floating:
    'top-[10px] w-[calc(100%-32px)] max-w-[calc(430px-32px)] h-12 rounded-2xl bg-[#1C2033] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35),0_2px_8px_rgba(0,0,0,0.25)] px-4',
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function Header({ scrollState, onOpenPanel, onOpenSearch }: HeaderProps) {
  const { isConnected, address } = useAccount()
  const { connect, connectors, isPending } = useConnect()

  const handleConnect = () => {
    const injectedConnector = connectors.find((c) => c.id === 'injected') ?? connectors[0]
    if (injectedConnector) {
      connect({ connector: injectedConnector })
    }
  }

  return (
    <header
      className={`fixed left-1/2 -translate-x-1/2 z-[100] flex items-center gap-[10px] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${STATE_CLASSES[scrollState]}`}
    >
      <span className="font-mono text-base font-medium tracking-[1.5px] text-white uppercase flex-shrink-0">
        VEST<span className="text-[#7140FF]">A</span>r
      </span>

      <div className="flex-1" />

      <button
        type="button"
        aria-label="검색"
        onClick={onOpenSearch}
        className="flex items-center justify-center w-8 h-8 flex-shrink-0"
      >
        <img src={searchIcon} alt="" className="w-[18px] h-[18px] brightness-0 invert" />
      </button>

      {isConnected && address ? (
        <button
          type="button"
          onClick={onOpenPanel}
          className="flex items-center gap-[5px] bg-white/[0.07] border border-white/10 rounded-[20px] px-[10px] py-[5px] text-[11px] font-mono whitespace-nowrap hover:bg-white/[0.12] transition-colors cursor-pointer flex-shrink-0"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_#22C55E] animate-pulse flex-shrink-0" />
          <span className="text-[#FFD166] font-semibold">2,480</span>
          <span className="text-white/60">{truncateAddress(address)}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleConnect}
          disabled={isPending}
          className="bg-[#7140FF] text-white rounded-2xl px-[13px] py-[6px] text-[12px] font-semibold hover:opacity-85 transition-opacity disabled:opacity-50 flex-shrink-0 flex items-center gap-1"
        >
          <img src={walletIcon} alt="" className="w-4 h-4 brightness-0 invert" />
          연결
        </button>
      )}

      <button
        type="button"
        aria-label="프로필"
        onClick={onOpenPanel}
        className="w-8 h-8 rounded-full flex items-center justify-center hover:ring-1 hover:ring-[#7140FF] transition-all flex-shrink-0"
      >
        <img
          src={accountCircleIcon}
          alt=""
          className="w-8 h-8 rounded-full brightness-0 invert opacity-55"
        />
      </button>
    </header>
  )
}
