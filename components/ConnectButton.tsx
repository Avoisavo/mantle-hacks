"use client";

import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import { useConnect, injected } from "wagmi";
import { useTownBalance } from "@/hooks/useTownBalance";

export default function ConnectButton() {
  const { connect } = useConnect();
  const { balance: townBalance } = useTownBalance();

  const isMobile = () => {
    if (typeof window === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  const handleConnect = () => {
    if (isMobile()) {
      // On mobile, use RainbowKit modal (shows QR code)
      return;
    } else {
      // On desktop, directly connect to injected wallet (MetaMask extension)
      connect({ connector: injected() });
    }
  };

  return (
    <motion.div className="w-full">
      <RainbowConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== "loading";
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === "authenticated");

          return (
            <div
              {...(!ready && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                },
              })}
              className="w-full"
            >
              {(() => {
                if (!connected) {
                  return (
                    <motion.button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('wallet_connecting', 'true');
                        }
                        if (isMobile()) {
                          openConnectModal();
                        } else {
                          handleConnect();
                        }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full relative group"
                      style={{ cursor: "pointer" }}
                    >
                      {/* Button Body */}
                      <div className="relative w-full bg-gradient-to-b from-[#2e0b5d] to-[#1a0033] rounded-2xl px-6 py-4 flex items-center justify-center gap-3 border border-[#bffff4]/30 overflow-hidden shadow-2xl group-hover:border-[#bffff4]/60 transition-all">
                        {/* High-end Rim Light (Mint) */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#bffff4]/80 to-transparent"></div>
                        
                        {/* Subtle sheen on hover */}
                        <div className="absolute top-0 left-[-100%] w-[50%] h-[200%] bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-[30deg] group-hover:left-[150%] transition-all duration-1000 ease-in-out"></div>

                        {/* Text */}
                        <span className="text-[#bffff4] font-bold text-lg tracking-wide" style={{ fontFamily: '"Luckiest Guy", cursive' }}>
                          Connect Wallet
                        </span>
                      </div>
                    </motion.button>
                  );
                }

                return (
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={openChainModal}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative overflow-hidden group"
                    >
                      <div className="relative bg-white/5 backdrop-blur-xl border border-purple-400/40 rounded-full px-4 py-2.5 flex items-center gap-2 hover:border-purple-300/60 transition-all duration-300">
                        {chain.hasIcon && (
                          <div
                            style={{
                              background: chain.iconBackground,
                              width: 16,
                              height: 16,
                              borderRadius: 999,
                              overflow: "hidden",
                            }}
                          >
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? "Chain icon"}
                                src={chain.iconUrl}
                                style={{ width: 16, height: 16 }}
                              />
                            )}
                          </div>
                        )}
                        <span className="text-white font-medium text-sm">{chain.name}</span>
                      </div>
                    </motion.button>

                    <motion.button
                      onClick={openAccountModal}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative overflow-hidden group"
                    >
                      <div className="relative bg-white/5 backdrop-blur-xl border border-pink-400/40 rounded-full px-4 py-2.5 flex items-center gap-2 hover:border-pink-300/60 transition-all duration-300">
                        <span className="text-white font-medium text-sm">
                          {account.displayName}
                        </span>
                        <span className="text-cyan-400 text-xs font-bold">
                          {townBalance} TOWN
                        </span>
                      </div>
                    </motion.button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </RainbowConnectButton.Custom>
    </motion.div>
  );
}
