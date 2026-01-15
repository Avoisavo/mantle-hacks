import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mantle, mantleSepoliaTestnet, sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "CoinTown",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [mantleSepoliaTestnet, mantle, sepolia],
  ssr: true,
});
