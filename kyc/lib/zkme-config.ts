// lib/zkme-config.ts
export const zkMeConfig = {
  appId: process.env.NEXT_PUBLIC_ZKME_APP_ID || "demo_app",
  chainId: "0x1388", // Mantle Mainnet (5000 in decimal)
  chainName: "Mantle",
  capabilities: [
    "KYC", 
    "Anti-Sybil", 
    "Citizenship"
  ],
};