import { useConnect } from "wagmi";
import walletIcon from "../../assets/account_balance_wallet.svg";

interface WalletButtonProps {
  onConnected?: () => void;
}

export function WalletButton({ onConnected }: WalletButtonProps) {
  const { connect, connectors, isPending } = useConnect();

  const handleConnect = () => {
    const injected = connectors.find((c) => c.id === "injected");
    const connector = injected ?? connectors[0];
    if (connector) {
      connect({ connector });
      onConnected?.();
    }
  };

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={isPending}
      className="flex items-center gap-2 rounded-full bg-[#7140FD] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      <img src={walletIcon} alt="" className="size-5 brightness-0 invert" />
      {isPending ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
