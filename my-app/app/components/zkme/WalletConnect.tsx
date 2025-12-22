// components/zkme/WalletConnect.tsx
"use client";

import { motion } from 'framer-motion';
import { Wallet, ChevronRight } from 'lucide-react';

interface WalletConnectProps {
  onConnect: () => void;
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-[#10B981]/50 transition-all cursor-pointer group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-900 rounded-lg group-hover:scale-110 transition-transform">
              <Wallet className="text-[#10B981]" />
            </div>
            <div>
              <h3 className="font-bold">Connect Wallet</h3>
              <p className="text-sm text-zinc-400">Ethereum, Polygon, or Arbitrum</p>
            </div>
          </div>
          <ChevronRight className="text-zinc-600" />
        </div>
      </div>
      <button 
        onClick={onConnect}
        className="w-full py-4 bg-[#F5F5F5] text-black font-bold rounded-xl hover:bg-[#10B981] transition-colors flex items-center justify-center gap-2"
      >
        Initialize zkMe <ChevronRight size={18} />
      </button>
    </div>
  );
}
