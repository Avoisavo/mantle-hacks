// components/identity/WalletConnect.tsx
"use client";

import { motion } from 'framer-motion';
import { Wallet, ChevronRight, Check } from 'lucide-react';
import { ethers } from 'ethers';
import { useState } from 'react';

interface WalletConnectProps {
  onConnect: (address: string, signer: any) => void;
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
  const [activeSigner, setActiveSigner] = useState<any>(null);

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
      
      if (accounts && accounts.length > 0) {
        const signer = await provider.getSigner();
        setConnectedAccount(accounts[0]);
        setActiveSigner(signer);
        console.log("Wallet linked:", accounts[0]);
      } else {
        setError("No accounts found.");
      }
    } catch (err: any) {
      console.error("Connection error:", err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleProceed = () => {
    if (connectedAccount && activeSigner) {
      onConnect(connectedAccount, activeSigner);
    }
  };

  return (
    <div className="space-y-6">
      <div
        onClick={!connectedAccount ? connectWallet : undefined}
        className={`p-6 rounded-xl bg-white/5 border transition-all ${
          !connectedAccount ? 'cursor-pointer hover:border-[#10B981]/50 group' : 'border-[#10B981]/30 bg-[#10B981]/5'
        } ${error ? 'border-red-500/50' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg transition-transform ${connectedAccount ? 'bg-[#10B981]/20' : 'bg-zinc-900 group-hover:scale-110'}`}>
              {connectedAccount ? (
                <Check className="text-[#10B981]" />
              ) : (
                <Wallet className={`transition-colors ${isConnecting ? 'text-zinc-500 animate-pulse' : 'text-[#10B981]'}`} />
              )}
            </div>
            <div>
              <h3 className="font-bold">
                {isConnecting ? 'Waiting for Wallet...' : connectedAccount ? 'Wallet Linked' : 'Link Wallet'}
              </h3>
              <p className="text-sm text-zinc-400 font-mono">
                {connectedAccount 
                  ? `${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}`
                  : error ? error : 'MetaMask or Coinbase Wallet'}
              </p>
            </div>
          </div>
          {!connectedAccount && <ChevronRight className="text-zinc-600" />}
        </div>
      </div>

      <button
        onClick={handleProceed}
        disabled={!connectedAccount || isConnecting}
        className={`w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
          connectedAccount && !isConnecting
            ? 'bg-[#10B981] text-black hover:bg-[#10B981]/90 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed text-zinc-600'
        }`}
      >
        Get Started <ChevronRight size={18} />
      </button>

      {connectedAccount && (
        <p className="text-center text-[10px] text-zinc-600 uppercase tracking-widest">
          Click Get Started to begin verification
        </p>
      )}
    </div>
  );
}

