// lib/zkme-config.ts
export const zkMeConfig = {
  appId: process.env.NEXT_PUBLIC_ZKME_APP_ID || "demo_app",
  chain: "polygon", // Example chain
  capabilities: [
    "KYC", 
    "Anti-Sybil", 
    "Citizenship"
  ],
};