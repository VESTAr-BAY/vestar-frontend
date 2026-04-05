import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { vestarStatusTestnetChain } from "../contracts/vestar";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string;

if (!projectId) {
  throw new Error("VITE_WALLETCONNECT_PROJECT_ID is not configured");
}

export const wagmiConfig = createConfig({
  chains: [vestarStatusTestnetChain, mainnet, sepolia],
  connectors: [injected(), walletConnect({ projectId })],
  transports: {
    [vestarStatusTestnetChain.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});
