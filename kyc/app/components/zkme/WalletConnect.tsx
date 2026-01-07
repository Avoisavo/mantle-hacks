// components/zkme/WalletConnect.tsx
"use client";

import { motion } from 'framer-motion';
import { Wallet, ChevronRight } from 'lucide-react';

import { ethers } from 'ethers';
import { useState } from 'react';

interface WalletConnectProps {
  onConnect: (address: string, signer: any) => void;
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setError("Please install a Web3 wallet (e.g. MetaMask)");
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      if (accounts[0]) {
        onConnect(accounts[0], signer);
      }
    } catch (err: any) {
      console.error("Connection error:", err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        onClick={connectWallet}
        className={`p-6 rounded-xl bg-white/5 border transition-all cursor-pointer group ${error ? 'border-red-500/50' : 'border-white/10 hover:border-[#10B981]/50'
          }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-900 rounded-lg group-hover:scale-110 transition-transform">
              <Wallet className={`transition-colors ${isConnecting ? 'text-zinc-500 animate-pulse' : 'text-[#10B981]'}`} />
            </div>
            <div>
              <h3 className="font-bold">{isConnecting ? 'Connecting...' : 'Connect Wallet'}</h3>
              <p className="text-sm text-zinc-400">
                {error ? error : 'Ethereum, Polygon, or Arbitrum'}
              </p>
            </div>
          </div>
          <ChevronRight className="text-zinc-600" />
        </div>
      </div>

      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="w-full py-4 bg-[#F5F5F5] text-black font-bold rounded-xl hover:bg-[#10B981] disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors flex items-center justify-center gap-2"
      >
        {isConnecting ? 'Connecting Wallet...' : 'Initialize zkMe'} <ChevronRight size={18} />
      </button>

      {/* MOCK WALLET OPTION for Hackathon/Testing */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-gray-700"></div>
        <span className="flex-shrink-0 mx-4 text-gray-500 text-xs">Test Options</span>
        <div className="flex-grow border-t border-gray-700"></div>
      </div>

      <button
        onClick={() => {
          const mockWallet = ethers.Wallet.createRandom();
          // Create a simple provider-less signer, or mock the provider if needed. 
          // For signing messages, a wallet with no provider is fine. 
          // But we need a provider to read the contract later.
          // We can attach a provider (Mantle Sepolia RPC)
          const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.mantle.xyz");
          const connectedWallet = mockWallet.connect(provider);

          onConnect(mockWallet.address, connectedWallet);
        }}
        className="w-full py-3 bg-zinc-800 text-zinc-300 font-bold rounded-xl hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 text-sm"
      >
        Simulate zk-Login (Mock Wallet)
      </button>
    </div>
  );
}
