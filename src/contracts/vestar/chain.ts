import { defineChain } from "viem";
import { vestarStatusTestnet } from "./generated";

export const VESTAR_STATUS_TESTNET_MULTICALL3 = "0xcA11bde05977b3631167028862bE2a173976CA11";

export const vestarStatusTestnetChain = defineChain({
  id: vestarStatusTestnet.chainId,
  name: vestarStatusTestnet.chainName,
  nativeCurrency: {
    name: "Status Testnet ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [vestarStatusTestnet.rpcUrl],
    },
    public: {
      http: [vestarStatusTestnet.rpcUrl],
    },
  },
  contracts: {
    multicall3: {
      address: VESTAR_STATUS_TESTNET_MULTICALL3,
      blockCreated: 0,
    },
  },
  testnet: true,
});
