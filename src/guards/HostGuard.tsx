import { Navigate, Outlet } from "react-router";
import { useAccount } from "wagmi";
import { isHost } from "../config/hosts";

export function HostGuard() {
  const { address } = useAccount();

  if (!isHost(address)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
