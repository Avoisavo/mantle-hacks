import { Chain } from "viem";

export const MANTLE_SEPOLIA: Chain = {
  id: 5003,
  name: "Mantle Sepolia Testnet",
  network: "mantle-sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Mantle",
    symbol: "MNT",
  },
  rpcUrls: {
    public: { http: ["https://rpc.sepolia.mantle.xyz"] },
    default: { http: ["https://rpc.sepolia.mantle.xyz"] },
  },
  blockExplorers: {
    default: { name: "Mantle Sepolia Explorer", url: "https://sepolia.mantle.xyz" },
  },
  testnet: true,
};

export const SIMPLE_ACCOUNT_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000";

// Simple Account ABI (minimal for our needs)
export const SIMPLE_ACCOUNT_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{"internalType": "address", "name": "target", "type": "address"}],
    "name": "execute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Simple Account Factory ABI
export const FACTORY_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"}
    ],
    "name": "getAddress",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"}
    ],
    "name": "createAccount",
    "outputs": [{"internalType": "address", "name": "ret", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
