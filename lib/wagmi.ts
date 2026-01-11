import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, mantleSepoliaTestnet, mantle, mantleTestnet } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "CoinTown",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [sepolia, mantleSepoliaTestnet, mantle, mantleTestnet],
  ssr: true,
});
