import { Navigate, Outlet } from "react-router";
import { useAccount } from "wagmi";

export function WalletGuard() {
  const { isConnected, isReconnecting } = useAccount();

  if (isReconnecting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span>Connecting wallet…</span>
      </div>
    );
  }

  if (!isConnected) {
    return <Navigate to="/vote" replace />;
  }

  return <Outlet />;
}
